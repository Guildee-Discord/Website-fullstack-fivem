const path = require("path");
const { checkModuleUpdate } = require("../../function/github");
const { createDiscordWebhookLogger } = require("../../function/discordWebhook");
const { createFileLogger } = require("../../function/fileLogger");
const config_webhook = require("../../../configuration/webhook.json");

module.exports = {
  meta: require("./module.json"),

  async init(ctx) {
    await checkModuleUpdate({
      logger: ctx.logger,
      meta: module.exports.meta,
      debug: false,
    });

    const logsDir = path.join(process.cwd(), "logs");
    const fileLogger = createFileLogger({ baseDir: logsDir });
    ctx.fileLogs = fileLogger;

    const urls = config_webhook?.webhooks?.url || {};
    const customs = config_webhook?.webhooks?.custom || {};

    ctx.webhooks = {};
    let count = 0;

    for (const name of Object.keys(urls)) {
      const url = urls[name];
      if (!url) continue;

      const custom = customs[name] || {};

      const client = createDiscordWebhookLogger(url, {
        defaultUsername: custom.username || name,
        defaultAvatarUrl: custom.avatar_url,
      });

      ctx.webhooks[name] = {
        log: client.log,
        send: client.send,
      };

      count++;
    }

    if (count === 0) {
      ctx.logger?.warn?.("[webhook] aucun webhook configuré");
      ctx._resolveWebhooksReady?.(false);
      return;
    }

    ctx._resolveWebhooksReady?.(true);
  },
};