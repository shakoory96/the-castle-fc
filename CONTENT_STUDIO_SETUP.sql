-- THE CASTLE FC — Content Studio settings and images
-- Run once in Supabase SQL Editor after the existing admin setup.
-- This does not delete or change player or match records.

BEGIN;

CREATE TABLE IF NOT EXISTS public.site_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  version integer NOT NULL DEFAULT 1 CHECK (version >= 1),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT castle_config_is_object CHECK (jsonb_typeof(config) = 'object'),
  CONSTRAINT castle_config_size_limit CHECK (octet_length(config::text) <= 250000)
);

INSERT INTO public.site_settings (id,config,version)
VALUES (1,'{}'::jsonb,1)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.site_settings FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.site_settings TO anon, authenticated;
GRANT UPDATE ON TABLE public.site_settings TO authenticated;

DROP POLICY IF EXISTS "Castle public read settings" ON public.site_settings;
CREATE POLICY "Castle public read settings"
ON public.site_settings FOR SELECT TO anon,authenticated
USING (id=1);

DROP POLICY IF EXISTS "Castle admin update settings" ON public.site_settings;
CREATE POLICY "Castle admin update settings"
ON public.site_settings FOR UPDATE TO authenticated
USING (id=1 AND (SELECT private.is_castle_admin()))
WITH CHECK (id=1 AND (SELECT private.is_castle_admin()));

INSERT INTO storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
VALUES ('castle-site-assets','castle-site-assets',true,3145728,
        ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE
SET public=EXCLUDED.public,
    file_size_limit=EXCLUDED.file_size_limit,
    allowed_mime_types=EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Castle admin upload site assets" ON storage.objects;
CREATE POLICY "Castle admin upload site assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id='castle-site-assets'
  AND name LIKE 'site/%'
  AND (SELECT private.is_castle_admin())
);

COMMIT;

SELECT 'site_settings' AS name,COUNT(*)::integer AS records FROM public.site_settings;
SELECT 'castle-site-assets' AS name,public AS is_public FROM storage.buckets WHERE id='castle-site-assets';
