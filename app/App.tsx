import './global.css';
import { SafeAreaProvider } from 'react-native-safe-area-context';
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

      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="MyJobs" component={MyJobsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
