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
import { getUnreadCount as getChatUnread } from '../services/chat.service';
import { getUnreadCount as getNotifUnread } from '../services/notification.service';
import { RootStackParamList } from '../types';
import { connectSocket } from '../services/socket';

type TabParamList = {
  ChatTab: undefined;
  NotifTab: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

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


function RootTabs() {
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
          const isChatTab = route.name === 'ChatTab';
          const iconName: keyof typeof Ionicons.glyphMap = isChatTab
            ? focused ? 'chatbubbles' : 'chatbubbles-outline'
            : focused ? 'notifications' : 'notifications-outline';
          const count = isChatTab ? msgUnread : notifUnread;
          return (
            <View>
              <Ionicons name={iconName} size={size} color={color} />
              <TabBadge count={count} />
            </View>
          );
        },
        tabBarActiveTintColor: '#6C63FF',
        tabBarInactiveTintColor: '#555',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      })}>
      <Tab.Screen name="ChatTab" component={ChatStack} options={{ title: 'Tin nhắn' }} />
      <Tab.Screen name="NotifTab" component={NotificationsScreen} options={{ title: 'Thông báo' }} />
    </Tab.Navigator>
  );
}


export default function AppNavigator() {
  const [state, setState] = useState<'loading' | 'login' | 'app'>('loading');

  useEffect(() => {
    AsyncStorage.getItem('token').then((token) => {
      setState(token ? 'app' : 'login');
    });
  }, []);

  if (state === 'loading') {
    return (
      <View style={{ flex: 1, backgroundColor: '#0f0f1a', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#6C63FF" size="large" />
      </View>
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
      <RootTabs />
    </NavigationContainer>
  );
}
