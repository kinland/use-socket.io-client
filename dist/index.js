'use client';
import { useEffect, useRef, useState, } from 'react';
import io from 'socket.io-client';
function getSocket(isComponentMounted, uri, options, setConnected, setTransport) {
    var _a;
    const args = uri !== undefined ? [uri, options] : [options];
    const argStr = JSON.stringify(args);
    // if this is running on server / has not mounted yet, then don't autoConnect even if autoConnect is set to true
    options.autoConnect = isComponentMounted && ((_a = options.autoConnect) !== null && _a !== void 0 ? _a : true);
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
const useSocket = (...args) => {
    var _a, _b, _c;
    const [isComponentMounted, setIsComponentMounted] = useState(false);
    useEffect(() => setIsComponentMounted(true), []);
    const [connected, setConnected] = useState(false);
    const [transport, setTransport] = useState('polling');
    const [uri, options] = typeof args[0] === 'string'
        ? [args[0], (_a = args[1]) !== null && _a !== void 0 ? _a : {}]
        : [undefined, (_b = args[0]) !== null && _b !== void 0 ? _b : {}];
    const socketRef = useRef(getSocket(isComponentMounted, uri, options, setConnected, setTransport));
    const socket = socketRef.current;
    useEffect(() => {
        if (isComponentMounted) {
            socketRef.current = getSocket(isComponentMounted, uri, options, setConnected, setTransport);
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
        if (isComponentMounted) {
            let currentTransport = (_d = (_b = (_a = socket.io.engine) === null || _a === void 0 ? void 0 : _a.transport.name) !== null && _b !== void 0 ? _b : (_c = options.transports) === null || _c === void 0 ? void 0 : _c[0]) !== null && _d !== void 0 ? _d : 'polling';
            if (connected !== socket.connected) {
                console.log(`updating connected with ${socket.connected}`);
                setConnected(socket.connected);
            }
            if (socket.connected && transport !== currentTransport) {
                console.log(`updating transport with ${currentTransport}`);
                setTransport(currentTransport);
            }
        }
    }, [isComponentMounted, socket.connected, (_c = socket.io.engine) === null || _c === void 0 ? void 0 : _c.transport.name]);
    return [socketRef.current, connected, transport];
};
export default useSocket;
export { useSocket };
