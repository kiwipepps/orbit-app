import React, { useEffect, useState, useMemo } from 'react';
import {
    View, Text, FlatList, ActivityIndicator, StyleSheet,
    SafeAreaView, Image, Platform, StatusBar
} from 'react-native';
import { fetchAthleteProfile } from '../services/api';

// 1. CUSTOM LABELS
const DISPLAY_NAMES = {
    "place_rank": "Place",
    "rank": "Place",
    "pos": "Place",
    "mark": "Mark",
    "discipline_clean": "Event",
    "event": "Event",
    "round_label": "Round", // Fixes "Round Name" -> "Round"
    "round": "Round",
    "phase": "Round",
    "wind": "Wind",
    "venue": "Location",
    "date": "Date"
};

export default function AthleteDetailScreen({ route }) {
    const { athleteId } = route.params;
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const data = await fetchAthleteProfile(athleteId);
            setProfile(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // --- SORTING LOGIC ---
    const sortedEvents = useMemo(() => {
        if (!profile?.events) return [];

        // Helper to score rounds (Higher number = Higher priority)
        const getRoundScore = (event) => {
            // Combine title and result data to find the round name
            const text = (event.title + " " + JSON.stringify(event.result)).toLowerCase();

            if (text.includes('final') && !text.includes('semi')) return 100; // Final (Top)
            if (text.includes('semi')) return 90;   // Semi Final
            if (text.includes('quarter')) return 80; // Quarter Final
            if (text.includes('round 3')) return 70;
            if (text.includes('round 2')) return 60;
            if (text.includes('round 1')) return 50;
            if (text.includes('qual')) return 40;   // Qualification
            if (text.includes('heat')) return 30;   // Heats
            return 0; // Unknown
        };

        return [...profile.events].sort((a, b) => {
            // 1. Sort by Date (Desc)
            const dateA = new Date(a.start_time).getTime();
            const dateB = new Date(b.start_time).getTime();
            if (dateA !== dateB) return dateB - dateA;

            // 2. If same Date, Sort by Round Priority (Desc)
            return getRoundScore(b) - getRoundScore(a);
        });
    }, [profile]);

    // --- FORMATTERS ---

    const formatKey = (key) => {
        if (DISPLAY_NAMES[key]) return DISPLAY_NAMES[key];
        return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    };

    const formatValue = (key, value) => {
        if (!value) return '-';

        // A. Ordinal Logic for Ranks (1st, 2nd)
        if (key.toLowerCase().includes('rank') || key.toLowerCase().includes('place')) {
            const num = parseInt(String(value).replace(/[^0-9]/g, ''), 10);
            if (!isNaN(num)) return getOrdinal(num);
        }

        // B. Text Cleanup (Fixes "100m_Hurdles" -> "100m Hurdles")
        if (typeof value === 'string') {
            // Replaces underscores with space & capitalizes words
            return value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        }

        return String(value);
    };

    const getOrdinal = (n) => {
        const s = ["th", "st", "nd", "rd"];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };

    // Sorting the stats rows (Place -> Mark -> Event)
    const getSortPriority = (key) => {
        const k = key.toLowerCase();
        if (k.includes('place') || k.includes('rank') || k.includes('pos')) return 1;
        if (k.includes('mark') || k.includes('result') || k.includes('time')) return 2;
        if (k.includes('discipline') || k.includes('event')) return 3;
        return 4;
    };

    const getSortedEntries = (resultObj) => {
        if (!resultObj) return [];
        return Object.entries(resultObj).sort(([keyA], [keyB]) => {
            const priorityA = getSortPriority(keyA);
            const priorityB = getSortPriority(keyB);
            if (priorityA !== priorityB) return priorityA - priorityB;
            return keyA.localeCompare(keyB);
        });
    };

    if (loading) return <ActivityIndicator style={{ marginTop: 50 }} size="large" color="#7F56D9" />;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Image
                    source={{ uri: profile?.image_url || 'https://via.placeholder.com/150' }}
                    style={styles.avatar}
                />
                <Text style={styles.name}>{profile?.name}</Text>
                <Text style={styles.category}>{profile?.subcategory || profile?.category || 'Athlete'}</Text>
            </View>

            <View style={styles.content}>
                <Text style={styles.sectionTitle}>Recent Results</Text>

                <FlatList
                    data={sortedEvents} // Using the Sorted List
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    renderItem={({ item }) => (
                        <View style={styles.eventCard}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.eventTitle}>{item.title}</Text>
                                <Text style={styles.eventDate}>
                                    {new Date(item.start_time).toLocaleDateString()}
                                </Text>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.statsContainer}>
                                {item.result && typeof item.result === 'object' ? (
                                    getSortedEntries(item.result).map(([key, value]) => {
                                        if (key === 'hidden_id') return null;

                                        return (
                                            <View key={key} style={styles.statRow}>
                                                <Text style={styles.statLabel}>{formatKey(key)}</Text>
                                                <Text style={styles.statValue}>{formatValue(key, value)}</Text>
                                            </View>
                                        );
                                    })
                                ) : (
                                    <Text style={{ color: '#666' }}>No detailed results available.</Text>
                                )}
                            </View>
                        </View>
                    )}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    header: {
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#F9FAFB',
        borderBottomWidth: 1,
        borderColor: '#EAECF0'
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 16,
        borderWidth: 3,
        borderColor: '#FFFFFF',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
    },
    name: { fontSize: 24, fontWeight: '700', color: '#101828', textAlign: 'center' },
    category: { color: '#7F56D9', fontSize: 16, fontWeight: '500', marginTop: 4 },
    content: { flex: 1, paddingHorizontal: 16 },
    sectionTitle: { fontSize: 18, fontWeight: '600', color: '#101828', marginTop: 20, marginBottom: 12 },
    eventCard: {
        backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#EAECF0', marginBottom: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2,
    },
    cardHeader: {
        padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#F9FAFB', borderTopLeftRadius: 12, borderTopRightRadius: 12,
    },
    eventTitle: { fontSize: 16, fontWeight: '700', color: '#101828', flex: 1 },
    eventDate: { fontSize: 14, color: '#667085' },
    divider: { height: 1, backgroundColor: '#EAECF0' },
    statsContainer: { padding: 16 },
    statRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    statLabel: { fontSize: 14, color: '#667085', fontWeight: '500' },
    statValue: { fontSize: 14, color: '#101828', fontWeight: '600' }
});