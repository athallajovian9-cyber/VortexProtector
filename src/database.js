import { Database } from "better-sqlite3";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";

const DB_PATH = join(process.cwd(), "data", "protector.db");

if (!existsSync(join(process.cwd(), "data"))) {
  mkdirSync(join(process.cwd(), "data"), { recursive: true });
}

export const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS punishments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    moderator_id TEXT NOT NULL,
    type TEXT NOT NULL,
    reason TEXT,
    duration INTEGER,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    expires_at INTEGER,
    active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS warnings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    moderator_id TEXT NOT NULL,
    reason TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS config (
    guild_id TEXT PRIMARY KEY,
    settings TEXT NOT NULL,
    updated_at INTEGER DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS raid_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS join_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
  );

  CREATE INDEX IF NOT EXISTS idx_punishments_guild_user ON punishments(guild_id, user_id);
  CREATE INDEX IF NOT EXISTS idx_warnings_guild_user ON warnings(guild_id, user_id);
  CREATE INDEX IF NOT EXISTS idx_raid_log_guild ON raid_log(guild_id);
  CREATE INDEX IF NOT EXISTS idx_join_log_guild ON join_log(guild_id);
`);

export function getConfig(guildId) {
  const row = db.prepare("SELECT settings FROM config WHERE guild_id = ?").get(guildId);
  return row ? JSON.parse(row.settings) : null;
}

export function setConfig(guildId, settings) {
  db.prepare("INSERT OR REPLACE INTO config (guild_id, settings, updated_at) VALUES (?, ?, strftime('%s', 'now'))")
    .run(guildId, JSON.stringify(settings));
}

export function addPunishment(guildId, userId, moderatorId, type, reason, duration = 0) {
  const expiresAt = duration > 0 ? Date.now() + duration : 0;
  db.prepare(`
    INSERT INTO punishments (guild_id, user_id, moderator_id, type, reason, duration, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(guildId, userId, moderatorId, type, reason, duration, expiresAt);
}

export function getActivePunishments(guildId, userId) {
  return db.prepare(`
    SELECT * FROM punishments 
    WHERE guild_id = ? AND user_id = ? AND active = 1 AND (expires_at = 0 OR expires_at > ?)
  `).all(guildId, userId, Date.now());
}

export function deactivatePunishment(id) {
  db.prepare("UPDATE punishments SET active = 0 WHERE id = ?").run(id);
}

export function addWarning(guildId, userId, moderatorId, reason) {
  db.prepare(`
    INSERT INTO warnings (guild_id, user_id, moderator_id, reason)
    VALUES (?, ?, ?, ?)
  `).run(guildId, userId, moderatorId, reason);
}

export function getWarnings(guildId, userId) {
  return db.prepare("SELECT * FROM warnings WHERE guild_id = ? AND user_id = ? ORDER BY created_at DESC")
    .all(guildId, userId);
}

export function logRaid(guildId, userId, action) {
  db.prepare("INSERT INTO raid_log (guild_id, user_id, action) VALUES (?, ?, ?)")
    .run(guildId, userId, action);
}

export function getRecentJoins(guildId, interval) {
  const cutoff = Date.now() - interval;
  return db.prepare("SELECT COUNT(*) as count FROM join_log WHERE guild_id = ? AND created_at > ?")
    .get(guildId, cutoff);
}

export function logJoin(guildId, userId) {
  db.prepare("INSERT INTO join_log (guild_id, user_id) VALUES (?, ?)")
    .run(guildId, userId);
}

export function cleanupOldLogs() {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  db.prepare("DELETE FROM join_log WHERE created_at < ?").run(weekAgo);
  db.prepare("DELETE FROM raid_log WHERE created_at < ?").run(weekAgo);
}