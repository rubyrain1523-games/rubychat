// Supabase setup
const SUPABASE_URL = 'https://yxngrbcgpsdtvsjlxrgp.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Qbmo7fKiSyTJfRoMmcXX-A_xkmgmNj5';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const GIPHY_API_KEY = 'YOUR_GIPHY_KEY';
const DEFAULT_RANK = 'user';
const RANK_LABELS = {
  user: 'User',
  mod: 'Mod',
  admin: 'Admin',
  super_admin: 'Super Admin',
  co_owner: 'Co-Owner',
  owner: 'Owner'
};

const state = {
  user: null,
  profile: null,
  currentChannel: null,
  channelMap: new Map(),
  dmTarget: null,
  theme: localStorage.getItem('rubychat-theme') || 'dark'
};

// Utility helpers
function showError(message) {
  const errorBox = document.getElementById('auth-error');
  errorBox.textContent = message;
  errorBox.classList.remove('hidden');
}

function clearError() {
  const errorBox = document.getElementById('auth-error');
  errorBox.textContent = '';
  errorBox.classList.add('hidden');
}

function setTheme(theme) {
  state.theme = theme;
  document.body.className = theme;
  localStorage.setItem('rubychat-theme', theme);
  const themeSelect = document.getElementById('theme-select');
  if (themeSelect) themeSelect.value = theme;
}

function showLogin() {
  document.getElementById('login-form').classList.remove('hidden');
  document.getElementById('signup-form').classList.add('hidden');
  clearError();
}

function showSignup() {
  document.getElementById('login-form').classList.add('hidden');
  document.getElementById('signup-form').classList.remove('hidden');
  clearError();
}

function openProfileModal() {
  document.getElementById('profile-modal').classList.remove('hidden');
  const profile = state.profile || {};
  document.getElementById('profile-username').value = profile.username || '';
  document.getElementById('profile-status').value = profile.status || '';
  document.getElementById('profile-avatar').value = profile.avatar_url || '';
  document.getElementById('profile-bio').value = profile.bio || '';
  document.getElementById('profile-about').value = profile.about || '';
}

function closeProfileModal() {
  document.getElementById('profile-modal').classList.add('hidden');
}

function openGifModal() {
  document.getElementById('gif-modal').classList.remove('hidden');
}

function closeGifModal() {
  document.getElementById('gif-modal').classList.add('hidden');
}

function openStickerModal() {
  document.getElementById('sticker-modal').classList.remove('hidden');
  loadStickers();
}

function closeStickerModal() {
  document.getElementById('sticker-modal').classList.add('hidden');
}

function formatRank(rank) {
  return RANK_LABELS[rank] || 'User';
}

function rankValue(rank) {
  const order = ['user', 'mod', 'admin', 'super_admin', 'co_owner', 'owner'];
  return order.indexOf(rank);
}

function canManageUsers() {
  const r = state.profile?.rank || DEFAULT_RANK;
  return rankValue(r) >= rankValue('mod');
}

function canCreateChannels() {
  const r = state.profile?.rank || DEFAULT_RANK;
  return rankValue(r) >= rankValue('admin');
}

function canManageStickers() {
  const r = state.profile?.rank || DEFAULT_RANK;
  return rankValue(r) >= rankValue('mod');
}

async function login() {
  clearError();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!email || !password) {
    showError('Please enter your email and password.');
    return;
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    state.user = data.user;
    await loadProfile();
    showApp();
  } catch (err) {
    showError(err.message || 'Login failed.');
  }
}

async function signup() {
  clearError();
  const username = document.getElementById('signup-username').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value.trim();

  if (!username || !email || !password) {
    showError('Please fill in all fields.');
    return;
  }

  try {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;

    const { error: profileError } = await supabase.from('profiles').insert([
      {
        id: data.user.id,
        username,
        status: 'online',
        rank: 'user',
        bio: 'Hello world!',
        about: 'New to RubyChat.',
        avatar_url: '',
        theme: 'dark'
      }
    ]);

    if (profileError) throw profileError;

    showLogin();
    alert('Account created! Please log in.');
  } catch (err) {
    showError(err.message || 'Signup failed.');
  }
}

async function logout() {
  await supabase.auth.signOut();
  state.user = null;
  state.profile = null;
  document.getElementById('chat-screen').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
}

async function loadProfile() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', state.user.id)
    .single();

  if (error) {
    console.error('Profile fetch error:', error);
    return;
  }

  state.profile = data;
  document.getElementById('sidebar-username').textContent = data.username;
  document.getElementById('sidebar-status').textContent = data.status || 'online';
  document.getElementById('sidebar-avatar').src = data.avatar_url || 'https://api.dicebear.com/7.x/adventurer/svg?seed=' + encodeURIComponent(data.username);
  document.getElementById('my-rank').textContent = formatRank(data.rank || DEFAULT_RANK);
  setTheme(data.theme || 'dark');
}

