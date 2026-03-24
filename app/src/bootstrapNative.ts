/**
 * Phải chạy trước khi @react-navigation mount.
 * Tránh lệch kiểu JS/native khi react-native-screens mới hơn bản trong Expo Go.
 */
import { enableScreens } from 'react-native-screens';

enableScreens(false);
