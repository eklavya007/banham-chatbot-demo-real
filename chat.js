export const config = {
  runtime: "edge",
};

export default async function handler(req) {
  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const userMessage = body.message || "";

    if (!userMessage) {
      return new Response(
        JSON.stringify({ error: "No message provided" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
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

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!openaiRes.ok) {
      const errorText = await openaiRes.text();
      console.error("OpenAI API error:", errorText);
      return new Response(
        JSON.stringify({ error: "OpenAI API error", details: errorText }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const data = await openaiRes.json();
    const reply =
      data.choices?.[0]?.message?.content ||
      "Sorry, I couldn't generate a response.";

    return new Response(
      JSON.stringify({ reply }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Server error:", err);
    return new Response(
      JSON.stringify({ error: "Server error", details: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
