import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, TextInput,
    StyleSheet, ActivityIndicator, ScrollView, Modal, TouchableWithoutFeedback
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { searchAthletes, fetchFollowedAthletes, toggleFollow } from '../services/api';
import { getFlagEmoji } from '../utils/flagHelper';

// Categories
const SPORTS_CATEGORIES = [
    { id: 'all', name: 'All', icon: 'apps' },
    { id: 'sprints', name: 'Sprints', icon: 'flash' },
    { id: 'middle_distance', name: 'Middle Dist.', icon: 'timer' },
    { id: 'long_distance', name: 'Long Dist.', icon: 'map' },
    { id: 'hurdles', name: 'Hurdles', icon: 'trending-up' },
    { id: 'jumps', name: 'Jumps', icon: 'arrow-up' },
    { id: 'throws', name: 'Throws', icon: 'planet' },
    { id: 'combined', name: 'Combined', icon: 'grid' },
    { id: 'walks', name: 'Race Walks', icon: 'walk' },
];

// 🟢 Common Nations List (You can expand this)
const NATIONS = [
    { code: 'All', name: 'All Countries' },
    { code: 'USA', name: 'United States' },
    { code: 'GBR', name: 'United Kingdom' },
    { code: 'JAM', name: 'Jamaica' },
    { code: 'KEN', name: 'Kenya' },
    { code: 'ETH', name: 'Ethiopia' },
    { code: 'AUS', name: 'Australia' },
    { code: 'CAN', name: 'Canada' },
    { code: 'NOR', name: 'Norway' },
    { code: 'SWE', name: 'Sweden' },
    { code: 'GER', name: 'Germany' },
    { code: 'FRA', name: 'France' },
    { code: 'CHN', name: 'China' },
    { code: 'JPN', name: 'Japan' },
    { code: 'RSA', name: 'South Africa' },
    { code: 'NZL', name: 'New Zealand' },
    { code: 'NED', name: 'Netherlands' },
];

