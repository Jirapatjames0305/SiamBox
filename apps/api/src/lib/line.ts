// LINE Messaging API — push a text message to a configured group chat.
// Requires LINE_CHANNEL_ACCESS_TOKEN and LINE_GROUP_ID env vars.
// Obtain a channel access token from LINE Developers Console → Messaging API channel.
// Get the group ID by listening to join/message webhook events once the bot is added to the group.

export function isLineEnabled(): boolean {
  return Boolean(process.env.LINE_CHANNEL_ACCESS_TOKEN && process.env.LINE_GROUP_ID);
}

export async function notifyLineGroup(text: string): Promise<void> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const groupId = process.env.LINE_GROUP_ID;
  if (!token || !groupId) return;

  const res = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      to: groupId,
      messages: [{ type: "text", text }],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[LINE] push failed ${res.status}: ${body}`);
  }
}
