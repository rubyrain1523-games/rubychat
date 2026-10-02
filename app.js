:root {
  --bg: #0b0d12;
  --bg-2: #131922;
  --panel: #181d2a;
  --panel-2: #202a39;
  --text: #f2f5fa;
  --muted: #9aa7b7;
  --primary: #ff2e88;
  --primary-dark: #c51169;
  --border: rgba(255, 46, 136, 0.25);
  --success: #4ade80;
  --danger: #ef4444;
  --shadow: rgba(0, 0, 0, 0.35);
}

body.light {
  --bg: #f3f5f9;
  --bg-2: #dde6f1;
  --panel: #ffffff;
  --panel-2: #edf2fa;
  --text: #1b2430;
  --muted: #5c6a7d;
  --primary: #ff2e88;
  --primary-dark: #cf0f6a;
  --border: rgba(255, 46, 136, 0.2);
  --shadow: rgba(93, 104, 120, 0.12);
}

body.rose {
  --bg: #180d13;
  --bg-2: #2a1620;
  --panel: #28171e;
  --panel-2: #3f1f2d;
  --text: #fdf2f8;
  --muted: #d7b6c7;
  --primary: #f472b6;
  --primary-dark: #d946ef;
  --border: rgba(244, 114, 182, 0.35);
  --shadow: rgba(0, 0, 0, 0.3);
}

body.midnight {
  --bg: #070b16;
  --bg-2: #101a2a;
  --panel: #0f172a;
  --panel-2: #162235;
  --text: #e2e8f0;
  --muted: #8aa1ba;
  --primary: #60a5fa;
  --primary-dark: #2563eb;
  --border: rgba(96, 165, 250, 0.35);
  --shadow: rgba(15, 23, 42, 0.6);
}

* {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: var(--bg);
  color: var(--text);
}

body {
  transition: background 0.2s ease, color 0.2s ease;
}

button, input, select, textarea {
  font: inherit;
}

button {
  cursor: pointer;
}

.screen {
  display: flex;
  min-height: 100vh;
}

.hidden {
  display: none !important;
}

.auth-screen {
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at top, rgba(255, 46, 136, 0.12), transparent 40%), var(--bg);
}

.auth-card {
  width: min(420px, calc(100vw - 2rem));
  background: rgba(24, 29, 42, 0.92);
  border: 1px solid var(--border);
  border-radius: 18px;
  padding: 2rem;
  box-shadow: 0 20px 60px var(--shadow);
}

.logo {
  font-size: 2.25rem;
  margin-bottom: 0.5rem;
}

.auth-card h1 {
  margin: 0;
  font-size: 2rem;
  letter-spacing: 0.04em;
}

.auth-card p {
  color: var(--muted);
  margin: 0.5rem 0 1.5rem;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

input, textarea, select {
  width: 100%;
  border: 1px solid var(--border);
  background: rgba(0, 0, 0, 0.18);
  color: var(--text);
  padding: 0.8rem 0.9rem;
  border-radius: 10px;
  outline: none;
}

input:focus, textarea:focus, select:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(255, 46, 136, 0.14);
}

button {
  border: 1px solid var(--border);
  background: var(--panel-2);
  color: var(--text);
  border-radius: 10px;
  padding: 0.8rem 1rem;
  transition: transform 0.15s ease, opacity 0.15s ease;
}

button:hover {
  transform: translateY(-1px);
}

button.primary {
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  border: none;
  color: white;
  font-weight: 600;
}

button.secondary {
  background: transparent;
}

button.tiny {
  padding: 0.45rem 0.7rem;
  font-size: 0.8rem;
}

.error {
  margin-bottom: 1rem;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.35);
  color: #fecaca;
  padding: 0.75rem 0.9rem;
  border-radius: 10px;
}

.sidebar {
  width: 320px;
  background: var(--panel);
  border-right: 1px solid var(--border);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.topbar h2 {
  margin: 0;
}

.profile-card {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  background: var(--panel-2);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 0.8rem;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  background: rgba(255, 255, 255, 0.08);
  border: 2px solid var(--primary);
}

.username {
  font-weight: 700;
}

.status-text {
  font-size: 0.8rem;
  color: var(--muted);
}

.sidebar-section {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--muted);
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 0.2rem;
}

.channel-item, .user-item {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid transparent;
  border-radius: 10px;
  padding: 0.7rem 0.8rem;
  color: var(--text);
  transition: border 0.2s ease, background 0.2s ease;
}

.channel-item.active, .user-item.active {
  border-color: var(--primary);
  background: rgba(255, 46, 136, 0.08);
}

.theme-toggle, .theme-select {
  width: 100%;
}

.chat-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.4rem;
  border-bottom: 1px solid var(--border);
  background: var(--panel);
}

.chat-header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.rank-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  background: rgba(255, 46, 136, 0.1);
  border: 1px solid var(--border);
  color: var(--primary);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  background: linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.01) 100%);
}

.message {
  max-width: min(72%, 680px);
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 0.8rem 0.9rem;
  box-shadow: 0 10px 24px var(--shadow);
}

.message.self {
  align-self: flex-end;
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  color: white;
  border-color: transparent;
}

.message-meta {
  font-size: 0.74rem;
  opacity: 0.78;
  margin-bottom: 0.35rem;
}

.message-content {
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.message-content img,
.media-item img,
.media-item video {
  max-width: 100%;
  border-radius: 12px;
  display: block;
}

.composer {
  border-top: 1px solid var(--border);
  padding: 0.9rem 1rem;
  background: var(--panel);
  display: grid;
  grid-template-columns: auto auto 1fr auto;
  gap: 0.7rem;
  align-items: center;
}

#composer-input {
  min-width: 0;
}

.modal {
  position: fixed;
  inset: 0;
  background: rgba(10, 12, 18, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 20;
}

.modal-card {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 18px;
  width: min(520px, 92vw);
  padding: 1rem;
  box-shadow: 0 25px 60px var(--shadow);
}

.modal-card.wide {
  width: min(760px, 92vw);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.modal-header h3 {
  margin: 0;
}

.profile-grid {
  display: grid;
  gap: 0.9rem;
}

.profile-grid label {
  display: grid;
  gap: 0.45rem;
  color: var(--muted);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
}

.search-row {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  max-height: 55vh;
  overflow: auto;
}

.media-item {
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  background: rgba(255,255,255,0.02);
}

.media-item img {
  width: 100%;
  height: 170px;
  object-fit: cover;
  display: block;
}

.media-item button {
  width: 100%;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}

@media (max-width: 900px) {
  .screen {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--border);
  }

  .composer {
    grid-template-columns: 1fr 1fr;
  }

  .composer input {
    grid-column: 1 / -1;
  }
}
