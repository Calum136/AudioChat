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
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
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
  const { error } = await supabase
    .from('rooms')
    .delete()
    .eq('id', roomId);
  if (error) throw error;
}

export async function saveFurnitureRemove(furnitureId) {
  const { error } = await supabase
    .from('furniture')
    .delete()
    .eq('id', furnitureId);
  if (error) throw error;
}
