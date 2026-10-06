# 🛡️ Vortex Protector

> **Wick-style Discord Server Protection Bot** — Anti-raid, Anti-spam, Anti-nuke, Anti-alt, Anti-link, Mass mention protection, and comprehensive logging.

---

## ✨ Features

### 🛡️ Protection Modules

| Module | Description |
|--------|-------------|
| **Anti-Raid** | Detects mass joins, triggers lockdown |
| **Anti-Spam** | Message rate limiting with mute/kick |
| **Anti-Alt** | Blocks newly created accounts |
| **Anti-Link** | Blocks unauthorized URLs |
| **Anti-Invite** | Blocks Discord server invites |
| **Anti-Nuke** | Detects mass deletions/bans/changes, triggers lockdown |
| **Mass Mention** | Blocks excessive @everyone/@role mentions |

### 📝 Logging System
- Message delete/edit
- Member join/leave
- Ban add/remove
- Role create/delete/update
- Channel create/delete/update
- Server settings changes
- Voice state updates

### ⚙️ Moderation Commands
- `!warn @user <reason>` — Warn a user
- `!mute @user <duration> <reason>` — Mute a user
- `!unmute @user` — Unmute a user
- `!kick @user <reason>` — Kick a user
- `!ban @user <reason>` — Ban a user
- `!lockdown` — Lock all channels
- `!unlock` — Unlock all channels
- `!warnings @user` — View user warnings

### 🔧 Configuration
- `!protection` — View protection status
- `!protection <type> <on|off>` — Toggle protection
- `!config` — View/change config
- `!config whitelist <add|remove> <user|role|channel> <target>` — Manage whitelist

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure
Edit `config.json`:
```json
{
  "token": "YOUR_BOT_TOKEN",
  "prefix": "!",
  "owners": ["YOUR_USER_ID"],
  "protection": {
    "antiRaid": { "enabled": true, "threshold": 5, "interval": 10000, "action": "lockdown" },
    "antiSpam": { "enabled": true, "maxMessages": 5, "interval": 5000, "action": "mute", "duration": 300000 },
    "antiAlt": { "enabled": true, "minAge": 86400000, "action": "kick" },
    "antiLink": { "enabled": true, "whitelist": ["discord.gg/yourserver"], "action": "delete" },
    "antiInvite": { "enabled": true, "action": "delete" },
    "massMention": { "enabled": true, "threshold": 5, "action": "mute" },
    "antiNuke": { "enabled": true, "threshold": 3, "interval": 10000, "action": "lockdown" }
  },
  "logging": {
    "enabled": true,
    "channel": "LOG_CHANNEL_ID",
    "events": ["messageDelete", "memberJoin", "..."]
  }
}
```

### 3. Run
```bash
# Double-click
START_PROTECTOR.bat

# Or terminal
npm start
```

---

## 📁 Project Structure

```
VortexProtector/
├── package.json
├── config.json
├── START_PROTECTOR.bat
├── data/
│   └── protector.db (SQLite)
└── src/
    ├── index.js           # Main entry point
    ├── config.js          # Config loader
    ├── database.js        # SQLite database
    ├── utils.js           # Shared utilities
    ├── logging.js         # Event logging
    └── protections/
        ├── antiRaid.js    # Anti-raid + anti-alt
        ├── antiSpam.js    # Anti-spam
        ├── antiLink.js    # Anti-link + anti-invite
        ├── antiNuke.js    # Anti-nuke
        └── massMention.js # Mass mention
```

---

## 🔧 Requirements
- Node.js 18+
- Discord Bot Token
- Bot Permissions: Administrator (or specific perms)

---

## 📝 License
MIT — Athalla Jovian Maharsa