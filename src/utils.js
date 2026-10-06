export const PROTECTION_TYPES = {
  ANTI_RAID: "antiRaid",
  ANTI_SPAM: "antiSpam",
  ANTI_ALT: "antiAlt",
  ANTI_LINK: "antiLink",
  ANTI_INVITE: "antiInvite",
  MASS_MENTION: "massMention",
  ANTI_NUKE: "antiNuke"
};

export const PUNISHMENT_ACTIONS = {
  WARN: "warn",
  MUTE: "mute",
  KICK: "kick",
  BAN: "ban",
  DELETE: "delete",
  LOCKDOWN: "lockdown"
};

export const LOG_EVENTS = {
  MESSAGE_DELETE: "messageDelete",
  MESSAGE_UPDATE: "messageUpdate",
  MEMBER_JOIN: "memberJoin",
  MEMBER_LEAVE: "memberLeave",
  BAN_ADD: "banAdd",
  BAN_REMOVE: "banRemove",
  ROLE_CREATE: "roleCreate",
  ROLE_DELETE: "roleDelete",
  ROLE_UPDATE: "roleUpdate",
  CHANNEL_CREATE: "channelCreate",
  CHANNEL_DELETE: "channelDelete",
  CHANNEL_UPDATE: "channelUpdate",
  GUILD_UPDATE: "guildUpdate",
  VOICE_STATE_UPDATE: "voiceStateUpdate"
};

export function isWhitelisted(config, member, channel) {
  if (!config.whitelist) return false;
  if (config.whitelist.users?.includes(member.id)) return true;
  if (config.whitelist.roles?.some(r => member.roles.cache.has(r))) return true;
  if (config.whitelist.channels?.includes(channel?.id)) return true;
  return false;
}

export function parseDuration(str) {
  if (!str) return 0;
  const ms = require("ms");
  return ms(str);
}

export function formatDuration(ms) {
  const prettyMs = require("pretty-ms");
  return prettyMs(ms, { verbose: true });
}

export async function applyPunishment(guild, member, action, reason, duration = 0, moderator) {
  const { MUTE, KICK, BAN, DELETE, LOCKDOWN } = PUNISHMENT_ACTIONS;
  
  try {
    switch (action) {
      case MUTE: {
        const muteRole = guild.roles.cache.find(r => r.name === "MUTED") 
          || await guild.roles.create({ name: "MUTED", color: 0x808080, reason: "Auto mute role" });
        
        for (const [, channel] of guild.channels.cache) {
          if (channel.isTextBased()) {
            await channel.permissionOverwrites.edit(muteRole, { 
              SendMessages: false, 
              AddReactions: false 
            }).catch(() => {});
          }
        }
        await member.roles.add(muteRole, reason);
        if (duration > 0) {
          setTimeout(() => member.roles.remove(muteRole, "Mute expired").catch(() => {}), duration);
        }
        break;
      }
      case KICK:
        await member.kick(reason);
        break;
      case BAN:
        await member.ban({ reason, deleteMessageSeconds: 86400 });
        break;
      case DELETE:
        // Handled separately for messages
        break;
      case LOCKDOWN: {
        const everyoneRole = guild.roles.everyone;
        for (const [, channel] of guild.channels.cache) {
          if (channel.isTextBased()) {
            await channel.permissionOverwrites.edit(everyoneRole, { 
              SendMessages: false 
            }).catch(() => {});
          }
        }
        break;
      }
    }
    return true;
  } catch (error) {
    console.error(`Failed to apply ${action}:`, error);
    return false;
  }
}