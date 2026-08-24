type Event = { httpMethod?: string; body?: string | null };

const fallbackReply = (message: string, context: any, userName: string) => {
  const text = message.toLowerCase();
  const name = userName || "Valued Customer";
  const products = Array.isArray(context?.productCatalog) ? context.productCatalog : [];
  if (text.includes("price") || text.includes("cost") || text.includes("discount")) {
    const listed = products.slice(0, 8).map((product: any) => `${product.title}: ${product.price ?? "price unavailable"}`).join(", ");
    return `Hello ${name}! Current product prices are: ${listed || "available on each product page"}.`;
  }
  if (text.includes("payment") || text.includes("pay") || text.includes("sadapay") || text.includes("account")) {
    return `Hello ${name}! We accept ${context?.paymentDetails?.paymentMethodName || "our available payment method"}. ${context?.paymentDetails?.paymentAccountTitle ? `Account title: ${context.paymentDetails.paymentAccountTitle}. Account number: ${context.paymentDetails.paymentAccountNumber}.` : "Please check the checkout payment details."} Upload your payment proof after transfer.`;
  }
  if (text.includes("product") || text.includes("app") || text.includes("website")) {
    const names = products.slice(0, 8).map((product: any) => product.title).join(", ");
    return `Hello ${name}! Nexus Store offers Apps, Websites, Custom Apps, and Source Code. Available products include: ${names || "our latest digital products"}.`;
  }
  if (text.includes("order") || text.includes("delivery") || text.includes("download")) {
    return `Hello ${name}! After payment verification, digital products are available in your Profile order history for download.`;
  }
  return `Hello ${name}! I can help with Nexus Store products, prices, payments, orders, downloads, and custom apps. What would you like to know?`;
};

export default async (event: Event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };
  try {
    const body = JSON.parse(event.body || "{}");
    if (!body.message || typeof body.message !== "string") return { statusCode: 400, body: JSON.stringify({ error: "Message is required" }) };
    const context = { ...(body.websiteContext || {}), paymentDetails: body.paymentDetails };
    const name = typeof body.userName === "string" ? body.userName : "Valued Customer";
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (apiKey && process.env.OPENROUTER_API_KEY) {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "X-Title": "Nexus Store AI" },
        body: JSON.stringify({ model: "openrouter/auto", messages: [{ role: "system", content: `You are Nexus Store support. Use only this live website data and never invent details:\n${JSON.stringify(context)}` }, { role: "user", content: body.message }], max_tokens: 500 }),
      });
      if (response.ok) {
        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content;
        if (reply) return { statusCode: 200, body: JSON.stringify({ reply }) };
      }
    }

    return { statusCode: 200, body: JSON.stringify({ reply: fallbackReply(body.message, context, name) }) };
  } catch (error) {
    console.error("Netlify AI function error:", error);
    return { statusCode: 200, body: JSON.stringify({ reply: "I can help with Nexus Store products, payments, orders, and downloads. Please ask your question again." }) };
  }
};
