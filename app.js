// ===== SUPABASE CONFIG =====
const SUPABASE_URL = 'https://yxngrbcgpsdtvsjlxrgp.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Qbmo7fKiSyTJfRoMmcXX-A_xkmgmNj5';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
});
const RAIN_MODEL = 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC';
const RAIN_LIBRARIES = [
    'https://unpkg.com/@mlc-ai/web-llm?module',
    'https://cdn.skypack.dev/@mlc-ai/web-llm',
    'https://esm.sh/@mlc-ai/web-llm'
];

// ===== STATE =====
let currentUser = null;
let currentChannel = null;
let roomSubscription = null;
let userRole = 'member';
let currentMessages = [];
let rainEngine = null;
let rainEnginePromise = null;
const rainHistory = new Map();

// ===== AUTH FUNCTIONS =====
const USERNAME_PATTERN = /^[a-z0-9_]{3,24}$/;
const AUTH_ALIAS_DOMAIN = 'users.rubychat.invalid';

function authEmailForIdentity(identity) {
    const value = identity.trim();
    if (value.includes('@')) return value.toLowerCase();

    const username = value.toLowerCase();
    if (!USERNAME_PATTERN.test(username)) {
        throw new Error('Use your email, or a username with 3–24 letters, numbers, or underscores.');
    }
    return `${username}@${AUTH_ALIAS_DOMAIN}`;
}

function showAuthMessage(message, type = 'error') {
    const box = document.getElementById('auth-error');
    box.textContent = message;
    box.classList.toggle('success', type === 'success');
    box.classList.remove('hidden');
}

function clearAuthMessage() {
    const box = document.getElementById('auth-error');
    box.textContent = '';
    box.classList.add('hidden');
    box.classList.remove('success');
}

async function login() {
    const identity = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    clearAuthMessage();
    if (!identity || !password) {
        showAuthMessage('Enter your username or email and password.');
        return;
    }

    try {
        const email = authEmailForIdentity(identity);
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        currentUser = data.user;
        try {
            await loadUserProfile();
        } catch (profileError) {
            await supabase.auth.signOut();
            currentUser = null;
            throw new Error(`Your login worked, but your RubyChat profile is unavailable: ${profileError.message}`);
        }
        switchToAppScreen();
    } catch (err) {
        showAuthMessage(err.message || 'Sign in failed.');
    }
}

async function signup() {
    const username = document.getElementById('username').value.trim();
    const normalizedUsername = username.toLowerCase();
    const password = document.getElementById('signup-password').value.trim();

    clearAuthMessage();
    if (!USERNAME_PATTERN.test(normalizedUsername)) {
        showAuthMessage('Choose a username with 3–24 letters, numbers, or underscores.');
        return;
    }
    if (password.length < 6) {
        showAuthMessage('Your password must be at least 6 characters.');
        return;
    }

    try {
        const { data, error } = await supabase.auth.signUp({
            email: `${normalizedUsername}@${AUTH_ALIAS_DOMAIN}`,
            password,
            options: { data: { username } }
        });

        if (error) throw error;
        if (!data.session) {
            showAuthMessage('Supabase created a pending account, but email confirmation is enabled. Username accounts cannot receive email. Disable email confirmation, delete this pending user in Supabase Auth, then sign up again.');
            return;
        }

        currentUser = data.user;
        await loadUserProfile();
        switchToAppScreen();
    } catch (err) {
        if (err.code === '42501') {
            await supabase.auth.signOut();
            currentUser = null;
            showAuthMessage('Your auth account was created, but Supabase blocked its profile. Run the updated schema.sql, then sign in with this username; RubyChat will retry profile creation.');
        } else {
            showAuthMessage(err.message || 'Account creation failed.');
        }
    }
}

async function logout() {
    if (roomSubscription) {
        await supabase.removeChannel(roomSubscription);
        roomSubscription = null;
    }
    await supabase.auth.signOut();
    currentUser = null;
    currentChannel = null;
    currentMessages = [];
    rainHistory.clear();
    switchToLoginScreen();
}

