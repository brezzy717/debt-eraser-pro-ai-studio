# 🚀 DEBT ERASER PRO - COMPLETE SETUP GUIDE

**Last Updated**: December 9, 2025
**Status**: ✅ Backend Migration Complete - Ready for Database Setup

---

## 📊 WHAT'S BEEN COMPLETED

### ✅ Phase 1: Email Service Migration
- **SendGrid → Mailjet** migration complete
- All 3 email endpoints updated (PDF stack, welcome, consultation)
- Email service ready to test

### ✅ Phase 2: Database Migration
- **SQLite → Supabase PostgreSQL** migration complete
- All backend endpoints updated to use Supabase
- Database schema SQL file ready to run

### ✅ Endpoints Migrated to Supabase:
- ✅ Community (posts, likes, comments)
- ✅ Modules
- ✅ Vault resources
- ✅ Calendar events
- ✅ Messenger (conversations, messages)
- ✅ Users

---

## 🔧 IMMEDIATE NEXT STEP - CREATE SUPABASE TABLES

**⚠️ CRITICAL**: You must run the SQL schema in Supabase before the app will work.

### Step-by-Step Instructions:

1. **Go to Supabase Dashboard:**
   ```
   https://supabase.com/dashboard/project/qecqhfriyehnafkkkuxx/editor
   ```

2. **Click "SQL Editor" in the left sidebar**

3. **Click "New Query"**

4. **Copy the entire contents of `supabase-schema.sql`** from your project root

5. **Paste it into the SQL Editor**

6. **Click "Run" (or press Cmd/Ctrl + Enter)**

7. **You should see**:
   ```
   ✅ Database schema created successfully!
   📊 Tables: users, community_posts, post_likes, post_comments, modules, vault_resources, calendar_events, conversations, messages
   ```

---

## 📋 WHAT THE SQL CREATES

### Tables:
1. **users** - User accounts with membership info
2. **community_posts** - Community feed posts
3. **post_likes** - Like tracking for posts
4. **post_comments** - Comments on posts
5. **modules** - Video course modules
6. **vault_resources** - PDF documents and resources
7. **calendar_events** - Upcoming live events
8. **conversations** - User messaging threads
9. **messages** - Individual messages

### Seed Data Included:
- ✅ 5 sample vault resources
- ✅ 5 sample modules (3 unlocked, 2 locked)
- ✅ 3 sample calendar events

### Security:
- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Public read policies (anyone can view)
- ✅ Authenticated write policies (members can post)
- ✅ Indexes for performance

---

## 🧪 TESTING AFTER SETUP

### 1. Test Server Startup

```bash
cd "/Users/reshee/Library/Mobile Documents/com~apple~CloudDocs/BUSINESS AND BUILDS/DEVBUILDS/debt-eraser-pro-ai-studio"

npm run dev:server
```

**Expected Output:**
```
🚀 Debt Eraser Pro Server running on port 3001
📝 API endpoints available at http://localhost:3001/api
💳 Stripe integration: ENABLED
🤖 Gemini AI: ENABLED
📊 HubSpot CRM: ENABLED
📧 Mailjet Email: ENABLED
💾 Supabase Database: ENABLED
```

### 2. Test Frontend

```bash
npm run dev
```

**Opens at:** http://localhost:3000

### 3. Test Full Flow

1. **Complete Quiz** → Click "Start Free Analysis"
2. **Enter Email** → Check inbox for PDF stack email (via Mailjet)
3. **Purchase Membership** → Use test card: `4242 4242 4242 4242`
4. **Access Dashboard** → Should see community posts, vault, etc.

---

## 🔑 API KEYS CONFIGURED

### ✅ Already Configured in `.env`:

```env
# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# HubSpot CRM
HUBSPOT_API_KEY=your_hubspot_api_key
HUBSPOT_CLIENT_SECRET=your_hubspot_client_secret

# Mailjet Email
MAILJET_API_KEY=your_mailjet_api_key
MAILJET_SECRET_KEY=your_mailjet_secret_key
FROM_EMAIL=noreply@debteraserpro.com

# Supabase Database
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 📁 NEW FILES CREATED

1. **`server/mailjet.ts`** - Mailjet email service functions
2. **`server/supabase.ts`** - Supabase client configuration
3. **`supabase-schema.sql`** - Complete database schema
4. **`MIGRATION_COMPLETE.md`** - Migration details
5. **`SETUP_INSTRUCTIONS.md`** - This file

---

## 🚨 IMPORTANT NOTES

### Stripe Keys
**⚠️ You're using LIVE Stripe keys!**

For development/testing, switch to test mode:
1. Go to https://dashboard.stripe.com/test/apikeys
2. Get your test keys
3. Update `.env` with test keys
4. Use test card: `4242 4242 4242 4242`

### Mailjet Email Sending
Make sure your Mailjet account is verified:
1. Go to https://app.mailjet.com
2. Verify your sender email (`noreply@debteraserpro.com`)
3. Or use a verified domain

---

## 🐛 TROUBLESHOOTING

### Database Connection Errors

**Error**: `relation "users" does not exist`
**Fix**: Run the SQL schema in Supabase (see step above)

### Email Not Sending

**Error**: `Mailjet API error`
**Check**:
1. Mailjet API keys are correct in `.env`
2. Sender email is verified in Mailjet dashboard
3. Check server logs for detailed error

### Server Won't Start

**Error**: `Cannot find module '@supabase/supabase-js'`
**Fix**:
```bash
npm install
```

---

## 🎯 WHAT STILL NEEDS TO BE BUILT

### Missing Features (Not Critical for Testing):

1. **Admin Panel** - Upload videos/PDFs without coding
2. **Real File Downloads** - Upload actual PDF files to serve
3. **Video Player** - Upload and stream course videos
4. **Customer Service Chat** - Drift or custom widget

These can be added after you test the core functionality.

---

## 📞 QUICK LINKS

**Supabase Dashboard:**
https://supabase.com/dashboard/project/qecqhfriyehnafkkkuxx

**Mailjet Dashboard:**
https://app.mailjet.com

**Stripe Dashboard:**
https://dashboard.stripe.com

**HubSpot CRM:**
https://app.hubspot.com

---

## ✅ DEPLOYMENT CHECKLIST

Before going live:

- [ ] Run SQL schema in Supabase
- [ ] Test quiz → email → payment flow
- [ ] Upload actual PDF files to vault
- [ ] Upload course videos
- [ ] Switch to Stripe test keys for testing
- [ ] Switch to Stripe live keys for production
- [ ] Verify Mailjet sender email
- [ ] Test all email templates
- [ ] Test community posting/commenting
- [ ] Test messaging system
- [ ] Add real calendar events

---

## 🆘 NEED HELP?

**Common Issues:**

1. **"Database not connected"** → Run SQL schema in Supabase
2. **"Emails not sending"** → Check Mailjet API keys and verify sender
3. **"Payment fails"** → Check Stripe keys (use test keys for testing)
4. **"Posts don't show"** → Ensure database tables are created

---

**Ready to launch! 🚀**

After running the SQL schema, your app should be fully functional with:
- ✅ Email delivery (Mailjet)
- ✅ Database operations (Supabase)
- ✅ Payments (Stripe)
- ✅ CRM tracking (HubSpot)
- ✅ AI quiz analysis (Gemini)
- ✅ Google Calendar booking
