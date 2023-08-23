'use client';
import { useEffect, useState, } from 'react';
import io from 'socket.io-client';
let socketDetails = {};
function getSocket(args, setConnected, setTransport) {
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
        connectedUpdateHandler();
        transportUpdateHandler({ name: 'polling' });
    });
    socketDetails[argStr] = {
        socket,
        setConnected,
        setTransport
    };
    return socket;
}
const useSocket = (...args) => {
    var _a, _b, _c, _d, _e;
    const [isComponentMounted, setIsComponentMounted] = useState(false);
    useEffect(() => setIsComponentMounted(true), []);
    const [connected, setConnected] = useState(false);
    const [transport, setTransport] = useState('polling');
    const socket = getSocket(
    // if this is running on server / has not mounted yet, then don't autoConnect even if autoConnect is set to true
    typeof args[0] === 'string'
        ? [args[0], Object.assign(Object.assign({}, args[1]), { autoConnect: isComponentMounted && ((_b = (_a = args[1]) === null || _a === void 0 ? void 0 : _a.autoConnect) !== null && _b !== void 0 ? _b : true) })]
        : [Object.assign(Object.assign({}, args[0]), { autoConnect: isComponentMounted && ((_d = (_c = args[0]) === null || _c === void 0 ? void 0 : _c.autoConnect) !== null && _d !== void 0 ? _d : true) })], setConnected, setTransport);
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
    }, [isComponentMounted, socket, socket.connected, (_e = socket.io.engine) === null || _e === void 0 ? void 0 : _e.transport.name]);
    return [socket, connected, transport];
};
export default useSocket;
export { getSocket, useSocket };