async function loadChannels() {
  const { data, error } = await supabase
    .from('channels')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error(error);
    return;
  }

  const channelList = document.getElementById('channel-list');
  channelList.innerHTML = '';

  data.forEach((channel) => {
    const el = document.createElement('button');
    el.className = 'channel-item' + (state.currentChannel && state.currentChannel.id === channel.id ? ' active' : '');
    el.textContent = '#' + channel.name;
    el.onclick = () => selectChannel(channel);
    channelList.appendChild(el);
  });

  if (!state.currentChannel && data.length) {
    selectChannel(data[0]);
  }
}

async function loadPeople() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .neq('id', state.user.id)
    .order('username', { ascending: true });

  if (error) {
    console.error(error);
    return;
  }

  const peopleList = document.getElementById('people-list');
  peopleList.innerHTML = '';

  data.forEach((user) => {
    const el = document.createElement('button');
    el.className = 'user-item';
    el.innerHTML = `
      <div class="user-line">
        <img src="${user.avatar_url || 'https://api.dicebear.com/7.x/adventurer/svg?seed=' + encodeURIComponent(user.username)}" class="avatar small" />
        <span>${user.username}</span>
      </div>
    `;
    el.onclick = () => startDM(user);
    peopleList.appendChild(el);
  });
}

async function createChannelPrompt() {
  if (!canCreateChannels()) {
    alert('Only Admin or higher can create channels.');
    return;
  }

  const name = prompt('Enter channel name:');
  if (!name) return;

  try {
    const { error } = await supabase.from('channels').insert([
      { name: name.trim(), created_by: state.user.id }
    ]);

    if (error) throw error;
    await loadChannels();
  } catch (err) {
    alert(err.message || 'Could not create channel.');
  }
}

function selectChannel(channel) {
  state.currentChannel = channel;
  state.dmTarget = null;
  document.getElementById('current-channel-name').textContent = '#' + channel.name;
  document.getElementById('composer-input').placeholder = 'Message #' + channel.name;
  loadMessages();
  loadChannels();
}

function startDM(user) {
  state.dmTarget = user;
  state.currentChannel = null;
  document.getElementById('current-channel-name').textContent = '@' + user.username;
  document.getElementById('composer-input').placeholder = 'Message @' + user.username;
  loadDMMessages(user.id);
}

async function loadMessages() {
  if (!state.currentChannel) return;

  const { data, error } = await supabase
    .from('messages')
    .select('*, profiles(id, username, avatar_url, rank)')
    .eq('channel_id', state.currentChannel.id)
    .order('created_at', { ascending: true })
    .limit(200);

  if (error) {
    console.error(error);
    return;
  }

  renderMessages(data);
}

async function loadDMMessages(otherUserId) {
  const { data, error } = await supabase
    .from('direct_messages')
    .select('*')
    .or(
      `and(sender_id.eq.${state.user.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${state.user.id})`
    )
    .order('created_at', { ascending: true })
    .limit(200);

  if (error) {
    console.error(error);
    return;
  }

  renderMessages(data.map((d) => ({
    ...d,
    content: d.content,
    sender_id: d.sender_id,
    profiles: { username: d.sender_id === state.user.id ? state.profile.username : state.dmTarget.username }
  })));
}

function renderMessages(msgs) {
  const container = document.getElementById('messages');
  container.innerHTML = '';

  msgs.forEach((msg) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'message ' + (msg.sender_id === state.user.id ? 'self' : '');

    const meta = document.createElement('div');
    meta.className = 'message-meta';
    meta.textContent = (msg.profiles?.username || 'Unknown') + ' • ' + new Date(msg.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

    const content = document.createElement('div');
    content.className = 'message-content';

    if (msg.type === 'gif' || msg.type === 'sticker') {
      const img = document.createElement('img');
      img.src = msg.media_url;
      img.alt = msg.type;
      content.appendChild(img);
    } else {
      content.textContent = msg.content || '';
    }

    wrapper.appendChild(meta);
    wrapper.appendChild(content);
    container.appendChild(wrapper);
  });

  container.scrollTop = container.scrollHeight;
}

async function sendTextMessage() {
  const input = document.getElementById('composer-input');
  const text = input.value.trim();
  if (!text) return;

  const payload = {
    content: text,
    sender_id: state.user.id,
    type: 'text'
  };

  if (state.currentChannel) {
    payload.channel_id = state.currentChannel.id;
  } else if (state.dmTarget) {
    payload.recipient_id = state.dmTarget.id;
  }

  try {
    if (state.currentChannel) {
      const { error } = await supabase.from('messages').insert([payload]);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('direct_messages').insert([{
        sender_id: state.user.id,
        recipient_id: state.dmTarget.id,
        content: text
      }]);
      if (error) throw error;
    }

    input.value = '';

    if (text.toLowerCase().includes('@rain.ai')) {
      await sendRainReply(text);
    }

    if (state.currentChannel) loadMessages();
    else loadDMMessages(state.dmTarget.id);
  } catch (err) {
    alert(err.message || 'Message failed.');
  }
}

