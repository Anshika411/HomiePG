// Force reload nodemon: devotp dynamic random config
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { supabase } = require("./config/supabase");

const app = express();
const PORT = process.env.PORT || 5000;

// Enable Middlewares
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Routes Integration
app.use("/api/auth", require("./routes/auth"));
app.use("/api/buildings", require("./routes/buildings"));
app.use("/api/bookings", require("./routes/bookings"));
app.use("/api/payments", require("./routes/payments"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/tenants", require("./routes/tenants"));
app.use("/api/maintenance", require("./routes/maintenance"));
app.use("/api/visitors", require("./routes/visitors"));
app.use("/api/owner", require("./routes/owner"));
app.use("/api/expenses", require("./routes/expenses"));
app.use("/api/inventory", require("./routes/inventory"));
app.use("/api/staff", require("./routes/staff"));
app.use("/api/notices", require("./routes/notices"));
app.use("/api/tasks", require("./routes/tasks"));

// Basic Root & Health Route
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date(),
    service: "HomiePG Express Backend"
  });
});

// Tunnel URL endpoint - mobile apps call this on startup to get the current tunnel URL
const TUNNEL_URL_FILE = path.join(__dirname, "../../.tunnel-url");
app.get("/api/tunnel-url", (req, res) => {
  try {
    if (fs.existsSync(TUNNEL_URL_FILE)) {
      const url = fs.readFileSync(TUNNEL_URL_FILE, "utf8").trim();
      res.json({ url });
    } else {
      res.json({ url: null });
    }
  } catch (e) {
    res.json({ url: null });
  }
});

// Endpoint for the tunnel manager to register current URL
app.post("/api/set-tunnel", (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "url required" });
  fs.writeFileSync(TUNNEL_URL_FILE, url, "utf8");
  console.log(`[Backend] Tunnel URL updated: ${url}`);
  res.json({ ok: true });
});

// Verification Endpoint to query DB
app.get("/api/todos-test", async (req, res) => {
  try {
    const { data, error } = await supabase.from("todos").select("*");
    if (error) throw error;
    res.status(200).json(data || []);
  } catch (error) {
    res.status(500).json({
      message: "Failed to connect to Supabase database",
      error: error.message
    });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 HomiePG Express backend running on http://localhost:${PORT}`);
});

