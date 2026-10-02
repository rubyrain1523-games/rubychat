// ===== SUPABASE CONFIG =====
const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // Replace with your URL
const SUPABASE_KEY = 'YOUR_SUPABASE_KEY'; // Replace with your key
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ===== STATE =====
let currentUser = null;
let currentChannel = null;
let userRole = 'member';

// ===== AUTH FUNCTIONS =====
async function login() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!email || !password) {
        alert('Please enter email and password');
        return;
    }

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        currentUser = data.user;
        await loadUserProfile();
        switchToAppScreen();
    } catch (err) {
        alert('Login failed: ' + err.message);
    }
}

async function signup() {
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value.trim();

    if (!username || !email || !password) {
        alert('Please fill in all fields');
        return;
    }

    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password
        });

        if (error) throw error;

        // Create user profile
        const { error: profileError } = await supabase.from('profiles').insert([
            {
                id: data.user.id,
                username,
                role: 'member'
            }
        ]);

        if (profileError) throw profileError;

        alert('Account created! Please log in.');
        toggleSignup();
    } catch (err) {
        alert('Signup failed: ' + err.message);
    }
}

async function logout() {
    await supabase.auth.signOut();
    currentUser = null;
    currentChannel = null;
    switchToLoginScreen();
}

function toggleSignup() {
    document.getElementById('signup-form').classList.toggle('hidden');
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
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

// ===== USER PROFILE =====
async function loadUserProfile() {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();

        if (error) throw error;

        userRole = data.role;
        document.getElementById('user-role').textContent = userRole.toUpperCase();
    } catch (err) {
        console.error('Error loading profile:', err);
    }
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
            div.onclick = () => selectChannel(channel);
            list.appendChild(div);
        });
    } catch (err) {
        console.error('Error loading channels:', err);
    }
}

function selectChannel(channel) {
    currentChannel = channel;
    document.getElementById('current-channel').textContent = '# ' + channel.name;
    document.querySelectorAll('.channel-item').forEach(el => el.classList.remove('active'));
    event.target.classList.add('active');
    loadMessages();
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
async function loadMessages() {
    if (!currentChannel) return;

    try {
        const { data, error } = await supabase
            .from('messages')
            .select('*, profiles(username)')
            .eq('channel_id', currentChannel.id)
            .order('created_at', { ascending: true })
            .limit(50);

        if (error) throw error;

        const container = document.getElementById('messages-container');
        container.innerHTML = '';

        data.forEach(msg => {
            displayMessage(msg);
        });

        container.scrollTop = container.scrollHeight;
    } catch (err) {
        console.error('Error loading messages:', err);
    }
}

function displayMessage(msg) {
    const container = document.getElementById('messages-container');
    const div = document.createElement('div');
    div.className = msg.sender_id === currentUser.id ? 'message user' : 'message bot';
    
    const meta = document.createElement('div');
    meta.className = 'message-meta';
    meta.textContent = (msg.profiles?.username || 'Unknown') + ' • ' + new Date(msg.created_at).toLocaleTimeString();
    
    const content = document.createElement('div');
    content.textContent = msg.content;
    
    div.appendChild(meta);
    div.appendChild(content);
    container.appendChild(div);
}

async function sendMessage() {
    if (!currentChannel || !currentUser) return;

    const input = document.getElementById('message-input');
    const content = input.value.trim();

    if (!content) return;

    // Check for @rain.ai mention
    const mentionsRain = content.toLowerCase().includes('@rain.ai');

    try {
        const { data, error } = await supabase.from('messages').insert([
            {
                channel_id: currentChannel.id,
                sender_id: currentUser.id,
                content
            }
        ]);

        if (error) throw error;

        input.value = '';
        loadMessages();

        // If @rain.ai mentioned, get AI response
        if (mentionsRain) {
            await generateAIResponse(content);
        }
    } catch (err) {
        alert('Error sending message: ' + err.message);
    }
}

// ===== AI RESPONSE (Rain.ai) =====
async function generateAIResponse(userMessage) {
    try {
        // TODO: Call your AI endpoint here
        // This is a placeholder - replace with actual Rain.ai or API call
        const aiReply = "Thanks for the message! I'm Rain.ai and I'm here to help.";

        const { error } = await supabase.from('messages').insert([
            {
                channel_id: currentChannel.id,
                sender_id: 'rain-ai', // Special ID for bot
                content: aiReply
            }
        ]);

        if (error) throw error;
        loadMessages();
    } catch (err) {
        console.error('Error generating AI response:', err);
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
            div.textContent = '@' + user.username;
            div.onclick = () => selectDM(user);
            list.appendChild(div);
        });
    } catch (err) {
        console.error('Error loading DMs:', err);
    }
}

function selectDM(user) {
    currentChannel = { id: 'dm-' + user.id, name: user.username, is_dm: true, recipient_id: user.id };
    document.getElementById('current-channel').textContent = '@' + user.username;
    document.querySelectorAll('.dm-item').forEach(el => el.classList.remove('active'));
    event.target.classList.add('active');
    loadMessages();
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
        await loadUserProfile();
        switchToAppScreen();
    } else {
        switchToLoginScreen();
    }
});