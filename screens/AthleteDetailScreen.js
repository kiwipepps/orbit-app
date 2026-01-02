import React, { useEffect, useState } from 'react';
import {
    View, Text, FlatList, ActivityIndicator, StyleSheet,
    SafeAreaView, Image, Platform, StatusBar
} from 'react-native';
import { fetchAthleteProfile } from '../services/api';

// 1. CUSTOM LABELS (Update these to match your preference)
const DISPLAY_NAMES = {
    "place_rank": "Place",
    "rank": "Place",
    "pos": "Place",
    "mark": "Mark",
    "discipline_clean": "Event",
    "event": "Event",
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

    // Helper: Formats keys (e.g. "place_rank" -> "Place")
    const formatKey = (key) => {
        if (DISPLAY_NAMES[key]) return DISPLAY_NAMES[key];
        // Fallback: Capitalize first letter
        return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    };

    // Helper: Formats values (e.g. "3." -> "3rd")
    const formatValue = (key, value) => {
        if (!value) return '-';

        // Ordinal Logic (1st, 2nd, 3rd)
        // Checks if key looks like a rank/place
        if (key.toLowerCase().includes('rank') || key.toLowerCase().includes('place')) {
            const num = parseInt(String(value).replace(/[^0-9]/g, ''), 10);
            if (!isNaN(num)) return getOrdinal(num);
        }

        return String(value);
    };

    const getOrdinal = (n) => {
        const s = ["th", "st", "nd", "rd"];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };

    // --- NEW SORTING LOGIC ---
    // Instead of looking for exact keys, we score them by keyword.
    const getSortPriority = (key) => {
        const k = key.toLowerCase();
        if (k.includes('place') || k.includes('rank') || k.includes('pos')) return 1; // Top Priority
        if (k.includes('mark') || k.includes('result') || k.includes('time')) return 2; // Second Priority
        if (k.includes('discipline') || k.includes('event')) return 3; // Third Priority
        return 4; // Everything else
    };

    const getSortedEntries = (resultObj) => {
        if (!resultObj) return [];
        return Object.entries(resultObj).sort(([keyA], [keyB]) => {
            const priorityA = getSortPriority(keyA);
            const priorityB = getSortPriority(keyB);

            if (priorityA !== priorityB) {
                return priorityA - priorityB; // Lower number = Higher up
            }
            // Tie-breaker: Alphabetical
            return keyA.localeCompare(keyB);
        });
    };

    if (loading) return <ActivityIndicator style={{ marginTop: 50 }} size="large" color="#7F56D9" />;

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
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
                    data={profile?.events || []}
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