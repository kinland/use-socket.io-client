import io, { type Socket } from 'socket.io-client';
type IoArgs = Parameters<typeof io>;
declare function useSocket(...args: IoArgs): [Socket, boolean, string];
export default useSocket;
export { useSocket };
//# sourceMappingURL=index.d.ts.map