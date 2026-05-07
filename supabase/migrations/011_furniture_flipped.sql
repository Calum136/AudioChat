-- Add flipped column to furniture table for 3D model orientation
alter table public.furniture add column if not exists flipped boolean not null default false;
