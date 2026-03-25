const { v4: uuidv4 } = require("uuid");
const { query, exec, run, transaction } = require("../db");

async function createOrder(req, res) {
  try {
    const clientId = req.clientId;
    const { amount } = req.body;

    const parsedAmount = Number(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0)
      return res.status(400).json({ error: "amount must be a positive number" });

    const walletRows = query("SELECT balance FROM wallets WHERE client_id = ?", [clientId]);
    if (walletRows.length === 0)
      return res.status(404).json({ error: "Wallet not found. Ask admin to credit your wallet first." });

    const currentBalance = walletRows[0].balance;
    if (currentBalance < parsedAmount)
      return res.status(400).json({
        error: "Insufficient wallet balance",
        current_balance: currentBalance,
        required: parsedAmount,
      });

    const orderId = uuidv4();

    // Atomically deduct wallet + create order
    transaction(() => {
      exec("UPDATE wallets SET balance = balance - ? WHERE client_id = ?", [parsedAmount, clientId]);
      exec("INSERT INTO orders (id, client_id, amount, status) VALUES (?, ?, ?, 'pending')",
        [orderId, clientId, parsedAmount]);
    });

    // Call fulfillment API
    let fulfillmentId;
    try {
      const resp = await fetch("https://jsonplaceholder.typicode.com/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: clientId, title: orderId }),
      });
      if (!resp.ok) throw new Error(`Status ${resp.status}`);
      const data = await resp.json();
      fulfillmentId = String(data.id);
    } catch (fulfillErr) {
      console.error("Fulfillment failed:", fulfillErr.message);
      // Rollback: refund + mark failed
      transaction(() => {
        exec("UPDATE wallets SET balance = balance + ? WHERE client_id = ?", [parsedAmount, clientId]);
        exec("UPDATE orders SET status = 'fulfillment_failed' WHERE id = ?", [orderId]);
      });
      return res.status(502).json({
        error: "Fulfillment service unavailable. Order cancelled and amount refunded.",
        order_id: orderId,
      });
    }

    // Store fulfillment ID
    run("UPDATE orders SET fulfillment_id = ?, status = 'created' WHERE id = ?",
      [fulfillmentId, orderId]);

    const order = query("SELECT * FROM orders WHERE id = ?", [orderId])[0];
    const wallet = query("SELECT balance FROM wallets WHERE client_id = ?", [clientId])[0];

    return res.status(201).json({
      message: "Order created successfully",
      order: {
        id: order.id,
        client_id: order.client_id,
        amount: order.amount,
        status: order.status,
        fulfillment_id: order.fulfillment_id,
        created_at: order.created_at,
      },
      remaining_balance: wallet.balance,
    });
  } catch (err) {
    console.error("createOrder error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function getOrder(req, res) {
  try {
    const clientId = req.clientId;
    const { order_id } = req.params;

    const rows = query("SELECT * FROM orders WHERE id = ? AND client_id = ?",
      [order_id.trim(), clientId]);

    if (rows.length === 0)
      return res.status(404).json({ error: "Order not found or does not belong to this client" });

    const o = rows[0];
    return res.status(200).json({
      id: o.id,
      client_id: o.client_id,
      amount: o.amount,
      status: o.status,
      fulfillment_id: o.fulfillment_id,
      created_at: o.created_at,
    });
  } catch (err) {
    console.error("getOrder error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { createOrder, getOrder };
