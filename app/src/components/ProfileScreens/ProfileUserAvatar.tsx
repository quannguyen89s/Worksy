import { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { resolveAvatarUrl } from '@/utils/avatarUrl';

export const PROFILE_AVATAR_ACCENT = '#92400E';

type Props = {
  name: string;
  /** Giá trị `avatar` thô từ API (path hoặc URL đầy đủ) */
  avatarRaw?: string | null;
  /** Đường kính vùng ảnh (bên trong viền) */
  size?: number;
  borderWidth?: number;
  editable?: boolean;
  uploading?: boolean;
  onPress?: () => void;
  /** Tăng sau khi upload để bust cache ảnh */
  cacheBust?: number;
  /** Màu nền xung quanh badge camera (đồng bộ màn hình) */
  badgeBorderColor?: string;
};

export function ProfileUserAvatar({
  name,
  avatarRaw,
  size = 100,
  borderWidth = 5,
  editable = false,
  uploading = false,
  onPress,
  cacheBust = 0,
  badgeBorderColor = '#FFF8E7',
}: Props) {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [avatarRaw, cacheBust]);

  const outerSize = size + borderWidth * 2;
  const uri = resolveAvatarUrl(
    avatarRaw ?? undefined,
    cacheBust > 0 ? { cacheBust } : undefined,
  );
  const showPhoto = Boolean(uri && !imageError);

  const avatarInner = (
    <View
      style={{
        width: outerSize,
        height: outerSize,
        borderRadius: outerSize / 2,
        borderWidth,
        borderColor: PROFILE_AVATAR_ACCENT,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      {showPhoto ? (
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            overflow: 'hidden',
            backgroundColor: '#F3F4F6',
          }}
        >
          <Image
            source={{ uri: uri! }}
            style={{ width: size, height: size }}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        </View>
      ) : (
        <LinearGradient
          colors={['#D97706', '#92400E']}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              color: '#fff',
              fontSize: Math.max(22, size * 0.36),
              fontWeight: '700',
            }}
          >
            {(name?.trim()?.charAt(0) || '?').toUpperCase()}
          </Text>
        </LinearGradient>
      )}

      {editable && (
        <View
          style={{
            position: 'absolute',
            bottom: -2,
            right: -2,
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: PROFILE_AVATAR_ACCENT,
            borderWidth: 3,
            borderColor: badgeBorderColor,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {uploading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="camera" size={16} color="#fff" />
          )}
        </View>
      )}
    </View>
  );

  if (editable && onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} disabled={uploading}>
        {avatarInner}
      </TouchableOpacity>
    );
  }

  return avatarInner;
}
