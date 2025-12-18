-- Add item_images column to proposal_visuals table for line-item specific overrides
ALTER TABLE proposal_visuals 
ADD COLUMN IF NOT EXISTS item_images JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN proposal_visuals.item_images IS 'Line-item specific image overrides as a JSON object of item names to URLs';
