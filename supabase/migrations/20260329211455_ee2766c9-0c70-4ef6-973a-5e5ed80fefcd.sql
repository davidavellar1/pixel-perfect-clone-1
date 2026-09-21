-- Create trigger to auto-create investor profile from user metadata on signup
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
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_investor();