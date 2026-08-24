import 'dotenv/config';
import express from 'express';
import path from 'path';
import jwt from 'jsonwebtoken';
import { createServer as createViteServer } from 'vite';
import { sendPasswordResetEmail, generatePasswordResetEmailHtml } from './server/mailer';
import { GoogleGenAI } from '@google/genai';

const JWT_SECRET = process.env.JWT_SECRET || 'nexora_premium_reset_secret_key_2026';

const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
}) : null;

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Health route
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Digital Asset Marketplace UI Server is running' });
  });

  app.post('/api/notifications/ntfy', async (req, res) => {
    const { title, message } = req.body || {};
    if (typeof title !== 'string' || typeof message !== 'string' || !title.trim() || !message.trim()) {
      return res.status(400).json({ error: 'Notification title and message are required' });
    }

    try {
      const response = await fetch('https://ntfy.sh/nexus-alert-for-ord-and-chat-pk-livep', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Title': title.trim(),
          'Priority': 'high',
          'Tags': 'bell,nexus',
        },
        body: message.trim(),
      });

      if (!response.ok) {
        throw new Error(`ntfy returned HTTP ${response.status}`);
      }
      return res.json({ success: true });
    } catch (error) {
      console.error('ntfy notification error:', error);
      return res.status(502).json({ error: 'Failed to send ntfy notification' });
    }
  });

  // Support AI Assistant Endpoint
  app.post('/api/support/ai-chat', async (req, res) => {
    try {
      const { message, userName, userEmail, apiKey, openRouterApiKey, customKnowledge, paymentDetails, websiteContext } = req.body;
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required' });
      }

      const clientName = (typeof userName === 'string' && userName.trim()) ? userName.trim() : null;

      const payMethod = (paymentDetails?.paymentMethodName && typeof paymentDetails.paymentMethodName === 'string') ? paymentDetails.paymentMethodName.trim() : 'SadaPay';
      const payTitle = (paymentDetails?.paymentAccountTitle && typeof paymentDetails.paymentAccountTitle === 'string') ? paymentDetails.paymentAccountTitle.trim() : 'SadaPay Digital Official';
      const payNumber = (paymentDetails?.paymentAccountNumber && typeof paymentDetails.paymentAccountNumber === 'string') ? paymentDetails.paymentAccountNumber.trim() : '03001234567';

      const userKey = (typeof apiKey === 'string' && apiKey.trim()) ? apiKey.trim() : null;
      const userOpenRouterKey = (typeof openRouterApiKey === 'string' && openRouterApiKey.trim()) ? openRouterApiKey.trim() : null;
      const envKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : null;
      const openRouterEnvKey = process.env.OPENROUTER_API_KEY ? process.env.OPENROUTER_API_KEY.trim() : null;

      const keysToTry = Array.from(new Set([userOpenRouterKey, openRouterEnvKey, userKey, envKey].filter(Boolean) as string[]));

      const baseSystemInstruction = `You are Nexus Store AI Support Assistant.
${clientName ? `The user's name is "${clientName}".` : 'The user is a Valued Customer.'}

CRITICAL PERSONALIZATION INSTRUCTIONS:
1. ALWAYS greet the user and address them by their name (${clientName || 'Valued Customer'}) at the beginning of your response.
2. IF the user sends a simple greeting like "hi", "hello", "hey", "greetings", respond with: "Hello ${clientName || 'Valued Customer'}! How can I assist you today?"
3. Answer their question politely, accurately, and concisely.

Store Knowledge & Guidelines:
1. Store Name: Nexus Store (Digital Asset Marketplace & App Studio).
2. Products: Source codes, mobile applications, website templates, custom app development, and digital assets with instant download delivery.
3. Active Payment Method: ${payMethod}. Account Title: "${payTitle}", Account Number: "${payNumber}". Customers select ${payMethod} at checkout, transfer money to the provided Account Title & Account Number, and upload their payment proof screenshot. Verification is fast and automated upon screenshot submission.
4. Custom App Requests: Users can submit custom development requirements via the Custom App Request form on the store.
5. User Orders: Tracked under User Profile > My History or My Orders.
6. Support: If the user needs direct human support or complex refund/account help, politely advise them to click 'Contact Admin' in the chat window.

Custom Admin Rules:
${customKnowledge || "Provide polite, concise, helpful assistance."}

Live Nexus Store Website Data:
${JSON.stringify(websiteContext || {
  store: 'Nexus Store digital marketplace',
  categories: ['Apps', 'Websites', 'Custom Apps', 'Source Code'],
  productCatalog: [],
  workflows: [],
}, null, 2)}

Use the live website data above as the source of truth for product names, categories, prices, features, checkout requirements, and store workflows. Never invent a product, price, payment detail, or policy when the data does not contain it. If information is missing, say so clearly and direct the customer to Contact Admin.`;

      const getFallbackReply = (msg: string) => {
        const lower = msg.toLowerCase().trim();
        const greetingPrefix = clientName ? `Hello ${clientName}! ` : "Hello Valued Customer! ";

        // Custom Knowledge rule parser
        if (customKnowledge) {
          const lines = customKnowledge.split('\n');
          for (const line of lines) {
            const cleanLine = line.trim();
            if (cleanLine.toLowerCase().includes('when user say') && cleanLine.toLowerCase().includes('then say')) {
              const parts = cleanLine.split(/then say/i);
              const trigger = parts[0].replace(/when user say/i, '').trim().toLowerCase().replace(/^["']|["']$/g, '');
              const response = parts[1]?.trim().replace(/^["']|["']$/g, '');
              if (trigger && response && lower.includes(trigger)) {
                return `${greetingPrefix}${response}`;
              }
            }
          }
        }

        // Greetings
        if (lower === 'hi' || lower === 'hello' || lower === 'hey' || lower === 'greetings' || lower === 'oa' || lower === 'hi there' || lower === 'hello there' || lower === 'hy' || lower === 'hey there') {
          return `${greetingPrefix}How can I assist you today?`;
        } 
        // Delivery / Download / Time / Receive Queries
        else if (
          lower.includes('deliv') || lower.includes('deeliv') || lower.includes('dliv') || 
          lower.includes('download') || lower.includes('time') || lower.includes('instant') || 
          lower.includes('receive') || lower.includes('when') || lower.includes('ship') || 
          lower.includes('get my') || lower.includes('how long')
        ) {
          return `${greetingPrefix}Delivery is INSTANT! 🚀 All our digital products (source codes, website templates, mobile apps) are available for immediate download right after payment verification. You can access your downloads anytime under 'My Profile > My Orders' or 'My History'.`;
        } 
        // Payment & Payment Method Queries
        else if (
          lower.includes('payment') || lower.includes(payMethod.toLowerCase()) || 
          lower.includes('pay') || lower.includes('buy') || lower.includes('sadapay') || 
          lower.includes('easypaisa') || lower.includes('jazzcash') || lower.includes('bank') || 
          lower.includes('account') || lower.includes('transfer')
        ) {
          return `${greetingPrefix}We accept ${payMethod} payments! Simply select ${payMethod} at checkout, transfer the total amount to Account Title: "${payTitle}" (Account Number: ${payNumber}), and upload your payment proof screenshot. Verification is fast and automated!`;
        } 
        // Custom App Development Queries
        else if (
          lower.includes('custom') || lower.includes('build') || lower.includes('develop') || 
          lower.includes('make app') || lower.includes('create app') || lower.includes('requirement')
        ) {
          return `${greetingPrefix}We offer custom app & web development! You can submit your requirements via the 'Custom App Request' form on our store or click 'Contact Admin' below to discuss your project directly with our engineering team.`;
        } 
        // Pricing / Cost Queries
        else if (
          lower.includes('price') || lower.includes('cost') || lower.includes('rate') || 
          lower.includes('fee') || lower.includes('charge') || lower.includes('discount') || 
          lower.includes('pkr') || lower.includes('dollar') || lower.includes('$')
        ) {
          return `${greetingPrefix}Product prices are clearly listed on each item page. For custom app development, pricing depends on project scope—submit a 'Custom App Request' for a quick estimate!`;
        } 
        // Refund & Policy Queries
        else if (
          lower.includes('refund') || lower.includes('return') || lower.includes('policy') || 
          lower.includes('cancel') || lower.includes('guarantee')
        ) {
          return `${greetingPrefix}Because we provide digital assets with instant source code downloads, sales are generally final once files are downloaded. However, if you experience any technical issues with a file, click 'Contact Admin' and our technical team will gladly assist or fix it for you!`;
        } 
        // Product Catalog Queries
        else if (
          lower.includes('app') || lower.includes('product') || lower.includes('source code') || 
          lower.includes('website') || lower.includes('template') || lower.includes('script')
        ) {
          return `${greetingPrefix}We provide high-quality mobile applications, website templates, custom apps, and full source codes with instant download delivery. Check out our store catalog or search for specific templates!`;
        } 
        // Order Tracking & History Queries
        else if (
          lower.includes('order') || lower.includes('history') || lower.includes('bought') || 
          lower.includes('purchased') || lower.includes('my order') || lower.includes('status')
        ) {
          return `${greetingPrefix}You can view your order history and download links anytime under User Profile > 'My Orders' or 'My History'.`;
        } 
        // Admin / Human Contact Queries
        else if (
          lower.includes('admin') || lower.includes('contact') || lower.includes('human') || 
          lower.includes('help') || lower.includes('support') || lower.includes('owner')
        ) {
          return `${greetingPrefix}Click the 'Contact Admin' tab above to send a direct message to our support team!`;
        }

        return `${greetingPrefix}I am Nexus Store AI Assistant. You can ask me about our digital products, instant download delivery times, ${payMethod} payments, or custom app development. If you need direct human assistance, click 'Contact Admin'!`;
      };

      const callOpenRouter = async (key: string) => {
        const openRouterModels = [
          'openrouter/auto',
          'google/gemini-2.0-flash-exp:free',
          'google/gemini-2.5-flash:free',
          'meta-llama/llama-3.3-70b-instruct:free',
          'deepseek/deepseek-r1:free',
          'mistralai/mistral-7b-instruct:free'
        ];

        for (const model of openRouterModels) {
          try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${key}`,
                'HTTP-Referer': 'https://nexusstore.app',
                'X-Title': 'Nexus Store AI Assistant',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                model: model,
                messages: [
                  { role: 'system', content: baseSystemInstruction },
                  { role: 'user', content: message }
                ],
                temperature: 0.7,
                max_tokens: 500
              })
            });

            if (response.ok) {
              const data = await response.json();
              const reply = data.choices?.[0]?.message?.content;
              if (reply && typeof reply === 'string') {
                return reply.trim();
              }
            } else {
              const errTxt = await response.text();
              console.warn(`OpenRouter model ${model} HTTP ${response.status}:`, errTxt);
            }
          } catch (err: any) {
            console.warn(`OpenRouter model ${model} failed:`, err?.message || err);
          }
        }
        return null;
      };

      for (const keyCandidate of keysToTry) {
        if (!keyCandidate) continue;

        // If candidate is an OpenRouter key
        if (keyCandidate.startsWith('sk-or-v1-') || keyCandidate.startsWith('sk-or-')) {
          const openRouterReply = await callOpenRouter(keyCandidate);
          if (openRouterReply) {
            return res.json({ reply: openRouterReply });
          }
          continue;
        }

        try {
          const dynamicAi = new GoogleGenAI({
            apiKey: keyCandidate,
            apiVersion: 'v1beta'
          });

          const modelsToTry = ['gemini-3.6-flash'];
          for (const modelName of modelsToTry) {
            try {
              const response = await dynamicAi.models.generateContent({
                model: modelName,
                contents: message,
                config: {
                  systemInstruction: baseSystemInstruction,
                }
              });

              if (response && response.text) {
                return res.json({ reply: response.text });
              }
            } catch (err: any) {
              const statusMsg = err?.message || String(err);
              if (statusMsg.includes('429') || statusMsg.includes('quota') || statusMsg.includes('RESOURCE_EXHAUSTED')) {
                console.warn(`Gemini API rate limit/quota reached for model ${modelName}. Falling back to OpenRouter or instant response system.`);
              } else if (statusMsg.includes('API_KEY_INVALID') || statusMsg.includes('API key not valid') || statusMsg.includes('INVALID_ARGUMENT')) {
                console.warn(`Gemini API key is invalid. Falling back to OpenRouter or instant response system.`);
              } else {
                console.warn(`Gemini API call error:`, statusMsg);
              }
            }
          }
        } catch (keyErr: any) {
          console.warn(`API Key initialization failed:`, keyErr?.message || keyErr);
        }
      }

      // If Gemini fails or hits quota, call OpenRouter as fallback
      if (openRouterEnvKey) {
        const openRouterReply = await callOpenRouter(openRouterEnvKey);
        if (openRouterReply) {
          return res.json({ reply: openRouterReply });
        }
      }

      // If all keys fail, return intelligent fallback
      return res.json({ reply: getFallbackReply(message) });
    } catch (err) {
      console.error('AI Support Chat Error:', err);
      return res.json({ reply: "I am here to assist you! Feel free to ask any question or click 'Contact Admin' for direct human support." });
    }
  });

  // 1. Password Reset Request Endpoint
  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      if (!email || typeof email !== 'string' || !email.includes('@')) {
        return res.status(400).json({ success: false, error: 'Please provide a valid email address.' });
      }

      const normalizedEmail = email.trim().toLowerCase();

      // Sign a 1-hour secure reset token
      const token = jwt.sign(
        { email: normalizedEmail, purpose: 'password_reset' },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Determine client base URL
      const host = req.get('host') || 'localhost:3000';
      const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
      const origin = process.env.APP_URL || `${protocol}://${host}`;
      const resetUrl = `${origin}/reset-password?token=${token}&email=${encodeURIComponent(normalizedEmail)}`;

      const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';

      // Send the luxury HTML email
      const result = await sendPasswordResetEmail({
        to: normalizedEmail,
        resetUrl,
        userIp: clientIp.split(',')[0],
      });

      return res.json({
        success: true,
        message: 'A luxury password reset link has been dispatched to your email.',
        resetUrl,
        previewUrl: result.previewUrl,
      });
    } catch (err: any) {
      console.error('Error handling forgot-password:', err);
      return res.status(500).json({ success: false, error: 'Internal server error while processing request.' });
    }
  });

  // 2. Verify Reset Token Endpoint
  app.post('/api/auth/verify-reset-token', (req, res) => {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({ valid: false, error: 'Reset token is required.' });
      }

      const decoded = jwt.verify(token, JWT_SECRET) as { email: string; purpose: string };
      if (decoded.purpose !== 'password_reset') {
        return res.status(400).json({ valid: false, error: 'Invalid token purpose.' });
      }

      return res.json({ valid: true, email: decoded.email });
    } catch (err: any) {
      return res.status(400).json({ valid: false, error: 'Reset token has expired or is invalid.' });
    }
  });

  // 3. Email Template Visual Preview (GET endpoint for live preview in browser)
  app.get('/api/auth/email-preview', (req, res) => {
    const email = (req.query.email as string) || 'developer@example.com';
    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    const dummyToken = 'demo-preview-token-123456';
    const resetUrl = `${protocol}://${host}/reset-password?token=${dummyToken}&email=${encodeURIComponent(email)}`;

    const html = generatePasswordResetEmailHtml({
      to: email,
      resetUrl,
      userIp: '127.0.0.1',
    });

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    app.get('*', async (req, res, next) => {
      if (req.originalUrl.startsWith('/api')) {
        return next();
      }
      try {
        const url = req.originalUrl;
        const fs = await import('fs');
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).send(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(console.error);
