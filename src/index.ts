'use client';

import {
  useEffect,
  useState,
} from 'react';

import io, {
  ManagerOptions,
  type Socket,
  SocketOptions,
} from 'socket.io-client';

type IoArgs = Parameters<typeof io>;

type SocketDetails = {
    socket: Socket;
    setConnected: React.Dispatch<React.SetStateAction<boolean>>;
    setTransport: React.Dispatch<React.SetStateAction<string>>;
}

let socketDetails = {} as Record<string, SocketDetails>;

function getSocket(isComponentMounted: boolean, uri: string | undefined, options: Partial<ManagerOptions & SocketOptions>, setConnected: React.Dispatch<React.SetStateAction<boolean>>, setTransport: React.Dispatch<React.SetStateAction<string>>): Socket {
    const args: IoArgs = uri !== undefined ? [uri, options] : [options];
    const argStr = JSON.stringify(args);
    let socketDetail = socketDetails[argStr];
    if (socketDetail !== undefined) {
        socketDetail.setConnected = setConnected;
        socketDetail.setTransport = setTransport;
        return socketDetail.socket;
    }
    // if this is running on server / has not mounted yet, then don't autoConnect even if autoConnect is set to true
    options.autoConnect = isComponentMounted && (options.autoConnect ?? true)

    console.log(`RECREATING SOCKET!? ${isComponentMounted}`)
    let socket = io(...args);

    const connectedUpdateHandler = () => socketDetails[argStr].setConnected(socket.connected);
    const transportUpdateHandler = (transport: {name: string}) => socketDetails[argStr].setTransport(transport.name);
    
    socket = socket.on('connect', () => {
        console.log("got connect")
        socket.io.engine.once('upgrade', transportUpdateHandler);
        connectedUpdateHandler();
    });
    socket = socket.on('disconnect', () => {
        connectedUpdateHandler();
        transportUpdateHandler({name: options.transports?.[0] ?? 'polling'});
    });

    if (isComponentMounted) {
        socketDetails[argStr] = {
            socket,
            setConnected,
            setTransport
        }
    }

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

    const socket = getSocket(
        isComponentMounted,
        uri,
        options,
        setConnected,
        setTransport
    );

    console.log("RERENDER 1")

    useEffect(() => {
        if (isComponentMounted) {
            console.log("RERENDER 2");
            return () => {
                const argStr = JSON.stringify(args);
                console.log(`Cleaning up ${argStr}`);
                socket && socket.removeAllListeners();
                socket && socket.close();
                delete socketDetails[argStr];
            };
        }
    }, [isComponentMounted, socket]);

    useEffect(() => {
        if (isComponentMounted) {
            let currentTransport = socket.io.engine?.transport.name ?? options.transports?.[0] ?? 'polling';

            console.log(`RERENDER 3 ${connected}!==${socket.connected}, ${transport}===${currentTransport}`);
            if (connected !== socket.connected) {
                console.log(`updating connected with ${socket.connected}`)
                setConnected(socket.connected);
            }
            
            if (socket.connected && transport !== currentTransport) {
                console.log(`updating transport with ${currentTransport}`)
                setTransport(currentTransport);
            }
        }
    }, [isComponentMounted, socket, socket.connected, socket.io.engine?.transport.name]);

    return [socket, connected, transport];
};

export default useSocket;
export { useSocket };