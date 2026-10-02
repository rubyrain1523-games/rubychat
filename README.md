# RubyChat

A Discord-style chat app starter with profiles, themes, GIFs, stickers, ranks, and Supabase support.

## Included features

- Login and signup
- User profile editing
- Theme switching (dark, light, rose, midnight)
- Channel chat
- Direct messages
- GIF search support (Giphy-ready)
- Sticker gallery and mod upload support
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
2. Open Settings → API.
3. Copy your Project URL and anon key.
4. Update `app.js` with your values if needed.

```js
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_KEY = 'your-anon-key';
```

5. In the Supabase SQL editor, run the contents of `schema.sql`.

## GIF setup

The app is built to support GIF search through Giphy. To activate it, add a real API key in `app.js`:

```js
const GIPHY_API_KEY = 'YOUR_GIPHY_KEY';
```

Without that key, the app will show a helpful message instead of failing silently.

## Sticker support

Stickers are pulled from the `stickers` table. Mods and admins can upload sticker URLs from the UI. Sticker moderation is ready for expansion.

## Run locally

Open `index.html` directly in a browser, or serve it locally:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Rank system

- user
- mod
- admin
- super_admin
- co_owner
- owner

You can change a user's rank in Supabase like this:

```sql
UPDATE profiles SET rank = 'owner' WHERE username = 'yourusername';
```

## Current Supabase values

The app is already configured with your project values:

```js
const SUPABASE_URL = 'https://yxngrbcgpsdtvsjlxrgp.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Qbmo7fKiSyTJfRoMmcXX-A_xkmgmNj5';
```

## Notes

This is a strong starter app with the features you requested: chat, profiles, themes, GIFs, stickers, following-ready people list, and rank-based permissions. It is suitable as a real app foundation and can be expanded into a bigger Discord-style product.

## Recommended next upgrades

- real-time subscriptions for live updates
- forum channels
- user follow/follower pages
- reactions and emoji rolls
- bans and mutes
- server settings page
- real Rain.ai backend integration
- uploaded sticker storage in Supabase Storage
- role and permission management screen







































































































































































































































































































































































































































































































































































































































































~
