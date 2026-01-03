const https = require("https");

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function postJson(url, payload, { timeoutMs = 7000 } = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const body = Buffer.from(JSON.stringify(payload), "utf8");

    const req = https.request(
      {
        method: "POST",
        hostname: u.hostname,
        path: u.pathname + u.search,
        headers: {
          "Content-Type": "application/json",
          "Content-Length": body.length,
          "User-Agent": "discord-webhook-logger",
        },
        timeout: timeoutMs,
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          // Discord renvoie souvent 204 No Content si OK
          if (res.statusCode >= 200 && res.statusCode < 300) return resolve({ ok: true });

          // gestion basique rate limit
          if (res.statusCode === 429) {
            try {
              const json = JSON.parse(data || "{}");
              return resolve({ ok: false, rateLimited: true, retryAfterMs: Math.ceil((json.retry_after || 1) * 1000) });
            } catch {
              return resolve({ ok: false, rateLimited: true, retryAfterMs: 1000 });
            }
          }

          return resolve({ ok: false, status: res.statusCode, body: data });
        });
      }
    );

    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function createDiscordWebhookLogger(webhookUrl, { defaultUsername, defaultAvatarUrl } = {}) {
  if (!webhookUrl) throw new Error("webhookUrl manquant");

  const queue = [];
  let running = false;

  async function runQueue() {
    if (running) return;
    running = true;

    while (queue.length) {
      const job = queue.shift();

      const payload = {
        content: job.content ?? undefined,
        embeds: job.embeds ?? undefined,
        username: job.username ?? defaultUsername,
        avatar_url: job.avatarUrl ?? defaultAvatarUrl,
        allowed_mentions: job.allowedMentions ?? { parse: [] },
      };

      try {
        const res = await postJson(webhookUrl, payload);

        if (res?.rateLimited) {
          await sleep(res.retryAfterMs || 1000);
          const retry = await postJson(webhookUrl, payload);
          if (!retry.ok) job.onError?.(retry);
          else job.onOk?.();
        } else {
          if (!res.ok) job.onError?.(res);
          else job.onOk?.();
        }
      } catch (e) {
        job.onError?.({ ok: false, error: e.message });
      }

      await sleep(150);
    }

    running = false;
  }

  function send({ content, embeds, username, avatarUrl, allowedMentions } = {}) {
    return new Promise((resolve, reject) => {
      queue.push({
        content,
        embeds,
        username,
        avatarUrl,
        allowedMentions,
        onOk: resolve,
        onError: (err) => reject(err),
      });
      runQueue();
    });
  }

  function log({ level = "info", title, message, fields = [], footer } = {}) {
    const color =
      level === "success" ? 0x2ecc71 :
      level === "warn" ? 0xf1c40f :
      level === "error" ? 0xe74c3c :
      0x3498db;

    const embed = {
      title: title || `Log (${level})`,
      description: message || "",
      color,
      fields: (fields || []).slice(0, 25),
      timestamp: new Date().toISOString(),
      footer: footer ? { text: footer } : undefined,
    };

    return send({ embeds: [embed] });
  }

  return { send, log };
}

module.exports = { createDiscordWebhookLogger };