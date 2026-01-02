import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, FlatList, Image, TouchableOpacity, TextInput,
    StyleSheet, ActivityIndicator, SafeAreaView, Platform, StatusBar, Alert, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { searchAthletes, fetchFollowedAthletes, toggleFollow } from '../services/api';

// Defined Categories (Same as My Orbit)
const SPORTS_CATEGORIES = [
    { id: 'all', name: 'All', icon: 'apps' },
    { id: 'tennis', name: 'Tennis', icon: 'tennisball' },
    { id: 'athletics', name: 'Athletics', icon: 'walk' }, // Use 'walk' or 'fitness' if 'running' isn't available in Ionicons
    { id: 'f1', name: 'F1', icon: 'car-sport' },
];

export default function SearchScreen() {
    const navigation = useNavigation();
    const [searchText, setSearchText] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    const [athletes, setAthletes] = useState([]);
    const [followedIds, setFollowedIds] = useState(new Set());
    const [loading, setLoading] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);

    // 1. SYNC LOGIC: Refresh 'Follows' every time we return to this screen
    useFocusEffect(
        useCallback(() => {
            refreshFollowStatus();
        }, [])
    );

    // Initial Setup
    useEffect(() => {
        setupUser();
    }, []);

    // Search Trigger (Runs when text OR category changes)
    useEffect(() => {
        performSearch(searchText, selectedCategory);
    }, [searchText, selectedCategory]);

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

    const performSearch = async (query, category) => {
        setLoading(true);
        // Pass both query AND category to the server
        const results = await searchAthletes(query, category);
        setAthletes(results || []);
        setLoading(false);
    };

    const handleToggleFollow = async (athleteId) => {
        if (!currentUserId) return;

        const isFollowing = followedIds.has(athleteId);

        // Optimistic Update
        const nextFollowedIds = new Set(followedIds);
        if (isFollowing) nextFollowedIds.delete(athleteId);
        else nextFollowedIds.add(athleteId);
        setFollowedIds(nextFollowedIds);

        const success = await toggleFollow(currentUserId, athleteId, isFollowing);
        if (!success) {
            setFollowedIds(followedIds); // Revert on fail
            Alert.alert("Error", "Could not update follow status");
        }
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
        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('AthleteDetail', { athleteId: item.id })}
            >
                <Image source={{ uri: item.image_url || 'https://via.placeholder.com/150' }} style={styles.avatar} />
                <View style={styles.infoContainer}>
                    <Text style={styles.nameText}>{item.name}</Text>
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
                {/* Search Input */}
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
                {/* Category Filter */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 10 }}>
                    {SPORTS_CATEGORIES.map(renderCategoryItem)}
                </ScrollView>
            </View>

            <FlatList
                data={athletes}
                renderItem={renderAthlete}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                ListFooterComponent={loading && <ActivityIndicator style={{ marginTop: 20 }} color="#7F56D9" />}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    header: { backgroundColor: '#0F172A', height: 60, justifyContent: 'center', alignItems: 'center', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
    headerTitle: { color: 'white', fontSize: 18, fontWeight: '600' },
    filterSection: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#F2F4F7' },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#D0D5DD', borderRadius: 8, paddingHorizontal: 12, height: 44 },
    searchInput: { flex: 1, fontSize: 16, color: '#101828' },
    listContent: { padding: 16 },
    card: { flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 12, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#EAECF0' },
    avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#D0D5DD' },
    infoContainer: { flex: 1, marginLeft: 12 },
    nameText: { fontSize: 16, fontWeight: '600', color: '#101828' },
    sportText: { color: '#7F56D9', fontSize: 14, marginTop: 2 },
    followButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F9F5FF', borderWidth: 1, borderColor: '#E9D7FE', justifyContent: 'center', alignItems: 'center' },
    followingButton: { backgroundColor: '#7F56D9', borderColor: '#7F56D9' },

    // New Styles for Pills
    categoryPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F2F4F7', marginRight: 8 },
    categoryPillSelected: { backgroundColor: '#7F56D9' },
    categoryText: { fontSize: 14, fontWeight: '500', color: '#344054' },
    categoryTextSelected: { color: '#FFFFFF' },
});