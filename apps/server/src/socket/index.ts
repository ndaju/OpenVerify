import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { verifyAccessToken } from "../lib/jwt";
import { config } from "../config";

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
}

let io: Server;

export function initializeSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: config.corsOrigin,
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    if (!token) {
      next(new Error("Authentication required"));
      return;
    }

    try {
      const payload = verifyAccessToken(token as string);
      socket.userId = payload.userId;
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    console.log(`User connected: ${socket.userId}`);

    socket.join(`user:${socket.userId}`);

    io.emit("user:online", { userId: socket.userId });

    socket.on("channel:join", (channelId: string) => {
      socket.join(`channel:${channelId}`);
      socket.to(`channel:${channelId}`).emit("channel:userJoined", {
        userId: socket.userId,
        channelId,
      });
    });

    socket.on("channel:leave", (channelId: string) => {
      socket.leave(`channel:${channelId}`);
      socket.to(`channel:${channelId}`).emit("channel:userLeft", {
        userId: socket.userId,
        channelId,
      });
    });

    socket.on("message:send", (data: { channelId: string; messageId: string; content: string; author: { id: string; username: string; avatarUrl: string | null }; createdAt: string }) => {
      io.to(`channel:${data.channelId}`).emit("message:new", data);
    });

    socket.on("message:delete", (data: { channelId: string; messageId: string }) => {
      io.to(`channel:${data.channelId}`).emit("message:removed", data);
    });

    socket.on("typing:start", (data: { channelId: string }) => {
      socket.to(`channel:${data.channelId}`).emit("typing:update", {
        userId: socket.userId,
        channelId: data.channelId,
        isTyping: true,
      });
    });

    socket.on("typing:stop", (data: { channelId: string }) => {
      socket.to(`channel:${data.channelId}`).emit("typing:update", {
        userId: socket.userId,
        channelId: data.channelId,
        isTyping: false,
      });
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.userId}`);
      io.emit("user:offline", { userId: socket.userId });
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
}
