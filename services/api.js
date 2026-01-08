// services/api.js

import { supabase } from '../lib/supabase';

// ... (Authentication functions remain the same) ...
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

// 1. Search Database (🟢 UPDATED FOR PAGINATION)
export const searchAthletes = async (query = '', category = 'all', page = 0, limit = 20) => {
    const from = page * limit;
    const to = from + limit - 1;

    let dbQuery = supabase
        .from('entities')
        .select('*')
        .order('name', { ascending: true })
        .range(from, to); // 👈 Fetch specific range

    if (query.length > 0) dbQuery = dbQuery.ilike('name', `%${query}%`);
    if (category !== 'all') dbQuery = dbQuery.ilike('subcategory', category);

    const { data, error } = await dbQuery;
    if (error) {
        console.error('Error searching athletes:', error);
        return [];
    }
    return data;
};

// ... (Rest of the file remains exactly the same: fetchFollowedAthletes, fetchAthleteProfile, etc.) ...
export const fetchFollowedAthletes = async (userId) => {
    const { data, error } = await supabase
        .from('follows')
        .select(`entity_id, entities (*)`)
        .eq('user_id', userId);

    if (error) {
        console.error('Error fetching followed athletes:', error);
        return [];
    }
    return data.map(item => item.entities).filter(Boolean);
};

export const fetchAthleteProfile = async (athleteId) => {
    const { data: athlete, error: athleteError } = await supabase
        .from('entities')
        .select('*')
        .eq('id', athleteId)
        .single();

    if (athleteError) throw athleteError;

    const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('entity_id', athleteId)
        .order('start_time', { ascending: false });

    if (eventsError) throw eventsError;

    return { ...athlete, events };
};

export const toggleFollow = async (userId, entityId, isCurrentlyFollowing) => {
    if (isCurrentlyFollowing) {
        const { error } = await supabase.from('follows').delete().eq('user_id', userId).eq('entity_id', entityId);
        return !error;
    } else {
        const { error } = await supabase.from('follows').insert([{ user_id: userId, entity_id: entityId }]);
        return !error;
    }
};

export const fetchUserFeed = async (userId) => {
    const { data: follows, error: followError } = await supabase
        .from('follows')
        .select('entity_id')
        .eq('user_id', userId);

    if (followError) return [];
    const followedIds = follows.map(f => f.entity_id);
    if (followedIds.length === 0) return [];

    const { data: events, error: eventError } = await supabase
        .from('events')
        .select(`*, entities (id, name, image_url, category, subcategory)`)
        .in('entity_id', followedIds)
        .order('start_time', { ascending: false })
        .limit(20);

    if (eventError) return [];
    return events;
};

export const fetchEventResults = async (title, eventKey) => {
    const { data, error } = await supabase
        .from('events')
        .select(`
            *,
            entities (
                id, 
                name, 
                image_url, 
                category, 
                subcategory, 
                nationality
            )
        `)
        .eq('title', title)
        .eq('event_key', eventKey);

    if (error) {
        console.error('Error fetching event results:', error);
        return [];
    }
    return data;
};