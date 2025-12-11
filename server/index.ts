import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import { GoogleGenAI } from '@google/genai';
import { supabase } from './supabase.js';
import { serveVaultFiles, createPlaceholderFiles } from './storage.js';
import { sendPDFStackEmail, sendWelcomeEmail, sendConsultConfirmationEmail } from './mailjet.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
});

// Initialize Gemini AI
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Set up file storage
serveVaultFiles(app);
createPlaceholderFiles();

// System prompts for Gemini AI
const QUIZ_SYSTEM_PROMPT = `
You are the "Debt Eraser", a ruthless, no-nonsense financial strategist.
Your goal is to analyze the user's financial situation based on 8 deep-dive questions.

You must assign a "Financial Archetype" (e.g., The Survivor, The Brawler, The Strategist) and a "Battle Plan".

CRITICAL: You must assign one of the following SPECIFIC "PDF Stacks" based on their answers:
1. "Mortgage Remedy Stack" (If mortgage/foreclosure mentioned)
2. "Repo Reversal Stack" (If car repossession/auto loans mentioned)
3. "Revolving Credit Stax" (If high credit card usage/utilization mentioned)
4. "Collections & Repo Stax" (If 3rd party collections mentioned)
5. "Administrative Remedy Stax" (If court/tickets/governmental issues mentioned)
6. "Credit Profile Sweep Stax" (General cleanup/inquiries/late payments)

Return purely JSON: { "archetype": "string", "plan": "string", "pdfStack": "string" }
`;

const CHAT_SYSTEM_PROMPT = `
You are the "War Room AI", a specialized expert system for the Debt Eraser Pro community.
You are trained on:
- FCRA (Fair Credit Reporting Act)
- FDCPA (Fair Debt Collection Practices Act)
- Metro 2 Compliance
- E-OSCAR system loopholes
- Factual Disputing strategies
- 1099-C Cancellation of Debt
- Contract Law regarding note issuance

Your Role:
- You help members create custom dispute letters.
- You explain complex legal codes in simple, aggressive terms.
- You are strictly on the side of the consumer.
- You DO NOT give legal advice, you give "educational strategies" based on federal law.

Tone:
- High-level consultant ($1000/hr value).
- Direct, no fluff.
- "We don't pay what we don't owe."

If asked about documents, refer to "The Vault".
If asked about process, refer to "The Classroom modules".
`;

// Store active chat sessions (in production, use Redis or similar)
const chatSessions = new Map();

// ============================================
// HEALTH & UTILITY ENDPOINTS
// ============================================

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Debt Eraser Pro Server Running' });
});

// ============================================
// GEMINI AI ENDPOINTS
// ============================================

