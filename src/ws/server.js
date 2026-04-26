import { WebSocket, WebSocketServer } from "ws";
import { wsArcjet } from "../arcjet.js";

//HELPER FUNCTIONS

function sendJson(socket, payload) {
  if (socket.readyState !== WebSocket.OPEN) return;

  socket.send(JSON.stringify(payload));
}

function broadcast(wss, payload) {
  for (const client of wss.clients) {
    if (client.readyState !== WebSocket.OPEN) continue;
    client.send(JSON.stringify(payload));
  }
}
// <---
export function attachWebSocketServer(server) {
  const wss = new WebSocketServer({
    server,
    path: "/ws",
    maxPayload: 1024 * 1024,
  });

  // Validate request before WebSocket handshake
  server.on("upgrade", async (req, socket, head) => {
    if (!req.url.startsWith("/ws")) {
      return; // Let other upgrade handlers take over
    }

    if (wsArcjet) {
      try {
        const decision = await wsArcjet.protect(req);
        if (decision.isDenied()) {
          const statusCode = decision.reason.isRateLimit() ? 429 : 403;
          const reasonPhrase = decision.reason.isRateLimit() ? "Too Many Requests" : "Forbidden";
          const message = decision.reason.isRateLimit() ? "Rate limit exceeded" : "Access denied";
          
          socket.write(
            `HTTP/1.1 ${statusCode} ${reasonPhrase}\r\n` +
            "Content-Type: application/json\r\n" +
            `Content-Length: ${Buffer.byteLength(message)}\r\n` +
            "Connection: close\r\n" +
            "\r\n" +
            message
          );
          socket.destroy();
          return;
        }
      } catch (e) {
        console.error("WS upgrade protection error:", e);
        socket.write(
          "HTTP/1.1 500 Internal Server Error\r\n" +
          "Content-Type: text/plain\r\n" +
          "Connection: close\r\n" +
          "\r\n" +
          "Server security error"
        );
        socket.destroy();
        return;
      }
    }

    // Request passed validation, proceed with WebSocket upgrade
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req);
    });
  });

  wss.on("connection", (socket, req) => {
    socket.isAlive = true;
    socket.on("pong", () => {
      socket.isAlive = true;
    });

    sendJson(socket, { type: "welcome" });

    socket.on("error", console.error);
  });

  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on("close", () => clearInterval(interval));

  function broadcastMatchCreated(match) {
    broadcast(wss, { type: "match_created", data: match });
  }

  return { broadcastMatchCreated };
}