async function searchGifs() {
  const term = document.getElementById('gif-search').value.trim();
  if (!term || GIPHY_API_KEY === 'YOUR_GIPHY_KEY') {
    document.getElementById('gif-results').innerHTML = '<div class="message">Add a Giphy or Kiply key in app.js to enable GIF search.</div>';
    return;
  }

  try {
    const res = await fetch(`https://api.giphy.com/v1/gifs/search?q=${encodeURIComponent(term)}&limit=12&api_key=${GIPHY_API_KEY}`);
    const json = await res.json();
    const results = document.getElementById('gif-results');
    results.innerHTML = '';

    json.data.forEach((gif) => {
      const item = document.createElement('div');
      item.className = 'media-item';
      item.innerHTML = `
        <img src="${gif.images.fixed_height_small.url}" alt="gif" />
        <button onclick="sendGif('${gif.images.original.url}')">Send</button>
      `;
      results.appendChild(item);
    });
  } catch (err) {
    console.error(err);
  }
}

async function sendGif(url) {
  if (state.currentChannel) {
    const { error } = await supabase.from('messages').insert([
      {
        channel_id: state.currentChannel.id,
        sender_id: state.user.id,
        content: 'GIF',
        type: 'gif',
        media_url: url
      }
    ]);

    if (error) throw error;
    closeGifModal();
    loadMessages();
  } else if (state.dmTarget) {
    const { error } = await supabase.from('direct_messages').insert([
      {
        sender_id: state.user.id,
        recipient_id: state.dmTarget.id,
        content: 'GIF',
        type: 'gif',
        media_url: url
      }
    ]);

    if (error) throw error;
    closeGifModal();
    loadDMMessages(state.dmTarget.id);
  }
}

async function loadStickers() {
  const { data, error } = await supabase.from('stickers').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error(error);
    return;
  }

  const results = document.getElementById('sticker-results');
  results.innerHTML = '';

  if (!data.length) {
    results.innerHTML = '<div class="message">No stickers yet. Mods can add them from Supabase.</div>';
    return;
  }

  data.forEach((sticker) => {
    const item = document.createElement('div');
    item.className = 'media-item';
    item.innerHTML = `
      <img src="${sticker.image_url}" alt="sticker" />
      <button onclick="sendSticker('${sticker.image_url}')">Send</button>
    `;
    results.appendChild(item);
  });
}

async function sendSticker(url) {
  if (state.currentChannel) {
    const { error } = await supabase.from('messages').insert([
      {
        channel_id: state.currentChannel.id,
        sender_id: state.user.id,
        content: 'Sticker',
        type: 'sticker',
        media_url: url
      }
    ]);

    if (error) throw error;
    closeStickerModal();
    loadMessages();
  } else if (state.dmTarget) {
    const { error } = await supabase.from('direct_messages').insert([
      {
        sender_id: state.user.id,
        recipient_id: state.dmTarget.id,
        content: 'Sticker',
        type: 'sticker',
        media_url: url
      }
    ]);

    if (error) throw error;
    closeStickerModal();
    loadDMMessages(state.dmTarget.id);
  }
}

async function saveProfile() {
  const username = document.getElementById('profile-username').value.trim();
  const status = document.getElementById('profile-status').value.trim();
  const avatar = document.getElementById('profile-avatar').value.trim();
  const bio = document.getElementById('profile-bio').value.trim();
  const about = document.getElementById('profile-about').value.trim();

  try {
    const { error } = await supabase.from('profiles').update({
      username,
      status,
      avatar_url: avatar,
      bio,
      about,
      theme: state.theme
    }).eq('id', state.user.id);

    if (error) throw error;

    await loadProfile();
    closeProfileModal();
    await loadPeople();
  } catch (err) {
    alert(err.message || 'Could not save profile.');
  }
}

async function changeTheme(theme) {
  setTheme(theme);
  if (!state.user) return;

  await supabase.from('profiles').update({ theme }).eq('id', state.user.id);
}

async function sendRainReply(text) {
  const clean = text.replace(/@rain\.ai/gi, '').trim();
  const aiReply = clean ? `Rain.ai says: "${clean.length > 90 ? clean.slice(0, 90) + '...' : clean}" I can help with chat, ideas, code, and moderation.` : 'Rain.ai is online and ready to help.';

  if (state.currentChannel) {
    await supabase.from('messages').insert([
      {
        channel_id: state.currentChannel.id,
        sender_id: state.user.id,
        content: aiReply,
        type: 'text'
      }
    ]);
  } else if (state.dmTarget) {
    await supabase.from('direct_messages').insert([
      {
        sender_id: state.user.id,
        recipient_id: state.dmTarget.id,
        content: aiReply
      }
    ]);
  }
}

function showApp() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('chat-screen').classList.remove('hidden');
  loadChannels();
  loadPeople();
}

async function init() {
  setTheme(state.theme);
  const { data } = await supabase.auth.getSession();

  if (data.session) {
    state.user = data.session.user;
    await loadProfile();
    showApp();
  }

  const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
      state.user = session.user;
      loadProfile();
      showApp();
    }
  });

  window.__supabaseAuthListener = authListener;
}

window.onload = init;
