-- Create investor types enum
CREATE TYPE public.investor_type AS ENUM ('fund', 'family_office', 'corporate', 'individual', 'other');

-- Create investment range enum
CREATE TYPE public.investment_range AS ENUM ('under_1m', '1m_5m', '5m_25m', '25m_100m', 'over_100m');

-- Create investor profiles table
CREATE TABLE public.investor_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  company_name TEXT,
  investor_type investor_type,
  investment_range investment_range,
  regions_of_interest TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.investor_profiles TO authenticated;
GRANT ALL ON public.investor_profiles TO service_role;

ALTER TABLE public.investor_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.investor_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.investor_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.investor_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_investor_profiles_updated_at
  BEFORE UPDATE ON public.investor_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Developer profiles
CREATE TYPE public.developer_type AS ENUM ('utility', 'municipality', 'private_developer', 'energy_company', 'esco', 'other');
CREATE TYPE public.project_stage AS ENUM ('concept', 'feasibility', 'development', 'construction', 'operational');

CREATE TABLE public.developer_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  company_name TEXT,
  position TEXT,
  developer_type developer_type,
  project_stages TEXT[],
  countries_of_operation TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.developer_profiles TO authenticated;
GRANT ALL ON public.developer_profiles TO service_role;

ALTER TABLE public.developer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own developer profile"
  ON public.developer_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own developer profile"
  ON public.developer_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own developer profile"
  ON public.developer_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_developer_profiles_updated_at
  BEFORE UPDATE ON public.developer_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_investor()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.raw_user_meta_data->>'user_type') = 'investor' THEN
    INSERT INTO public.investor_profiles (user_id, full_name, company_name, investor_type, investment_range, regions_of_interest)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      NULLIF(NEW.raw_user_meta_data->>'company_name', ''),
      NULLIF(NEW.raw_user_meta_data->>'investor_type', '')::investor_type,
      NULLIF(NEW.raw_user_meta_data->>'investment_range', '')::investment_range,
      CASE
        WHEN NEW.raw_user_meta_data->'regions_of_interest' IS NOT NULL
        THEN ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'regions_of_interest'))
        ELSE NULL
      END
    );
  ELSIF (NEW.raw_user_meta_data->>'user_type') = 'developer' THEN
    INSERT INTO public.developer_profiles (user_id, full_name, company_name, position, developer_type, project_stages, countries_of_operation)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      NULLIF(NEW.raw_user_meta_data->>'company_name', ''),
      NULLIF(NEW.raw_user_meta_data->>'position', ''),
      NULLIF(NEW.raw_user_meta_data->>'developer_type', '')::developer_type,
      CASE
        WHEN NEW.raw_user_meta_data->'project_stages' IS NOT NULL
        THEN ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'project_stages'))
        ELSE NULL
      END,
      CASE
        WHEN NEW.raw_user_meta_data->'countries_of_operation' IS NOT NULL
        THEN ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'countries_of_operation'))
        ELSE NULL
      END
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_investor();
