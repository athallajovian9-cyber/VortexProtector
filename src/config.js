import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const CONFIG_DIR = join(process.cwd(), "data");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

if (!existsSync(CONFIG_DIR)) {
  mkdirSync(CONFIG_DIR, { recursive: true });
}

export function loadConfig() {
  if (!existsSync(CONFIG_FILE)) {
    // Return default config
    return {
      token: "YOUR_BOT_TOKEN_HERE",
      prefix: "!",
      owners: [],
      protection: {
        antiRaid: { enabled: true, threshold: 5, interval: 10000, action: "lockdown" },
        antiSpam: { enabled: true, maxMessages: 5, interval: 5000, action: "mute", duration: 300000 },
        antiAlt: { enabled: true, minAge: 86400000, action: "kick" },
        antiLink: { enabled: true, whitelist: [], action: "delete" },
        antiInvite: { enabled: true, action: "delete" },
        massMention: { enabled: true, threshold: 5, action: "mute" },
        antiNuke: { enabled: true, threshold: 3, interval: 10000, action: "lockdown" }
      },
      logging: {
        enabled: true,
        channel: "",
        events: [
          "messageDelete", "messageUpdate", "memberJoin", "memberLeave",
          "banAdd", "banRemove", "roleCreate", "roleDelete", "roleUpdate",
          "channelCreate", "channelDelete", "channelUpdate", "guildUpdate",
          "voiceStateUpdate"
        ]
      },
      punishment: {
        muteRole: "MUTED",
        jailRole: "JAILED",
        defaultDuration: "5m",
        maxDuration: "7d"
      },
      whitelist: { users: [], roles: [], channels: [] },
      database: "data/protector.db"
    };
  }
  
  try {
    return JSON.parse(readFileSync(CONFIG_FILE, "utf-8"));
  } catch {
    return loadConfig(); // Return defaults on error
  }
}

export function saveConfig(config) {
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export function getGuildConfig(guildId) {
  const file = join(CONFIG_DIR, `${guildId}.json`);
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, "utf-8"));
  } catch {
    return null;
  }
}

export function saveGuildConfig(guildId, config) {
  const file = join(CONFIG_DIR, `${guildId}.json`);
  writeFileSync(file, JSON.stringify(config, null, 2));
}