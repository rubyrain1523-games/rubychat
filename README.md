# RubyChat

A Discord-style chat app starter for you and your friends, built with HTML + JS + Supabase.

## Included features

- Login and signup
- User profile editing
- Theme switching
- Channels
- Direct messages
- GIF picker
- Sticker support
- Rank system:
  - user
  - mod
  - admin
  - super_admin
  - co_owner
  - owner
- Rain.ai mention placeholder
- Supabase-ready schema

## Supabase setup

1. Create a project in Supabase.
2. Go to Settings → API.
3. Copy the Project URL and anon key.
4. Update `app.js` with your values:

```js
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_KEY = 'your-anon-key';
```

5. Open the SQL editor in Supabase.
6. Paste the contents of `schema.sql` and run it.

## Giphy / GIF setup

The GIF feature is ready, but needs a real Giphy key before it works. In `app.js`:

```js
const GIPHY_API_KEY = 'YOUR_GIPHY_KEY';
```

If you want to use a Kiply-style provider instead, replace the `searchGifs()` fetch URL with your own endpoint.

## Run locally

Open `index.html` in a browser, or serve it locally:

```bash
python -m http.server 8000
```

Then visit:

```text
http://localhost:8000
```

## Suggested next upgrades

- Forum channels
- Message reactions
- User bans and mutes
- Sticker approval system
- Follow/follower pages
- Real Rain.ai backend
- WebSocket real-time sync instead of polling
- Server settings and role management
- File uploads and image attachments

## Important note

This is a strong starter app, but it is not a full production Discord clone yet. The current version is meant to give you a working base with chat, profile, themes, ranks, GIFs, stickers, and Supabase connectivity.

## User ranks

- user
- mod
- admin
- super_admin
- co_owner
- owner

## Example role logic

If you want to make a user the owner in Supabase, update the `profiles` table row and set:

```sql
UPDATE profiles SET rank = 'owner' WHERE username = 'yourusername';
```

## Rain.ai integration

Right now, the bot response is a placeholder so the app works without an external AI service. Replace the `sendRainReply()` function in `app.js` with a real API call when you have your AI backend ready.

## Current setup status

Your Supabase values are already wired into the project:

```js
const SUPABASE_URL = 'https://yxngrbcgpsdtvsjlxrgp.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Qbmo7fKiSyTJfRoMmcXX-A_xkmgmNj5';
```

If you want the app to use your real Giphy or Kiply token, add it in `app.js` before testing GIFs.

## Project structure

```text
rubychat/
├── index.html
├── styles.css
├── app.js
├── schema.sql
├── README.md
```

## Next step

If you want, I can continue and turn this into a more complete real-time Discord clone with:

- forums
- message reactions
- role permissions
- follow/following list
- real Rain.ai API layer
- admin controls
- better profile pages
- sticker upload UI
- server settings page

Just tell me which one you want next.







































































































































