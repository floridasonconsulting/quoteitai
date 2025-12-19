-- Add missing columns for visual defaults feature
-- These columns are required for the Visual Defaults settings

-- Add visual_rules column (JSONB to store keyword-to-image mappings)
ALTER TABLE public.company_settings
ADD COLUMN IF NOT EXISTS visual_rules JSONB DEFAULT NULL;

-- Add default_cover_image column (URL for default cover image)
ALTER TABLE public.company_settings
ADD COLUMN IF NOT EXISTS default_cover_image TEXT DEFAULT NULL;

-- Add default_header_image column (URL for default section header image)
ALTER TABLE public.company_settings
ADD COLUMN IF NOT EXISTS default_header_image TEXT DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.company_settings.visual_rules IS 'JSON array of visual mapping rules: [{id, keyword, imageUrl, matchType}]';
COMMENT ON COLUMN public.company_settings.default_cover_image IS 'URL of the default cover image for proposals';
COMMENT ON COLUMN public.company_settings.default_header_image IS 'URL of the default section header image for proposals';
