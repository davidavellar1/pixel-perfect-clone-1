CREATE TABLE public.user_profile (
 user_id uuid PRIMARY KEY DEFAULT auth.uid(),
 first_name text CHECK (char_length(first_name) <= 100),
 last_name text CHECK (char_length(last_name) <= 100),
 job_title text CHECK (char_length(job_title) <= 160),
 phone text CHECK (phone IS NULL OR phone = '' OR phone ~ '^\+[0-9][0-9 ()-]{5,24}$'),
 linkedin_url text CHECK (linkedin_url IS NULL OR linkedin_url = '' OR linkedin_url ~ '^https://([a-z]{2,3}\.)?(www\.)?linkedin\.com/(in|pub)/[^[:space:]]+$'),
 bio text CHECK (char_length(bio) <= 600),
 avatar_url text CHECK (avatar_url IS NULL OR avatar_url LIKE user_id::text || '/%'),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.user_profile TO authenticated;
GRANT ALL ON public.user_profile TO service_role;
ALTER TABLE public.user_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_profile_select ON public.user_profile FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY user_profile_insert ON public.user_profile FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY user_profile_update ON public.user_profile FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER user_profile_updated_at BEFORE UPDATE ON public.user_profile FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
INSERT INTO public.user_profile (user_id,first_name,last_name)
SELECT user_id, split_part(btrim(full_name),' ',1), nullif(regexp_replace(btrim(full_name),'^[^[:space:]]+[[:space:]]*',''),'')
FROM (SELECT DISTINCT ON (user_id) user_id, full_name FROM (
 SELECT user_id, full_name, 0 AS priority FROM public.investor_profiles WHERE nullif(btrim(full_name),'') IS NOT NULL
 UNION ALL SELECT user_id,full_name,1 FROM public.developer_profiles WHERE nullif(btrim(full_name),'') IS NOT NULL
) names ORDER BY user_id,priority) chosen;
ALTER TABLE public.investor_profiles ADD COLUMN technologies_of_interest public.technology[] NOT NULL DEFAULT '{}';
CREATE FUNCTION public.sync_profile_full_name() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE n text := btrim(concat_ws(' ', nullif(btrim(NEW.first_name),''), nullif(btrim(NEW.last_name),'')));
BEGIN
 IF EXISTS (SELECT 1 FROM public.user_role WHERE user_id = NEW.user_id AND role = 'investor') THEN
 INSERT INTO public.investor_profiles(user_id,full_name) VALUES (NEW.user_id,n) ON CONFLICT(user_id) DO UPDATE SET full_name = excluded.full_name;
 END IF;
 IF EXISTS (SELECT 1 FROM public.user_role WHERE user_id = NEW.user_id AND role = 'developer') THEN
 INSERT INTO public.developer_profiles(user_id,full_name) VALUES (NEW.user_id,n) ON CONFLICT(user_id) DO UPDATE SET full_name = excluded.full_name;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER user_profile_sync_name AFTER INSERT OR UPDATE OF first_name,last_name ON public.user_profile FOR EACH ROW EXECUTE FUNCTION public.sync_profile_full_name();
CREATE POLICY avatar_owner_read ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY avatar_owner_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text AND lower(storage.extension(name)) IN ('jpg','jpeg','png','webp','gif') AND metadata->>'mimetype' IN ('image/jpeg','image/png','image/webp','image/gif') AND (metadata->>'size')::bigint <= 2097152);
CREATE POLICY avatar_owner_update ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text) WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text AND lower(storage.extension(name)) IN ('jpg','jpeg','png','webp','gif') AND metadata->>'mimetype' IN ('image/jpeg','image/png','image/webp','image/gif') AND (metadata->>'size')::bigint <= 2097152);
CREATE POLICY avatar_owner_delete ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);