-- Add avatar customization columns to profiles
-- These store the user's chosen avatar appearance options.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_hair text NOT NULL DEFAULT '#6b4422',
  ADD COLUMN IF NOT EXISTS avatar_skin text NOT NULL DEFAULT '#f0c8a0',
  ADD COLUMN IF NOT EXISTS avatar_shirt text NOT NULL DEFAULT '#5577bb',
  ADD COLUMN IF NOT EXISTS avatar_pants text NOT NULL DEFAULT '#3d5288',
  ADD COLUMN IF NOT EXISTS avatar_bg text NOT NULL DEFAULT '#1a1a2e';
