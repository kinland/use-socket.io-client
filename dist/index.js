'use client';
import { useEffect, useState, } from 'react';
import io from 'socket.io-client';
let socketDetails = {};
function getSocket(uri, options, setConnected, setTransport) {
    const args = uri !== undefined ? [uri, options] : [options];
    const argStr = JSON.stringify(args);
    let socketDetail = socketDetails[argStr];
    if (socketDetail !== undefined) {
        socketDetail.setConnected = setConnected;
        socketDetail.setTransport = setTransport;
        return socketDetail.socket;
    }
    console.log("RECREATING SOCKET!?");
    let socket = io(...args);
    const connectedUpdateHandler = () => socketDetails[argStr].setConnected(socket.connected);
    const transportUpdateHandler = (transport) => socketDetails[argStr].setTransport(transport.name);
    socket = socket.on('connect', () => {
        console.log("got connect");
        socket.io.engine.once('upgrade', transportUpdateHandler);
        connectedUpdateHandler();
    });
    socket = socket.on('disconnect', () => {
        var _a, _b;
        connectedUpdateHandler();
        transportUpdateHandler({ name: (_b = (_a = options.transports) === null || _a === void 0 ? void 0 : _a[0]) !== null && _b !== void 0 ? _b : 'polling' });
    });
    socketDetails[argStr] = {
        socket,
        setConnected,
        setTransport
    };
    return socket;
}
const useSocket = (...args) => {
    var _a, _b, _c, _d;
    const [isComponentMounted, setIsComponentMounted] = useState(false);
    useEffect(() => setIsComponentMounted(true), []);
    const [connected, setConnected] = useState(false);
    const [transport, setTransport] = useState('polling');
    const [uri, options] = typeof args[0] === 'string'
        ? [args[0], (_a = args[1]) !== null && _a !== void 0 ? _a : {}]
        : [undefined, (_b = args[0]) !== null && _b !== void 0 ? _b : {}];
    // if this is running on server / has not mounted yet, then don't autoConnect even if autoConnect is set to true
    options.autoConnect = isComponentMounted && ((_c = options.autoConnect) !== null && _c !== void 0 ? _c : true);
    const socket = getSocket(uri, options, setConnected, setTransport);
    console.log("RERENDER 1");
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
        var _a, _b, _c, _d;
        if (isComponentMounted) {
            console.log(`RERENDER 3 ${connected}!==${socket.connected}, ${transport}===${(_b = (_a = socket.io.engine) === null || _a === void 0 ? void 0 : _a.transport.name) !== null && _b !== void 0 ? _b : 'polling'}`);
            if (connected !== socket.connected) {
                console.log(`updating connected with ${socket.connected}`);
                setConnected(socket.connected);
            }
            let currentTransport = (_d = (_c = socket.io.engine) === null || _c === void 0 ? void 0 : _c.transport.name) !== null && _d !== void 0 ? _d : 'polling';
            if (socket.connected && transport !== currentTransport) {
                console.log(`updating transport with ${currentTransport}`);
                setTransport(currentTransport);
            }
        }
    }, [isComponentMounted, socket, socket.connected, (_d = socket.io.engine) === null || _d === void 0 ? void 0 : _d.transport.name]);
    return [socket, connected, transport];
};
export default useSocket;
export { useSocket };
