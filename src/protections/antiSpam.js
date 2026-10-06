import { getConfig, addWarning } from "../../database.js";
import { isWhitelisted, applyPunishment, parseDuration, PUNISHMENT_ACTIONS } from "../../utils.js";

const spamTracker = new Map();

export function handleMessage(message) {
  if (!message.guild || message.author.bot) return;
  if (!message.content) return;
  
  const config = getConfig(message.guild.id);
  if (!config?.protection?.antiSpam?.enabled) return;
  if (isWhitelisted(config, message.member, message.channel)) return;
  
  const now = Date.now();
  const key = `${message.guild.id}-${message.author.id}`;
  const tracks = spamTracker.get(key) || [];
  tracks.push(now);
  
  // Clean old entries
  const interval = config.protection.antiSpam.interval || 5000;
  const cutoff = now - interval;
  const recent = tracks.filter(t => t > cutoff);
  spamTracker.set(key, recent);
  
  // Check threshold
  const maxMessages = config.protection.antiSpam.maxMessages || 5;
  if (recent.length >= maxMessages) {
    const action = config.protection.antiSpam.action || "mute";
    const duration = parseDuration(config.protection.antiSpam.duration || "5m");
    
    applyPunishment(message.guild, message.member, PUNISHMENT_ACTIONS[action.toUpperCase()], 
      `Anti-spam: ${recent.length} messages in ${interval}ms`, duration, message.client.user);
    
    // Delete the spam messages
    message.delete().catch(() => {});
    
    // Log warning
    addWarning(message.guild.id, message.author.id, message.client.user.id, `Anti-spam: ${recent.length} messages in ${interval}ms`);
    
    // Notify log channel
    notifyLog(message.guild, "🔇 **SPAM DETECTED**", 
      `**User:** ${message.author.tag} (${message.author.id})\n**Messages:** ${recent.length} in ${interval}ms\n**Action:** ${action}`);
  }
}

function notifyLog(guild, title, description) {
  const config = getConfig(guild.id);
  if (!config?.logging?.enabled || !config.logging.channel) return;
  
  const channel = guild.channels.cache.get(config.logging.channel);
  if (channel) {
    channel.send({ embeds: [{ title, description, color: 0xffaa00, timestamp: new Date() }] }).catch(() => {});
  }
}