// Analyze quiz results
app.post('/api/analyze-quiz', async (req, res) => {
  try {
    const { answers } = req.body;

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Invalid answers format' });
    }

    const prompt = `
      User Profile:
      ${answers.map(a => `- ${a.question}: ${a.answer}`).join('\n')}

      Analyze and provide JSON output.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: QUIZ_SYSTEM_PROMPT,
        temperature: 0.7,
        maxOutputTokens: 500,
        responseMimeType: 'application/json'
      }
    });

    const result = response.text;
    let parsedResult;

    try {
      parsedResult = JSON.parse(result);
    } catch {
      parsedResult = {
        archetype: 'The Fighter',
        plan: 'Strategic debt elimination',
        pdfStack: 'Credit Profile Sweep Stax'
      };
    }

    res.json(parsedResult);
  } catch (error) {
    console.error('Quiz analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze quiz results' });
  }
});

// Chat with AI
app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const session = sessionId || `session-${Date.now()}`;
    let chatHistory = chatSessions.get(session) || [];

    chatHistory.push({ role: 'user', content: message });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: message,
      config: {
        systemInstruction: CHAT_SYSTEM_PROMPT,
        temperature: 0.8,
        maxOutputTokens: 800
      }
    });

    const aiMessage = response.text;
    chatHistory.push({ role: 'assistant', content: aiMessage });

    chatSessions.set(session, chatHistory);

    res.json({ reply: aiMessage, sessionId: session });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

// ============================================
// STRIPE PAYMENT ENDPOINTS
// ============================================

// Create payment intent
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { plan, email } = req.body;

    const amounts = {
      community: 9700, // $97.00
      consult: 29700   // $297.00
    };

    const amount = amounts[plan as keyof typeof amounts];
    if (!amount) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      metadata: { plan, email },
      receipt_email: email
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Payment intent error:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Verify payment
app.post('/api/verify-payment', async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    res.json({
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      metadata: paymentIntent.metadata
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// ============================================
// COMMUNITY ENDPOINTS
// ============================================

// Get all community posts
app.get('/api/community/posts', async (req, res) => {
  try {
    const { data: posts, error } = await supabase
      .from('community_posts')
      .select(`
        id,
        title,
        content,
        category,
        created_at,
        users (
          name,
          avatar
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get likes and comments count for each post
    const postsWithCounts = await Promise.all(posts.map(async (post: any) => {
      const { count: likes } = await supabase
        .from('post_likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', post.id);

      const { count: comments } = await supabase
        .from('post_comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', post.id);

      return {
        id: post.id,
        title: post.title,
        content: post.content,
        category: post.category,
        created_at: post.created_at,
        author: post.users?.name || 'Anonymous',
        avatar: post.users?.avatar || '',
        likes: likes || 0,
        comments: comments || 0,
        timeAgo: getTimeAgo(new Date(post.created_at))
      };
    }));

    res.json(postsWithCounts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Create a new post
app.post('/api/community/posts', async (req, res) => {
  try {
    const { userId, title, content, category } = req.body;

    const { data, error } = await supabase
      .from('community_posts')
      .insert([
        { user_id: userId, title, content, category }
      ])
      .select()
      .single();

    if (error) throw error;

    res.json({ id: data.id, success: true });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Like a post
app.post('/api/community/posts/:postId/like', async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.body;

    // Insert like (Supabase will handle UNIQUE constraint)
    await supabase
      .from('post_likes')
      .insert([{ user_id: userId, post_id: postId }]);

    // Get updated like count
    const { count } = await supabase
      .from('post_likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    res.json({ likes: count || 0, success: true });
  } catch (error) {
    console.error('Error liking post:', error);
    res.status(500).json({ error: 'Failed to like post' });
  }
});

// Get comments for a post
app.get('/api/community/posts/:postId/comments', async (req, res) => {
  try {
    const { postId } = req.params;

    const { data: comments, error } = await supabase
      .from('post_comments')
      .select(`
        id,
        content,
        created_at,
        users (
          name,
          avatar
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const formattedComments = comments.map((comment: any) => ({
      id: comment.id,
      content: comment.content,
      created_at: comment.created_at,
      author: comment.users?.name || 'Anonymous',
      avatar: comment.users?.avatar || ''
    }));

    res.json(formattedComments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// ============================================
// MODULES ENDPOINTS
// ============================================

app.get('/api/modules', async (req, res) => {
  try {
    const { data: modules, error } = await supabase
      .from('modules')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) throw error;

    res.json(modules || []);
  } catch (error) {
    console.error('Error fetching modules:', error);
    res.status(500).json({ error: 'Failed to fetch modules' });
  }
});

// ============================================
// VAULT ENDPOINTS
// ============================================

app.get('/api/vault/resources', async (req, res) => {
  try {
    const { category } = req.query;

    let query = supabase
      .from('vault_resources')
      .select('*')
      .order('created_at', { ascending: false });

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    const { data: resources, error } = await query;

    if (error) throw error;

    res.json(resources || []);
  } catch (error) {
    console.error('Error fetching vault resources:', error);
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
});

app.get('/api/vault/resources/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: resource, error } = await supabase
      .from('vault_resources')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    res.json(resource);
  } catch (error) {
    console.error('Error fetching resource:', error);
    res.status(500).json({ error: 'Failed to fetch resource' });
  }
});

// ============================================
// CALENDAR ENDPOINTS
// ============================================

app.get('/api/calendar/events', async (req, res) => {
  try {
    const { data: events, error } = await supabase
      .from('calendar_events')
      .select('*')
      .order('date', { ascending: true });

    if (error) throw error;

    res.json(events || []);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

app.post('/api/calendar/events', async (req, res) => {
  try {
    const { title, date, type, description } = req.body;

    const { data, error } = await supabase
      .from('calendar_events')
      .insert([{ title, date, type, description }])
      .select()
      .single();

    if (error) throw error;

    res.json({ id: data.id, success: true });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// ============================================
// MESSENGER ENDPOINTS
// ============================================

app.get('/api/messenger/conversations', async (req, res) => {
  try {
    const { userId } = req.query;

    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('last_message_time', { ascending: false });

    if (error) throw error;

    res.json(conversations || []);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

app.get('/api/messenger/conversations/:conversationId/messages', async (req, res) => {
  try {
    const { conversationId } = req.params;

    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('timestamp', { ascending: true });

    if (error) throw error;

    res.json(messages || []);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.post('/api/messenger/messages', async (req, res) => {
  try {
    const { conversationId, senderId, content } = req.body;

    // Insert message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert([{ conversation_id: conversationId, sender_id: senderId, content }])
      .select()
      .single();

    if (messageError) throw messageError;

    // Update conversation last message
    const { error: updateError } = await supabase
      .from('conversations')
      .update({
        last_message: content,
        last_message_time: new Date().toISOString()
      })
      .eq('id', conversationId);

    if (updateError) throw updateError;

    res.json({ id: message.id, success: true });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// ============================================
// USER ENDPOINTS
// ============================================

app.get('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, avatar, membership_type, created_at, has_community_access, has_consult_access')
      .eq('id', userId)
      .single();

    if (error) throw error;

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

app.post('/api/users/register', async (req, res) => {
  try {
    const { email, name, password } = req.body;

    // In production, hash the password properly with bcrypt
    const passwordHash = password; // TODO: Use bcrypt

    const { data, error } = await supabase
      .from('users')
      .insert([{ email, name, password_hash: passwordHash }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return res.status(400).json({ error: 'Email already exists' });
      }
      throw error;
    }

    res.json({ userId: data.id, success: true });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// ============================================
// UTILITY FUNCTIONS
// ============================================

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
    }
  }

  return 'just now';
}

// ============================================
// HUBSPOT CRM ENDPOINTS
// ============================================

// Create or update contact in HubSpot
app.post('/api/hubspot/create-contact', async (req, res) => {
  try {
    const { email, firstName, lastName, phone, leadSource, quizResults, purchaseAmount, purchaseType } = req.body;

    const hubspotApiKey = process.env.HUBSPOT_API_KEY;
    if (!hubspotApiKey) {
      return res.status(500).json({ error: 'HubSpot API key not configured' });
    }

    // Prepare contact properties
    const properties: any = {
      email,
      lead_source: leadSource,
    };

    if (firstName) properties.firstname = firstName;
    if (lastName) properties.lastname = lastName;
    if (phone) properties.phone = phone;
    if (quizResults) properties.quiz_results = JSON.stringify(quizResults);
    if (purchaseAmount) properties.purchase_amount = purchaseAmount.toString();
    if (purchaseType) properties.purchase_type = purchaseType;

    // Create/update contact in HubSpot
    const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hubspotApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ properties })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('HubSpot API error:', errorData);
      return res.status(response.status).json({ error: 'Failed to create HubSpot contact', details: errorData });
    }

    const contactData = await response.json();
    res.json({ success: true, contactId: contactData.id });
  } catch (error) {
    console.error('HubSpot create contact error:', error);
    res.status(500).json({ error: 'Failed to create HubSpot contact' });
  }
});

// Update existing HubSpot contact
app.post('/api/hubspot/update-contact', async (req, res) => {
  try {
    const { email, ...updates } = req.body;

    const hubspotApiKey = process.env.HUBSPOT_API_KEY;
    if (!hubspotApiKey) {
      return res.status(500).json({ error: 'HubSpot API key not configured' });
    }

    // Search for contact by email
    const searchResponse = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hubspotApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filterGroups: [{
          filters: [{ propertyName: 'email', operator: 'EQ', value: email }]
        }]
      })
    });

    if (!searchResponse.ok) {
      return res.status(searchResponse.status).json({ error: 'Failed to find contact' });
    }

    const searchData = await searchResponse.json();
    if (!searchData.results || searchData.results.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    const contactId = searchData.results[0].id;

    // Update contact
    const updateResponse = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${hubspotApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ properties: updates })
    });

    if (!updateResponse.ok) {
      return res.status(updateResponse.status).json({ error: 'Failed to update contact' });
    }

    const updateData = await updateResponse.json();
    res.json({ success: true, contactId: updateData.id });
  } catch (error) {
    console.error('HubSpot update contact error:', error);
    res.status(500).json({ error: 'Failed to update HubSpot contact' });
  }
});

// Create deal in HubSpot
app.post('/api/hubspot/create-deal', async (req, res) => {
  try {
    const { email, dealName, amount, dealStage, dealType } = req.body;

    const hubspotApiKey = process.env.HUBSPOT_API_KEY;
    if (!hubspotApiKey) {
      return res.status(500).json({ error: 'HubSpot API key not configured' });
    }

    // Find contact by email
    const searchResponse = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hubspotApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filterGroups: [{
          filters: [{ propertyName: 'email', operator: 'EQ', value: email }]
        }]
      })
    });

    if (!searchResponse.ok) {
      return res.status(searchResponse.status).json({ error: 'Failed to find contact' });
    }

    const searchData = await searchResponse.json();
    if (!searchData.results || searchData.results.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    const contactId = searchData.results[0].id;

    // Create deal
    const dealResponse = await fetch('https://api.hubapi.com/crm/v3/objects/deals', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hubspotApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          dealname: dealName,
          amount: amount.toString(),
          dealstage: dealStage,
          deal_type: dealType,
          pipeline: 'default'
        },
        associations: [{
          to: { id: contactId },
          types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 3 }]
        }]
      })
    });

    if (!dealResponse.ok) {
      const errorData = await dealResponse.json();
      return res.status(dealResponse.status).json({ error: 'Failed to create deal', details: errorData });
    }

    const dealData = await dealResponse.json();
    res.json({ success: true, dealId: dealData.id });
  } catch (error) {
    console.error('HubSpot create deal error:', error);
    res.status(500).json({ error: 'Failed to create HubSpot deal' });
  }
});

// ============================================
// EMAIL DELIVERY ENDPOINTS (Mailjet)
// ============================================

// Send PDF stack email after quiz completion
app.post('/api/email/send-pdf-stack', async (req, res) => {
  try {
    const { email, name, archetype, pdfStack, battlePlan } = req.body;

    const success = await sendPDFStackEmail(email, name || 'there', archetype, pdfStack, battlePlan);

    if (!success) {
      return res.status(500).json({ error: 'Failed to send PDF stack email' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Email send error:', error);
    res.status(500).json({ error: 'Failed to send PDF stack email' });
  }
});

// Send welcome email for new community members
app.post('/api/email/send-welcome', async (req, res) => {
  try {
    const { email, name } = req.body;

    const success = await sendWelcomeEmail(email, name);

    if (!success) {
      return res.status(500).json({ error: 'Failed to send welcome email' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Welcome email error:', error);
    res.status(500).json({ error: 'Failed to send welcome email' });
  }
});

// Send consultation confirmation email
app.post('/api/email/send-consult-confirmation', async (req, res) => {
  try {
    const { email, name } = req.body;

    const success = await sendConsultConfirmationEmail(email, name);

    if (!success) {
      return res.status(500).json({ error: 'Failed to send consultation confirmation' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Consultation email error:', error);
    res.status(500).json({ error: 'Failed to send consultation confirmation' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Debt Eraser Pro Server running on port ${PORT}`);
  console.log(`📝 API endpoints available at http://localhost:${PORT}/api`);
  console.log(`💳 Stripe integration: ${process.env.STRIPE_SECRET_KEY ? 'ENABLED' : 'DISABLED'}`);
  console.log(`🤖 Gemini AI: ${process.env.GEMINI_API_KEY ? 'ENABLED' : 'DISABLED'}`);
  console.log(`📊 HubSpot CRM: ${process.env.HUBSPOT_API_KEY ? 'ENABLED' : 'DISABLED'}`);
  console.log(`📧 Mailjet Email: ${process.env.MAILJET_API_KEY && process.env.MAILJET_SECRET_KEY ? 'ENABLED' : 'DISABLED'}`);
  console.log(`💾 Supabase Database: ${process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY ? 'ENABLED' : 'DISABLED'}`);
});
