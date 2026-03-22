import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

const COLORS = ['#6C63FF', '#FF6584', '#43B89C', '#F9A825', '#E57373', '#64B5F6'];

function colorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length] ?? COLORS[0]!;
}

interface Props {
  name: string;
  uri?: string;
  size?: number;
  online?: boolean;
}

export default function Avatar({ name, uri, size = 44, online = false }: Props) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <View style={{ width: size, height: size }}>
      {uri ? (
        <Image source={{ uri }} style={[styles.img, { width: size, height: size, borderRadius: size / 2 }]} />
      ) : (
        <View
          style={[
            styles.placeholder,
            { width: size, height: size, borderRadius: size / 2, backgroundColor: colorFromName(name) },
          ]}>
          <Text style={[styles.initials, { fontSize: size * 0.38 }]}>{initials}</Text>
        </View>
      )}
      {online && (
        <View
          style={[
            styles.dot,
            { width: size * 0.27, height: size * 0.27, borderRadius: size * 0.14, right: 0, bottom: 0 },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  img: { resizeMode: 'cover' },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  initials: { color: '#fff', fontWeight: '700' },
  dot: {
    position: 'absolute',
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#1a1a2e',
  },
});
