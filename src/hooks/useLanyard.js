import { useState, useEffect, useRef } from 'react';

export function useLanyard(userId) {
  const [data, setData] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!userId) return;

    const connect = () => {
      const socket = new WebSocket('wss://api.lanyard.rest/socket');
      socketRef.current = socket;

      socket.onmessage = (event) => {
        const message = JSON.parse(event.data);

        // Opcode 1: Hello - we must respond with Opcode 2 (subscribe)
        if (message.op === 1) {
          socket.send(JSON.stringify({
            op: 2,
            d: { subscribe_to_id: userId }
          }));

          // Send heartbeat every heartbeat_interval
          const heartbeat = setInterval(() => {
            socket.send(JSON.stringify({ op: 3 }));
          }, message.d.heartbeat_interval);

          socket.heartbeat = heartbeat;
        }

        // Opcode 0: Event
        if (message.op === 0) {
          if (message.t === 'INIT_STATE' || message.t === 'PRESENCE_UPDATE') {
            setData(message.d);
          }
        }
      };

      socket.onclose = () => {
        if (socket.heartbeat) clearInterval(socket.heartbeat);
        setTimeout(connect, 5000); // Reconnect after 5s
      };
    };

    connect();

    return () => {
      if (socketRef.current) {
        if (socketRef.current.heartbeat) clearInterval(socketRef.current.heartbeat);
        socketRef.current.close();
      }
    };
  }, [userId]);

  return data;
}
