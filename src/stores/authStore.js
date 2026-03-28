import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export const useAuthStore = create((set, get) => ({
  user: null,       // { id, displayName, color, avatar: { hair, skin, shirt, pants, bg } }
  loading: true,    // true until initial session check
  error: null,

  initialize: async () => {
    try {
      // Check existing session
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await get().fetchProfile(session.user.id);
      }
    } catch (e) {
      console.error('Auth init failed:', e);
    }
    set({ loading: false });

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (event === 'SIGNED_IN' && session) {
          await get().fetchProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          set({ user: null });
        }
      } catch (e) {
        console.error('Auth state change error:', e);
      }
    });
  },

  fetchProfile: async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (data) {
      set({
        user: {
          id: userId,
          displayName: data.display_name,
          color: data.color,
          avatar: {
            hair: data.avatar_hair || '#6b4422',
            skin: data.avatar_skin || '#f0c8a0',
            shirt: data.avatar_shirt || '#5577bb',
            pants: data.avatar_pants || '#3d5288',
            bg: data.avatar_bg || '#1a1a2e',
          },
        },
      });
    }
  },

  signUp: async ({ email, password, displayName, color }) => {
    set({ error: null });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName, color },
      },
    });
    if (error) { set({ error: error.message }); return false; }

    // Profile is auto-created by DB trigger from user metadata.
    // If email confirmation is disabled, we have a session immediately.
    if (data.session) {
      await get().fetchProfile(data.user.id);
    } else {
      // Email confirmation enabled — user needs to verify first
      set({ error: 'Check your email to confirm your account, then sign in.' });
    }
    return true;
  },

  signIn: async ({ email, password }) => {
    set({ error: null });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { set({ error: error.message }); return false; }
    return true;
  },

  updateAvatar: async (avatar) => {
    const user = get().user;
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update({
        avatar_hair: avatar.hair,
        avatar_skin: avatar.skin,
        avatar_shirt: avatar.shirt,
        avatar_pants: avatar.pants,
        avatar_bg: avatar.bg,
      })
      .eq('id', user.id);
    if (!error) {
      set({ user: { ...user, avatar } });
    }
    return error;
  },

  updateDisplayName: async (displayName) => {
    const user = get().user;
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName })
      .eq('id', user.id);
    if (!error) {
      set({ user: { ...user, displayName } });
    }
    return error;
  },

  updatePassword: async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return error;
  },

  updateEmail: async (newEmail) => {
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    return error;
  },

  deleteAccount: async () => {
    // User deletion requires a server-side admin call; for now delete profile + sign out
    const user = get().user;
    if (!user) return;
    await supabase.from('profiles').delete().eq('id', user.id);
    await supabase.auth.signOut();
    set({ user: null });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  },
}));
