// api/chat.js
// Vercel Node.js Serverless Function

module.exports = async (req, res) => {
  // CORS (optional, mostly helpful in dev)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ reply: 'Only POST allowed.' });
  }

  // Body parse
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      body = {};
    }
  }
  const userMessage = (body && body.message) ? String(body.message) : '';

  if (!userMessage) {
    return res.status(400).json({ reply: 'Koi message nahi mila.' });
  }

  const HF_API_KEY = process.env.HF_API_KEY;

  if (!HF_API_KEY) {
    return res.status(500).json({
      reply: 'Server config theek nahi hai (HF_API_KEY missing). ' +
             'Developer ko bolo Vercel env me HF_API_KEY set kare.'
    });
  }

  // 🧠 Permanent Memory / Identity
  const identityMemory = `
Tum ek AI voice assistant ho jiska naam "Novacore AI" hai.
Tum hamesha sirf Roman Urdu mein jawab do. English ya Urdu script (ا ب پ etc.) nahi.
Roman Urdu simple, friendly aur choti sentences mein hogi.

Bohat important rule (PERMANENT MEMORY):

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
Jab example dene ho, simple roman urdu use karo jese:
"theek hoon", "tum batao", "aaj ka plan kya hai", waghera.
  `.trim();

  // Prompt build
  const prompt = `
${identityMemory}

User: ${userMessage}
Assistant (Roman Urdu main):`.trim();

  try {
    const response = await fetch('https://api-inference.huggingface.co/models/microsoft/phi-2', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 160,
          temperature: 0.7,
          top_p: 0.9,
          do_sample: true,
          return_full_text: true
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('HF error:', errorText);
      return res.status(500).json({
        reply: 'AI se jawab late waqt error aa gaya. Thori dair baad try kar lena.'
      });
    }

    const data = await response.json();

    let fullText = '';
    if (Array.isArray(data) && data[0] && data[0].generated_text) {
      fullText = data[0].generated_text;
    } else {
      console.error('Unexpected HF response format', data);
      return res.status(500).json({
        reply: 'AI ka jawab sahi format mein nahi mila. Baad mein try karna.'
      });
    }

    // Sirf Assistant ka hissah nikalne ki koshish
    let reply = fullText;
    const marker = 'Assistant (Roman Urdu main):';
    const idx = fullText.lastIndexOf(marker);
    if (idx !== -1) {
      reply = fullText.substring(idx + marker.length).trim();
    } else {
      // fallback: pura text se last line
      const lines = fullText.split('\n').map(l => l.trim()).filter(Boolean);
      reply = lines[lines.length - 1] || fullText;
    }

    // Kuch cleaning
    reply = reply
      .replace(/^Assistant\s*:/i, '')
      .replace(/^Novacore AI\s*:/i, '')
      .trim();

    if (!reply) {
      reply = 'Mujhe sahi jawab generate nahi ho saka, dobara sawal repeat kar do please.';
    }

    return res.status(200).json({ reply });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({
      reply: 'Internal server error aa gaya. Thori dair baad dobara try karna.'
    });
  }
};
