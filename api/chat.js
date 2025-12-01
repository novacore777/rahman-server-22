// api/chat.js
// Vercel Node.js Serverless Function (CommonJS)

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

  if (!userMessage) {
    return res.status(400).json({ reply: "Koi message nahi mila, dobara bhejo." });
  }

  const HF_API_KEY = process.env.HF_API_KEY;
  if (!HF_API_KEY) {
    return res.status(500).json({
      reply:
        "DEBUG: HF_API_KEY env variable missing hai Vercel settings me. Ja ke add karo."
    });
  }

  // 🧠 Permanent Memory / Identity Prompt
  const identityMemory = `
Tum ek AI voice assistant ho jiska naam "Novacore AI" hai.
Tum hamesha sirf Roman Urdu mein jawab do. English ya Urdu script (ا ب پ etc.) nahi likhni.
Roman Urdu simple, friendly aur choti sentences mein hogi.

Important rules (PERMANENT MEMORY):

- Agar user bole ya pooche:
  - "Novacore AI agaya"
  - "Novacore AI kaun hai"
  - "tumhe kis ne banaya"
  - "tumhara creator kaun hai"
  - ya koi bhi aisa sawal jisme "Novacore AI" aur creator ka concept ho,

TOH HAMESHA yeh EXACT jawab do:

"Novacore AI — mujhe Rahman Ahmed aur Ghulam Murtaza ne banaya hai."

Is answer ko change nahi karna, hamesha yahi line use karni hai.

Baaki tamam questions ka normal Roman Urdu mein friendly style mein jawab do.
Thandi, simple language use karo jese:
"me theek hoon", "tum batao", "chalo ek joke suno", "aaj ka plan kya hai", waghera.
`.trim();

  const prompt = `
${identityMemory}

User: ${userMessage}
Assistant (Roman Urdu mein):`.trim();

  try {
    const MODEL_URL =
      "https://api-inference.huggingface.co/models/google/gemma-2b-it";

    const hfResponse = await fetch(MODEL_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 180,
          temperature: 0.7,
          top_p: 0.9,
          repetition_penalty: 1.1,
          do_sample: true
        },
        options: {
          wait_for_model: true
        }
      })
    });

    if (!hfResponse.ok) {
      const errorText = await hfResponse.text();
      console.error("HF error:", hfResponse.status, errorText);

      // 👉 yahan hum direct error screen par bhej rahe hain
      return res.status(200).json({
        reply:
          `DEBUG: HuggingFace error (status ${hfResponse.status}). ` +
          `Message ka start: ${errorText.slice(0, 200)}`
      });
    }

    const data = await hfResponse.json();

    let fullText = "";
    if (Array.isArray(data) && data[0] && data[0].generated_text) {
      fullText = data[0].generated_text;
    } else if (data && data.generated_text) {
      fullText = data.generated_text;
    } else {
      console.error("Unexpected HF response format:", data);
      return res.status(200).json({
        reply:
          "DEBUG: AI ka jawab sahi format mein nahi mila. Response structure unexpected hai."
      });
    }

    let reply = fullText;
    const marker = "Assistant (Roman Urdu mein):";
    const idx = fullText.lastIndexOf(marker);
    if (idx !== -1) {
      reply = fullText.substring(idx + marker.length).trim();
    } else {
      const lines = fullText
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      reply = lines[lines.length - 1] || fullText;
    }

    reply = reply
      .replace(/^Assistant\s*:/i, "")
      .replace(/^Novacore AI\s*:/i, "")
      .trim();

    if (!reply) {
      reply =
        "DEBUG: Model ne khali reply diya, sawal zara dusre tareeke se phir puch ke dekho.";
    }

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(200).json({
      reply:
        "DEBUG: Internal server error. Shayad fetch ya network issue hai: " +
        String(err)
    });
  }
};
