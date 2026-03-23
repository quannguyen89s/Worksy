import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator, Animated, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Toast } from '@/components/ToastProvider';
import authService from '@/services/authService';

export default function ForgotPasswordScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleSendOTP = async () => {
    if (!email.trim()) {
      Toast.show({ type: 'error', title: 'Error', message: 'Please enter your email.' }); return;
    }
    setLoading(true);
    try {
      await authService.forgotPassword(email.trim());
      Toast.show({ type: 'success', title: 'Email Sent!', message: 'OTP code has been sent to your email.' });
      setTimeout(() => { navigation.navigate('VerifyOTP', { email: email.trim() }); }, 1500);
    } catch (error: any) {
      Toast.show({ type: 'error', title: 'Error', message: error.response?.data?.message || 'Failed to send OTP. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#1C0A00' }}>
      <StatusBar barStyle="light-content" />

      {/* Hero */}
      <LinearGradient
        colors={['#1C0A00', '#3B1505', '#78350F']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ paddingTop: insets.top + 16, paddingBottom: 56, paddingHorizontal: 28 }}
      >
        {/* Decorative blobs */}
        <View style={{
          position: 'absolute', top: insets.top, right: -30,
          width: 180, height: 180, borderRadius: 90,
          backgroundColor: 'rgba(180,83,9,0.2)',
        }} />
        <View style={{
          position: 'absolute', bottom: 0, left: 20,
          width: 80, height: 80, borderRadius: 40,
          backgroundColor: 'rgba(217,119,6,0.12)',
        }} />

        {/* Back */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            width: 40, height: 40, borderRadius: 12,
            backgroundColor: 'rgba(255,255,255,0.12)',
            alignItems: 'center', justifyContent: 'center',
            marginBottom: 32,
          }}
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>

        {/* Icon */}
        <View style={{
          width: 64, height: 64, borderRadius: 20,
          backgroundColor: 'rgba(217,119,6,0.25)',
          alignItems: 'center', justifyContent: 'center',
          marginBottom: 20,
          borderWidth: 1,
          borderColor: 'rgba(217,119,6,0.4)',
        }}>
          <Ionicons name="key-outline" size={32} color="#F59E0B" />
        </View>

        <Text style={{ fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 8, lineHeight: 36 }}>
          Forgot Password?
        </Text>
        <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 22 }}>
          No worries! Enter your email address{'\n'}and we'll send you a recovery code.
        </Text>
      </LinearGradient>

      {/* Form card */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <ScrollView
            style={{
              flex: 1, backgroundColor: '#fff',
              borderTopLeftRadius: 32, borderTopRightRadius: 32,
              marginTop: -28,
            }}
            contentContainerStyle={{ padding: 28, paddingBottom: 48 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Handle bar */}
            <View style={{
              width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB',
              alignSelf: 'center', marginBottom: 36,
            }} />

            <Text style={{ fontSize: 15, color: '#6B7280', lineHeight: 24, marginBottom: 28 }}>
              Enter the email address associated with your account. We'll send a 6-digit code to your inbox.
            </Text>

            {/* Email */}
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 }}>
              Email Address
            </Text>
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              height: 58, borderRadius: 16, paddingHorizontal: 16,
              backgroundColor: emailFocused ? '#FFFBEB' : '#F9FAFB',
              borderWidth: 1.5,
              borderColor: emailFocused ? '#D97706' : '#F3F4F6',
              marginBottom: 32,
            }}>
              <View style={{
                width: 34, height: 34, borderRadius: 10,
                backgroundColor: emailFocused ? '#FEF3C7' : '#F3F4F6',
                alignItems: 'center', justifyContent: 'center', marginRight: 12,
              }}>
                <Ionicons name="mail-outline" size={17} color={emailFocused ? '#92400E' : '#9CA3AF'} />
              </View>
              <TextInput
                style={{ flex: 1, fontSize: 15, color: '#111827', padding: 0 }}
                placeholder="your@email.com"
                placeholderTextColor="#C0C0C0"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Send OTP Button */}
            <TouchableOpacity onPress={handleSendOTP} activeOpacity={0.85} disabled={loading}>
              <LinearGradient
                colors={['#D97706', '#B45309', '#92400E']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{
                  height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
                  shadowColor: '#B45309', shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
                  marginBottom: 24,
                }}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Ionicons name="send-outline" size={18} color="#fff" />
                      <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
                        Send Recovery Code
                      </Text>
                    </View>
                  )
                }
              </LinearGradient>
            </TouchableOpacity>

            {/* Info box */}
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              backgroundColor: '#FFFBEB', borderRadius: 14,
              padding: 14, gap: 10,
              borderWidth: 1, borderColor: '#FDE68A',
            }}>
              <Ionicons name="information-circle" size={18} color="#D97706" />
              <Text style={{ fontSize: 13, color: '#92400E', flex: 1, lineHeight: 20 }}>
                Check your spam folder if you don't see the email within a few minutes.
              </Text>
            </View>

            {/* Back to login */}
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 32, gap: 6 }}
              onPress={() => navigation.navigate('Login')}
            >
              <Ionicons name="arrow-back" size={16} color="#92400E" />
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#92400E' }}>
                Back to Sign In
              </Text>
            </TouchableOpacity>

          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}
