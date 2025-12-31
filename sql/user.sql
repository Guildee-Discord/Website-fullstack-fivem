ALTER TABLE users
  ADD COLUMN discord_id VARCHAR(32) NULL,
  ADD COLUMN discord_username VARCHAR(100) NULL,
  ADD COLUMN discord_avatar VARCHAR(100) NULL,
  ADD COLUMN discord_avatar_decoration_asset VARCHAR(100) NULL;
ALTER TABLE users
  ADD UNIQUE KEY uniq_discord_id (discord_id);