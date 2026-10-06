import { Client, GatewayIntentBits, Events, ActivityType, PermissionFlagsBits } from "discord.js";
import { readFileSync } from "fs";
import { join } from "path";

import { loadConfig, saveGuildConfig as saveConfig } from "./config.js";
import { db, cleanupOldLogs } from "./database.js";
import { setupLogging } from "./logging.js";
import { handleMemberJoin, checkAntiAlt } from "./protections/antiRaid.js";
import { handleMessage as handleSpam } from "./protections/antiSpam.js";
import { handleMessage as handleLink } from "./protections/antiLink.js";
import { 
  handleGuildUpdate, 
  handleChannelDelete, 
  handleRoleDelete, 
  handleBanAdd 
} from "./protections/antiNuke.js";
import { handleMessage as handleMassMention } from "./protections/massMention.js";
import { applyPunishment, isWhitelisted, PUNISHMENT_ACTIONS, parseDuration } from "./utils.js";

const config = loadConfig();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.GuildIntegrations,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildModeration
  ]
});

// Load protection modules
import "./protections/antiRaid.js";
import "./protections/antiSpam.js";
import "./protections/antiLink.js";
import "./protections/antiNuke.js";
import "./protections/massMention.js";

client.once(Events.ClientReady, () => {
  console.log(`✅ Vortex Protector logged in as ${client.user.tag}`);
  console.log(`🛡️  Protecting ${client.guilds.cache.size} servers`);
  
  client.user.setPresence({
    activities: [{ name: "🛡️ Protecting servers", type: ActivityType.Watching }],
    status: "dnd"
  });
  
  // Start cleanup interval
  setInterval(() => {
    cleanupOldLogs();
  }, 60 * 60 * 1000); // Every hour
});

// Setup logging
setupLogging(client);

// Protection event handlers
client.on(Events.GuildMemberAdd, async (member) => {
  // Anti-raid
  handleMemberJoin(member);
  
  // Anti-alt
  const config = getConfig(member.guild.id);
  if (config?.protection?.antiAlt?.enabled) {
    checkAntiAlt(member, config);
  }
});

client.on(Events.MessageCreate, async (message) => {
  if (!message.guild || message.author.bot) return;
  
  const config = getConfig(message.guild.id);
  if (!config?.protection) return;
  
  // Whitelist check
  if (isWhitelisted(config, message.member, message.channel)) return;
  
  // Anti-spam
  if (config.protection?.antiSpam?.enabled) {
    await handleSpam(message);
  }
  
  // Anti-link/invite
  if (config.protection?.antiLink?.enabled || config.protection?.antiInvite?.enabled) {
    await handleLink(message);
  }
  
  // Mass mention
  if (config.protection?.massMention?.enabled) {
    await handleMassMention(message);
  }
});

client.on(Events.GuildUpdate, handleGuildUpdate);
client.on(Events.ChannelDelete, handleChannelDelete);
client.on(Events.RoleDelete, handleRoleDelete);
client.on(Events.GuildBanAdd, handleBanAdd);

