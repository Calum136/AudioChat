-- Add image_url column to rooms for room cover images
ALTER TABLE rooms ADD COLUMN image_url text;

-- Storage bucket policies for room-images
-- NOTE: Create the 'room-images' bucket in the Supabase dashboard (Storage > New bucket)
-- Set it to Public so images are accessible via public URL

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload room images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'room-images'
    AND auth.role() = 'authenticated'
  );

-- Allow authenticated users to update (upsert) their images
CREATE POLICY "Authenticated users can update room images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'room-images'
    AND auth.role() = 'authenticated'
  );

-- Public read access for room images
CREATE POLICY "Anyone can view room images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'room-images');

-- Users can delete images in their own folder
CREATE POLICY "Users can delete own room images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'room-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
