-- Add missing DELETE policy for rooms table
-- Allows room owners to delete their own rooms
create policy "Room owners can delete their rooms"
  on public.rooms for delete
  to authenticated
  using (auth.uid() = owner_id);
