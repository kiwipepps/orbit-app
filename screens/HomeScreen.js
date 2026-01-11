import React, { useState, useCallback } from 'react';
import {
    View, Text, FlatList, StyleSheet, ActivityIndicator,
    TouchableOpacity, Platform, StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { fetchUserFeed } from '../services/api';

const DISPLAY_NAMES = {
    "place_rank": "Place", "rank": "Place", "pos": "Place",
    "mark": "Mark", "discipline_clean": "Event", "event": "Event",
    "round_label": "Round", "round": "Round", "phase": "Round",
    "wind": "Wind", "venue": "Location", "date": "Date"
};

const HIDDEN_FIELDS = ['id', 'hidden_id', 'event_name_raw', 'athlete_id', 'entity_id', 'event_key'];

const getInitials = (name) => {
    if (!name) return '';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

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
                const processed = processFeed(data || []);
                setFeed(processed);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getRoundScore = (item) => {
        const text = (item.title + " " + JSON.stringify(item.result)).toLowerCase();
        if (text.includes('final') && !text.includes('semi') && !text.includes('quarter')) return 100;
        if (text.includes('semi')) return 90;
        if (text.includes('quarter')) return 80;
        if (text.includes('round 3')) return 70;
        if (text.includes('round 2')) return 60;
        if (text.includes('round 1')) return 50;
        if (text.includes('qual')) return 40;
        if (text.includes('heat')) return 30;
        return 0;
    };

    const getDiscipline = (result) => {
        if (!result) return 'unknown';
        if (result.discipline_clean) return result.discipline_clean;
        if (result.discipline) return result.discipline;
        if (result.event) return result.event;
        const key = Object.keys(result).find(k => k.toLowerCase().includes('discipline'));
        return key ? result[key] : 'general';
    };

    const processFeed = (rawData) => {
        const grouped = {};
        rawData.forEach(item => {
            const discipline = getDiscipline(item.result);
            const uniqueKey = `${item.entity_id}_${item.title}_${discipline}`;
            const currentScore = getRoundScore(item);
            const existingItem = grouped[uniqueKey];
            if (!existingItem || currentScore > getRoundScore(existingItem)) {
                grouped[uniqueKey] = item;
            }
        });
        return Object.values(grouped).sort((a, b) =>
            new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
        );
    };

    const formatKey = (key) => DISPLAY_NAMES[key] || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    const getOrdinal = (n) => {
        const s = ["th", "st", "nd", "rd"];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };

    const formatValue = (key, value) => {
        if (!value) return '-';
        if (key.toLowerCase().includes('rank') || key.toLowerCase().includes('place')) {
            const num = parseInt(String(value).replace(/[^0-9]/g, ''), 10);
            if (!isNaN(num)) return getOrdinal(num);
        }
        if (typeof value === 'string') return value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        return String(value);
    };

    const getPlaceInfo = (resultObj) => {
        if (!resultObj) return null;
        const placeKey = Object.keys(resultObj).find(k =>
            ['place_rank', 'rank', 'pos', 'place'].includes(k.toLowerCase())
        );
        if (placeKey) return { key: placeKey, value: formatValue(placeKey, resultObj[placeKey]) };
        return null;
    };

    const getSortedEntries = (resultObj) => {
        if (!resultObj) return [];
        const getPriority = (k) => {
            const key = k.toLowerCase();
            if (key.includes('discipline') || key.includes('event')) return 1;
            if (key.includes('mark') || key.includes('time')) return 2;
            if (key.includes('round')) return 3;
            if (key.includes('wind')) return 4;
            return 5;
        };
        return Object.entries(resultObj).sort(([a], [b]) => getPriority(a) - getPriority(b));
    };

    const renderFeedItem = ({ item }) => {
        const placeInfo = getPlaceInfo(item.result);
        const goToAthlete = () => navigation.navigate('AthleteDetail', { athleteId: item.entity_id });
        const goToEvent = () => navigation.navigate('EventDetail', {
            title: item.title,
            eventKey: item.event_key,
            date: item.start_time
        });

        const hasImage = !!item.entities?.image_url;
        const initials = getInitials(item.entities?.name);

        return (
            <View style={styles.card}>
                <View style={styles.cardTop}>
                    <View style={styles.headerLeft}>
                        <TouchableOpacity onPress={goToAthlete}>
                            {hasImage ? (
                                <Image
                                    source={{ uri: item.entities.image_url }}
                                    style={styles.avatarSmall}
                                    contentFit="cover"
                                    contentPosition="top center"
                                />
                            ) : (
                                <View style={[styles.avatarSmall, styles.initialsContainer]}>
                                    <Text style={styles.initialsTextSmall}>{initials}</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        <View style={{ flex: 1 }}>
                            <TouchableOpacity onPress={goToAthlete}>
                                <Text style={styles.athleteName}>{item.entities?.name}</Text>
                            </TouchableOpacity>

                            {/* 🟢 CHANGE: Removed TouchableOpacity here so text is not clickable */}
                            <Text style={styles.eventMeta}>
                                {item.title} • {new Date(item.start_time).toLocaleDateString()}
                            </Text>
                        </View>
                    </View>

                    {placeInfo && (
                        <TouchableOpacity style={styles.headerRight} onPress={goToEvent}>
                            <Text style={styles.bigPlaceText}>{placeInfo.value}</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.divider} />

                <TouchableOpacity style={styles.statsContainer} onPress={goToEvent}>
                    {item.result && typeof item.result === 'object' ? (
                        getSortedEntries(item.result).map(([key, value]) => {
                            if (HIDDEN_FIELDS.includes(key) || key === placeInfo?.key) return null;
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
                </TouchableOpacity>
            </View>
        );
    };

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
    header: { backgroundColor: '#0F172A', height: 60, justifyContent: 'center', alignItems: 'center', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
    headerTitle: { color: 'white', fontSize: 18, fontWeight: '600' },
    card: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#EAECF0', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
    cardTop: { padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F9FAFB', borderTopLeftRadius: 12, borderTopRightRadius: 12 },
    headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
    headerRight: { justifyContent: 'center' },

    avatarSmall: { width: 40, height: 40, borderRadius: 20, marginRight: 12, backgroundColor: '#F2F4F7' },
    initialsContainer: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#E4E7EC' },
    initialsTextSmall: { fontSize: 14, fontWeight: '700', color: '#475467' },

    athleteName: { fontSize: 16, fontWeight: '700', color: '#101828' },
    eventMeta: { fontSize: 12, color: '#667085', marginTop: 2 },
    bigPlaceText: { fontSize: 20, fontWeight: '800', color: '#7F56D9', textAlign: 'right' },
    divider: { height: 1, backgroundColor: '#EAECF0' },
    statsContainer: { padding: 16 },
    statRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    statLabel: { fontSize: 14, color: '#667085', fontWeight: '500' },
    statValue: { fontSize: 14, color: '#101828', fontWeight: '600' },
    emptyState: { alignItems: 'center', marginTop: 60, paddingHorizontal: 40 },
    emptyText: { fontSize: 18, fontWeight: '600', color: '#101828' },
    emptySubText: { textAlign: 'center', color: '#667085', marginVertical: 8 },
    linkText: { color: '#7F56D9', fontWeight: '700', fontSize: 16, marginTop: 8 }
});