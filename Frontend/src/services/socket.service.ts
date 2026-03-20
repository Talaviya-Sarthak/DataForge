import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_NODE_API_URL || 'http://localhost:5000';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
    if (!socket) {
        socket = io(WS_URL, {
            // Read token at connect-time, not at module-load-time,
            // so a refreshed token is always used on reconnect.
            auth: (cb) => cb({ token: localStorage.getItem('token') }),
            transports: ['websocket'],
            reconnectionAttempts: 5,
            // Debounce reconnects: 2s base, doubles each attempt (2s, 4s, 8s, 16s, 32s)
            reconnectionDelay: 2000,
            reconnectionDelayMax: 30000,
            randomizationFactor: 0.3,
        });

        socket.on('connect',       () => console.info('[WS] Connected', socket!.id));
        socket.on('disconnect',    (reason) => console.warn('[WS] Disconnected:', reason));
        socket.on('connect_error', (err) => console.error('[WS] Error:', err.message));
        socket.on('reconnect_failed', () => console.error('[WS] Reconnect failed after 5 attempts'));
    }
    return socket;
};

export const disconnectSocket = () => {
    socket?.disconnect();
    socket = null;
};

/** Subscribe to tuning events for a specific experiment. */
export const subscribeToTuning = (
    experimentId: string,
    handlers: {
        onCompleted?: (result: any) => void;
        onFailed?: (error: string) => void;
    }
) => {
    const s = getSocket();
    s.emit('subscribe:tuning', { experimentId });

    if (handlers.onCompleted) s.on(`tuning:${experimentId}:completed`, handlers.onCompleted);
    if (handlers.onFailed)    s.on(`tuning:${experimentId}:failed`,    handlers.onFailed);

    return () => {
        s.emit('unsubscribe:tuning', { experimentId });
        s.off(`tuning:${experimentId}:completed`);
        s.off(`tuning:${experimentId}:failed`);
    };
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
