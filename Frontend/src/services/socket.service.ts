import { io, Socket } from 'socket.io-client';
import { getAccessToken } from './api.client';

const WS_URL = import.meta.env.VITE_NODE_API_URL || 'http://localhost:5000';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
    if (!socket) {
        socket = io(WS_URL, {
            // Read token at connect-time, not at module-load-time,
            // so a refreshed token is always used on reconnect.
            auth: (cb) => cb({ token: getAccessToken() }),
            transports: ['websocket'],
            reconnectionAttempts: 5,
            // Debounce reconnects: 2s base, doubles each attempt (2s, 4s, 8s, 16s, 32s)
            reconnectionDelay: 2000,
            reconnectionDelayMax: 30000,
            randomizationFactor: 0.3,
        });

        socket.on('connect', () => {});
        socket.on('disconnect', () => {});
        socket.on('connect_error', () => {});
        socket.on('reconnect_failed', () => {});
    }
    return socket;
};

export const disconnectSocket = () => {
    socket?.disconnect();
    socket = null;
};

export const subscribeToJob = (
    experimentId: string,
    handlers: {
        onProgress?: (data: { progress: number; models_completed: number }) => void;
        onCompleted?: (result: any) => void;
        onFailed?: (error: string) => void;
    }
) => {
    const s = getSocket();
    s.emit('subscribe:job', { experimentId });

    if (handlers.onProgress) s.on(`job:${experimentId}:progress`, handlers.onProgress);
    if (handlers.onCompleted) s.on(`job:${experimentId}:completed`, handlers.onCompleted);
    if (handlers.onFailed) s.on(`job:${experimentId}:failed`, handlers.onFailed);

    return () => {
        s.emit('unsubscribe:job', { experimentId });
        s.off(`job:${experimentId}:progress`);
        s.off(`job:${experimentId}:completed`);
        s.off(`job:${experimentId}:failed`);
    };
};
