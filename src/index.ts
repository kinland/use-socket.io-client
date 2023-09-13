'use client';

import {
  useEffect,
  useRef,
  useState,
} from 'react';

import io, {
  ManagerOptions,
  type Socket,
  SocketOptions,
} from 'socket.io-client';

type IoArgs = Parameters<typeof io>;

function getSocket(isComponentMounted: boolean, uri: string | undefined, options: Partial<ManagerOptions & SocketOptions>, setConnected: React.Dispatch<React.SetStateAction<boolean>>, setTransport: React.Dispatch<React.SetStateAction<string>>): Socket {
    const args: IoArgs = uri !== undefined ? [uri, options] : [options];
    const argStr = JSON.stringify(args);
    // if this is running on server / has not mounted yet, then don't autoConnect even if autoConnect is set to true
    options.autoConnect = isComponentMounted && (options.autoConnect ?? true)

    let socket = io(...args);

    const connectedUpdateHandler = () => setConnected(socket.connected);
    const transportUpdateHandler = (transport: { name: string }) => setTransport(transport.name);
    
    socket = socket.on('connect', () => {
        socket.io.engine.once('upgrade', transportUpdateHandler);
        connectedUpdateHandler();
    });
    socket = socket.on('disconnect', () => {
        connectedUpdateHandler();
        transportUpdateHandler({ name: options.transports?.[0] ?? 'polling' });
    });

    return socket;
}

const useSocket = (...args: IoArgs): [Socket, boolean, string] => {
    const [isComponentMounted, setIsComponentMounted] = useState(false);
    useEffect(() => setIsComponentMounted(true), []);

    const [connected, setConnected] = useState(false);
    const [transport, setTransport] = useState('polling');

    const [uri, options] = typeof args[0] === 'string'
        ? [args[0], args[1] ?? {}]
        : [undefined, args[0] ?? {}];

    const socketRef = useRef(
        getSocket(
            isComponentMounted,
            uri,
            options,
            setConnected,
            setTransport
        )
    );
    const socket = socketRef.current;

    useEffect(() => {
        socketRef.current = getSocket(
            isComponentMounted,
            uri,
            options,
            setConnected,
            setTransport
        );
    }, []);

    useEffect(() => {        
        if (isComponentMounted) {
            return () => {
                const argStr = JSON.stringify(args);
                console.log(`Cleaning up socket ${argStr}`);
                socket && socket.removeAllListeners();
                socket && socket.close();
            };
        }
    }, [isComponentMounted]);

    useEffect(() => {
        if (isComponentMounted) {
            let currentTransport = socket.io.engine?.transport.name ?? options.transports?.[0] ?? 'polling';

            if (connected !== socket.connected) {
                console.log(`updating connected with ${socket.connected}`)
                setConnected(socket.connected);
            }
            
            if (socket.connected && transport !== currentTransport) {
                console.log(`updating transport with ${currentTransport}`)
                setTransport(currentTransport);
            }
        }
    }, [isComponentMounted, socket.connected, socket.io.engine?.transport.name]);

    return [socketRef.current, connected, transport];
};

export default useSocket;
export { useSocket };