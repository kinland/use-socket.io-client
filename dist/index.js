'use client';
import { useEffect, useRef, useState, } from 'react';
import io from 'socket.io-client';
function getSocket(uri, options, setConnected, setTransport) {
    const args = uri !== undefined ? [uri, options] : [options];
    // if this is running on server / has not mounted yet, this prevents autoConnect even if autoConnect is set to true
    options.autoConnect = false;
    let socket = io(...args);
    const connectedUpdateHandler = () => setConnected(socket.connected);
    const transportUpdateHandler = (transport) => setTransport(transport.name);
    socket = socket.on('connect', () => {
        socket.io.engine.once('upgrade', transportUpdateHandler);
        connectedUpdateHandler();
    });
    socket = socket.on('disconnect', () => {
        var _a, _b;
        connectedUpdateHandler();
        transportUpdateHandler({ name: (_b = (_a = options.transports) === null || _a === void 0 ? void 0 : _a[0]) !== null && _b !== void 0 ? _b : 'polling' });
    });
    return socket;
}
function useSocket(...args) {
    var _a, _b, _c, _d, _e;
    const [isComponentMounted, setIsComponentMounted] = useState(false);
    useEffect(() => setIsComponentMounted(true), []);
    const [uri, options] = typeof args[0] === 'string'
        ? [args[0], (_a = args[1]) !== null && _a !== void 0 ? _a : {}]
        : [undefined, (_b = args[0]) !== null && _b !== void 0 ? _b : {}];
    const [connected, setConnected] = useState(false);
    const [transport, setTransport] = useState((_d = (_c = options.transports) === null || _c === void 0 ? void 0 : _c[0]) !== null && _d !== void 0 ? _d : 'polling');
    const socketRef = useRef(null);
    // Prevent calling getSocket more than once
    if (socketRef.current === null) {
        socketRef.current = getSocket(uri, options, setConnected, setTransport);
    }
    const socket = socketRef.current;
    const automaticallyConnected = useRef(false);
    useEffect(() => {
        var _a;
        if (isComponentMounted) {
            if (!socket.connected && ((_a = options.autoConnect) !== null && _a !== void 0 ? _a : true) && !automaticallyConnected.current) {
                socket.connect();
                automaticallyConnected.current = true;
            }
            return () => {
                const argStr = JSON.stringify(args);
                console.log(`Cleaning up socket ${argStr}`);
                socket && socket.removeAllListeners();
                socket && socket.close();
            };
        }
    }, [isComponentMounted]);
    useEffect(() => {
        var _a, _b, _c, _d;
        let currentTransport = (_d = (_b = (_a = socket.io.engine) === null || _a === void 0 ? void 0 : _a.transport.name) !== null && _b !== void 0 ? _b : (_c = options.transports) === null || _c === void 0 ? void 0 : _c[0]) !== null && _d !== void 0 ? _d : 'polling';
        if (connected !== socket.connected) {
            console.log(`updating connected with ${socket.connected}`);
            setConnected(socket.connected);
        }
        if (socket.connected && transport !== currentTransport) {
            console.log(`updating transport with ${currentTransport}`);
            setTransport(currentTransport);
        }
    }, [socket === null || socket === void 0 ? void 0 : socket.connected, (_e = socket === null || socket === void 0 ? void 0 : socket.io.engine) === null || _e === void 0 ? void 0 : _e.transport.name]);
    return [socket, connected, transport];
}
;
export default useSocket;
export { useSocket };
