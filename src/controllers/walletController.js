const { query } = require("../db");

// GET /wallet/balance
async function getBalance(req, res) {
  try {
    const clientId = req.clientId;

    const rows = query("SELECT balance FROM wallets WHERE client_id = ?", [clientId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Wallet not found for this client" });
    }

    return res.status(200).json({
      client_id: clientId,
      balance: rows[0].balance,
    });
  } catch (err) {
    console.error("getBalance error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { getBalance };
