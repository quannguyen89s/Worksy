import './global.css';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
const Stack = createNativeStackNavigator();
import HomeScreen from '@/screens/HomeScreen';

export default function App() {
  return (
    <SafeAreaProvider>
      <View>
        <Text>
          <HomeScreen></HomeScreen>
        </Text>
      </View>
    </SafeAreaProvider>
  );
}
