-- Ledger archives: snapshot closed master ledgers with expenses and receipt files

CREATE TABLE IF NOT EXISTS public.ledger_archives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_by UUID NOT NULL REFERENCES auth.users(id),
  expense_count INT NOT NULL DEFAULT 0,
  total_amount NUMERIC(12,3) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.archived_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  archive_id UUID NOT NULL REFERENCES public.ledger_archives(id) ON DELETE CASCADE,
  original_expense_id UUID NOT NULL,
  serial_number BIGINT NOT NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  purchaser_name TEXT NOT NULL,
  purchase_date DATE NOT NULL,
  amount NUMERIC(12,3) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'OMR',
  receipt_path TEXT,
  no_receipt_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT archived_receipt_or_reason CHECK (
    receipt_path IS NOT NULL OR (no_receipt_reason IS NOT NULL AND length(trim(no_receipt_reason)) >= 5)
  )
);

CREATE INDEX IF NOT EXISTS idx_archived_expenses_archive_serial
  ON public.archived_expenses(archive_id, serial_number);

CREATE OR REPLACE FUNCTION public.reset_expense_serial_seq()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  ALTER SEQUENCE expense_serial_seq RESTART WITH 1;
$$;

REVOKE ALL ON FUNCTION public.reset_expense_serial_seq() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reset_expense_serial_seq() TO service_role;

ALTER TABLE public.ledger_archives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archived_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ledger_archives_select_admin" ON public.ledger_archives
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "archived_expenses_select_admin" ON public.archived_expenses
  FOR SELECT TO authenticated
  USING (public.is_admin());

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ledger-archive-receipts',
  'ledger-archive-receipts',
  false,
  524288,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "ledger_archive_receipts_select_admin" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'ledger-archive-receipts' AND public.is_admin()
  );
