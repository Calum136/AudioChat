import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export const useAuthStore = create((set, get) => ({
  user: null,       // { id, displayName, color }
  loading: true,    // true until initial session check
  error: null,

  initialize: async () => {
    // Check existing session
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await get().fetchProfile(session.user.id);
    }
    set({ loading: false });

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        await get().fetchProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        set({ user: null });
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
        },
      });
    }
  },

  signUp: async ({ email, password, displayName, color }) => {
    set({ error: null });
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) { set({ error: error.message }); return false; }

    // Insert profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({ id: data.user.id, display_name: displayName, color });
    if (profileError) { set({ error: profileError.message }); return false; }

    await get().fetchProfile(data.user.id);
    return true;
  },

  signIn: async ({ email, password }) => {
    set({ error: null });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { set({ error: error.message }); return false; }
    return true;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  },
}));
