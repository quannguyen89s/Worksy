import '@/bootstrapNative';
import 'react-native-gesture-handler';
import './global.css';
import * as WebBrowser from 'expo-web-browser';
import { NavigationContainer } from '@react-navigation/native';
import { CardStyleInterpolators, createStackNavigator } from '@react-navigation/stack';
import type { RootStackParamList } from '@/navigation/types';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HomeScreen from '@/screens/HomeScreen';
import ToastProvider from '@/components/ToastProvider';
import LoginScreen from '@/components/authScreens/LoginScreen';
import RegisterScreen from '@/components/authScreens/RegisterScreen';
import ForgotPasswordScreen from '@/components/authScreens/ForgotPasswordScreen';
import VerifyOTPScreen from '@/components/authScreens/VerifyOTPScreen';
import ResetPasswordScreen from '@/components/authScreens/ResetPasswordScreen';
import ProfileScreen from '@/components/ProfileScreens/ProfileScreen';
import EditProfileScreen from '@/components/ProfileScreens/EditProfileScreen';
import ChangePasswordScreen from '@/components/ProfileScreens/ChangePasswordScreen';
import MyJobsScreen from '@/screens/MyJobsScreen';
import BrowseJobsScreen from '@/screens/BrowseJobsScreen';
import WorkerAppliesScreen from '@/screens/WorkerAppliesScreen';
import NotificationsScreen from '@/screens/NotificationsScreen';
import MessagesScreen from '@/screens/MessagesScreen';
import ChatScreen from '@/screens/ChatScreen';
import AdminDashboardScreen from '@/screens/admin/AdminDashboardScreen';
import AdminUsersScreen from '@/screens/admin/AdminUsersScreen';
import AdminJobsScreen from '@/screens/admin/AdminJobsScreen';
import AdminSettingsScreen from '@/screens/admin/AdminSettingsScreen';
import AdminAlertsScreen from './src/screens/admin/AdminAlertsScreen';

WebBrowser.maybeCompleteAuthSession();

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f1a" translucent={false} />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Login"
          detachInactiveScreens={false}
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: '#FEF9E7' },
          }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ cardStyleInterpolator: CardStyleInterpolators.forNoAnimation }}
          />
          <Stack.Screen
            name="BrowseJobs"
            component={BrowseJobsScreen}
            options={{ cardStyleInterpolator: CardStyleInterpolators.forNoAnimation }}
          />
          <Stack.Screen
            name="MyJobs"
            component={MyJobsScreen}
            options={{ cardStyleInterpolator: CardStyleInterpolators.forNoAnimation }}
          />
          <Stack.Screen
            name="AdminDashboard"
            component={AdminDashboardScreen}
            options={{ cardStyleInterpolator: CardStyleInterpolators.forNoAnimation }}
          />
          <Stack.Screen
            name="AdminUsers"
            component={AdminUsersScreen}
            options={{ cardStyleInterpolator: CardStyleInterpolators.forNoAnimation }}
          />
          <Stack.Screen
            name="AdminJobs"
            component={AdminJobsScreen}
            options={{ cardStyleInterpolator: CardStyleInterpolators.forNoAnimation }}
          />
          <Stack.Screen name="AdminSettings" component={AdminSettingsScreen} />
          <Stack.Screen
            name="AdminAlerts"
            component={AdminAlertsScreen}
            options={{ cardStyleInterpolator: CardStyleInterpolators.forNoAnimation }}
          />
          <Stack.Screen
            name="WorkerApplies"
            component={WorkerAppliesScreen}
            options={{ cardStyleInterpolator: CardStyleInterpolators.forNoAnimation }}
          />
          <Stack.Screen
            name="Notifications"
            component={NotificationsScreen}
            options={{ cardStyleInterpolator: CardStyleInterpolators.forNoAnimation }}
          />
          <Stack.Screen
            name="Messages"
            component={MessagesScreen}
            options={{ cardStyleInterpolator: CardStyleInterpolators.forNoAnimation }}
          />
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={{ cardStyleInterpolator: CardStyleInterpolators.forNoAnimation }}
          />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
        </Stack.Navigator>
      </NavigationContainer>
      <ToastProvider />
    </SafeAreaProvider>
  );
}
