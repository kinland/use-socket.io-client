'use client';
import { useEffect, useState, } from 'react';
import io from 'socket.io-client';
let socketDetails = {};
function getSocket(isComponentMounted, uri, options, setConnected, setTransport) {
    var _a;
    const args = uri !== undefined ? [uri, options] : [options];
    const argStr = JSON.stringify(args);
    let socketDetail = socketDetails[argStr];
    if (socketDetail !== undefined) {
        socketDetail.setConnected = setConnected;
        socketDetail.setTransport = setTransport;
        return socketDetail.socket;
    }
    // if this is running on server / has not mounted yet, then don't autoConnect even if autoConnect is set to true
    options.autoConnect = isComponentMounted && ((_a = options.autoConnect) !== null && _a !== void 0 ? _a : true);
    console.log(`RECREATING SOCKET!? ${isComponentMounted}`);
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
    if (isComponentMounted) {
        socketDetails[argStr] = {
            socket,
            setConnected,
            setTransport
        };
    }
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
    // const args2: IoArgs = uri !== undefined ? [uri, options] : [options];
    // console.log({argStr: JSON.stringify(args), argStrRe: {};
    const socket = getSocket(isComponentMounted, uri, options, setConnected, setTransport);
    console.log("RERENDER 1");
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
        var _a, _b, _c, _d;
        if (isComponentMounted) {
            let currentTransport = (_d = (_b = (_a = socket.io.engine) === null || _a === void 0 ? void 0 : _a.transport.name) !== null && _b !== void 0 ? _b : (_c = options.transports) === null || _c === void 0 ? void 0 : _c[0]) !== null && _d !== void 0 ? _d : 'polling';
            console.log(`RERENDER 3 ${connected}!==${socket.connected}, ${transport}===${currentTransport}`);
            if (connected !== socket.connected) {
                console.log(`updating connected with ${socket.connected}`);
                setConnected(socket.connected);
            }
            if (socket.connected && transport !== currentTransport) {
                console.log(`updating transport with ${currentTransport}`);
                setTransport(currentTransport);
            }
        }
    }, [isComponentMounted, socket, socket.connected, (_c = socket.io.engine) === null || _c === void 0 ? void 0 : _c.transport.name]);
    return [socket, connected, transport];
};
export default useSocket;
export { useSocket };
