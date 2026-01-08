import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, TextInput,
    StyleSheet, ActivityIndicator, ScrollView, Platform, StatusBar, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { searchAthletes, fetchFollowedAthletes, toggleFollow } from '../services/api';
import { getFlagEmoji } from '../utils/flagHelper';

const SPORTS_CATEGORIES = [
    { id: 'all', name: 'All', icon: 'apps' },
    { id: 'tennis', name: 'Tennis', icon: 'tennisball' },
    { id: 'athletics', name: 'Athletics', icon: 'walk' },
    { id: 'f1', name: 'F1', icon: 'car-sport' },
];

// 🟢 HELPER
const getInitials = (name) => {
    if (!name) return '';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

export default function SearchScreen() {
    const navigation = useNavigation();
    const [searchText, setSearchText] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [athletes, setAthletes] = useState([]);
    const [followedIds, setFollowedIds] = useState(new Set());
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [currentUserId, setCurrentUserId] = useState(null);

    useFocusEffect(useCallback(() => { refreshFollowStatus(); }, []));
    useEffect(() => { setupUser(); }, []);
    useEffect(() => { resetAndSearch(); }, [searchText, selectedCategory]);

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
        const results = await searchAthletes(searchText, selectedCategory, 0);
        setAthletes(results || []);
        setLoading(false);
    };

    const loadMore = async () => {
        if (!hasMore || loading) return;
        setLoading(true);
        const nextPage = page + 1;
        const results = await searchAthletes(searchText, selectedCategory, nextPage);
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

    const renderAthlete = ({ item }) => {
        const isFollowing = followedIds.has(item.id);
        const hasImage = !!item.image_url;
        const initials = getInitials(item.name);

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('AthleteDetail', { athleteId: item.id })}
            >
                {/* 🟢 CONDITIONAL AVATAR */}
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
                    <Text style={styles.sportText}>{item.subcategory || item.category || 'Athlete'}</Text>
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
                        placeholder="Search database..."
                        placeholderTextColor="#667085"
                        value={searchText}
                        onChangeText={setSearchText}
                    />
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
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    header: { backgroundColor: '#0F172A', height: 60, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { color: 'white', fontSize: 18, fontWeight: '600' },
    filterSection: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#F2F4F7' },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#D0D5DD', borderRadius: 8, paddingHorizontal: 12, height: 44 },
    searchInput: { flex: 1, fontSize: 16, color: '#101828' },
    listContent: { padding: 16 },
    card: { flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 12, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#EAECF0' },

    avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F2F4F7' },
    // 🟢 INITIALS STYLES
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
});