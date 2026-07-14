import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Serve API routes FIRST
  app.get("/api/config", async (req, res) => {
    try {
      const response = await fetch("https://journal.xo.je/wp-json/tradejrnl/v1/config", {
        headers: {
          "Accept": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch from remote server: ${response.status}`);
      }
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.warn("Remote config returned non-JSON response, using fallback.");
        return res.json({
          latest_version: "1.0.0",
          force_update: false,
          message: "",
          app_status: "active"
        });
      }
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Proxy fetch error, returning fallback config:", error);
      res.json({
        latest_version: "1.0.0",
        force_update: false,
        message: "",
        app_status: "active",
        error: "Failed to connect to config API",
        details: error.message
      });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
