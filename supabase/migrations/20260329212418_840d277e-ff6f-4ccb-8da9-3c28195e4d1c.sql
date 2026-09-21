-- Create developer type enum
CREATE TYPE public.developer_type AS ENUM ('utility', 'municipality', 'private_developer', 'energy_company', 'esco', 'other');

-- Create project stage enum
CREATE TYPE public.project_stage AS ENUM ('concept', 'feasibility', 'development', 'construction', 'operational');

-- Create developer profiles table
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

-- Enable RLS
ALTER TABLE public.developer_profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own developer profile"
  ON public.developer_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own developer profile"
  ON public.developer_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own developer profile"
  ON public.developer_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Timestamp trigger
CREATE TRIGGER update_developer_profiles_updated_at
  BEFORE UPDATE ON public.developer_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Update the auth trigger to also handle developers
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