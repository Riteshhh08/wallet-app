function validateClientId(req, res, next) {
  const clientId = req.headers["client-id"];
  if (!clientId || typeof clientId !== "string" || clientId.trim() === "") {
    return res.status(400).json({ error: "Missing required header: client-id" });
  }
  req.clientId = clientId.trim();
  next();
}

module.exports = validateClientId;
