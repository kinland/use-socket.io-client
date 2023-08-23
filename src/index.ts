'use client';

import {
  useEffect,
  useState,
} from 'react';

import io, { type Socket } from 'socket.io-client';

type SocketDetails = {
    socket: Socket;
    setConnected: React.Dispatch<React.SetStateAction<boolean>>;
    setTransport: React.Dispatch<React.SetStateAction<string>>;
}

let socketDetails = {} as Record<string, SocketDetails>;

function getSocket(args: Parameters<typeof io>, setConnected: React.Dispatch<React.SetStateAction<boolean>>, setTransport: React.Dispatch<React.SetStateAction<string>>): Socket {
    const argStr = JSON.stringify(args);
    let socketDetail = socketDetails[argStr];
    if (socketDetail !== undefined) {
        socketDetail.setConnected = setConnected;
        socketDetail.setTransport = setTransport;
        return socketDetail.socket;
    }
    console.log("RECREATING SOCKET!?")
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
        transportUpdateHandler({name: 'polling'});
    });

    socketDetails[argStr] = {
        socket,
        setConnected,
        setTransport
    }

    return socket;
}

const useSocket = (...args: Parameters<typeof io>): [null, false, ''] | [Socket, boolean, string] => {
    const [isComponentMounted, setIsComponentMounted] = useState(false);
    useEffect(() => setIsComponentMounted(true), []);

    const [connected, setConnected] = useState(false);
    const [transport, setTransport] = useState('polling');

    const socket = getSocket(
        // if this is running on server / has not mounted yet, then don't autoConnect even if autoConnect is set to true
        typeof args[0] === 'string'
            ? [args[0], {...args[1], autoConnect: isComponentMounted && (args[1]?.autoConnect ?? true)}]
            : [{...args[0], autoConnect: isComponentMounted && (args[0]?.autoConnect ?? true)}],
        setConnected,
        setTransport
    );

    console.log("RERENDER 1")

    useEffect(() => {
        if (isComponentMounted) {
            console.log("RERENDER 2");
            return () => {
                socket && socket.removeAllListeners();
                socket && socket.close();
            };
        }
    }, [isComponentMounted, socket]);

    useEffect(() => {
        if (isComponentMounted) {
            console.log(`RERENDER 3 ${connected}!==${socket.connected}, ${transport}===${socket.io.engine?.transport.name ?? 'polling'}`);
            if (connected !== socket.connected) {
                console.log(`updating connected with ${socket.connected}`)
                setConnected(socket.connected);
            }
            let currentTransport = socket.io.engine?.transport.name ?? 'polling';
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