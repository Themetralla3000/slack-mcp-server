import type { WebClient } from "@slack/web-api";
import type { MessagesSendInput, MessagesSendOutput } from "./schemas.js";

export async function sendMessage(
  client: WebClient,
  input: MessagesSendInput
): Promise<MessagesSendOutput> {
  const response = await client.chat.postMessage({
    channel: input.channel_id,
    text: input.text,
    ...(input.thread_ts !== undefined && { thread_ts: input.thread_ts }),
  });

  return {
    ts: response.ts ?? "",
    channel: response.channel ?? "",
    text: input.text,
  };
}
