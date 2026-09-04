-- Create the storage bucket for private designs
INSERT INTO storage.buckets (id, name, public)
VALUES ('designs', 'designs', false)
ON CONFLICT (id) DO UPDATE SET public = false;
