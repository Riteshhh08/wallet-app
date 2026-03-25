const { v4: uuidv4 } = require("uuid");
const { query, exec, transaction } = require("../db");

async function creditWallet(req, res) {
  try {
    const { client_id, amount } = req.body;

    if (!client_id || String(client_id).trim() === "")
      return res.status(400).json({ error: "client_id is required" });
    const parsedAmount = Number(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0)
      return res.status(400).json({ error: "amount must be a positive number" });

    const cid = String(client_id).trim();
    const ledgerId = uuidv4();

    transaction(() => {
      const existing = query("SELECT balance FROM wallets WHERE client_id = ?", [cid]);
      if (existing.length === 0) {
        exec("INSERT INTO wallets (client_id, balance) VALUES (?, ?)", [cid, parsedAmount]);
      } else {
        exec("UPDATE wallets SET balance = balance + ? WHERE client_id = ?", [parsedAmount, cid]);
      }
      exec("INSERT INTO ledger (id, client_id, type, amount) VALUES (?, ?, 'credit', ?)",
        [ledgerId, cid, parsedAmount]);
    });

    const wallet = query("SELECT balance FROM wallets WHERE client_id = ?", [cid])[0];
    return res.status(200).json({
      message: "Wallet credited successfully",
      client_id: cid,
      credited: parsedAmount,
      new_balance: wallet.balance,
      ledger_id: ledgerId,
    });
  } catch (err) {
    console.error("creditWallet error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function debitWallet(req, res) {
  try {
    const { client_id, amount } = req.body;

    if (!client_id || String(client_id).trim() === "")
      return res.status(400).json({ error: "client_id is required" });
    const parsedAmount = Number(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0)
      return res.status(400).json({ error: "amount must be a positive number" });

    const cid = String(client_id).trim();
    const walletRows = query("SELECT balance FROM wallets WHERE client_id = ?", [cid]);
    if (walletRows.length === 0)
      return res.status(404).json({ error: "Wallet not found for this client" });

    const currentBalance = walletRows[0].balance;
    if (currentBalance < parsedAmount)
      return res.status(400).json({
        error: "Insufficient balance",
        current_balance: currentBalance,
        requested_debit: parsedAmount,
      });

    const ledgerId = uuidv4();

    transaction(() => {
      exec("UPDATE wallets SET balance = balance - ? WHERE client_id = ?", [parsedAmount, cid]);
      exec("INSERT INTO ledger (id, client_id, type, amount) VALUES (?, ?, 'debit', ?)",
        [ledgerId, cid, parsedAmount]);
    });

    const wallet = query("SELECT balance FROM wallets WHERE client_id = ?", [cid])[0];
    return res.status(200).json({
      message: "Wallet debited successfully",
      client_id: cid,
      debited: parsedAmount,
      new_balance: wallet.balance,
      ledger_id: ledgerId,
    });
  } catch (err) {
    console.error("debitWallet error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { creditWallet, debitWallet };
