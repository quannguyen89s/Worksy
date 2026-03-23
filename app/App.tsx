import './global.css';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ToastProvider from '@/components/ToastProvider';
import LoginScreen from '@/components/authScreens/LoginScreen';
import RegisterScreen from '@/components/authScreens/RegisterScreen';
import ForgotPasswordScreen from '@/components/authScreens/ForgotPasswordScreen';
import VerifyOTPScreen from '@/components/authScreens/VerifyOTPScreen';
import ResetPasswordScreen from '@/components/authScreens/ResetPasswordScreen';
import HomeScreen from '@/screens/HomeScreen';
import ProfileScreen from '@/components/ProfileScreens/ProfileScreen';
import EditProfileScreen from '@/components/ProfileScreens/EditProfileScreen';
import ChangePasswordScreen from '@/components/ProfileScreens/ChangePasswordScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
        </Stack.Navigator>
      </NavigationContainer>
      <ToastProvider />
    </SafeAreaProvider>
  );
}
