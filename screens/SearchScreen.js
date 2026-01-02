import React, { useEffect, useState } from 'react';
import {
    View, Text, FlatList, Image, TouchableOpacity, TextInput,
    StyleSheet, ActivityIndicator, SafeAreaView, Platform, StatusBar, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { fetchAthletes, fetchFollowedAthletes, toggleFollow } from '../services/api';

export default function SearchScreen() {
    const navigation = useNavigation();
    const [searchText, setSearchText] = useState('');
    const [allAthletes, setAllAthletes] = useState([]);
    const [filteredAthletes, setFilteredAthletes] = useState([]);
    const [followedIds, setFollowedIds] = useState(new Set()); // Instant lookup for who we follow
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        // Filter locally as user types
        if (searchText) {
            setFilteredAthletes(
                allAthletes.filter(a => a.name.toLowerCase().includes(searchText.toLowerCase()))
            );
        } else {
            setFilteredAthletes(allAthletes);
        }
    }, [searchText, allAthletes]);

    const loadData = async () => {
        setLoading(true);
        try {
            // 1. Get User
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setCurrentUserId(user.id);

            // 2. Run fetches in parallel: Get ALL athletes AND the ones I follow
            const [athletesData, followedData] = await Promise.all([
                fetchAthletes(),
                fetchFollowedAthletes(user.id)
            ]);

            setAllAthletes(athletesData || []);
            setFilteredAthletes(athletesData || []);

            // Create a Set of IDs I already follow (e.g., {123, 456})
            const ids = new Set(followedData.map(a => a.id));
            setFollowedIds(ids);

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleFollow = async (athleteId) => {
        if (!currentUserId) return;

        const isFollowing = followedIds.has(athleteId);

        // Optimistic UI Update (Update screen instantly before DB finishes)
        const nextFollowedIds = new Set(followedIds);
        if (isFollowing) {
            nextFollowedIds.delete(athleteId);
        } else {
            nextFollowedIds.add(athleteId);
        }
        setFollowedIds(nextFollowedIds);

        // API Call
        const success = await toggleFollow(currentUserId, athleteId, isFollowing);

        // Revert if API fails
        if (!success) {
            setFollowedIds(followedIds);
            Alert.alert("Error", "Could not update follow status");
        }
    };

    const renderAthlete = ({ item }) => {
        const isFollowing = followedIds.has(item.id);

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('AthleteDetail', { athleteId: item.id })}
            >
                <Image
                    source={{ uri: item.image_url || 'https://via.placeholder.com/150' }}
                    style={styles.avatar}
                />

                <View style={styles.infoContainer}>
                    <Text style={styles.nameText}>{item.name}</Text>
                    <Text style={styles.sportText}>{item.subcategory || item.category || 'Athlete'}</Text>
                </View>

                {/* Follow Button */}
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

            <View style={styles.searchSection}>
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#667085" style={{ marginRight: 8 }} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search the database..."
                        placeholderTextColor="#667085"
                        value={searchText}
                        onChangeText={setSearchText}
                    />
                </View>
            </View>

            {loading ? (
                <ActivityIndicator style={{ marginTop: 50 }} size="large" color="#7F56D9" />
            ) : (
                <FlatList
                    data={filteredAthletes}
                    renderItem={renderAthlete}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    header: {
        backgroundColor: '#0F172A',
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
    },
    headerTitle: { color: 'white', fontSize: 18, fontWeight: '600' },
    searchSection: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#F2F4F7' },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#D0D5DD', borderRadius: 8, paddingHorizontal: 12, height: 44 },
    searchInput: { flex: 1, fontSize: 16, color: '#101828' },
    listContent: { padding: 16 },
    card: { flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 12, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#EAECF0' },
    avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#D0D5DD' },
    infoContainer: { flex: 1, marginLeft: 12 },
    nameText: { fontSize: 16, fontWeight: '600', color: '#101828' },
    sportText: { color: '#7F56D9', fontSize: 14, marginTop: 2 },

    // Button Styles
    followButton: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: '#F9F5FF', borderWidth: 1, borderColor: '#E9D7FE',
        justifyContent: 'center', alignItems: 'center'
    },
    followingButton: {
        backgroundColor: '#7F56D9', borderColor: '#7F56D9'
    }
});