function toggleSignup() {
    const signupVisible = document.getElementById('signup-form').classList.contains('hidden');
    document.getElementById('signup-form').classList.toggle('hidden', !signupVisible);
    document.getElementById('login-form').classList.toggle('hidden', signupVisible);
    document.getElementById('auth-title').textContent = signupVisible ? 'Make yourself at home' : 'Welcome back';
    document.getElementById('auth-description').textContent = signupVisible
        ? 'Choose a username and password to get started.'
        : 'Sign in and pick up where you left off.';
    clearAuthMessage();
}

// ===== SCREEN SWITCHING =====
function switchToLoginScreen() {
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('app-screen').classList.add('hidden');
}

function switchToAppScreen() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app-screen').classList.remove('hidden');
    loadChannels();
    loadDMs();
}

function subscribeToRoom(room) {
    if (roomSubscription) {
        supabase.removeChannel(roomSubscription);
        roomSubscription = null;
    }

    const table = room.is_dm ? 'direct_messages' : 'messages';
    const changeFilter = {
        event: 'INSERT',
        schema: 'public',
        table,
        ...(!room.is_dm ? { filter: `channel_id=eq.${room.id}` } : {})
    };

    roomSubscription = supabase
        .channel(`room:${room.is_dm ? `dm:${room.recipient_id}` : `channel:${room.id}`}`)
        .on('postgres_changes', changeFilter, payload => {
            if (currentChannel !== room) return;
            const message = payload.new;
            if (room.is_dm) {
                const participants = [currentUser.id, room.recipient_id];
                if (!participants.includes(message.sender_id) || !participants.includes(message.recipient_id)) return;
            } else if (message.channel_id !== room.id) {
                return;
            }
            loadMessages(room);
        })
        .subscribe();
}

// ===== USER PROFILE =====
async function loadUserProfile() {
    let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

    if (error?.code === 'PGRST116' && currentUser.user_metadata?.username) {
        const result = await supabase.from('profiles').insert([{
            id: currentUser.id,
            username: currentUser.user_metadata.username
        }]).select('*').single();
        data = result.data;
        error = result.error;
    }

    if (error) throw error;

    userRole = data.role || data.rank || 'member';
    document.getElementById('user-role').textContent = userRole.toUpperCase();
    document.getElementById('sidebar-username').textContent = data.username || 'RubyChat member';
    document.getElementById('sidebar-avatar').textContent = (data.username || 'R').slice(0, 1).toUpperCase();
}

// ===== CHANNELS =====
async function loadChannels() {
    try {
        const { data, error } = await supabase.from('channels').select('*');
        if (error) throw error;

        const list = document.getElementById('channels-list');
        list.innerHTML = '';

        data.forEach(channel => {
            const div = document.createElement('div');
            div.className = 'channel-item';
            div.textContent = '# ' + channel.name;
            div.onclick = () => selectChannel(channel, div);
            list.appendChild(div);
        });
    } catch (err) {
        console.error('Error loading channels:', err);
    }
}

function selectChannel(channel, element) {
    currentChannel = channel;
    subscribeToRoom(channel);
    document.getElementById('current-channel').textContent = '# ' + channel.name;
    document.querySelector('.room-symbol').textContent = '#';
    document.getElementById('message-input').placeholder = `Message #${channel.name} · use @rain.ai`;
    document.querySelectorAll('.channel-item').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
    loadMessages(channel);
}

function showCreateChannel() {
    const name = prompt('Channel name:');
    if (!name) return;

    createChannel(name);
}

async function createChannel(name) {
    if (userRole !== 'owner' && userRole !== 'admin') {
        alert('Only admins can create channels');
        return;
    }

    try {
        const { error } = await supabase.from('channels').insert([
            {
                name,
                created_by: currentUser.id
            }
        ]);

        if (error) throw error;
        loadChannels();
    } catch (err) {
        alert('Error creating channel: ' + err.message);
    }
}

