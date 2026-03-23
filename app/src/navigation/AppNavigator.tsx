import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MessagesScreen from '../screens/MessagesScreen';
import ChatScreen from '../screens/ChatScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import AppHomeScreen from '../screens/AppHomeScreen';
import { getUnreadCount as getChatUnread } from '../services/chat.service';
import { getUnreadCount as getNotifUnread } from '../services/notification.service';
import { RootStackParamList } from '../types';
import { connectSocket, disconnectSocket } from '../services/socket';
import { setUnauthorizedHandler } from '../services/api';

type AppTabParamList = {
  HomeTab: undefined;
  ChatTab: undefined;
  NotifTab: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<AppTabParamList>();

function TabBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <View style={badge.wrap}>
      <Text style={badge.text}>{count > 9 ? '9+' : String(count)}</Text>
    </View>
  );
}

const badge = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#6C63FF',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  text: { color: '#fff', fontSize: 10, fontWeight: '700' },
});

function ChatStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Messages" component={MessagesScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
    </Stack.Navigator>
  );
}

function RootTabs({ onLogout }: { onLogout: () => void }) {
  const [msgUnread, setMsgUnread] = useState(0);
  const [notifUnread, setNotifUnread] = useState(0);

  useEffect(() => {
    const refresh = async () => {
      const [m, n] = await Promise.all([getChatUnread(), getNotifUnread()]);
      setMsgUnread(m);
      setNotifUnread(n);
    };
    void refresh();

    connectSocket().then((socket) => {
      socket.on('new_message', () => setMsgUnread((c) => c + 1));
      socket.on('notification', () => setNotifUnread((c) => c + 1));
    });
  }, []);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0f0f1a',
          borderTopColor: '#1e1e30',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
        },
        tabBarIcon: ({ focused, color, size }) => {
          if (route.name === 'HomeTab') {
            return (
              <Ionicons
                name={focused ? 'home' : 'home-outline'}
                size={size}
                color={color}
              />
            );
          }
          if (route.name === 'ChatTab') {
            return (
              <View>
                <Ionicons
                  name={focused ? 'chatbubbles' : 'chatbubbles-outline'}
                  size={size}
                  color={color}
                />
                <TabBadge count={msgUnread} />
              </View>
            );
          }
          return (
            <View>
              <Ionicons
                name={focused ? 'notifications' : 'notifications-outline'}
                size={size}
                color={color}
              />
              <TabBadge count={notifUnread} />
            </View>
          );
        },
        tabBarActiveTintColor: '#6C63FF',
        tabBarInactiveTintColor: '#555',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      })}>
      <Tab.Screen name="HomeTab" options={{ title: 'Trang chủ' }}>
        {() => <AppHomeScreen onLogout={onLogout} />}
      </Tab.Screen>
      <Tab.Screen name="ChatTab" component={ChatStack} options={{ title: 'Tin nhắn' }} />
      <Tab.Screen name="NotifTab" component={NotificationsScreen} options={{ title: 'Thông báo' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const [state, setState] = useState<'loading' | 'home' | 'login' | 'app'>('loading');

  useEffect(() => {
    AsyncStorage.getItem('token').then((token) => {
      setState(token ? 'app' : 'home');
    });

    setUnauthorizedHandler(() => {
      disconnectSocket();
      setState('home');
    });
  }, []);

  if (state === 'loading') {
    return (
      <View style={{ flex: 1, backgroundColor: '#0f0f1a', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#6C63FF" size="large" />
      </View>
    );
  }

  if (state === 'home') {
    return (
      <NavigationContainer>
        <HomeScreen onLoginPress={() => setState('login')} />
      </NavigationContainer>
    );
  }

  if (state === 'login') {
    return (
      <NavigationContainer>
        <LoginScreen onLoginSuccess={() => setState('app')} />
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <RootTabs onLogout={() => setState('home')} />
    </NavigationContainer>
  );
}
