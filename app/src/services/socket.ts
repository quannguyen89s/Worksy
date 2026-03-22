import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './api';

let socket: Socket | null = null;
let pending: Promise<Socket> | null = null;

export async function connectSocket(): Promise<Socket> {
  if (socket?.connected) return socket;
  if (pending) return pending;

  pending = (async () => {
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
      socket = null;
    }

    const token = await AsyncStorage.getItem('token');

    const newSocket = io(BASE_URL, {
      auth: { token: token ?? '' },
      transports: ['polling', 'websocket'],
      upgrade: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      timeout: 20000,
    });

    newSocket.on('connect', () =>
      console.log('[Socket] connected', newSocket.id)
    );
    newSocket.on('connect_error', (err) =>
      console.error('[Socket] error', err.message)
    );
    newSocket.on('disconnect', (reason) =>
      console.log('[Socket] disconnected', reason)
    );

    await new Promise<void>((resolve) => {
      newSocket.once('connect', () => resolve());
      newSocket.once('connect_error', () => resolve());
      setTimeout(resolve, 8000);
    });

    socket = newSocket;
    pending = null;
    return newSocket;
  })();

  return pending;
}

export async function reconnectSocket(): Promise<Socket> {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
  pending = null;
  return connectSocket();
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket(): void {
  socket?.removeAllListeners();
  socket?.disconnect();
  socket = null;
  pending = null;
}
