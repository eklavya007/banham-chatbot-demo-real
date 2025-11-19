export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.statusCode = 405;
      return res.json({ error: "Method not allowed" });
    }

    // Read and parse the request body
    let body = "";
    for await (const chunk of req) {
      body += chunk;
    }

    const { message } = JSON.parse(body || "{}");

    if (!message) {
      res.statusCode = 400;
      return res.json({ error: "No message provided" });
    }

    const systemPrompt = `
You are the official Banham Security Support Chatbot.

You must always provide accurate information about:
- Banham alarms
- CCTV systems
- Smart security
- Locks
- Safes
- Entry systems
- Service plans
- Maintenance & monitoring
- Installation process
- Quotes & site surveys
- Banham response team
- Keyholding
- Commercial security products
- Residential security products

Your tone:
- Professional
- Reassuring
- Clear and friendly
- Avoid jargon unless needed

If asked anything outside security, gently redirect.

Never guess technical details – only use reliable information.

If asked about prices, say:
"Banham provides tailored quotations depending on property type and system design. I can help arrange a free survey."

Always try to guide the user toward:
- booking a survey
- calling customer service
- understanding product differences
- finding the correct solution for their property.
    `;

    // Call OpenAI directly via fetch (no SDK needed)
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ]
      })
    });

    if (!openaiRes.ok) {
      const errorText = await openaiRes.text();
      console.error("OpenAI API error:", errorText);
      res.statusCode = 500;
      return res.json({ error: "OpenAI API error", details: errorText });
    }

    const data = await openaiRes.json();
    const reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response.";

    res.statusCode = 200;
    return res.json({ reply });

  } catch (err) {
    console.error("Server error:", err);
    res.statusCode = 500;
    return res.json({ error: "Server error", details: String(err) });
  }
}
