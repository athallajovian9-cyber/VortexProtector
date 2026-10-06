import { getConfig, addWarning } from "../../database.js";
import { isWhitelisted, applyPunishment, PUNISHMENT_ACTIONS } from "../../utils.js";

export function handleMessage(message) {
  if (!message.guild || message.author.bot) return;
  if (!message.content) return;
  
  const config = getConfig(message.guild.id);
  if (!config?.protection?.massMention?.enabled) return;
  if (isWhitelisted(config, message.member, message.channel)) return;
  
  // Count mentions
  const mentionCount = message.mentions.users.size + message.mentions.roles.size;
  
  if (mentionCount >= (config.protection.massMention.threshold || 5)) {
    message.delete().catch(() => {});
    
    const action = config.protection.massMention.action || "mute";
    applyPunishment(message.guild, message.member, PUNISHMENT_ACTIONS[action.toUpperCase()], 
      `Mass mention: ${mentionCount} mentions`, 0, message.client.user);
    
    addWarning(message.guild.id, message.author.id, message.client.user.id, `Mass mention: ${mentionCount} mentions`);
    
    notifyLog(message.guild, "📢 **MASS MENTION**", 
      `**User:** ${message.author.tag} (${message.author.id})\n**Mentions:** ${mentionCount}\n**Action:** ${action}`);
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