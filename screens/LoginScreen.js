import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { signIn, signUp } from '../services/api';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        setLoading(true);
        const { error } = await signIn(email, password);
        setLoading(false);
        if (error) Alert.alert('Login Failed', error.message);
    };

    const handleSignUp = async () => {
        setLoading(true);
        const { error } = await signUp(email, password);
        setLoading(false);
        if (error) Alert.alert('Error', error.message);
        else Alert.alert('Success', 'Check your email for the confirmation link!');
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Welcome to Orbit</Text>
            <TextInput
                style={styles.input} placeholder="Email"
                value={email} onChangeText={setEmail} autoCapitalize="none"
            />
            <TextInput
                style={styles.input} placeholder="Password"
                value={password} onChangeText={setPassword} secureTextEntry
            />
            {loading ? <ActivityIndicator color="#7F56D9" /> : (
                <View style={styles.btnContainer}>
                    <TouchableOpacity onPress={handleLogin} style={styles.btnPrimary}>
                        <Text style={styles.btnText}>Sign In</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleSignUp} style={styles.btnSecondary}>
                        <Text style={[styles.btnText, { color: '#7F56D9' }]}>Create Account</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff' },
    header: { fontSize: 28, fontWeight: 'bold', marginBottom: 30, textAlign: 'center', color: '#101828' },
    input: { height: 50, borderWidth: 1, borderColor: '#D0D5DD', borderRadius: 8, paddingHorizontal: 15, marginBottom: 15, fontSize: 16 },
    btnContainer: { gap: 10, marginTop: 10 },
    btnPrimary: { backgroundColor: '#7F56D9', height: 50, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    btnSecondary: { backgroundColor: '#F9F5FF', height: 50, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#7F56D9' },
    btnText: { color: '#fff', fontSize: 16, fontWeight: '600' }
});