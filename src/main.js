const express = require("express");
const { getDb } = require("./db");

const adminRoutes = require("./routes/admin");
const ordersRoutes = require("./routes/orders");
const walletRoutes = require("./routes/wallet");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.use("/admin", adminRoutes);
app.use("/orders", ordersRoutes);
app.use("/wallet", walletRoutes);

// Health check
app.get("/health", (req, res) => res.json({ status: "ok" }));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Start server after DB is ready
async function start() {
  try {
    await getDb();
    console.log("✅ Database initialized");
    app.listen(PORT, () => {
      console.log(`🚀 Wallet API running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();