const getInitials = (name) => {
    if (!name) return '';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const getEventsSummary = (events) => {
    if (!events || events.length === 0) return '';
    const set = new Set();
    events.forEach(e => {
        const r = e.result;
        if (!r) return;
        let discipline = r.discipline_clean || r.discipline || r.event;
        if (discipline) {
            discipline = discipline.replace(/ Short Track/gi, '').replace(/ Indoor/gi, '').trim();
            set.add(discipline);
        }
    });
    return Array.from(set).sort().join(', ');
};

export default function SearchScreen() {
    const navigation = useNavigation();
    const [searchText, setSearchText] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    // 🟢 Nationality State
    const [selectedNationality, setSelectedNationality] = useState(null); // null means 'All'
    const [isNationModalVisible, setNationModalVisible] = useState(false);

    const [athletes, setAthletes] = useState([]);
    const [followedIds, setFollowedIds] = useState(new Set());
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [currentUserId, setCurrentUserId] = useState(null);

    useFocusEffect(useCallback(() => { refreshFollowStatus(); }, []));
    useEffect(() => { setupUser(); }, []);

    // 🟢 Trigger search when filters change
    useEffect(() => { resetAndSearch(); }, [searchText, selectedCategory, selectedNationality]);

    const setupUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setCurrentUserId(user.id);
    };

    const refreshFollowStatus = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const followedData = await fetchFollowedAthletes(user.id);
            setFollowedIds(new Set(followedData.map(a => a.id)));
        }
    };

    const resetAndSearch = async () => {
        setLoading(true);
        setPage(0);
        setHasMore(true);
        // 🟢 Pass selectedNationality to API
        const results = await searchAthletes(searchText, selectedCategory, selectedNationality, 0);
        setAthletes(results || []);
        setLoading(false);
    };

    const loadMore = async () => {
        if (!hasMore || loading) return;
        setLoading(true);
        const nextPage = page + 1;
        // 🟢 Pass selectedNationality to API
        const results = await searchAthletes(searchText, selectedCategory, selectedNationality, nextPage);
        if (results && results.length > 0) {
            setAthletes(prev => [...prev, ...results]);
            setPage(nextPage);
        } else {
            setHasMore(false);
        }
        setLoading(false);
    };

    const handleToggleFollow = async (athleteId) => {
        if (!currentUserId) return;
        const isFollowing = followedIds.has(athleteId);
        const nextFollowedIds = new Set(followedIds);
        if (isFollowing) nextFollowedIds.delete(athleteId);
        else nextFollowedIds.add(athleteId);
        setFollowedIds(nextFollowedIds);
        const success = await toggleFollow(currentUserId, athleteId, isFollowing);
        if (!success) { setFollowedIds(followedIds); Alert.alert("Error", "Could not update follow status"); }
    };

    const renderCategoryItem = (item) => {
        const isSelected = selectedCategory === item.id;
        return (
            <TouchableOpacity
                key={item.id}
                onPress={() => setSelectedCategory(item.id)}
                style={[styles.categoryPill, isSelected && styles.categoryPillSelected]}
            >
                <Ionicons name={item.icon} size={18} color={isSelected ? '#FFF' : '#667085'} style={{ marginRight: 6 }} />
                <Text style={[styles.categoryText, isSelected && styles.categoryTextSelected]}>{item.name}</Text>
            </TouchableOpacity>
        );
    };

    const renderNationItem = ({ item }) => (
        <TouchableOpacity
            style={styles.nationItem}
            onPress={() => {
                setSelectedNationality(item.code === 'All' ? null : item.code);
                setNationModalVisible(false);
            }}
        >
            <Text style={styles.nationFlag}>{item.code === 'All' ? '🌍' : getFlagEmoji(item.code)}</Text>
            <Text style={[styles.nationName, selectedNationality === item.code && styles.nationNameSelected]}>
                {item.name}
            </Text>
            {selectedNationality === item.code && <Ionicons name="checkmark" size={20} color="#7F56D9" />}
        </TouchableOpacity>
    );

    const renderAthlete = ({ item }) => {
        const isFollowing = followedIds.has(item.id);
        const hasImage = !!item.image_url;
        const initials = getInitials(item.name);
        const summary = getEventsSummary(item.events);

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('AthleteDetail', { athleteId: item.id })}
            >
                {hasImage ? (
                    <Image
                        source={{ uri: item.image_url }}
                        style={styles.avatar}
                        contentFit="cover"
                        contentPosition="top center"
                        transition={200}
                    />
                ) : (
                    <View style={[styles.avatar, styles.initialsContainer]}>
                        <Text style={styles.initialsText}>{initials}</Text>
                    </View>
                )}

                <View style={styles.infoContainer}>
                    <Text style={styles.nameText} numberOfLines={1}>
                        {item.name} {getFlagEmoji(item.nationality)}
                    </Text>
                    <Text style={styles.sportText} numberOfLines={1}>
                        {summary || item.subcategory || item.category || 'Athlete'}
                    </Text>
                </View>
                <TouchableOpacity
                    style={[styles.followButton, isFollowing && styles.followingButton]}
                    onPress={() => handleToggleFollow(item.id)}
                >
                    <Ionicons
                        name={isFollowing ? "checkmark" : "add"}
                        size={20}
                        color={isFollowing ? "#FFFFFF" : "#7F56D9"}
                    />
                </TouchableOpacity>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Discover</Text>
            </View>

            <View style={styles.filterSection}>
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#667085" style={{ marginRight: 8 }} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search athletes..."
                        placeholderTextColor="#667085"
                        value={searchText}
                        onChangeText={setSearchText}
                    />
                    {/* 🟢 NATIONALITY FILTER ICON */}
                    <TouchableOpacity onPress={() => setNationModalVisible(true)} style={styles.filterIconContainer}>
                        <Ionicons
                            name="filter"
                            size={20}
                            color={selectedNationality ? "#7F56D9" : "#667085"}
                        />
                        {selectedNationality && <View style={styles.activeDot} />}
                    </TouchableOpacity>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 10 }}>
                    {SPORTS_CATEGORIES.map(renderCategoryItem)}
                </ScrollView>
            </View>

            <FlatList
                data={athletes}
                renderItem={renderAthlete}
                keyExtractor={(item, index) => `${item.id}-${index}`}
                contentContainerStyle={styles.listContent}
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={loading && <ActivityIndicator style={{ marginTop: 20 }} color="#7F56D9" />}
            />

            {/* 🟢 NATION SELECTION MODAL */}
            <Modal
                visible={isNationModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setNationModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setNationModalVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Select Nationality</Text>
                            <FlatList
                                data={NATIONS}
                                renderItem={renderNationItem}
                                keyExtractor={(item) => item.code}
                                style={{ maxHeight: 400 }}
                            />
                            <TouchableOpacity style={styles.closeButton} onPress={() => setNationModalVisible(false)}>
                                <Text style={styles.closeButtonText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    header: { backgroundColor: '#0F172A', height: 60, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { color: 'white', fontSize: 18, fontWeight: '600' },
    filterSection: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#F2F4F7' },

    // 🟢 UPDATED SEARCH CONTAINER
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#D0D5DD', borderRadius: 8, paddingLeft: 12, paddingRight: 8, height: 44 },
    searchInput: { flex: 1, fontSize: 16, color: '#101828' },
    filterIconContainer: { padding: 8, position: 'relative' },
    activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#7F56D9', position: 'absolute', top: 6, right: 6, borderWidth: 1, borderColor: '#FFF' },

    listContent: { padding: 16 },
    card: { flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 12, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#EAECF0' },

    avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F2F4F7' },
    initialsContainer: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#E4E7EC' },
    initialsText: { fontSize: 18, fontWeight: '600', color: '#475467' },

    infoContainer: { flex: 1, marginLeft: 12, justifyContent: 'center' },
    nameText: { fontSize: 16, fontWeight: '600', color: '#101828' },
    sportText: { color: '#7F56D9', fontSize: 14, marginTop: 2 },
    followButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F9F5FF', borderWidth: 1, borderColor: '#E9D7FE', justifyContent: 'center', alignItems: 'center' },
    followingButton: { backgroundColor: '#7F56D9', borderColor: '#7F56D9' },
    categoryPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F2F4F7', marginRight: 8 },
    categoryPillSelected: { backgroundColor: '#7F56D9' },
    categoryText: { fontSize: 14, fontWeight: '500', color: '#344054' },
    categoryTextSelected: { color: '#FFFFFF' },

    // 🟢 MODAL STYLES
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { width: '85%', backgroundColor: 'white', borderRadius: 16, padding: 20, maxHeight: '70%' },
    modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
    nationItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F2F4F7' },
    nationFlag: { fontSize: 24, marginRight: 12 },
    nationName: { fontSize: 16, color: '#101828', flex: 1 },
    nationNameSelected: { color: '#7F56D9', fontWeight: '600' },
    closeButton: { marginTop: 16, alignSelf: 'center', padding: 10 },
    closeButtonText: { color: '#667085', fontSize: 16, fontWeight: '600' }
});