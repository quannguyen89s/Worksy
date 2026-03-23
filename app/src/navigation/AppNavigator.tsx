import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HomeScreen from '../screens/HomeScreen';
import MessagesScreen from '../screens/MessagesScreen';
import ChatScreen from '../screens/ChatScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import LoginScreen from '../components/authScreens/LoginScreen';
import RegisterScreen from '../components/authScreens/RegisterScreen';
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
const AuthStackNav = createNativeStackNavigator();
const Tab = createBottomTabNavigator<AppTabParamList>();

function AuthStack({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  return (
    <AuthStackNav.Navigator screenOptions={{ headerShown: false }}>
      <AuthStackNav.Screen name="Login">
        {(props) => <LoginScreen {...props} onLoginSuccess={onLoginSuccess} />}
      </AuthStackNav.Screen>
      <AuthStackNav.Screen name="Register" component={RegisterScreen} />
    </AuthStackNav.Navigator>
  );
}

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
    backgroundColor: '#C87941',
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

    // Expose logout for tab bar (not used here but kept for future)
    void onLogout;
  }, [onLogout]);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FBF7F3',
          borderTopColor: '#DDD5C8',
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 10,
          shadowColor: '#8B6F5E',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 8,
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
        tabBarActiveTintColor: '#1A0F0A',
        tabBarInactiveTintColor: '#A08070',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      })}>
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: 'Trang chủ' }} />
      <Tab.Screen name="ChatTab" component={ChatStack} options={{ title: 'Tin nhắn' }} />
      <Tab.Screen name="NotifTab" component={NotificationsScreen} options={{ title: 'Thông báo' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const [state, setState] = useState<'loading' | 'login' | 'app'>('loading');

  useEffect(() => {
    // Luôn xóa token cũ và bắt đầu từ Login
    AsyncStorage.multiRemove(['token', 'user']).then(() => {
      setState('login');
    });

    setUnauthorizedHandler(() => {
      disconnectSocket();
      AsyncStorage.multiRemove(['token', 'user']);
      setState('login');
    });
  }, []);

  if (state === 'loading') {
    return (
      <View style={{ flex: 1, backgroundColor: '#F2EAE0', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#C87941" size="large" />
      </View>
    );
  }

  if (state === 'login') {
    return (
      <NavigationContainer>
        <AuthStack onLoginSuccess={() => setState('app')} />
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <RootTabs onLogout={() => setState('login')} />
    </NavigationContainer>
  );
}
