import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, FlatList, Image, TouchableOpacity, TextInput,
    ScrollView, SafeAreaView, StyleSheet, ActivityIndicator,
    Platform, StatusBar, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { fetchFollowedAthletes, toggleFollow } from '../services/api';

// --- UPDATED CATEGORIES ---
const SPORTS_CATEGORIES = [
    { id: 'all', name: 'All', icon: 'apps' },
    { id: 'tennis', name: 'Tennis', icon: 'tennisball' },
    { id: 'athletics', name: 'Athletics', icon: 'walk' }, // Updated
    { id: 'f1', name: 'F1', icon: 'car-sport' },
];

export default function MyOrbitScreen() {
    const navigation = useNavigation();
    const [myAthletes, setMyAthletes] = useState([]);
    const [filteredAthletes, setFilteredAthletes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [currentUserId, setCurrentUserId] = useState(null);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const loadData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setCurrentUserId(user.id);
                const data = await fetchFollowedAthletes(user.id);
                setMyAthletes(data || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Filter Logic
    useEffect(() => {
        let result = myAthletes;
        if (selectedCategory !== 'all') {
            result = result.filter(a => a.subcategory?.toLowerCase() === selectedCategory.toLowerCase());
        }
        if (searchText) {
            result = result.filter(a => a.name.toLowerCase().includes(searchText.toLowerCase()));
        }
        setFilteredAthletes(result);
    }, [searchText, selectedCategory, myAthletes]);

    const handleUnfollow = async (athleteId) => {
        const updatedList = myAthletes.filter(a => a.id !== athleteId);
        setMyAthletes(updatedList); // Optimistic remove

        const success = await toggleFollow(currentUserId, athleteId, true);
        if (!success) {
            Alert.alert("Error", "Could not unfollow.");
            loadData();
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
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

    const renderAthlete = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('AthleteDetail', { athleteId: item.id })}
        >
            <Image source={{ uri: item.image_url || 'https://via.placeholder.com/150' }} style={styles.avatar} />
            <View style={styles.infoContainer}>
                <Text style={styles.nameText}>{item.name}</Text>
                <Text style={styles.sportText}>{item.subcategory || item.category || 'Sport'}</Text>
            </View>
            <TouchableOpacity onPress={() => handleUnfollow(item.id)} style={{ padding: 8 }}>
                <Ionicons name="star" size={24} color="#FEC84B" />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Orbit</Text>
                <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
                    <Ionicons name="log-out-outline" size={24} color="white" />
                </TouchableOpacity>
            </View>

            <View style={styles.filterSection}>
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#667085" style={{ marginRight: 8 }} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search my orbit..."
                        placeholderTextColor="#667085"
                        value={searchText}
                        onChangeText={setSearchText}
                    />
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 10 }}>
                    {SPORTS_CATEGORIES.map(renderCategoryItem)}
                </ScrollView>
            </View>

            {loading ? (
                <ActivityIndicator style={{ marginTop: 50 }} size="large" color="#7F56D9" />
            ) : (
                <FlatList
                    data={filteredAthletes}
                    renderItem={renderAthlete}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>You aren't following anyone yet.</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Search')}>
                                <Text style={{ color: '#7F56D9', marginTop: 10, fontWeight: '600' }}>Go to Search</Text>
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
    signOutButton: { position: 'absolute', right: 20, top: 18 },
    filterSection: { padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F2F4F7' },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#D0D5DD', borderRadius: 8, paddingHorizontal: 12, height: 44, marginBottom: 12 },
    searchInput: { flex: 1, fontSize: 16, color: '#101828' },
    categoryPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F2F4F7', marginRight: 8 },
    categoryPillSelected: { backgroundColor: '#7F56D9' },
    categoryText: { fontSize: 14, fontWeight: '500', color: '#344054' },
    categoryTextSelected: { color: '#FFFFFF' },
    listContent: { padding: 16 },
    card: { flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 12, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#EAECF0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
    avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#D0D5DD' },
    infoContainer: { flex: 1, marginLeft: 12 },
    nameText: { fontSize: 16, fontWeight: '600', color: '#101828' },
    sportText: { color: '#7F56D9', fontSize: 14, marginTop: 2 },
    emptyContainer: { alignItems: 'center', marginTop: 40 },
    emptyText: { color: '#667085', fontSize: 16 },
});