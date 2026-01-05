import React, { useEffect, useState } from 'react';
import {
    View, Text, FlatList, ActivityIndicator, StyleSheet,
    SafeAreaView, Image, TouchableOpacity
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { fetchEventResults } from '../services/api';

export default function EventDetailScreen({ route }) {
    const { title, date, eventKey } = route.params;
    const navigation = useNavigation();
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadResults();
    }, []);

    const loadResults = async () => {
        const data = await fetchEventResults(title, eventKey);
        // Sort data by Rank (1st, 2nd, 3rd...)
        const sorted = data.sort((a, b) => getRank(a.result) - getRank(b.result));
        setResults(sorted);
        setLoading(false);
    };

    const getRank = (resultObj) => {
        if (!resultObj) return 999;
        const key = Object.keys(resultObj).find(k =>
            ['place_rank', 'rank', 'pos', 'place'].includes(k.toLowerCase())
        );
        if (!key) return 999;
        const val = parseInt(String(resultObj[key]).replace(/[^0-9]/g, ''), 10);
        return isNaN(val) ? 999 : val;
    };

    const formatRank = (n) => {
        if (n === 999) return '-';
        const s = ["th", "st", "nd", "rd"];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };

    const getMark = (resultObj) => {
        if (!resultObj) return '-';
        const key = Object.keys(resultObj).find(k =>
            ['mark', 'time', 'result'].includes(k.toLowerCase())
        );
        return key ? resultObj[key] : '-';
    };

    const renderItem = ({ item }) => {
        const rank = getRank(item.result);
        const mark = getMark(item.result);

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.push('AthleteDetail', { athleteId: item.entity_id })}
            >
                {/* Rank (1st, 2nd...) */}
                <View style={styles.rankCol}>
                    <Text style={[styles.rankText, rank <= 3 && styles.topRank]}>
                        {rank !== 999 ? formatRank(rank) : '-'}
                    </Text>
                </View>

                {/* Athlete Info */}
                <Image
                    source={{ uri: item.entities?.image_url || 'https://via.placeholder.com/50' }}
                    style={styles.avatar}
                />

                <View style={styles.infoCol}>
                    <Text style={styles.nameText}>{item.entities?.name}</Text>
                    {/* 🟢 NEW: Display Nationality */}
                    {item.entities?.nationality && (
                        <Text style={styles.subText}>{item.entities.nationality}</Text>
                    )}
                </View>

                {/* Result / Mark */}
                <View style={styles.markCol}>
                    <Text style={styles.markText}>{mark}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{title}</Text>
                <Text style={styles.headerDate}>
                    {date ? new Date(date).toLocaleDateString() : 'Event Results'}
                </Text>
            </View>

            {loading ? (
                <ActivityIndicator style={{ marginTop: 50 }} size="large" color="#7F56D9" />
            ) : (
                <FlatList
                    data={results}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{ padding: 16 }}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    header: { padding: 16, backgroundColor: '#F9FAFB', borderBottomWidth: 1, borderColor: '#EAECF0' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#101828', marginBottom: 4 },
    headerDate: { fontSize: 14, color: '#667085' },
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F2F4F7' },
    rankCol: { width: 50, alignItems: 'center' },
    rankText: { fontSize: 16, fontWeight: '600', color: '#667085' },
    topRank: { color: '#7F56D9', fontWeight: '800' },
    avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12, backgroundColor: '#DDD' },

    // Updated info column to support two lines again
    infoCol: { flex: 1, justifyContent: 'center' },
    nameText: { fontSize: 16, fontWeight: '600', color: '#101828' },
    subText: { fontSize: 13, color: '#667085', marginTop: 2 }, // Added marginTop for spacing

    markCol: { minWidth: 60, alignItems: 'flex-end' },
    markText: { fontSize: 16, fontWeight: '700', color: '#101828' }
});