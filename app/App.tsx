import '@/bootstrapNative';
import 'react-native-gesture-handler';
import './global.css';
import { NavigationContainer } from '@react-navigation/native';
import { CardStyleInterpolators, createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
const Stack = createNativeStackNavigator();
import type { RootStackParamList } from '@/navigation/types';
import HomeScreen from '@/screens/HomeScreen';
import LoginScreen from '@/components/authScreens/LoginScreen';
import RegisterScreen from '@/components/authScreens/RegisterScreen';
import MyJobsScreen from '@/screens/MyJobsScreen';
import BrowseJobsScreen from '@/screens/BrowseJobsScreen';
import WorkerAppliesScreen from '@/screens/WorkerAppliesScreen';
import AdminDashboardScreen from '@/screens/admin/AdminDashboardScreen';
import AdminUsersScreen from '@/screens/admin/AdminUsersScreen';
import AdminJobsScreen from '@/screens/admin/AdminJobsScreen';
import AdminSettingsScreen from '@/screens/admin/AdminSettingsScreen';
import AdminAlertsScreen from './src/screens/admin/AdminAlertsScreen';
const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f1a" translucent={false} />
      <AppNavigator />
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
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
