import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, SafeAreaView, Image } from 'react-native';
import { fetchAthleteProfile } from '../services/api';

export default function AthleteDetailScreen({ route }) {
    const { athleteId } = route.params;
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const data = await fetchAthleteProfile(athleteId);
            setProfile(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <ActivityIndicator style={{ marginTop: 50 }} size="large" color="#7F56D9" />;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Image source={{ uri: profile?.image_url }} style={styles.avatar} />
                <Text style={styles.name}>{profile?.name}</Text>
                <Text style={styles.category}>{profile?.category}</Text>
            </View>

            <Text style={styles.sectionTitle}>Recent Results</Text>

            <FlatList
                data={profile?.events || []}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.eventCard}>
                        <Text style={styles.eventTitle}>{item.title}</Text>
                        <Text style={styles.eventDate}>{new Date(item.start_time).toLocaleDateString()}</Text>
                        {/* Rendering the JSON result data */}
                        <Text style={styles.result}>
                            Result: {JSON.stringify(item.result)}
                        </Text>
                    </View>
                )}
                contentContainerStyle={{ padding: 16 }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { alignItems: 'center', padding: 20, borderBottomWidth: 1, borderColor: '#eee' },
    avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 10 },
    name: { fontSize: 22, fontWeight: 'bold' },
    category: { color: '#7F56D9', fontSize: 16 },
    sectionTitle: { fontSize: 18, fontWeight: '600', marginLeft: 16, marginTop: 16 },
    eventCard: { padding: 15, backgroundColor: '#F2F4F7', borderRadius: 8, marginBottom: 10 },
    eventTitle: { fontWeight: 'bold', fontSize: 16 },
    eventDate: { color: '#666', marginBottom: 5 },
    result: { fontFamily: 'monospace', color: '#333' }
});