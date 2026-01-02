import { supabase } from '../lib/supabase';

// --- AUTH ---
export const signIn = async (email, password) => {
    return await supabase.auth.signInWithPassword({ email, password });
};

export const signUp = async (email, password) => {
    return await supabase.auth.signUp({ email, password });
};

export const signOut = async () => {
    return await supabase.auth.signOut();
};

// --- DATA FETCHING ---

// 1. Fetch all Athletes (Entities)
export const fetchAthletes = async () => {
    const { data, error } = await supabase
        .from('entities')
        .select('*')
        .order('name', { ascending: true });

    if (error) {
        console.error('Error fetching athletes:', error);
        return [];
    }
    return data;
};

// 2. Fetch specific Athlete + Their Events
export const fetchAthleteProfile = async (athleteId) => {
    // A. Get basic details
    const { data: athlete, error: athleteError } = await supabase
        .from('entities')
        .select('*')
        .eq('id', athleteId)
        .single();

    if (athleteError) throw athleteError;

    // B. Get their events (using your JSONB result structure)
    const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('id, title, start_time, result, category')
        .eq('entity_id', athleteId)
        .order('start_time', { ascending: false });

    if (eventsError) throw eventsError;

    return { ...athlete, events };
};

// 3. Follow/Unfollow Logic
export const toggleFollow = async (userId, entityId, isCurrentlyFollowing) => {
    if (isCurrentlyFollowing) {
        // Unfollow
        const { error } = await supabase
            .from('follows')
            .delete()
            .match({ user_id: userId, entity_id: entityId });
        return error ? false : true;
    } else {
        // Follow
        const { error } = await supabase
            .from('follows')
            .insert({ user_id: userId, entity_id: entityId });
        return error ? false : true;
    }
};