import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
const Stack = createNativeStackNavigator();
import HomeScreen from '@/screens/HomeScreen';
import LoginScreen from '@/components/authScreens/LoginScreen';
import RegisterScreen from '@/components/authScreens/RegisterScreen';
import MyJobsScreen from '@/screens/MyJobsScreen';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f1a" translucent={false} />
      <AppNavigator />
    </SafeAreaProvider>
  );
}
