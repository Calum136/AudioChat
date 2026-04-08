import { supabase } from './supabase';

export async function createRoom(name, ownerId) {
  const { data, error } = await supabase
    .from('rooms')
    .insert({ name, owner_id: ownerId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getRoomByJoinCode(joinCode) {
  const normalized = joinCode.trim().toLowerCase();
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .ilike('join_code', normalized)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getUserRooms(userId) {
  // Fetch owned rooms
  const { data: owned, error: e1 } = await supabase
    .from('rooms')
    .select('*')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false });
  if (e1) throw e1;

  // Fetch rooms the user has joined (via room_members)
  const { data: memberships, error: e2 } = await supabase
    .from('room_members')
    .select('room_id, role, rooms(*)')
    .eq('user_id', userId);
  // Silently ignore if room_members table doesn't exist yet
  const joinedRooms = (!e2 && memberships)
    ? memberships.filter((m) => m.rooms).map((m) => ({ ...m.rooms, _memberRole: m.role }))
    : [];

  // Merge and deduplicate
  const ownedIds = new Set((owned || []).map((r) => r.id));
  const allRooms = [...(owned || [])];
  for (const r of joinedRooms) {
    if (!ownedIds.has(r.id)) allRooms.push(r);
  }
  return allRooms.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export async function getRoom(roomId) {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', roomId)
    .single();
  if (error) throw error;
  return data;
}

export async function updateRoomTheme(roomId, theme) {
  const { error } = await supabase
    .from('rooms')
    .update({ theme })
    .eq('id', roomId);
  if (error) throw error;
}

export async function loadFurniture(roomId) {
  const { data, error } = await supabase
    .from('furniture')
    .select('*')
    .eq('room_id', roomId);
  if (error) throw error;
  return data;
}

export async function saveFurnitureAdd(roomId, type, x, y) {
  const { data, error } = await supabase
    .from('furniture')
    .insert({ room_id: roomId, type, x, y })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function saveFurnitureMove(furnitureId, x, y) {
  const { error } = await supabase
    .from('furniture')
    .update({ x, y })
    .eq('id', furnitureId);
  if (error) throw error;
}

export async function deleteRoom(roomId) {
  // Delete all furniture in the room first, then the room
  const { error: furErr } = await supabase
    .from('furniture')
    .delete()
    .eq('room_id', roomId);
  if (furErr) throw furErr;
  const { error, count } = await supabase
    .from('rooms')
    .delete({ count: 'exact' })
    .eq('id', roomId);
  if (error) throw error;
  if (count === 0) throw new Error('Could not delete room. You may not be the owner.');
}

export async function saveFurnitureRemove(furnitureId) {
  const { error } = await supabase
    .from('furniture')
    .delete()
    .eq('id', furnitureId);
  if (error) throw error;
}

// ======== Room Membership ========

export async function joinRoomMembership(roomId, userId) {
  const { error } = await supabase
    .from('room_members')
    .upsert({ room_id: roomId, user_id: userId }, { onConflict: 'room_id,user_id' });
  // Silently ignore if table doesn't exist yet
  if (error) console.warn('[roomService] joinRoomMembership:', error.message);
}

export async function leaveRoomMembership(roomId, userId) {
  const { error } = await supabase
    .from('room_members')
    .delete()
    .eq('room_id', roomId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function getRoomMemberRole(roomId, userId) {
  const { data, error } = await supabase
    .from('room_members')
    .select('role')
    .eq('room_id', roomId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) return null;
  return data?.role || null;
}

export async function setRoomMemberRole(roomId, userId, role) {
  const { error } = await supabase
    .from('room_members')
    .update({ role })
    .eq('room_id', roomId)
    .eq('user_id', userId);
  if (error) throw error;
}
