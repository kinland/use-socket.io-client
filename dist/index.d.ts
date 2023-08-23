/// <reference types="react" />
import io, { type Socket } from 'socket.io-client';
declare function getSocket(args: Parameters<typeof io>, setConnected: React.Dispatch<React.SetStateAction<boolean>>, setTransport: React.Dispatch<React.SetStateAction<string>>): Socket;
declare const useSocket: (uri: string | Partial<import("socket.io-client").ManagerOptions & import("socket.io-client").SocketOptions>, opts?: Partial<import("socket.io-client").ManagerOptions & import("socket.io-client").SocketOptions> | undefined) => [null, false, ''] | [Socket, boolean, string];
export default useSocket;
export { getSocket, useSocket };
//# sourceMappingURL=index.d.ts.map