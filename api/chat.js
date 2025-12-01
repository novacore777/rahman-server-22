// api/chat.js
// SUPER SIMPLE TEST FILE

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  return res.status(200).json({
    reply: "TEST BACKEND SE REPLY AA RAHA HAI 🎯 (ye naya chat.js hai)."
  });
};
