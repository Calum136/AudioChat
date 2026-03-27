import { supabase } from './supabase';

/**
 * Search users by display name (excludes self and blocked users).
 */
export async function searchUsers(query, currentUserId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, color')
    .ilike('display_name', `%${query}%`)
    .neq('id', currentUserId)
    .limit(10);
  if (error) throw error;
  return data;
}

/**
 * Send a friend request. Checks for existing friendship in either direction.
 */
export async function sendFriendRequest(requesterId, addresseeId) {
  // Check if friendship exists in either direction
  const { data: existing } = await supabase
    .from('friendships')
    .select('id, status, requester_id')
    .or(`and(requester_id.eq.${requesterId},addressee_id.eq.${addresseeId}),and(requester_id.eq.${addresseeId},addressee_id.eq.${requesterId})`)
    .maybeSingle();

  if (existing) {
    if (existing.status === 'accepted') throw new Error('Already friends');
    if (existing.status === 'pending') throw new Error('Request already pending');
    if (existing.status === 'blocked') throw new Error('Cannot send request');
  }

  const { data, error } = await supabase
    .from('friendships')
    .insert({ requester_id: requesterId, addressee_id: addresseeId, status: 'pending' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Accept an incoming friend request.
 */
export async function acceptRequest(friendshipId) {
  const { error } = await supabase
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('id', friendshipId);
  if (error) throw error;
}

/**
 * Decline/remove a friend request or friendship.
 */
export async function removeFriendship(friendshipId) {
  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', friendshipId);
  if (error) throw error;
}

/**
 * Block a user. Upserts the friendship row with blocked status.
 */
export async function blockUser(currentUserId, targetUserId) {
  // Check for existing friendship in either direction
  const { data: existing } = await supabase
    .from('friendships')
    .select('id, requester_id, addressee_id')
    .or(`and(requester_id.eq.${currentUserId},addressee_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},addressee_id.eq.${currentUserId})`)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'blocked', blocked_by: currentUserId })
      .eq('id', existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('friendships')
      .insert({ requester_id: currentUserId, addressee_id: targetUserId, status: 'blocked', blocked_by: currentUserId })
      .select()
      .single();
    if (error) throw error;
  }
}

/**
 * Unblock a user (deletes the friendship row).
 */
export async function unblockUser(friendshipId) {
  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', friendshipId);
  if (error) throw error;
}

/**
 * Get all accepted friends for a user, with profile data.
 */
export async function getFriends(userId) {
  const { data, error } = await supabase
    .from('friendships')
    .select(`
      id,
      requester_id,
      addressee_id,
      created_at,
      requester:profiles!friendships_requester_id_fkey(id, display_name, color),
      addressee:profiles!friendships_addressee_id_fkey(id, display_name, color)
    `)
    .eq('status', 'accepted')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);
  if (error) throw error;

  // Normalize: return the "other" person's profile
  return data.map((f) => {
    const isRequester = f.requester_id === userId;
    const friend = isRequester ? f.addressee : f.requester;
    return {
      friendshipId: f.id,
      id: friend.id,
      displayName: friend.display_name,
      color: friend.color,
    };
  });
}

/**
 * Get pending incoming requests for a user.
 */
export async function getPendingRequests(userId) {
  const { data, error } = await supabase
    .from('friendships')
    .select(`
      id,
      requester_id,
      created_at,
      requester:profiles!friendships_requester_id_fkey(id, display_name, color)
    `)
    .eq('status', 'pending')
    .eq('addressee_id', userId);
  if (error) throw error;

  return data.map((f) => ({
    friendshipId: f.id,
    id: f.requester.id,
    displayName: f.requester.display_name,
    color: f.requester.color,
    createdAt: f.created_at,
  }));
}

/**
 * Get users blocked by the current user.
 */
export async function getBlockedUsers(userId) {
  const { data, error } = await supabase
    .from('friendships')
    .select(`
      id,
      requester_id,
      addressee_id,
      requester:profiles!friendships_requester_id_fkey(id, display_name, color),
      addressee:profiles!friendships_addressee_id_fkey(id, display_name, color)
    `)
    .eq('status', 'blocked')
    .eq('blocked_by', userId);
  if (error) throw error;

  return data.map((f) => {
    const blocked = f.requester_id === userId ? f.addressee : f.requester;
    return {
      friendshipId: f.id,
      id: blocked.id,
      displayName: blocked.display_name,
      color: blocked.color,
    };
  });
}
