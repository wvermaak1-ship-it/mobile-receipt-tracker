-- Allow receipt uploads before receipt_path is set on the expense row.
-- Upsert requires SELECT + UPDATE in addition to INSERT; prior policies only
-- matched objects already linked via expenses.receipt_path.

CREATE OR REPLACE FUNCTION public.user_owns_receipt_path(path_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.expenses e
    WHERE e.user_id = auth.uid()
      AND (
        e.receipt_path = path_name
        OR (
          e.purchase_date::text = (storage.foldername(path_name))[1]
          AND e.serial_number::text = split_part(storage.filename(path_name), '.', 1)
        )
      )
  );
$$;

DROP POLICY IF EXISTS "receipts_select" ON storage.objects;
DROP POLICY IF EXISTS "receipts_insert" ON storage.objects;
DROP POLICY IF EXISTS "receipts_update" ON storage.objects;
DROP POLICY IF EXISTS "receipts_delete" ON storage.objects;

CREATE POLICY "receipts_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'receipts'
    AND (public.is_admin() OR public.user_owns_receipt_path(name))
  );

CREATE POLICY "receipts_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'receipts'
    AND (public.is_admin() OR public.user_owns_receipt_path(name))
  );

CREATE POLICY "receipts_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'receipts'
    AND (public.is_admin() OR public.user_owns_receipt_path(name))
  )
  WITH CHECK (
    bucket_id = 'receipts'
    AND (public.is_admin() OR public.user_owns_receipt_path(name))
  );

CREATE POLICY "receipts_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'receipts'
    AND (public.is_admin() OR public.user_owns_receipt_path(name))
  );
