import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator, SafeAreaView, Platform, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { fetchAthletes, signOut } from '../services/api';

export default function MyOrbitScreen() {
    const navigation = useNavigation();
    const [athletes, setAthletes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const data = await fetchAthletes();
        setAthletes(data || []);
        setLoading(false);
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity 
            style= { styles.card }
    onPress = {() => navigation.navigate('AthleteDetail', { athleteId: item.id })
}
        >
    <Image 
                source={ { uri: item.image_url || 'https://via.placeholder.com/150' } }
style = { styles.avatar }
    />
    <View style={ styles.info }>
        <Text style={ styles.name }> { item.name } </Text>
            < Text style = { styles.category } > { item.category || 'Athlete' } </Text>
                </View>
                </TouchableOpacity>
    );

return (
    <SafeAreaView style= { styles.container } >
    <View style={ styles.header }>
        <Text style={ styles.title }> My Orbit </Text>
            < TouchableOpacity onPress = { signOut } >
                <Text style={ { color: 'white', fontWeight: 'bold' } }> Log Out </Text>
                    </TouchableOpacity>
                    </View>

{ loading ? <ActivityIndicator size="large" color = "#7F56D9" style = {{ marginTop: 50 } } /> : (
    < FlatList
data = { athletes }
keyExtractor = {(item) => item.id}
renderItem = { renderItem }
contentContainerStyle = {{ padding: 16 }}
                />
            )}
</SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: {
        backgroundColor: '#0F172A', height: 60, flexDirection: 'row',
        justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
    },
    title: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    card: { flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 12, backgroundColor: '#F9FAFB', borderRadius: 12, borderWidth: 1, borderColor: '#EAECF0' },
    avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#ccc' },
    info: { marginLeft: 12 },
    name: { fontSize: 16, fontWeight: '600', color: '#101828' },
    category: { fontSize: 14, color: '#7F56D9', marginTop: 2 }
});