// ===== MESSAGES =====
async function loadMessages(room = currentChannel) {
    if (!room) return [];

    try {
        const result = room.is_dm
            ? await supabase
                .from('direct_messages')
                .select('*')
                .or(`and(sender_id.eq.${currentUser.id},recipient_id.eq.${room.recipient_id}),and(sender_id.eq.${room.recipient_id},recipient_id.eq.${currentUser.id})`)
                .order('created_at', { ascending: true })
                .limit(50)
            : await supabase
                .from('messages')
                .select('*, profiles(username)')
                .eq('channel_id', room.id)
                .order('created_at', { ascending: true })
                .limit(50);

        if (result.error) throw result.error;
        const data = result.data || [];
        if (currentChannel !== room) return data;

        const container = document.getElementById('messages-container');
        container.innerHTML = '';
        currentMessages = data;

        data.forEach(msg => {
            displayMessage(msg, room);
        });

        if (!data.length) {
            const emptyState = document.createElement('div');
            emptyState.className = 'room-empty';
            const marker = document.createElement('span');
            marker.className = 'empty-marker';
            marker.textContent = room.is_dm ? '@' : '#';
            const title = document.createElement('h3');
            title.textContent = room.is_dm ? `A fresh chat with ${room.name}` : `Welcome to #${room.name}`;
            const description = document.createElement('p');
            description.textContent = room.is_dm
                ? 'Send the first message, or ask Rain for a private reply with @rain.ai.'
                : 'This room is quiet for now. Start the conversation, or bring in Rain with @rain.ai.';
            emptyState.append(marker, title, description);
            container.appendChild(emptyState);
        }

        container.scrollTop = container.scrollHeight;
        return data;
    } catch (err) {
        console.error('Error loading messages:', err);
        return [];
    }
}

function displayMessage(msg, room = currentChannel) {
    const container = document.getElementById('messages-container');
    const div = document.createElement('div');
    div.className = msg.is_ai
        ? 'message bot ai-message'
        : msg.sender_id === currentUser.id ? 'message user' : 'message bot';

    const meta = document.createElement('div');
    meta.className = 'message-meta';
    const author = msg.is_ai ? 'Rain AI' : room?.is_dm
        ? (msg.sender_id === currentUser.id ? 'You' : room.name)
        : (msg.profiles?.username || 'Unknown');
    meta.textContent = author + ' · ' + new Date(msg.created_at).toLocaleTimeString();

    const content = document.createElement('div');
    content.textContent = msg.content;

    div.appendChild(meta);
    div.appendChild(content);
    container.appendChild(div);
}

async function sendMessage() {
    if (!currentChannel || !currentUser) return;

    const room = currentChannel;
    const input = document.getElementById('message-input');
    const content = input.value.trim();

    if (!content) return;

    // Check for @rain.ai mention
    const mentionsRain = content.toLowerCase().includes('@rain.ai');

    try {
        const message = {
            sender_id: currentUser.id,
            content,
            ...(room.is_dm
                ? { recipient_id: room.recipient_id }
                : { channel_id: room.id })
        };
        const { error } = await supabase
            .from(room.is_dm ? 'direct_messages' : 'messages')
            .insert([message]);

        if (error) throw error;

        input.value = '';
        const messages = await loadMessages(room);

        if (mentionsRain && currentChannel === room) {
            const question = content.replace(/@rain\.ai\b/gi, '').trim() || content;
            await generateAIResponse(question, room, messages.slice(0, -1));
        }
    } catch (err) {
        alert('Error sending message: ' + err.message);
    }
}

// ===== AI RESPONSE (Rain.ai) =====
async function getRainEngine() {
    if (rainEngine) return rainEngine;
    if (!navigator.gpu) {
        throw new Error('WebGPU is unavailable. Open RubyChat in a recent Chrome or Edge browser.');
    }

    if (!rainEnginePromise) {
        rainEnginePromise = (async () => {
            let lastError;
            for (const libraryUrl of RAIN_LIBRARIES) {
                try {
                    const webllm = await import(libraryUrl);
                    rainEngine = await webllm.CreateMLCEngine(RAIN_MODEL, {
                        initProgressCallback: progress => {
                            const status = document.getElementById('rain-status');
                            status.textContent = `Rain · loading ${Math.round((progress.progress || 0) * 100)}%`;
                        }
                    });
                    return rainEngine;
                } catch (err) {
                    lastError = err;
                    console.warn('Rain AI library failed to load:', libraryUrl, err);
                }
            }
            throw lastError || new Error('Could not load the local AI model.');
        })().catch(err => {
            rainEnginePromise = null;
            throw err;
        });
    }

    return rainEnginePromise;
}

function roomKey(room) {
    return room.is_dm ? `dm:${room.recipient_id}` : `channel:${room.id}`;
}

