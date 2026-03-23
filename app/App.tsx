import './global.css';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';

const Stack = createNativeStackNavigator<RootStackParamList>();
import HomeScreen from '@/screens/HomeScreen';
import LoginScreen from '@/components/authScreens/LoginScreen';
import RegisterScreen from '@/components/authScreens/RegisterScreen';
import MyJobsScreen from '@/screens/MyJobsScreen';
import BrowseJobsScreen from '@/screens/BrowseJobsScreen';
import WorkerAppliesScreen from '@/screens/WorkerAppliesScreen';

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
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="BrowseJobs" component={BrowseJobsScreen} />
          <Stack.Screen name="MyJobs" component={MyJobsScreen} />
          <Stack.Screen name="WorkerApplies" component={WorkerAppliesScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
