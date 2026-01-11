// services/api.js
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

// --- CONSTANTS ---
const ATHLETICS_MAPPINGS = {
    'sprints': ['60m', '100 m', '200 m', '400 m', 'sprint', 'relay'],
    'middle_distance': ['800 m', '1500 m', 'mile', 'middle distance', '3000 m'],
    'long_distance': ['5000 m', '10000 m', '10km', 'marathon', 'cross country', 'xc', 'road', 'half marathon'],
    'hurdles': ['hurdles', 'steeplechase', '3000mSC'],
    'jumps': ['high jump', 'long jump', 'triple jump', 'pole vault', 'jump'],
    'throws': ['shot put', 'discus', 'javelin', 'hammer', 'throw'],
    'combined': ['heptathlon', 'decathlon', 'pentathlon', 'combined'],
    'walks': ['walk']
};

const ATHLETICS_EXCLUSIONS = {
    'sprints': ['hurdles', 'steeplechase', 'obstacle'],
};

// --- DATA FETCHING ---

// 1. Search Database
export const searchAthletes = async (query = '', category = 'all', nationality = null, page = 0, limit = 20) => {
    const from = page * limit;
    const to = from + limit - 1;

    // Use !inner to ensure we only get athletes who actually HAVE the matching event
    const joinType = category !== 'all' ? 'events!inner(result)' : 'events(result)';

    let dbQuery = supabase
        .from('entities')
        .select(`*, ${joinType}`)
        .range(from, to);

    // A. Text Search
    if (query.length > 0) dbQuery = dbQuery.ilike('name', `%${query}%`);

    // B. Nationality Filter
    if (nationality && nationality !== 'All') {
        dbQuery = dbQuery.ilike('nationality', nationality);
    }

    // C. Category Filter (Database Side - Inclusion Only)
    if (category !== 'all') {
        const mapping = ATHLETICS_MAPPINGS[category];
        if (mapping) {
            const conditions = mapping.flatMap(term => [
                `result->>discipline_clean.ilike.%${term}%`,
                `result->>discipline.ilike.%${term}%`,
                `result->>event.ilike.%${term}%`
            ]);
            dbQuery = dbQuery.or(conditions.join(','), { foreignTable: 'events' });
        } else {
            dbQuery = dbQuery.ilike('subcategory', category);
        }
    }

    // D. Sorting (Trending vs Name)
    // If you add a 'trending_score' column to your DB later, change 'name' to 'trending_score'
    if (query.length === 0 && category === 'all' && !nationality) {
        dbQuery = dbQuery.order('name', { ascending: true });
    } else {
        dbQuery = dbQuery.order('name', { ascending: true });
    }

    let { data, error } = await dbQuery;

    if (error) {
        console.error('Error searching athletes:', error);
        return [];
    }

    // E. Exclusion Filter (JavaScript)
    if (category !== 'all' && ATHLETICS_EXCLUSIONS[category] && data) {
        const exclusions = ATHLETICS_EXCLUSIONS[category];

        data = data.filter(athlete => {
            const validEvents = athlete.events.filter(e => {
                const str = JSON.stringify(e.result).toLowerCase();
                // Check if this specific event string contains any forbidden word
                const hasExcludedTerm = exclusions.some(term => str.includes(term.toLowerCase()));
                return !hasExcludedTerm;
            });
            return validEvents.length > 0;
        });
    }

    return data;
};

// 2. Fetch Follows
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

// 3. Fetch Profile
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

// 4. Toggle Follow
export const toggleFollow = async (userId, entityId, isCurrentlyFollowing) => {
    if (isCurrentlyFollowing) {
        const { error } = await supabase.from('follows').delete().eq('user_id', userId).eq('entity_id', entityId);
        return !error;
    } else {
        const { error } = await supabase.from('follows').insert([{ user_id: userId, entity_id: entityId }]);
        return !error;
    }
};

// 5. User Feed (Fixed & Restored)
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

// 6. Event Results
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