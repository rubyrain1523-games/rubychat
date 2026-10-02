# 🌧️ RubyChat

A Discord-style chat app with **@rain.ai** bot integration, built with **HTML/CSS/JS + Supabase**.

## Features

✅ User authentication (login/signup)
✅ User roles (Owner, Admin, Member)
✅ Channels (text-based chat)
✅ Direct Messages (one-on-one chat with pair-only access)
✅ @rain.ai replies saved to the active channel or private DM
✅ Live channel and DM updates through Supabase Realtime
✅ Responsive charcoal, coral, and green interface

## Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Copy your project URL and API key (found in Project Settings → API)

### 2. Set Up Database

1. Open the SQL editor in Supabase
2. Copy the entire contents of `schema.sql`
3. Paste it into the Supabase SQL editor and run it
4. This creates or updates the tables, AI message markers, and security policies

### 3. Configure the App

The app is configured for its Supabase project in `app.js`. If you use a
different project, replace `SUPABASE_URL` and `SUPABASE_KEY` with that project's
URL and publishable key. Never put a Supabase secret or service-role key in this
browser app.

In Supabase Authentication settings, disable email confirmation for the Email
provider. RubyChat creates username sign-ins with an internal address in the
reserved `.invalid` domain, so confirmation and password-recovery emails cannot
be delivered. Existing accounts created with real email addresses can still
sign in using those addresses.

### 4. Run Locally

Use a local server so browser WebGPU can run the AI model:
```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`

After signup or sign-in, RubyChat remembers the Supabase session in this browser
and opens the chat automatically on later visits. Signing out clears that
session.

## Create Your First User

1. Click "Create an account"
2. Choose a username (3–24 letters, numbers, or underscores) and password; sign-in ignores letter case
3. Successful signup opens the chat immediately and saves the session in this browser
4. You'll be the first user (default role: `member`)
5. To make your account owner, run this in the Supabase SQL editor after signup:
   ```sql
   UPDATE public.profiles
   SET role = 'owner'
   WHERE lower(username) = lower('RubyRain1523');
   ```
   If your existing `profiles` table uses `rank` instead of `role`, update the
   `rank` column in that statement instead.
   Confirm one row was updated, then sign out and back in. Never put an owner
   password in SQL or browser code; sign up through the app and promote the
   profile from the Supabase dashboard.

## Add @rain.ai Bot

Type `@rain.ai` in a channel or DM. The Qwen2.5 Turbo model is loaded on the
first mention and runs in the browser through WebGPU. The first use downloads
the model (about 0.4 GB); use a recent Chrome or Edge browser with WebGPU.

AI replies are saved in the active room and appear live. Everyone in a public
channel can read the question and Rain's reply; a DM conversation, including
Rain replies, is visible only to its two participants under the direct-message
RLS policy. The model runs in the requesting user's browser and receives recent
messages from that room as context. Run the updated `schema.sql` in Supabase
before using this version so the `is_ai` columns, profile policy, and Realtime
publication are configured.

## Usage

- **Create Channel**: Click "+Channel" (admin only)
- **Send Message**: Type in the input box and press Enter or click Send
- **Ask Rain**: Type `@rain.ai` followed by a question in a channel or DM
- **DM a User**: Click a user in the "Direct Messages" list
- **Check Role**: Your role badge appears in the top right

## User Roles

- **Member**: Can send messages, view channels
- **Admin**: Can create channels, moderate
- **Owner**: Full control, can assign roles

## Project Structure

```
rubychat/
├── index.html     # Main UI
├── styles.css     # Dark pink theme
├── app.js         # Supabase + chat logic
├── schema.sql     # Database setup
└── README.md      # This file
```

## Troubleshooting

**"Error: Supabase not found"**
- Make sure the CDN script loaded: `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>`

**"Invalid credentials"**
- Check your SUPABASE_URL and SUPABASE_KEY in app.js
- Make sure the project is active in Supabase dashboard

**Messages not loading**
- Check that the `messages` table exists (run schema.sql again)
- Check RLS policies (should be public for SELECT)

**Rain AI is unavailable**
- Use a recent Chrome or Edge browser with WebGPU enabled
- Serve the app from `localhost` or HTTPS, not directly from a `file://` URL
- Allow the first model download from the WebLLM CDN to complete

**Username signup fails**
- Disable email confirmation for the Email provider in Supabase Auth settings
- Run the updated `schema.sql` so authenticated users can create their profile
- If a failed attempt created an auth user without a profile, delete that user in Supabase Auth and retry after fixing the setting or policy

## Next Steps

1. Add forums (thread-based discussions)
2. Add file uploads
3. Add reactions/emojis
4. Add bot commands
5. Deploy to Vercel/Netlify

## License

MIT - Feel free to use and modify!
