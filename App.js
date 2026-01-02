import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from './lib/supabase';

// --- IMPORT YOUR REAL SCREENS HERE ---
import LoginScreen from './screens/LoginScreen';
import MyOrbitScreen from './screens/MyOrbitScreen';
import AthleteDetailScreen from './screens/AthleteDetailScreen';
import SearchScreen from './screens/SearchScreen';
import HomeScreen from './screens/HomeScreen';

// --- DELETE THE SEARCHSCREEN PLACEHOLDER BELOW ---
const ProfileScreen = () => <View style={{ flex: 1, backgroundColor: 'white' }} />;

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// 1. The Tab Navigator (Main App)
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#7F56D9',
        tabBarInactiveTintColor: '#98A2B3',
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Search') iconName = focused ? 'search' : 'search-outline';
          else if (route.name === 'My Orbit') iconName = focused ? 'people' : 'people-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="My Orbit" component={MyOrbitScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// 2. The Root Navigator (Handles Auth & Drill-down navigation)
export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#7F56D9" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {session && session.user ? (
          // IF LOGGED IN
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="AthleteDetail"
              component={AthleteDetailScreen}
              options={{ headerShown: true, title: 'Athlete Profile' }}
            />
          </>
        ) : (
          // IF LOGGED OUT
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}