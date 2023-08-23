import { ManagerOptions, type Socket, SocketOptions } from 'socket.io-client';
declare const useSocket: (uri: string | Partial<ManagerOptions & SocketOptions>, opts?: Partial<ManagerOptions & SocketOptions> | undefined) => [Socket, boolean, string];
export default useSocket;
export { useSocket };
//# sourceMappingURL=index.d.ts.map