async function generateAIResponse(userMessage, room, contextMessages) {
    const container = document.getElementById('messages-container');
    const bubble = document.createElement('div');
    bubble.className = 'message bot ai-message';
    const meta = document.createElement('div');
    meta.className = 'message-meta';
    meta.textContent = 'Rain AI · generating on this device';
    const content = document.createElement('div');
    content.textContent = 'Loading the Turbo model on this device…';
    bubble.append(meta, content);
    if (currentChannel === room) {
        container.appendChild(bubble);
        container.scrollTop = container.scrollHeight;
    }

    let generatedReply = '';
    try {
        const engine = await getRainEngine();
        const history = rainHistory.get(roomKey(room)) || [];
        const context = contextMessages.slice(-8).map(message => ({
            role: 'user',
            content: `${message.is_ai ? 'Rain AI' : message.sender_id === currentUser.id ? 'You' : (room.is_dm ? room.name : message.profiles?.username || 'Someone')}: ${message.content}`
        }));
        const result = await engine.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: 'You are Rain, a helpful assistant in RubyChat. Answer clearly and directly. You run locally in the user’s browser; only use the conversation context provided.'
                },
                ...context,
                ...history,
                { role: 'user', content: userMessage }
            ],
            temperature: 0.6,
            max_tokens: 256
        });
        generatedReply = result.choices[0]?.message?.content?.trim() || 'I could not generate a reply.';
        content.textContent = generatedReply;

        const aiMessage = {
            sender_id: currentUser.id,
            content: generatedReply,
            is_ai: true,
            ...(room.is_dm
                ? { recipient_id: room.recipient_id }
                : { channel_id: room.id })
        };
        const { error: saveError } = await supabase
            .from(room.is_dm ? 'direct_messages' : 'messages')
            .insert([aiMessage]);
        if (saveError) {
            meta.textContent = 'Rain AI · reply could not be shared';
            content.textContent += `\n\nCouldn't save this reply: ${saveError.message}`;
            return;
        }

        rainHistory.set(roomKey(room), [
            ...history,
            { role: 'user', content: userMessage },
            { role: 'assistant', content: generatedReply }
        ].slice(-8));
        document.getElementById('rain-status').textContent = 'Rain · Turbo ready';
        if (currentChannel === room) await loadMessages(room);
    } catch (err) {
        console.error('Error generating AI response:', err);
        content.textContent = generatedReply
            ? `${generatedReply}\n\nRain could not finish saving the reply: ${err.message}`
            : `Rain could not start: ${err.message}`;
        document.getElementById('rain-status').textContent = 'Rain · unavailable';
    }
}

// ===== DIRECT MESSAGES =====
async function loadDMs() {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .neq('id', currentUser.id);

        if (error) throw error;

        const list = document.getElementById('dms-list');
        list.innerHTML = '';

        data.forEach(user => {
            const div = document.createElement('div');
            div.className = 'dm-item';
            const avatar = document.createElement('span');
            avatar.className = 'dm-avatar';
            avatar.textContent = (user.username || '?').slice(0, 1).toUpperCase();
            const username = document.createElement('span');
            username.className = 'dm-username';
            username.textContent = '@' + user.username;
            div.append(avatar, username);
            div.onclick = () => selectDM(user, div);
            list.appendChild(div);
        });
    } catch (err) {
        console.error('Error loading DMs:', err);
    }
}

function selectDM(user, element) {
    currentChannel = { id: 'dm-' + user.id, name: user.username, is_dm: true, recipient_id: user.id };
    subscribeToRoom(currentChannel);
    document.getElementById('current-channel').textContent = '@' + user.username;
    document.querySelector('.room-symbol').textContent = '@';
    document.getElementById('message-input').placeholder = `Message @${user.username} · use @rain.ai`;
    document.querySelectorAll('.dm-item').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
    loadMessages(currentChannel);
}

// ===== KEYBOARD SHORTCUT =====
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && document.activeElement.id === 'message-input') {
        sendMessage();
    }
});

// ===== INIT =====
window.addEventListener('load', async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
        currentUser = data.session.user;
        try {
            await loadUserProfile();
            switchToAppScreen();
        } catch (err) {
            await supabase.auth.signOut();
            currentUser = null;
            switchToLoginScreen();
            showAuthMessage(`This account needs a RubyChat profile before it can open: ${err.message}`);
        }
    } else {
        switchToLoginScreen();
    }
});