// Commands
client.on(Events.MessageCreate, async (message) => {
  if (!message.guild || message.author.bot) return;
  if (!message.content.startsWith(config.prefix)) return;
  
  const args = message.content.slice(config.prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();
  
  // Check if user is owner or has admin perms
  const isOwner = config.owners.includes(message.author.id);
  const isAdmin = message.member.permissions.has(PermissionFlagsBits.Administrator);
  
  if (!isOwner && !isAdmin) {
    return message.reply("❌ You don't have permission to use this command.");
  }
  
  // Commands
  switch (command) {
    case "protect":
    case "protection": {
      const sub = args[0]?.toLowerCase();
      const guildConfig = getConfig(message.guild.id);
      
      if (!sub) {
        return message.reply({ embeds: [{
          title: "🛡️ Protection Status",
          description: Object.entries(guildConfig.protection).map(([key, val]) => 
            `**${key}:** ${val.enabled ? "✅" : "❌"}${val.threshold ? ` (threshold: ${val.threshold})` : ""}${val.action ? ` → ${val.action}` : ""}`
          ).join("\n"),
          color: 0x0099ff
        }]});
      }
      
      if (!guildConfig.protection[sub]) {
        return message.reply(`❌ Unknown protection: ${sub}`);
      }
      
      const enable = args[1] !== "off" && args[1] !== "disable";
      guildConfig.protection[sub].enabled = enable;
      saveConfig(message.guild.id, guildConfig);
      
      return message.reply(`${enable ? "✅ Enabled" : "❌ Disabled"} **${sub}** protection.`);
    }
    
    case "warn": {
      const target = message.mentions.users.first();
      const reason = args.slice(1).join(" ") || "No reason provided";
      
      if (!target) return message.reply("❌ Mention a user to warn.");
      
      const member = await message.guild.members.fetch(target.id).catch(() => null);
      if (!member) return message.reply("❌ User not found in server.");
      
      const { addWarning } = await import("./database.js");
      addWarning(message.guild.id, target.id, message.author.id, reason);
      
      await message.reply({ embeds: [{
        title: "⚠️ User Warned",
        description: `**User:** ${target.tag}\n**Reason:** ${reason}`,
        color: 0xffaa00
      }]});
      break;
    }
    
    case "mute": {
      const target = message.mentions.users.first();
      const duration = parseDuration(args[1]) || 0;
      const reason = args.slice(2).join(" ") || "No reason provided";
      
      if (!target) return message.reply("❌ Mention a user to mute.");
      
      const member = await message.guild.members.fetch(target.id).catch(() => null);
      if (!member) return message.reply("❌ User not found in server.");
      
      await applyPunishment(message.guild, member, PUNISHMENT_ACTIONS.MUTE, reason, duration, message.author);
      
      await message.reply({ embeds: [{
        title: "🔇 User Muted",
        description: `**User:** ${target.tag}\n**Duration:** ${duration > 0 ? formatDuration(duration) : "Indefinite"}\n**Reason:** ${reason}`,
        color: 0xffaa00
      }]});
      break;
    }
    
    case "unmute": {
      const target = message.mentions.users.first();
      if (!target) return message.reply("❌ Mention a user to unmute.");
      
      const member = await message.guild.members.fetch(target.id).catch(() => null);
      if (!member) return message.reply("❌ User not found in server.");
      
      const muteRole = message.guild.roles.cache.find(r => r.name === "MUTED");
      if (muteRole) {
        await member.roles.remove(muteRole, "Manual unmute").catch(() => {});
      }
      
      await message.reply({ embeds: [{
        title: "🔊 User Unmuted",
        description: `**User:** ${target.tag}`,
        color: 0x00ff00
      }]});
      break;
    }
    
    case "kick": {
      const target = message.mentions.users.first();
      const reason = args.slice(1).join(" ") || "No reason provided";
      
      if (!target) return message.reply("❌ Mention a user to kick.");
      
      const member = await message.guild.members.fetch(target.id).catch(() => null);
      if (!member) return message.reply("❌ User not found in server.");
      
      await member.kick(reason);
      
      await message.reply({ embeds: [{
        title: "👢 User Kicked",
        description: `**User:** ${target.tag}\n**Reason:** ${reason}`,
        color: 0xff0000
      }]});
      break;
    }
    
    case "ban": {
      const target = message.mentions.users.first();
      const reason = args.slice(1).join(" ") || "No reason provided";
      
      if (!target) return message.reply("❌ Mention a user to ban.");
      
      await message.guild.members.ban(target, { reason, deleteMessageSeconds: 86400 });
      
      await message.reply({ embeds: [{
        title: "🔨 User Banned",
        description: `**User:** ${target.tag}\n**Reason:** ${reason}`,
        color: 0xff0000
      }]});
      break;
    }
    
    case "lockdown": {
      const guild = message.guild;
      const everyoneRole = guild.roles.everyone;
      
      for (const [, channel] of guild.channels.cache) {
        if (channel.isTextBased()) {
          await channel.permissionOverwrites.edit(everyoneRole, { SendMessages: false }).catch(() => {});
        }
      }
      
      await message.reply({ embeds: [{
        title: "🔒 Server Locked Down",
        description: "All text channels have been locked. Use `!unlock` to revert.",
        color: 0xff0000
      }]});
      break;
    }
    
    case "unlock": {
      const guild = message.guild;
      const everyoneRole = guild.roles.everyone;
      
      for (const [, channel] of guild.channels.cache) {
        if (channel.isTextBased()) {
          await channel.permissionOverwrites.delete(everyoneRole).catch(() => {});
        }
      }
      
      await message.reply({ embeds: [{
        title: "🔓 Server Unlocked",
        description: "All text channels have been unlocked.",
        color: 0x00ff00
      }]});
      break;
    }
    
    case "warnings": {
      const target = message.mentions.users.first() || message.author;
      const { getWarnings } = await import("./database.js");
      const warnings = getWarnings(message.guild.id, target.id);
      
      if (warnings.length === 0) {
        return message.reply({ embeds: [{
          title: "✅ No Warnings",
          description: `${target.tag} has no warnings.`,
          color: 0x00ff00
        }]});
      }
      
      const embed = {
        title: `⚠️ Warnings for ${target.tag}`,
        description: warnings.slice(0, 10).map((w, i) => 
          `${i + 1}. **${w.reason}** - <t:${w.created_at}:R> (by <@${w.moderator_id}>)`
        ).join("\n"),
        color: 0xffaa00,
        footer: { text: `Total: ${warnings.length} warnings` }
      };
      
      await message.reply({ embeds: [embed] });
      break;
    }
    
    case "config": {
      const key = args[0];
      const value = args.slice(1).join(" ");
      
      if (!key) {
        return message.reply({ embeds: [{
          title: "⚙️ Current Config",
          description: "```json\n" + JSON.stringify(getConfig(message.guild.id), null, 2).slice(0, 2000) + "\n```",
          color: 0x0099ff
        }]});
      }
      
      if (key === "prefix") {
        config.prefix = value || "!";
        saveConfig(message.guild.id, config);
        return message.reply(`✅ Prefix changed to: \`${config.prefix}\``);
      }
      
      if (key === "logchannel") {
        const channel = message.mentions.channels.first() || message.guild.channels.cache.get(value);
        if (!channel) return message.reply("❌ Invalid channel.");
        
        const guildConfig = getConfig(message.guild.id);
        guildConfig.logging.channel = channel.id;
        saveConfig(message.guild.id, guildConfig);
        return message.reply(`✅ Log channel set to: ${channel}`);
      }
      
      if (key === "whitelist") {
        const sub = args[1]?.toLowerCase();
        const target = message.mentions.users.first() || message.mentions.roles.first() || message.mentions.channels.first();
        
        if (!sub || !target) return message.reply("Usage: `!config whitelist <add|remove> <user|role|channel> <target>`");
        
        const guildConfig = getConfig(message.guild.id);
        if (!guildConfig.whitelist) guildConfig.whitelist = { users: [], roles: [], channels: [] };
        
        let list;
        if (target.type === "user" || target.type === "bot") list = guildConfig.whitelist.users;
        else if (target.type === "role") list = guildConfig.whitelist.roles;
        else if (target.type === "channel") list = guildConfig.whitelist.channels;
        else return message.reply("❌ Invalid target type.");
        
        if (sub === "add") {
          if (!list.includes(target.id)) {
            list.push(target.id);
            saveConfig(message.guild.id, guildConfig);
            return message.reply(`✅ Added ${target} to whitelist.`);
          }
          return message.reply("❌ Already whitelisted.");
        } else if (sub === "remove") {
          const idx = list.indexOf(target.id);
          if (idx !== -1) {
            list.splice(idx, 1);
            saveConfig(message.guild.id, guildConfig);
            return message.reply(`✅ Removed ${target} from whitelist.`);
          }
          return message.reply("❌ Not whitelisted.");
        }
      }
      
      break;
    }
    
    case "help": {
      await message.reply({ embeds: [{
        title: "🛡️ Vortex Protector Commands",
        description: `
**Protection Management:**
\`${config.prefix}protection\` - View protection status
\`${config.prefix}protection <type> <on|off>\` - Toggle protection

**Moderation:**
\`${config.prefix}warn @user <reason>\` - Warn a user
\`${config.prefix}mute @user <duration> <reason>\` - Mute a user
\`${config.prefix}unmute @user\` - Unmute a user
\`${config.prefix}kick @user <reason>\` - Kick a user
\`${config.prefix}ban @user <reason>\` - Ban a user
\`${config.prefix}lockdown\` - Lock all channels
\`${config.prefix}unlock\` - Unlock all channels

**Info:**
\`${config.prefix}warnings @user\` - View user warnings
\`${config.prefix}config\` - View/change config
\`${config.prefix}help\` - This message
        `,
        color: 0x0099ff
      }]});
      break;
    }
  }
});

client.login(config.token);