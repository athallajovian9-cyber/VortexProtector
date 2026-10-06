import { getConfig, logRaid } from "../../database.js";
import { isWhitelisted, applyPunishment, PUNISHMENT_ACTIONS } from "../../utils.js";

const nukeTracker = new Map();

export function handleGuildUpdate(oldGuild, newGuild) {
  const config = getConfig(newGuild.id);
  if (!config?.protection?.antiNuke?.enabled) return;
  
  // Track dangerous changes
  const dangerousChanges = [];
  
  if (oldGuild.name !== newGuild.name) dangerousChanges.push("Server name changed");
  if (oldGuild.icon !== newGuild.icon) dangerousChanges.push("Server icon changed");
  if (oldGuild.banner !== newGuild.banner) dangerousChanges.push("Server banner changed");
  if (oldGuild.verificationLevel !== newGuild.verificationLevel) dangerousChanges.push("Verification level changed");
  if (oldGuild.explicitContentFilter !== newGuild.explicitContentFilter) dangerousChanges.push("Content filter changed");
  if (oldGuild.defaultMessageNotifications !== newGuild.defaultMessageNotifications) dangerousChanges.push("Notification settings changed");
  if (oldGuild.vanityURLCode !== newGuild.vanityURLCode) dangerousChanges.push("Vanity URL changed");
  if (oldGuild.afkChannelId !== newGuild.afkChannelId) dangerousChanges.push("AFK channel changed");
  if (oldGuild.afkTimeout !== newGuild.afkTimeout) dangerousChanges.push("AFK timeout changed");
  if (oldGuild.systemChannelId !== newGuild.systemChannelId) dangerousChanges.push("System channel changed");
  if (oldGuild.rulesChannelId !== newGuild.rulesChannelId) dangerousChanges.push("Rules channel changed");
  if (oldGuild.publicUpdatesChannelId !== newGuild.publicUpdatesChannelId) dangerousChanges.push("Updates channel changed");
  
  if (dangerousChanges.length > 0) {
    const now = Date.now();
    const key = newGuild.id;
    const tracks = nukeTracker.get(key) || [];
    tracks.push({ time: now, changes: dangerousChanges });
    
    const interval = config.protection.antiNuke.interval || 10000;
    const cutoff = now - interval;
    const recent = tracks.filter(t => t.time > cutoff);
    nukeTracker.set(key, recent);
    
    const threshold = config.protection.antiNuke.threshold || 3;
    const totalChanges = recent.reduce((sum, t) => sum + t.changes.length, 0);
    
    if (totalChanges >= threshold) {
      logRaid(newGuild.id, newGuild.ownerId || "unknown", "ANTI_NUKE");
      
      const action = config.protection.antiNuke.action || "lockdown";
      if (action === "lockdown") {
        applyPunishment(newGuild, newGuild.members.me, PUNISHMENT_ACTIONS.LOCKDOWN, "Anti-nuke: suspicious mass changes", 0, newGuild.client.user);
      }
      
      notifyLog(newGuild, "💥 **ANTI-NUKE TRIGGERED**", 
        `**Changes:** ${totalChanges} in ${interval}ms\n**Details:** ${dangerousChanges.join(", ")}\n**Action:** ${action}`);
    }
  }
}

export function handleChannelDelete(channel) {
  if (!channel.guild) return;
  
  const config = getConfig(channel.guild.id);
  if (!config?.protection?.antiNuke?.enabled) return;
  
  // Track channel deletions
  const now = Date.now();
  const key = `${channel.guild.id}-channels`;
  const tracks = nukeTracker.get(key) || [];
  tracks.push({ time: now, type: "channel_delete", name: channel.name });
  
  const interval = config.protection.antiNuke.interval || 10000;
  const cutoff = now - interval;
  const recent = tracks.filter(t => t.time > cutoff);
  nukeTracker.set(key, recent);
  
  const threshold = config.protection.antiNuke.threshold || 3;
  if (recent.length >= threshold) {
    logRaid(channel.guild.id, "unknown", "ANTI_NUKE_CHANNELS");
    
    const action = config.protection.antiNuke.action || "lockdown";
    if (action === "lockdown") {
      applyPunishment(channel.guild, channel.guild.members.me, PUNISHMENT_ACTIONS.LOCKDOWN, "Anti-nuke: mass channel deletion", 0, channel.client.user);
    }
    
    notifyLog(channel.guild, "💥 **ANTI-NUKE: CHANNELS**", 
      `**${recent.length} channels deleted in ${interval}ms**\n**Action:** ${action}`);
  }
}

export function handleRoleDelete(role) {
  const config = getConfig(role.guild.id);
  if (!config?.protection?.antiNuke?.enabled) return;
  
  // Track role deletions
  const now = Date.now();
  const key = `${role.guild.id}-roles`;
  const tracks = nukeTracker.get(key) || [];
  tracks.push({ time: now, type: "role_delete", name: role.name });
  
  const interval = config.protection.antiNuke.interval || 10000;
  const cutoff = now - interval;
  const recent = tracks.filter(t => t.time > cutoff);
  nukeTracker.set(key, recent);
  
  const threshold = config.protection.antiNuke.threshold || 3;
  if (recent.length >= threshold) {
    logRaid(role.guild.id, "unknown", "ANTI_NUKE_ROLES");
    
    const action = config.protection.antiNuke.action || "lockdown";
    if (action === "lockdown") {
      applyPunishment(role.guild, role.guild.members.me, PUNISHMENT_ACTIONS.LOCKDOWN, "Anti-nuke: mass role deletion", 0, role.client.user);
    }
    
    notifyLog(role.guild, "💥 **ANTI-NUKE: ROLES**", 
      `**${recent.length} roles deleted in ${interval}ms**\n**Action:** ${action}`);
  }
}

export function handleBanAdd(ban) {
  const config = getConfig(ban.guild.id);
  if (!config?.protection?.antiNuke?.enabled) return;
  
  // Track bans
  const now = Date.now();
  const key = `${ban.guild.id}-bans`;
  const tracks = nukeTracker.get(key) || [];
  tracks.push({ time: now, user: ban.user.tag });
  
  const interval = config.protection.antiNuke.interval || 10000;
  const cutoff = now - interval;
  const recent = tracks.filter(t => t.time > cutoff);
  nukeTracker.set(key, recent);
  
  const threshold = config.protection.antiNuke.threshold || 3;
  if (recent.length >= threshold) {
    logRaid(ban.guild.id, "unknown", "ANTI_NUKE_BANS");
    
    const action = config.protection.antiNuke.action || "lockdown";
    if (action === "lockdown") {
      applyPunishment(ban.guild, ban.guild.members.me, PUNISHMENT_ACTIONS.LOCKDOWN, "Anti-nuke: mass bans", 0, ban.client.user);
    }
    
    notifyLog(ban.guild, "💥 **ANTI-NUKE: BANS**", 
      `**${recent.length} bans in ${interval}ms**\n**Action:** ${action}`);
  }
}

function notifyLog(guild, title, description) {
  const config = getConfig(guild.id);
  if (!config?.logging?.enabled || !config.logging.channel) return;
  
  const channel = guild.channels.cache.get(config.logging.channel);
  if (channel) {
    channel.send({ embeds: [{ title, description, color: 0xff0000, timestamp: new Date() }] }).catch(() => {});
  }
}