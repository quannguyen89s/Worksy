import '@/bootstrapNative';
import 'react-native-gesture-handler';
import './global.css';
import { NavigationContainer } from '@react-navigation/native';
import { CardStyleInterpolators, createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { RootStackParamList } from '@/navigation/types';
import LoginScreen from '@/components/authScreens/LoginScreen';
import RegisterScreen from '@/components/authScreens/RegisterScreen';
import HomeScreen from '@/screens/HomeScreen';
import MyJobsScreen from '@/screens/MyJobsScreen';
import AdminDashboardScreen from '@/screens/admin/AdminDashboardScreen';
import AdminUsersScreen from '@/screens/admin/AdminUsersScreen';
import AdminJobsScreen from '@/screens/admin/AdminJobsScreen';
import AdminSettingsScreen from '@/screens/admin/AdminSettingsScreen';
import AdminAlertsScreen from './src/screens/admin/AdminAlertsScreen';

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
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
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="MyJobs" component={MyJobsScreen} />
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
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
