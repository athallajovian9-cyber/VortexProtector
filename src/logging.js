import { getConfig } from "../database.js";

const LOG_EVENTS = [
  "messageDelete",
  "messageUpdate", 
  "memberJoin",
  "memberLeave",
  "banAdd",
  "banRemove",
  "roleCreate",
  "roleDelete",
  "roleUpdate",
  "channelCreate",
  "channelDelete",
  "channelUpdate",
  "guildUpdate",
  "voiceStateUpdate"
];

export function setupLogging(client) {
  // Message Delete
  client.on("messageDelete", async (message) => {
    if (!message.guild || message.author.bot) return;
    const config = getConfig(message.guild.id);
    if (!config?.logging?.enabled || !config.logging.events?.includes("messageDelete")) return;
    
    const channel = message.guild.channels.cache.get(config.logging.channel);
    if (!channel) return;
    
    const embed = {
      title: "🗑️ Message Deleted",
      description: `**Author:** ${message.author.tag}\n**Channel:** ${message.channel}\n**Content:** ${message.content?.slice(0, 1024) || "No content"}`,
      color: 0xff0000,
      timestamp: new Date(),
      footer: { text: `User ID: ${message.author.id} • Message ID: ${message.id}` }
    };
    channel.send({ embeds: [embed] }).catch(() => {});
  });
  
  // Message Update
  client.on("messageUpdate", async (oldMessage, newMessage) => {
    if (!newMessage.guild || newMessage.author.bot) return;
    if (oldMessage.content === newMessage.content) return;
    
    const config = getConfig(newMessage.guild.id);
    if (!config?.logging?.enabled || !config.logging.events?.includes("messageUpdate")) return;
    
    const channel = newMessage.guild.channels.cache.get(config.logging.channel);
    if (!channel) return;
    
    const embed = {
      title: "📝 Message Edited",
      description: `**Author:** ${newMessage.author.tag}\n**Channel:** ${newMessage.channel}\n**Before:** ${oldMessage.content?.slice(0, 1024) || "No content"}\n**After:** ${newMessage.content?.slice(0, 1024) || "No content"}`,
      color: 0xffaa00,
      timestamp: new Date(),
      footer: { text: `User ID: ${newMessage.author.id} • Message ID: ${newMessage.id}` }
    };
    channel.send({ embeds: [embed] }).catch(() => {});
  });
  
  // Member Join
  client.on("guildMemberAdd", async (member) => {
    const config = getConfig(member.guild.id);
    if (!config?.logging?.enabled || !config.logging.events?.includes("memberJoin")) return;
    
    const channel = member.guild.channels.cache.get(config.logging.channel);
    if (!channel) return;
    
    const embed = {
      title: "📥 Member Joined",
      description: `**User:** ${member.user.tag}\n**Account Created:** <t:${Math.floor(member.user.createdTimestamp / 1000)}:R>\n**Members:** ${member.guild.memberCount}`,
      color: 0x00ff00,
      timestamp: new Date(),
      thumbnail: { url: member.user.displayAvatarURL() },
      footer: { text: `User ID: ${member.id}` }
    };
    channel.send({ embeds: [embed] }).catch(() => {});
  });
  
  // Member Leave
  client.on("guildMemberRemove", async (member) => {
    const config = getConfig(member.guild.id);
    if (!config?.logging?.enabled || !config.logging.events?.includes("memberLeave")) return;
    
    const channel = member.guild.channels.cache.get(config.logging.channel);
    if (!channel) return;
    
    const embed = {
      title: "📤 Member Left",
      description: `**User:** ${member.user.tag}\n**Members:** ${member.guild.memberCount}`,
      color: 0xff0000,
      timestamp: new Date(),
      thumbnail: { url: member.user.displayAvatarURL() },
      footer: { text: `User ID: ${member.id}` }
    };
    channel.send({ embeds: [embed] }).catch(() => {});
  });
  
  // Ban Add
  client.on("guildBanAdd", async (ban) => {
    const config = getConfig(ban.guild.id);
    if (!config?.logging?.enabled || !config.logging.events?.includes("banAdd")) return;
    
    const channel = ban.guild.channels.cache.get(config.logging.channel);
    if (!channel) return;
    
    const embed = {
      title: "🔨 Member Banned",
      description: `**User:** ${ban.user.tag}\n**Reason:** ${ban.reason || "No reason provided"}`,
      color: 0xff0000,
      timestamp: new Date(),
      thumbnail: { url: ban.user.displayAvatarURL() },
      footer: { text: `User ID: ${ban.user.id}` }
    };
    channel.send({ embeds: [embed] }).catch(() => {});
  });
  
  // Ban Remove
  client.on("guildBanRemove", async (ban) => {
    const config = getConfig(ban.guild.id);
    if (!config?.logging?.enabled || !config.logging.events?.includes("banRemove")) return;
    
    const channel = ban.guild.channels.cache.get(config.logging.channel);
    if (!channel) return;
    
    const embed = {
      title: "🔓 Member Unbanned",
      description: `**User:** ${ban.user.tag}`,
      color: 0x00ff00,
      timestamp: new Date(),
      thumbnail: { url: ban.user.displayAvatarURL() },
      footer: { text: `User ID: ${ban.user.id}` }
    };
    channel.send({ embeds: [embed] }).catch(() => {});
  });
  
  // Role Create
  client.on("roleCreate", async (role) => {
    const config = getConfig(role.guild.id);
    if (!config?.logging?.enabled || !config.logging.events?.includes("roleCreate")) return;
    
    const channel = role.guild.channels.cache.get(config.logging.channel);
    if (!channel) return;
    
    const embed = {
      title: "➕ Role Created",
      description: `**Role:** ${role.name}\n**Color:** ${role.hexColor}\n**Hoisted:** ${role.hoist}\n**Mentionable:** ${role.mentionable}`,
      color: 0x00ff00,
      timestamp: new Date(),
      footer: { text: `Role ID: ${role.id}` }
    };
    channel.send({ embeds: [embed] }).catch(() => {});
  });
  
  // Role Delete
  client.on("roleDelete", async (role) => {
    const config = getConfig(role.guild.id);
    if (!config?.logging?.enabled || !config.logging.events?.includes("roleDelete")) return;
    
    const channel = role.guild.channels.cache.get(config.logging.channel);
    if (!channel) return;
    
    const embed = {
      title: "➖ Role Deleted",
      description: `**Role:** ${role.name}\n**Color:** ${role.hexColor}`,
      color: 0xff0000,
      timestamp: new Date(),
      footer: { text: `Role ID: ${role.id}` }
    };
    channel.send({ embeds: [embed] }).catch(() => {});
  });
  
  // Role Update
  client.on("roleUpdate", async (oldRole, newRole) => {
    const config = getConfig(newRole.guild.id);
    if (!config?.logging?.enabled || !config.logging.events?.includes("roleUpdate")) return;
    
    const changes = [];
    if (oldRole.name !== newRole.name) changes.push(`Name: ${oldRole.name} → ${newRole.name}`);
    if (oldRole.color !== newRole.color) changes.push(`Color: ${oldRole.hexColor} → ${newRole.hexColor}`);
    if (oldRole.hoist !== newRole.hoist) changes.push(`Hoisted: ${oldRole.hoist} → ${newRole.hoist}`);
    if (oldRole.mentionable !== newRole.mentionable) changes.push(`Mentionable: ${oldRole.mentionable} → ${newRole.mentionable}`);
    if (oldRole.permissions.bitfield !== newRole.permissions.bitfield) changes.push("Permissions changed");
    
    if (changes.length === 0) return;
    
    const channel = newRole.guild.channels.cache.get(config.logging.channel);
    if (!channel) return;
    
    const embed = {
      title: "🔄 Role Updated",
      description: `**Role:** ${newRole.name}\n**Changes:**\n${changes.map(c => `• ${c}`).join("\n")}`,
      color: 0xffaa00,
      timestamp: new Date(),
      footer: { text: `Role ID: ${newRole.id}` }
    };
    channel.send({ embeds: [embed] }).catch(() => {});
  });
  
  // Channel Create
  client.on("channelCreate", async (channel) => {
    const config = getConfig(channel.guild?.id);
    if (!config?.logging?.enabled || !config.logging.events?.includes("channelCreate")) return;
    
    const logChannel = channel.guild.channels.cache.get(config.logging.channel);
    if (!logChannel) return;
    
    const embed = {
      title: "➕ Channel Created",
      description: `**Channel:** ${channel.name} (${channel.type})\n**Category:** ${channel.parent?.name || "None"}`,
      color: 0x00ff00,
      timestamp: new Date(),
      footer: { text: `Channel ID: ${channel.id}` }
    };
    logChannel.send({ embeds: [embed] }).catch(() => {});
  });
  
  // Channel Delete
  client.on("channelDelete", async (channel) => {
    const config = getConfig(channel.guild?.id);
    if (!config?.logging?.enabled || !config.logging.events?.includes("channelDelete")) return;
    
    const logChannel = channel.guild.channels.cache.get(config.logging.channel);
    if (!logChannel) return;
    
    const embed = {
      title: "➖ Channel Deleted",
      description: `**Channel:** ${channel.name} (${channel.type})\n**Category:** ${channel.parent?.name || "None"}`,
      color: 0xff0000,
      timestamp: new Date(),
      footer: { text: `Channel ID: ${channel.id}` }
    };
    logChannel.send({ embeds: [embed] }).catch(() => {});
  });
  
  // Channel Update
  client.on("channelUpdate", async (oldChannel, newChannel) => {
    const config = getConfig(newChannel.guild?.id);
    if (!config?.logging?.enabled || !config.logging.events?.includes("channelUpdate")) return;
    
    const changes = [];
    if (oldChannel.name !== newChannel.name) changes.push(`Name: ${oldChannel.name} → ${newChannel.name}`);
    if (oldChannel.topic !== newChannel.topic) changes.push("Topic changed");
    if (oldChannel.nsfw !== newChannel.nsfw) changes.push(`NSFW: ${oldChannel.nsfw} → ${newChannel.nsfw}`);
    if (oldChannel.bitrate !== newChannel.bitrate) changes.push(`Bitrate: ${oldChannel.bitrate} → ${newChannel.bitrate}`);
    if (oldChannel.userLimit !== newChannel.userLimit) changes.push(`User Limit: ${oldChannel.userLimit} → ${newChannel.userLimit}`);
    if (oldChannel.parentId !== newChannel.parentId) changes.push(`Category: ${oldChannel.parent?.name || "None"} → ${newChannel.parent?.name || "None"}`);
    
    if (changes.length === 0) return;
    
    const logChannel = newChannel.guild.channels.cache.get(config.logging.channel);
    if (!logChannel) return;
    
    const embed = {
      title: "🔄 Channel Updated",
      description: `**Channel:** ${newChannel.name}\n**Changes:**\n${changes.map(c => `• ${c}`).join("\n")}`,
      color: 0xffaa00,
      timestamp: new Date(),
      footer: { text: `Channel ID: ${newChannel.id}` }
    };
    logChannel.send({ embeds: [embed] }).catch(() => {});
  });
  
  // Guild Update
  client.on("guildUpdate", async (oldGuild, newGuild) => {
    const config = getConfig(newGuild.id);
    if (!config?.logging?.enabled || !config.logging.events?.includes("guildUpdate")) return;
    
    const changes = [];
    if (oldGuild.name !== newGuild.name) changes.push(`Name: ${oldGuild.name} → ${newGuild.name}`);
    if (oldGuild.icon !== newGuild.icon) changes.push("Icon changed");
    if (oldGuild.banner !== newGuild.banner) changes.push("Banner changed");
    if (oldGuild.verificationLevel !== newGuild.verificationLevel) changes.push(`Verification: ${oldGuild.verificationLevel} → ${newGuild.verificationLevel}`);
    if (oldGuild.explicitContentFilter !== newGuild.explicitContentFilter) changes.push(`Content Filter: ${oldGuild.explicitContentFilter} → ${newGuild.explicitContentFilter}`);
    if (oldGuild.defaultMessageNotifications !== newGuild.defaultMessageNotifications) changes.push(`Notifications: ${oldGuild.defaultMessageNotifications} → ${newGuild.defaultMessageNotifications}`);
    if (oldGuild.vanityURLCode !== newGuild.vanityURLCode) changes.push(`Vanity URL: ${oldGuild.vanityURLCode || "None"} → ${newGuild.vanityURLCode || "None"}`);
    if (oldGuild.afkChannelId !== newGuild.afkChannelId) changes.push("AFK channel changed");
    if (oldGuild.afkTimeout !== newGuild.afkTimeout) changes.push(`AFK Timeout: ${oldGuild.afkTimeout} → ${newGuild.afkTimeout}`);
    if (oldGuild.systemChannelId !== newGuild.systemChannelId) changes.push("System channel changed");
    if (oldGuild.rulesChannelId !== newGuild.rulesChannelId) changes.push("Rules channel changed");
    
    if (changes.length === 0) return;
    
    const channel = newGuild.channels.cache.get(config.logging.channel);
    if (!channel) return;
    
    const embed = {
      title: "🔄 Server Updated",
      description: `**Changes:**\n${changes.map(c => `• ${c}`).join("\n")}`,
      color: 0xffaa00,
      timestamp: new Date()
    };
    channel.send({ embeds: [embed] }).catch(() => {});
  });
  
  // Voice State Update
  client.on("voiceStateUpdate", async (oldState, newState) => {
    const config = getConfig(newState.guild?.id);
    if (!config?.logging?.enabled || !config.logging.events?.includes("voiceStateUpdate")) return;
    
    const channel = newState.guild.channels.cache.get(config.logging.channel);
    if (!channel) return;
    
    const changes = [];
    if (oldState.channelId !== newState.channelId) {
      const oldCh = oldState.channel ? `#${oldState.channel.name}` : "None";
      const newCh = newState.channel ? `#${newState.channel.name}` : "None";
      changes.push(`Channel: ${oldCh} → ${newCh}`);
    }
    if (oldState.mute !== newState.mute) changes.push(`Mute: ${oldState.mute} → ${newState.mute}`);
    if (oldState.deaf !== newState.deaf) changes.push(`Deaf: ${oldState.deaf} → ${newState.deaf}`);
    if (oldState.selfMute !== newState.selfMute) changes.push(`Self Mute: ${oldState.selfMute} → ${newState.selfMute}`);
    if (oldState.selfDeaf !== newState.selfDeaf) changes.push(`Self Deaf: ${oldState.selfDeaf} → ${newState.selfDeaf}`);
    if (oldState.streaming !== newState.streaming) changes.push(`Streaming: ${oldState.streaming} → ${newState.streaming}`);
    
    if (changes.length === 0) return;
    
    const embed = {
      title: "🎙️ Voice State Update",
      description: `**User:** ${newState.member?.user.tag}\n**Changes:**\n${changes.map(c => `• ${c}`).join("\n")}`,
      color: 0x00ffff,
      timestamp: new Date(),
      footer: { text: `User ID: ${newState.id}` }
    };
    channel.send({ embeds: [embed] }).catch(() => {});
  });
}