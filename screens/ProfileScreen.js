import React, { useEffect, useState } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
    Platform, StatusBar, Alert, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { signOut } from '../services/api';

export default function ProfileScreen() {
    const [userEmail, setUserEmail] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getUserProfile();
    }, []);

    const getUserProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setUserEmail(user.email);
        }
        setLoading(false);
    };

    const handleSignOut = async () => {
        Alert.alert("Sign Out", "Are you sure you want to log out?", [
            { text: "Cancel", style: "cancel" },
            { text: "Log Out", style: "destructive", onPress: async () => await signOut() }
        ]);
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            "Delete Account",
            "This action cannot be undone. Please contact support to finalize account deletion.",
            [{ text: "OK" }]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Profile</Text>
            </View>

            <View style={styles.content}>
                {/* User Info Card */}
                <View style={styles.userCard}>
                    <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarText}>
                            {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
                        </Text>
                    </View>
                    <View style={styles.userInfo}>
                        <Text style={styles.label}>Signed in as</Text>
                        <Text style={styles.email}>{userEmail || 'User'}</Text>
                    </View>
                </View>

                {/* Settings Section */}
                <Text style={styles.sectionHeader}>Account Settings</Text>

                <TouchableOpacity style={styles.menuItem} onPress={handleSignOut}>
                    <View style={styles.menuRow}>
                        <Ionicons name="log-out-outline" size={24} color="#101828" />
                        <Text style={styles.menuText}>Log Out</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#98A2B3" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={handleDeleteAccount}>
                    <View style={styles.menuRow}>
                        <Ionicons name="trash-outline" size={24} color="#D92D20" />
                        <Text style={[styles.menuText, { color: '#D92D20' }]}>Delete Account</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#98A2B3" />
                </TouchableOpacity>

                <View style={styles.footer}>
                    <Text style={styles.versionText}>Orbit App v1.0.0</Text>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: {
        backgroundColor: '#0F172A', height: 60, justifyContent: 'center', alignItems: 'center',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
    },
    headerTitle: { color: 'white', fontSize: 18, fontWeight: '600' },
    content: { padding: 20 },

    // User Card
    userCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: 'white',
        padding: 16, borderRadius: 12, marginBottom: 30,
        borderWidth: 1, borderColor: '#EAECF0',
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1
    },
    avatarPlaceholder: {
        width: 50, height: 50, borderRadius: 25, backgroundColor: '#F9F5FF',
        justifyContent: 'center', alignItems: 'center', marginRight: 16,
        borderWidth: 1, borderColor: '#E9D7FE'
    },
    avatarText: { fontSize: 20, fontWeight: '700', color: '#7F56D9' },
    userInfo: { flex: 1 },
    label: { fontSize: 12, color: '#667085' },
    email: { fontSize: 16, fontWeight: '600', color: '#101828' },

    // Menu
    sectionHeader: { fontSize: 14, fontWeight: '600', color: '#667085', marginBottom: 10, marginLeft: 4 },
    menuItem: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 12,
        borderWidth: 1, borderColor: '#EAECF0'
    },
    menuRow: { flexDirection: 'row', alignItems: 'center' },
    menuText: { fontSize: 16, fontWeight: '500', color: '#101828', marginLeft: 12 },

    footer: { marginTop: 40, alignItems: 'center' },
    versionText: { color: '#98A2B3', fontSize: 14 }
});