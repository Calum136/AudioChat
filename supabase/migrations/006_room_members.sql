-- Room members: tracks users who have joined a room (for persistence + admin roles)
CREATE TABLE room_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'member' CHECK (role IN ('member', 'admin')) NOT NULL,
  joined_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(room_id, user_id)
);

-- RLS
ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;

-- Users can see members of rooms they belong to
CREATE POLICY "Users can view room members"
  ON room_members FOR SELECT
  USING (
    auth.uid() = user_id
    OR room_id IN (SELECT id FROM rooms WHERE owner_id = auth.uid())
    OR room_id IN (SELECT rm.room_id FROM room_members rm WHERE rm.user_id = auth.uid())
  );

-- Users can add themselves as members
CREATE POLICY "Users can join rooms"
  ON room_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can leave rooms (delete own membership)
CREATE POLICY "Users can leave rooms"
  ON room_members FOR DELETE
  USING (auth.uid() = user_id);

-- Room owners can update member roles (promote/demote)
CREATE POLICY "Owners can manage roles"
  ON room_members FOR UPDATE
  USING (
    room_id IN (SELECT id FROM rooms WHERE owner_id = auth.uid())
  );
