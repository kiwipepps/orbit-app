import React, { useEffect, useState, useMemo } from 'react';
import {
    View, Text, FlatList, ActivityIndicator, StyleSheet,
    TouchableOpacity, Linking, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { fetchAthleteProfile } from '../services/api';

const DISPLAY_NAMES = {
    "place_rank": "Place", "rank": "Place", "pos": "Place",
    "mark": "Mark",
    "discipline_clean": "Event", "event": "Event",
    "round_label": "Round", "round": "Round", "phase": "Round",
    "wind": "Wind", "venue": "Location", "date": "Date"
};
const HIDDEN_FIELDS = ['id', 'hidden_id', 'event_name_raw', 'athlete_id', 'entity_id', 'event_key'];

// 🟢 HELPER
const getInitials = (name) => {
    if (!name) return '';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

export default function AthleteDetailScreen({ route }) {
    const { athleteId } = route.params;
    const navigation = useNavigation();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadProfile(); }, []);

    const loadProfile = async () => {
        try {
            const data = await fetchAthleteProfile(athleteId);
            setProfile(data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const sortedEvents = useMemo(() => {
        if (!profile?.events) return [];
        const getRoundScore = (event) => {
            const text = (event.title + " " + JSON.stringify(event.result)).toLowerCase();
            if (text.includes('final') && !text.includes('semi')) return 100;
            if (text.includes('semi')) return 90;
            if (text.includes('quarter')) return 80;
            if (text.includes('round 1')) return 50;
            return 0;
        };
        return [...profile.events].sort((a, b) => {
            const dateA = new Date(a.start_time).getTime();
            const dateB = new Date(b.start_time).getTime();
            if (dateA !== dateB) return dateB - dateA;
            return getRoundScore(b) - getRoundScore(a);
        });
    }, [profile]);

    const formatKey = (key) => DISPLAY_NAMES[key] || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const getOrdinal = (n) => { const s = ["th", "st", "nd", "rd"]; const v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };
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
        const placeKey = Object.keys(resultObj).find(k => ['place_rank', 'rank', 'pos', 'place'].includes(k.toLowerCase()));
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

    const showAttribution = () => {
        const license = profile?.image_license || 'CC BY-SA';
        const sourceUrl = profile?.image_source_page;
        Alert.alert("Image Attribution", `Image licensed under ${license}.\nSource: Wikimedia Commons`,
            [{ text: "OK", style: "cancel" }, sourceUrl ? { text: "Visit Source", onPress: () => Linking.openURL(sourceUrl) } : null].filter(Boolean)
        );
    };

    if (loading) return <ActivityIndicator style={{ marginTop: 50 }} size="large" color="#7F56D9" />;

    const hasImage = !!profile?.image_url;
    const initials = getInitials(profile?.name);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.avatarContainer}>
                    {/* 🟢 CONDITIONAL AVATAR */}
                    {hasImage ? (
                        <Image
                            source={{ uri: profile.image_url }}
                            style={styles.avatar}
                            contentFit="cover"
                            contentPosition="top center"
                            transition={500}
                        />
                    ) : (
                        <View style={[styles.avatar, styles.initialsContainer]}>
                            <Text style={styles.initialsTextBig}>{initials}</Text>
                        </View>
                    )}

                    {(hasImage && (profile?.image_license || profile?.image_source_page)) && (
                        <TouchableOpacity style={styles.infoIcon} onPress={showAttribution}>
                            <Ionicons name="information-circle" size={24} color="#7F56D9" />
                        </TouchableOpacity>
                    )}
                </View>

                <Text style={styles.name}>{profile?.name}</Text>
                <Text style={styles.category}>{profile?.subcategory || profile?.category || 'Athlete'}</Text>
            </View>

            <View style={styles.content}>
                <Text style={styles.sectionTitle}>Recent Results</Text>
                <FlatList
                    data={sortedEvents}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    renderItem={({ item }) => {
                        const placeInfo = getPlaceInfo(item.result);
                        const goToEvent = () => navigation.push('EventDetail', { title: item.title, eventKey: item.event_key, date: item.start_time });

                        return (
                            <View style={styles.eventCard}>
                                <TouchableOpacity style={styles.cardHeader} onPress={goToEvent}>
                                    <View style={styles.headerLeft}>
                                        <Text style={styles.eventTitle}>{item.title}</Text>
                                        <Text style={styles.eventDate}>{new Date(item.start_time).toLocaleDateString()}</Text>
                                    </View>
                                    {placeInfo && (
                                        <View style={styles.headerRight}>
                                            <Text style={styles.bigPlaceText}>{placeInfo.value}</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
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
                                    ) : (<Text style={{ color: '#666' }}>No detailed results.</Text>)}
                                </TouchableOpacity>
                            </View>
                        );
                    }}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    header: { alignItems: 'center', padding: 24, backgroundColor: '#F9FAFB', borderBottomWidth: 1, borderColor: '#EAECF0' },

    avatarContainer: { width: 100, height: 100, marginBottom: 16, position: 'relative' },
    avatar: { width: '100%', height: '100%', borderRadius: 50, borderWidth: 3, borderColor: '#FFFFFF', backgroundColor: '#F2F4F7' },

    // 🟢 INITIALS STYLES
    initialsContainer: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#E4E7EC' },
    initialsTextBig: { fontSize: 32, fontWeight: '700', color: '#475467' },

    infoIcon: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#FFFFFF', borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
    name: { fontSize: 24, fontWeight: '700', color: '#101828', textAlign: 'center' },
    category: { color: '#7F56D9', fontSize: 16, fontWeight: '500', marginTop: 4 },
    content: { flex: 1, paddingHorizontal: 16 },
    sectionTitle: { fontSize: 18, fontWeight: '600', color: '#101828', marginTop: 20, marginBottom: 12 },
    eventCard: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#EAECF0', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
    cardHeader: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F9FAFB', borderTopLeftRadius: 12, borderTopRightRadius: 12 },
    headerLeft: { flex: 1, marginRight: 10 },
    headerRight: { justifyContent: 'center', alignItems: 'flex-end' },
    eventTitle: { fontSize: 16, fontWeight: '700', color: '#101828' },
    eventDate: { fontSize: 14, color: '#667085', marginTop: 2 },
    bigPlaceText: { fontSize: 24, fontWeight: '800', color: '#7F56D9', textAlign: 'right' },
    divider: { height: 1, backgroundColor: '#EAECF0' },
    statsContainer: { padding: 16 },
    statRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    statLabel: { fontSize: 14, color: '#667085', fontWeight: '500' },
    statValue: { fontSize: 14, color: '#101828', fontWeight: '600' }
});