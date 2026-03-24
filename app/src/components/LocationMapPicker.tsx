/**
 * LocationMapPicker - Chọn vị trí trên bản đồ (Google Maps / Apple Maps)
 * Pin cố định giữa màn hình - lướt/di chuyển bản đồ để chọn vị trí
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import MapView from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { reverseGeocode } from '@/services/geocodeService';
import { COLORS } from '@/theme/colors';

const DEFAULT_REGION = {
  latitude: 21.0285,
  longitude: 105.8542,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export type LocationResult = {
  lat: number;
  lng: number;
  address: string;
};

type LocationMapPickerProps = {
  visible: boolean;
  onClose: () => void;
  onConfirm: (result: LocationResult) => void;
  /** Vị trí ban đầu khi mở (nếu null sẽ thử lấy vị trí hiện tại) */
  initialLocation?: { lat: number; lng: number } | null;
};

export default function LocationMapPicker({
  visible,
  onClose,
  onConfirm,
  initialLocation,
}: LocationMapPickerProps) {
  const [region, setRegion] = useState(DEFAULT_REGION);
  const [selectedPosition, setSelectedPosition] = useState<{ lat: number; lng: number } | null>(
    initialLocation ?? null,
  );
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [loadingConfirm, setLoadingConfirm] = useState(false);
  const mapRef = useRef<MapView>(null);
  const isUpdatingRegion = useRef(false);

  const initFromCurrentLocation = useCallback(async () => {
    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Cần quyền', 'Cho phép truy cập vị trí để sử dụng bản đồ');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = pos.coords;
      const newRegion = {
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      isUpdatingRegion.current = true;
      setRegion(newRegion);
      setSelectedPosition({ lat: latitude, lng: longitude });
      mapRef.current?.animateToRegion(newRegion, 400);
    } catch {
      Alert.alert('Lỗi', 'Không thể lấy vị trí hiện tại');
    } finally {
      setLoadingLocation(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      if (initialLocation) {
        setSelectedPosition(initialLocation);
        const r = {
          latitude: initialLocation.lat,
          longitude: initialLocation.lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        isUpdatingRegion.current = true;
        setRegion(r);
        setTimeout(() => mapRef.current?.animateToRegion(r, 300), 100);
      } else {
        initFromCurrentLocation();
      }
    }
  }, [visible, initialLocation, initFromCurrentLocation]);

  /** Khi user lướt bản đồ xong - lấy tọa độ trung tâm làm vị trí chọn */
  const handleRegionChangeComplete = useCallback((r: { latitude: number; longitude: number }) => {
    if (isUpdatingRegion.current) {
      setTimeout(() => { isUpdatingRegion.current = false; }, 500);
      return;
    }
    setSelectedPosition({ lat: r.latitude, lng: r.longitude });
  }, []);

  const handleConfirm = async () => {
    if (!selectedPosition) {
      Alert.alert('Chưa chọn vị trí', 'Lướt bản đồ hoặc bấm "Vị trí hiện tại" để chọn');
      return;
    }
    setLoadingConfirm(true);
    try {
      const address = await reverseGeocode(selectedPosition.lat, selectedPosition.lng);
      onConfirm({
        lat: selectedPosition.lat,
        lng: selectedPosition.lng,
        address,
      });
      onClose();
    } catch {
      Alert.alert('Lỗi', 'Không thể lấy địa chỉ');
    } finally {
      setLoadingConfirm(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chọn vị trí trên bản đồ</Text>
          <View style={styles.headerBtn} />
        </View>

        <View style={styles.mapWrap}>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={region}
            onRegionChangeComplete={handleRegionChangeComplete}
            showsUserLocation
            showsMyLocationButton={false}
          />
          {/* Pin cố định giữa màn hình - user lướt map để chọn vị trí */}
          <View style={styles.centerPin} pointerEvents="none">
            <Ionicons name="location" size={48} color={COLORS.primary} />
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.hint}>
            {selectedPosition
              ? `Đã chọn: ${selectedPosition.lat.toFixed(4)}, ${selectedPosition.lng.toFixed(4)}`
              : 'Lướt bản đồ để chọn vị trí (pin ở giữa)'}
          </Text>
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.btn, styles.btnSecondary]}
              onPress={initFromCurrentLocation}
              disabled={loadingLocation}
            >
              {loadingLocation ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <>
                  <Ionicons name="locate" size={20} color={COLORS.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.btnSecondaryText}>Vị trí hiện tại</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary]}
              onPress={handleConfirm}
              disabled={!selectedPosition || loadingConfirm}
            >
              {loadingConfirm ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.btnPrimaryText}>Xác nhận</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 56 : 16,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
  },
  mapWrap: {
    flex: 1,
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  centerPin: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -48,
    marginLeft: -24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    padding: 16,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  hint: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 12,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  btnPrimary: {
    backgroundColor: COLORS.primary,
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  btnSecondary: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  btnSecondaryText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '600',
  },
});
