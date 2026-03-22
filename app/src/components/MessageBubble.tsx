import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Message } from '../types';

interface Props {
  message: Message;
  isMine: boolean;
}

const { width: SCREEN_W } = Dimensions.get('window');

function formatTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const period = h < 12 ? 'SA' : 'CH';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${period}`;
}

export default function MessageBubble({ message, isMine }: Props) {
  const [imgModalVisible, setImgModalVisible] = useState(false);
  const isImage = message.type === 'image';

  return (
    <>
      <View style={[styles.row, isMine ? styles.rowRight : styles.rowLeft]}>
        <View style={[
          styles.bubble,
          isMine ? styles.bubbleMine : styles.bubbleOther,
          isImage && styles.bubbleImage,
        ]}>
          {isImage ? (
            <TouchableOpacity onPress={() => setImgModalVisible(true)} activeOpacity={0.9}>
              <Image
                source={{ uri: message.content }}
                style={styles.image}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ) : (
            <Text style={[styles.text, isMine ? styles.textMine : styles.textOther]}>
              {message.content}
            </Text>
          )}

          <View style={[styles.meta, isMine ? styles.metaRight : styles.metaLeft]}>
            <Text style={[styles.time, isMine ? styles.timeMine : styles.timeOther]}>
              {formatTime(message.createdAt)}
            </Text>
            {isMine && (
              <Text style={styles.tick}>{message.isRead ? '✓✓' : '✓'}</Text>
            )}
          </View>
        </View>
      </View>

      {isImage && (
        <Modal visible={imgModalVisible} transparent animationType="fade">
          <View style={styles.modalBg}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setImgModalVisible(false)}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Image
              source={{ uri: message.content }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  row: { marginVertical: 3, paddingHorizontal: 12 },
  rowRight: { alignItems: 'flex-end' },
  rowLeft: { alignItems: 'flex-start' },
  bubble: {
    maxWidth: '75%',
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  bubbleMine: { backgroundColor: '#6C63FF', borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: '#2a2a3e', borderBottomLeftRadius: 4 },
  bubbleImage: { padding: 4, paddingBottom: 0 },
  image: {
    width: SCREEN_W * 0.55,
    height: SCREEN_W * 0.55,
    borderRadius: 14,
  },
  text: { fontSize: 15, lineHeight: 21 },
  textMine: { color: '#fff' },
  textOther: { color: '#e8e8f0' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  metaRight: { justifyContent: 'flex-end' },
  metaLeft: { justifyContent: 'flex-start' },
  time: { fontSize: 11 },
  timeMine: { color: 'rgba(255,255,255,0.65)' },
  timeOther: { color: 'rgba(232,232,240,0.55)' },
  tick: { fontSize: 11, color: 'rgba(255,255,255,0.65)' },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  fullImage: { width: SCREEN_W, height: SCREEN_W * 1.2 },
});
