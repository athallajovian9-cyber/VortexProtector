import { getConfig, logRaid, logJoin, getRecentJoins } from "../database.js";
import { isWhitelisted, applyPunishment, PUNISHMENT_ACTIONS } from "../utils.js";

const joinTracker = new Map();

export function handleMemberJoin(member) {
  if (member.user.bot) return;
  
  const config = getConfig(member.guild.id);
  if (!config?.protection?.antiRaid?.enabled) return;
  
  logJoin(member.guild.id, member.id);
  
  const now = Date.now();
  const joins = joinTracker.get(member.guild.id) || [];
  joins.push(now);
  
  // Clean old entries
  const window = config.protection.antiRaid.interval || 10000;
  const cutoff = now - window;
  const recent = joins.filter(t => t > cutoff);
  joinTracker.set(member.guild.id, recent);
  
  // Check threshold
  const threshold = config.protection.antiRaid.threshold || 5;
  if (recent.length >= threshold) {
    // Raid detected!
    logRaid(member.guild.id, member.id, "RAID_DETECTED");
    
    const action = config.protection.antiRaid.action || "lockdown";
    if (action === "lockdown") {
      applyPunishment(member.guild, member.guild.members.me, PUNISHMENT_ACTIONS.LOCKDOWN, "Anti-raid lockdown", 0, member.user);
    }
    
    // Notify log channel
    notifyLog(member.guild, "🚨 **RAID DETECTED**", `**${recent.length} joins in ${window}ms**\nAction: ${action}`);
  }
}

export function checkAntiAlt(member, config) {
  if (!config.protection?.antiAlt?.enabled) return false;
  if (isWhitelisted(config, member, null)) return false;
  
  const minAge = config.protection.antiAlt.minAge || 86400000; // 1 day default
  const accountAge = Date.now() - member.user.createdTimestamp;
  
  if (accountAge < minAge) {
    const action = config.protection.antiAlt.action || "kick";
    applyPunishment(member.guild, member, PUNISHMENT_ACTIONS[action.toUpperCase()], `Account too new (< ${formatDuration(minAge)})`, 0, member.user);
    return true;
  }
  return false;
}

function notifyLog(guild, title, description) {
  const config = getConfig(guild.id);
  if (!config?.logging?.enabled || !config.logging.channel) return;
  
  const channel = guild.channels.cache.get(config.logging.channel);
  if (channel) {
    channel.send({ embeds: [{ title, description, color: 0xff0000, timestamp: new Date() }] }).catch(() => {});
  }
}

function formatDuration(ms) {
  const prettyMs = require("pretty-ms");
  return prettyMs(ms, { verbose: true });
}