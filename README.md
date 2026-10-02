# 🌧️ RubyChat

A Discord-style chat app with **@rain.ai** bot integration, built with **HTML/CSS/JS + Supabase**.

## Features

✅ User authentication (login/signup)
✅ User roles (Owner, Admin, Member)
✅ Channels (text-based chat)
✅ Direct Messages (one-on-one chat)
✅ @rain.ai bot (responds to mentions and DMs)
✅ Real-time messaging
✅ Responsive design with pink/dark theme

## Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Copy your project URL and API key (found in Project Settings → API)

### 2. Set Up Database

1. Open the SQL editor in Supabase
2. Copy the entire contents of `schema.sql`
3. Paste it into the Supabase SQL editor and run it
4. This creates all the tables and security policies

### 3. Configure the App

1. Open `app.js`
2. Replace:
   ```javascript
   const SUPABASE_URL = 'YOUR_SUPABASE_URL';
   const SUPABASE_KEY = 'YOUR_SUPABASE_KEY';
   ```
   With your actual Supabase URL and key from step 1.

### 4. Run Locally

Simply open `index.html` in your browser!

Or use a local server:
```bash
python -m http.server 8000
# or
node -e "require('http').createServer((q,s)=>require('fs').createReadStream('.'+q.url).pipe(s)).listen(8000)"
```

Then visit `http://localhost:8000`

## Create Your First User

1. Click "Sign Up"
2. Enter username, email, password
3. You'll be the first user (default role: `member`)
4. To become owner, update the role in Supabase:
   - Go to Supabase → `profiles` table
   - Find your profile row
   - Change `role` from `member` to `owner`

## Add @rain.ai Bot

### Option 1: Offline (Local AI)

Embed the offline Rain.ai HTML file:
```html
<!-- In index.html <head> -->
<script src="rain-ai.html"></script>
```

### Option 2: Use an API

In `app.js`, replace the `generateAIResponse()` function:

```javascript
async function generateAIResponse(userMessage) {
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${YOUR_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: userMessage }],
                max_tokens: 150
            })
        });

        const data = await response.json();
        const aiReply = data.choices[0].message.content;

        const { error } = await supabase.from('messages').insert([{
            channel_id: currentChannel.id,
            sender_id: 'rain-ai',
            content: aiReply
        }]);

        if (error) throw error;
        loadMessages();
    } catch (err) {
        console.error('AI error:', err);
    }
}
```

## Usage

- **Create Channel**: Click "+Channel" (admin only)
- **Send Message**: Type in the input box and press Enter or click Send
- **Mention Bot**: Type `@rain.ai` in any message
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

## Next Steps

1. Add forums (thread-based discussions)
2. Add file uploads
3. Add reactions/emojis
4. Add bot commands
5. Deploy to Vercel/Netlify

## License

MIT - Feel free to use and modify!
