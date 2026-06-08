-- Trip Expense Ledger — initial schema

CREATE SEQUENCE IF NOT EXISTS expense_serial_seq START 1;

CREATE TABLE IF NOT EXISTS public.app_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  default_budget NUMERIC(12,3) NOT NULL DEFAULT 500.000,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

INSERT INTO public.app_settings (id, default_budget)
VALUES (1, 500.000)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('employee', 'admin')),
  budget_amount NUMERIC(12,3) NOT NULL DEFAULT 500.000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  serial_number BIGINT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  purchaser_name TEXT NOT NULL,
  purchase_date DATE NOT NULL,
  amount NUMERIC(12,3) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'OMR',
  receipt_path TEXT,
  no_receipt_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT receipt_or_reason CHECK (
    receipt_path IS NOT NULL OR (no_receipt_reason IS NOT NULL AND length(trim(no_receipt_reason)) >= 5)
  )
);

CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON public.expenses(user_id, purchase_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_purchase_date ON public.expenses(purchase_date);

-- Assign serial number on insert
CREATE OR REPLACE FUNCTION public.assign_expense_serial()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.serial_number IS NULL THEN
    NEW.serial_number := nextval('expense_serial_seq');
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_expense_serial ON public.expenses;
CREATE TRIGGER trg_assign_expense_serial
  BEFORE INSERT ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_expense_serial();

CREATE OR REPLACE FUNCTION public.touch_expense_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_expense_updated_at ON public.expenses;
CREATE TRIGGER trg_touch_expense_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_expense_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_budget_val NUMERIC(12,3);
  user_role TEXT;
  display_name TEXT;
BEGIN
  SELECT default_budget INTO default_budget_val FROM public.app_settings WHERE id = 1;
  user_role := COALESCE(NEW.raw_app_meta_data->>'role', 'employee');
  display_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));

  INSERT INTO public.profiles (id, full_name, role, budget_amount)
  VALUES (NEW.id, display_name, user_role, COALESCE(default_budget_val, 500.000))
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Admin helper
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;

-- Employee ledger summary view
CREATE OR REPLACE VIEW public.employee_ledger_summary
WITH (security_invoker = true)
AS
SELECT
  p.id,
  p.full_name,
  p.budget_amount,
  COALESCE(SUM(e.amount), 0) AS total_expenses,
  p.budget_amount - COALESCE(SUM(e.amount), 0) AS remaining_budget
FROM public.profiles p
LEFT JOIN public.expenses e ON e.user_id = p.id
WHERE p.role = 'employee'
GROUP BY p.id, p.full_name, p.budget_amount;

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (
    public.is_admin()
    OR (id = auth.uid() AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()))
  );

CREATE POLICY "profiles_insert_admin" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR id = auth.uid());

-- App settings policies
CREATE POLICY "app_settings_select" ON public.app_settings
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "app_settings_update_admin" ON public.app_settings
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Expenses policies
CREATE POLICY "expenses_select" ON public.expenses
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "expenses_insert_own" ON public.expenses
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND NOT public.is_admin());

CREATE POLICY "expenses_update_own" ON public.expenses
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "expenses_delete_own" ON public.expenses
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('receipts', 'receipts', false, 524288, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies: employees access own receipts via expense ownership
CREATE POLICY "receipts_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'receipts' AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1 FROM public.expenses e
        WHERE e.receipt_path = storage.objects.name
        AND e.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "receipts_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1] IS NOT NULL
  );

CREATE POLICY "receipts_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'receipts' AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1 FROM public.expenses e
        WHERE e.receipt_path = storage.objects.name
        AND e.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "receipts_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'receipts' AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1 FROM public.expenses e
        WHERE e.receipt_path = storage.objects.name
        AND e.user_id = auth.uid()
      )
    )
  );
