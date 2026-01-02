import React, { useEffect, useState } from 'react';
import {
    View, Text, FlatList, Image, TouchableOpacity, TextInput,
    ScrollView, SafeAreaView, StyleSheet, ActivityIndicator,
    Platform, StatusBar, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { fetchAthletes } from '../services/api';

// 1. Define your categories here
const SPORTS_CATEGORIES = [
    { id: 'all', name: 'All', icon: 'apps' },
    { id: 'tennis', name: 'Tennis', icon: 'tennisball' },
    { id: 'f1', name: 'F1', icon: 'car-sport' },
    { id: 'basketball', name: 'Basketball', icon: 'basketball' },
];

export default function MyOrbitScreen() {
    const navigation = useNavigation();

    // State for Data
    const [allAthletes, setAllAthletes] = useState([]); // Stores the full list
    const [filteredAthletes, setFilteredAthletes] = useState([]); // Stores what is shown
    const [loading, setLoading] = useState(true);

    // State for Search & Filter
    const [searchText, setSearchText] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    useEffect(() => {
        loadData();
    }, []);

    // 2. Filter Logic: Runs whenever search text or category changes
    useEffect(() => {
        let result = allAthletes;

        // A. Filter by Category
        if (selectedCategory !== 'all') {
            result = result.filter(a =>
                a.category?.toLowerCase() === selectedCategory.toLowerCase()
            );
        }

        // B. Filter by Search Text
        if (searchText) {
            result = result.filter(a =>
                a.name.toLowerCase().includes(searchText.toLowerCase())
            );
        }

        setFilteredAthletes(result);
    }, [searchText, selectedCategory, allAthletes]);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await fetchAthletes();
            setAllAthletes(data || []);
            setFilteredAthletes(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
    };

    // 3. Render the Category Pill
    const renderCategoryItem = (item) => {
        const isSelected = selectedCategory === item.id;
        return (
            <TouchableOpacity
                key={item.id}
                onPress={() => setSelectedCategory(item.id)}
                style={[
                    styles.categoryPill,
                    isSelected && styles.categoryPillSelected
                ]}
            >
                <Ionicons
                    name={item.icon}
                    size={18}
                    color={isSelected ? '#FFF' : '#667085'}
                    style={{ marginRight: 6 }}
                />
                <Text style={[
                    styles.categoryText,
                    isSelected && styles.categoryTextSelected
                ]}>
                    {item.name}
                </Text>
            </TouchableOpacity>
        );
    };

    const renderAthlete = ({ item }) => (
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
                <Text style={styles.sportText}>{item.category || 'Sport'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#98A2B3" />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* --- HEADER --- */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Orbit</Text>
                <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
                    <Ionicons name="log-out-outline" size={24} color="white" />
                </TouchableOpacity>
            </View>

            {/* --- SEARCH & FILTER SECTION --- */}
            <View style={styles.filterSection}>
                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#667085" style={{ marginRight: 8 }} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search athletes..."
                        placeholderTextColor="#667085"
                        value={searchText}
                        onChangeText={setSearchText}
                    />
                    {searchText.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchText('')}>
                            <Ionicons name="close-circle" size={18} color="#98A2B3" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Horizontal Category Scroll */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingVertical: 10 }}
                >
                    {SPORTS_CATEGORIES.map(renderCategoryItem)}
                </ScrollView>
            </View>

            {/* --- LIST CONTENT --- */}
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
                            <Text style={styles.emptyText}>No athletes found.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },

    // Header
    header: {
        backgroundColor: '#0F172A',
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
    },
    headerTitle: { color: 'white', fontSize: 18, fontWeight: '600' },
    signOutButton: { position: 'absolute', right: 20, top: 18 },

    // Search & Filter
    filterSection: {
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F2F4F7',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#D0D5DD',
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 44,
        marginBottom: 12,
    },
    searchInput: { flex: 1, fontSize: 16, color: '#101828' },

    // Category Pills
    categoryPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F2F4F7',
        marginRight: 8,
    },
    categoryPillSelected: {
        backgroundColor: '#7F56D9', // Purple when selected
    },
    categoryText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#344054',
    },
    categoryTextSelected: {
        color: '#FFFFFF',
    },

    // List
    listContent: { padding: 16 },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        marginBottom: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#EAECF0',
        // Shadow for iOS/Android
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#D0D5DD' },
    infoContainer: { flex: 1, marginLeft: 12 },
    nameText: { fontSize: 16, fontWeight: '600', color: '#101828' },
    sportText: { color: '#7F56D9', fontSize: 14, marginTop: 2 },

    // Empty State
    emptyContainer: { alignItems: 'center', marginTop: 40 },
    emptyText: { color: '#667085', fontSize: 16 },
});