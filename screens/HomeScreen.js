import React, { useState, useCallback } from 'react';
import {
    View, Text, FlatList, Image, StyleSheet, ActivityIndicator,
    SafeAreaView, TouchableOpacity, Platform, StatusBar
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { fetchUserFeed } from '../services/api';

// Reusing your formatting logic
const DISPLAY_NAMES = {
    "place_rank": "Place", "rank": "Place", "pos": "Place",
    "mark": "Mark", "discipline_clean": "Event",
    "event": "Event", "wind": "Wind", "venue": "Location", "date": "Date"
};

const SORT_ORDER = ["place_rank", "mark", "discipline_clean"];

export default function HomeScreen() {
    const navigation = useNavigation();
    const [feed, setFeed] = useState([]);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            loadFeed();
        }, [])
    );

    const loadFeed = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const data = await fetchUserFeed(user.id);
                setFeed(data || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // --- HELPER FUNCTIONS (Same as AthleteDetail) ---
    const formatKey = (key) => {
        if (DISPLAY_NAMES[key]) return DISPLAY_NAMES[key];
        return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    };

    const formatValue = (key, value) => {
        if (!value) return '-';
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

    // --- RENDER ITEM ---
    const renderFeedItem = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('AthleteDetail', { athleteId: item.entity_id })}
        >
            {/* 1. Card Header: Athlete Info */}
            <View style={styles.cardTop}>
                <Image
                    source={{ uri: item.entities?.image_url || 'https://via.placeholder.com/50' }}
                    style={styles.avatarSmall}
                />

                {/* 👇 ADD style={{ flex: 1 }} HERE 👇 */}
                <View style={{ flex: 1 }}>
                    <Text style={styles.athleteName}>{item.entities?.name}</Text>
                    <Text style={styles.eventMeta}>
                        {item.title} • {new Date(item.start_time).toLocaleDateString()}
                    </Text>
                </View>
            </View>

            <View style={styles.divider} />

            {/* 2. Results Board */}
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
                    <Text style={{ color: '#666', fontStyle: 'italic' }}>Detailed results pending...</Text>
                )}
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Home</Text>
            </View>

            {loading ? (
                <ActivityIndicator style={{ marginTop: 50 }} size="large" color="#7F56D9" />
            ) : (
                <FlatList
                    data={feed}
                    renderItem={renderFeedItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{ padding: 16 }}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>Your feed is empty.</Text>
                            <Text style={styles.emptySubText}>Follow athletes to see their latest results here!</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Search')}>
                                <Text style={styles.linkText}>Find Athletes</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    header: {
        backgroundColor: '#0F172A', height: 60, justifyContent: 'center', alignItems: 'center',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
    },
    headerTitle: { color: 'white', fontSize: 18, fontWeight: '600' },

    // Card Styles
    card: {
        backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#EAECF0', marginBottom: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2,
    },
    cardTop: {
        padding: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB',
        borderTopLeftRadius: 12, borderTopRightRadius: 12,
    },
    avatarSmall: { width: 40, height: 40, borderRadius: 20, marginRight: 12, backgroundColor: '#DDD' },
    athleteName: { fontSize: 16, fontWeight: '700', color: '#101828' },
    eventMeta: { fontSize: 12, color: '#667085', marginTop: 2 },

    divider: { height: 1, backgroundColor: '#EAECF0' },

    statsContainer: { padding: 16 },
    statRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    statLabel: { fontSize: 14, color: '#667085', fontWeight: '500' },
    statValue: { fontSize: 14, color: '#101828', fontWeight: '600' },

    // Empty State
    emptyState: { alignItems: 'center', marginTop: 60, paddingHorizontal: 40 },
    emptyText: { fontSize: 18, fontWeight: '600', color: '#101828' },
    emptySubText: { textAlign: 'center', color: '#667085', marginVertical: 8 },
    linkText: { color: '#7F56D9', fontWeight: '700', fontSize: 16, marginTop: 8 }
});