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

// 1. Fetch ALL Athletes (For Search Screen)
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

// 2. Fetch ONLY Followed Athletes (For My Orbit Screen)
export const fetchFollowedAthletes = async (userId) => {
    // We select the 'entities' data referenced in the 'follows' table
    const { data, error } = await supabase
        .from('follows')
        .select(`
        entity_id,
        entities (*)
      `)
        .eq('user_id', userId);

    if (error) {
        console.error('Error fetching followed athletes:', error);
        return [];
    }
    // Flatten the result: Supabase returns { entities: {name: '...'} }, we just want { name: '...' }
    return data.map(item => item.entities).filter(Boolean);
};

// 3. Fetch specific Athlete Profile
export const fetchAthleteProfile = async (athleteId) => {
    const { data: athlete, error: athleteError } = await supabase
        .from('entities')
        .select('*')
        .eq('id', athleteId)
        .single();

    if (athleteError) throw athleteError;

    const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('id, title, start_time, result, category')
        .eq('entity_id', athleteId)
        .order('start_time', { ascending: false });

    if (eventsError) throw eventsError;

    return { ...athlete, events };
};

// 4. Follow/Unfollow Logic
export const toggleFollow = async (userId, entityId, isCurrentlyFollowing) => {
    if (isCurrentlyFollowing) {
        const { error } = await supabase
            .from('follows')
            .delete()
            .eq('user_id', userId)
            .eq('entity_id', entityId);
        return error ? false : true;
    } else {
        const { error } = await supabase
            .from('follows')
            .insert([{ user_id: userId, entity_id: entityId }]);
        return error ? false : true;
    }
};