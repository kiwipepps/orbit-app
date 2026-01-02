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

// 1. Search Database (Updated with Category Filter)
export const searchAthletes = async (query = '', category = 'all') => {
    let dbQuery = supabase
        .from('entities')
        .select('*')
        .order('name', { ascending: true })
        .limit(50);

    // Filter by Text
    if (query.length > 0) {
        dbQuery = dbQuery.ilike('name', `%${query}%`);
    }

    // Filter by Category (using 'subcategory' column)
    if (category !== 'all') {
        dbQuery = dbQuery.ilike('subcategory', category);
    }

    const { data, error } = await dbQuery;

    if (error) {
        console.error('Error searching athletes:', error);
        return [];
    }
    return data;
};

// 2. Fetch ONLY Followed Athletes
export const fetchFollowedAthletes = async (userId) => {
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

// 5. Fetch Activity Feed (Events from followed athletes)
export const fetchUserFeed = async (userId) => {
    // A. Get list of IDs the user follows
    const { data: follows, error: followError } = await supabase
        .from('follows')
        .select('entity_id')
        .eq('user_id', userId);

    if (followError) {
        console.error('Error fetching follows for feed:', followError);
        return [];
    }

    const followedIds = follows.map(f => f.entity_id);

    if (followedIds.length === 0) return []; // User follows no one

    // B. Get latest events for these IDs
    // We also fetch the 'entities' data so we can show the athlete's Name/Photo on the card
    const { data: events, error: eventError } = await supabase
        .from('events')
        .select(`
            *,
            entities (id, name, image_url, category, subcategory)
        `)
        .in('entity_id', followedIds)
        .order('start_time', { ascending: false })
        .limit(20); // Limit to 20 items for speed

    if (eventError) {
        console.error('Error fetching feed:', eventError);
        return [];
    }
    return events;
};