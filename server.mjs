import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

// ─── Startup: Validate critical environment variables ───
const requiredEnvVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXTAUTH_SECRET",
];

const missingVars = requiredEnvVars.filter((v) => !process.env[v]);
if (missingVars.length > 0 && !dev) {
  console.error(
    `[FATAL] Missing required environment variables: ${missingVars.join(", ")}`
  );
  console.error("Please set them in the Render dashboard under Environment.");
  process.exit(1);
}

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    const httpServer = createServer((req, res) => {
      const parsedUrl = parse(req.url || "/", true);

      // ─── Health check endpoint (Render uses this to verify service is alive) ───
      if (parsedUrl.pathname === "/api/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            status: "ok",
            uptime: Math.floor(process.uptime()),
            timestamp: new Date().toISOString(),
            env: dev ? "development" : "production",
          })
        );
        return;
      }

      handle(req, res, parsedUrl);
    });

    // ─── Socket.IO setup with production CORS ───
    const allowedOrigins = process.env.NEXT_PUBLIC_SITE_URL
      ? [process.env.NEXT_PUBLIC_SITE_URL]
      : "*";

    const io = new SocketIOServer(httpServer, {
      cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
      },
      pingTimeout: 60000,
      pingInterval: 25000,
      transports: ["websocket", "polling"],
    });

    io.on("connection", (socket) => {
      console.log(`[Socket.IO] Client connected: ${socket.id}`);

      socket.on("attendance_marked", (data) => {
        console.log("[Socket.IO] Attendance marked:", data);
        io.emit("attendance_marked", data);
      });

      socket.on("admin_notification", (data) => {
        console.log("[Socket.IO] Admin notification:", data);
        io.emit("admin_notification", data);
      });

      socket.on("disconnect", (reason) => {
        console.log(
          `[Socket.IO] Client disconnected: ${socket.id} (${reason})`
        );
      });

      socket.on("error", (err) => {
        console.error(`[Socket.IO] Socket error (${socket.id}):`, err.message);
      });
    });

    httpServer.listen(port, hostname, () => {
      console.log(`> AttendX ready on http://${hostname}:${port}`);
      console.log(`> Environment: ${dev ? "development" : "production"}`);
      console.log(`> Health check: http://${hostname}:${port}/api/health`);
    });

    // ─── Graceful shutdown (Render sends SIGTERM before stopping) ───
    const gracefulShutdown = (signal) => {
      console.log(`\n[${signal}] Shutting down gracefully...`);

      // Stop accepting new connections
      httpServer.close(() => {
        console.log("[Server] HTTP server closed.");
      });

      // Disconnect all socket clients
      io.disconnectSockets(true);
      io.close(() => {
        console.log("[Socket.IO] All connections closed.");
      });

      // Force exit after 10 seconds if still hanging
      setTimeout(() => {
        console.error("[Server] Forced exit after timeout.");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  })
  .catch((err) => {
    console.error("[FATAL] Failed to start Next.js:", err);
    process.exit(1);
  });

// ─── Global error handlers (prevent silent crashes in production) ───
process.on("unhandledRejection", (reason, promise) => {
  console.error("[FATAL] Unhandled Promise Rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("[FATAL] Uncaught Exception:", err);
  // In production, exit so Render auto-restarts the service
  if (!dev) {
    process.exit(1);
  }
});
