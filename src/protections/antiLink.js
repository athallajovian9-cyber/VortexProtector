import { getConfig, addWarning } from "../../database.js";
import { isWhitelisted, applyPunishment, PUNISHMENT_ACTIONS } from "../../utils.js";

const INVITE_REGEX = /(discord\.(gg|com|me|io)\/[a-zA-Z0-9]+)/gi;
const URL_REGEX = /https?:\/\/[^\s]+/gi;

export function handleMessage(message) {
  if (!message.guild || message.author.bot) return;
  if (!message.content) return;
  
  const config = getConfig(message.guild.id);
  if (!config?.protection) return;
  if (isWhitelisted(config, message.member, message.channel)) return;
  
  // Anti-Invite
  if (config.protection.antiInvite?.enabled) {
    const invites = message.content.match(INVITE_REGEX);
    if (invites) {
      const hasWhitelisted = invites.some(invite => 
        config.protection.antiLink?.whitelist?.some(w => invite.includes(w))
      );
      
      if (!hasWhitelisted) {
        message.delete().catch(() => {});
        applyPunishment(message.guild, message.member, PUNISHMENT_ACTIONS.DELETE, "Discord invite blocked", 0, message.client.user);
        addWarning(message.guild.id, message.author.id, message.client.user.id, "Posted Discord invite");
        notifyLog(message.guild, "🔗 **INVITE BLOCKED**", 
          `**User:** ${message.author.tag} (${message.author.id})\n**Invite:** ${invites[0]}`);
        return;
      }
    }
  }
  
  // Anti-Link
  if (config.protection.antiLink?.enabled) {
    const urls = message.content.match(URL_REGEX);
    if (urls) {
      const hasWhitelisted = urls.some(url => 
        config.protection.antiLink?.whitelist?.some(w => url.includes(w))
      );
      
      if (!hasWhitelisted) {
        message.delete().catch(() => {});
        applyPunishment(message.guild, message.member, PUNISHMENT_ACTIONS.DELETE, "Unauthorized link blocked", 0, message.client.user);
        addWarning(message.guild.id, message.author.id, message.client.user.id, "Posted unauthorized link");
        notifyLog(message.guild, "🔗 **LINK BLOCKED**", 
          `**User:** ${message.author.tag} (${message.author.id})\n**Link:** ${urls[0]}`);
        return;
      }
    }
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