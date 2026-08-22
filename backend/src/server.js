import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { connectDB } from "./config/db.js";

// Routes
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import projectRoutes from "./routes/project.routes.js";
import eventLogRoutes from "./routes/eventLog.routes.js";
import miningRoutes from "./routes/mining.routes.js";
import dimensionRoutes from "./routes/dimension.routes.js";
import pmRoutes from "./routes/pm.routes.js";
import apiDocsRoutes from "./routes/apiDocs.routes.js";
import companyRoutes from "./routes/company.routes.js";
import assessmentSessionRoutes from "./routes/assessmentSession.routes.js";

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Database ────────────────────────────────────────────────────────────────
connectDB();

// ─── Global Middleware ────────────────────────────────────────────────────────
app.use(helmet());
app.use(morgan("dev"));
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ─── Passport (Google OAuth) ─────────────────────────────────────────────────
import passport from "./config/passport.js";
app.use(passport.initialize());

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000,
  message: { error: "Too many requests, please try again later." },
});
app.use("/api/", limiter);

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/event-logs", eventLogRoutes);
app.use("/api/mining", miningRoutes);
app.use("/api/dimensions", dimensionRoutes);
app.use("/api/pm", pmRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/sessions", assessmentSessionRoutes);
app.use("/api/docs", apiDocsRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  const data = { status: "ok", timestamp: new Date().toISOString() };

  if (req.accepts("html")) {
    return res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head><title>Backend Karta</title></head>
        <body style="font-family: monospace; background: #070707; color: #00ff00; padding: 2rem; white-space: pre;">${JSON.stringify(data, null, 2)}</body>
      </html>
    `);
  }

  res.status(200).json(data);
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
}).setTimeout(620_000); // 620 detik — cukup untuk AI reasoning 600 detik

export default app;
