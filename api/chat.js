// api/chat.js
// Simple rule-based Roman Urdu assistant (no external API)

module.exports = async (req, res) => {
  // Basic CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Sirf POST request allow hai." });
  }

  // Body parse
  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch (e) {
      body = {};
    }
  }
  const userMessage = body && body.message ? String(body.message) : "";
  const text = userMessage.trim();
  const lower = text.toLowerCase();

  if (!text) {
    return res.status(200).json({
      reply: "Kuch bolo na bhai, main sun raha hoon 🙂"
    });
  }

  // 🧠 Permanent identity – Novacore AI
  const creatorKeywords = [
    "novacore ai agaya",
    "novacore ai kon hai",
    "novacore ai kaun hai",
    "tumhe kis ne banaya",
    "kis ne banaya",
    "creator kaun hai",
    "kis ne create",
    "who made you",
    "who created you"
  ];

  if (creatorKeywords.some(k => lower.includes(k))) {
    return res.status(200).json({
      reply: "Novacore AI — mujhe Rahman Ahmed aur Ghulam Murtaza ne banaya hai."
    });
  }

  // Greetings
  if (
    lower.includes("assalam") ||
    lower.includes("asalam") ||
    lower.includes("salam") ||
    lower.includes("hello") ||
    lower.includes("hi ")
  ) {
    return res.status(200).json({
      reply: "Wa alaikum salam! Me Novacore AI hoon, roman urdu mein jo puchna ho puch lo 😊"
    });
  }

  // “how are you”
  if (
    lower.includes("kese ho") ||
    lower.includes("kaisa ho") ||
    lower.includes("how are you")
  ) {
    return res.status(200).json({
      reply: "Me theek hoon yar, tum batao kese ho? 😄"
    });
  }

  // Joke
  if (
    lower.includes("joke") ||
    lower.includes("jokes") ||
    lower.includes("mazaq") ||
    lower.includes("mazaak") ||
    lower.includes("chutkula")
  ) {
    const jokes = [
      "Ek banda bola: mobile slow ho gaya hai. Dosra bola: usko chai pila, sab tez ho jata hai garam garam 😂",
      "Teacher: homework kyun nahi kiya? Student: sir light nahi thi. Teacher: din mein? Student: sir din ko motivation nahi thi 😆",
      "Doctor: aap ko kis cheez se allergy hai? Patient: paise se. Doctor: wah, free mein check karaoge phir! 😜"
    ];
    const j = jokes[Math.floor(Math.random() * jokes.length)];
    return res.status(200).json({
      reply: "Chalo ek chota sa joke suno:\n\n" + j
    });
  }

  // Time / date (very simple)
  if (lower.includes("time") || lower.includes("waqt")) {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, "0");
    return res.status(200).json({
      reply: `Abhi approx ${hours}:${minutes} baj rahe hain tumhare device ke hisaab se.`
    });
  }

  if (lower.includes("date") || lower.includes("tareekh")) {
    const now = new Date();
    const d = now.getDate().toString().padStart(2, "0");
    const m = (now.getMonth() + 1).toString().padStart(2, "0");
    const y = now.getFullYear();
    return res.status(200).json({
      reply: `Aaj ki tareekh ${d}-${m}-${y} hai (device ke mutabiq).`
    });
  }

  // Advice / generic help
  if (
    lower.includes("sad") ||
    lower.includes("udaas") ||
    lower.includes("bura") ||
    lower.includes("tension")
  ) {
    return res.status(200).json({
      reply:
        "Agar tum udaas ho to thora sa break lo, halka music suno ya walk pe chalay jao. Agar kisi se baat karni ho to close dost ya family se zaroor share karo. Tum akelay nahi ho ❤️"
    });
  }

  // Fallback generic AI style reply
  return res.status(200).json({
    reply:
      "Me samajh gaya ke tum ne bola: \"" +
      text +
      "\".\n\nFilhal me simple rule-based assistant hoon, lekin phir bhi koshish karun ga ke tumhari roman urdu mein help karun. Thora detail se batao ke kis cheez mein help chahiye? 🙂"
  });
};
