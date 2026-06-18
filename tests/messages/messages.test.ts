import { describe, it, expect, vi, beforeEach } from "vitest";
import type { WebClient } from "@slack/web-api";
import { sendMessage } from "../../src/messages/service.js";
import { MessagesSendInputSchema } from "../../src/messages/schemas.js";

function makeMockClient(): WebClient {
  return {
    chat: {
      postMessage: vi.fn(),
    },
  } as unknown as WebClient;
}

describe("sendMessage", () => {
  let client: WebClient;

  beforeEach(() => {
    client = makeMockClient();
  });

  it("maps chat.postMessage response to output schema", async () => {
    vi.mocked(client.chat.postMessage).mockResolvedValue({
      ok: true,
      ts: "1709769600.000100",
      channel: "C001",
    } as never);

    const result = await sendMessage(client, {
      channel_id: "C001",
      text: "Hello, world!",
    });

    expect(result).toEqual({
      ts: "1709769600.000100",
      channel: "C001",
      text: "Hello, world!",
    });
    expect(client.chat.postMessage).toHaveBeenCalledWith({
      channel: "C001",
      text: "Hello, world!",
    });
  });

  it("forwards thread_ts when provided", async () => {
    vi.mocked(client.chat.postMessage).mockResolvedValue({
      ok: true,
      ts: "1709769700.000200",
      channel: "C001",
    } as never);

    await sendMessage(client, {
      channel_id: "C001",
      text: "A threaded reply",
      thread_ts: "1709769600.000100",
    });

    expect(client.chat.postMessage).toHaveBeenCalledWith({
      channel: "C001",
      text: "A threaded reply",
      thread_ts: "1709769600.000100",
    });
  });

  it("does not include thread_ts in payload when not provided", async () => {
    vi.mocked(client.chat.postMessage).mockResolvedValue({
      ok: true,
      ts: "1709769600.000100",
      channel: "C001",
    } as never);

    await sendMessage(client, { channel_id: "C001", text: "Standalone message" });

    const callArgs = vi.mocked(client.chat.postMessage).mock.calls[0][0];
    expect(callArgs).not.toHaveProperty("thread_ts");
  });
});

describe("MessagesSendInputSchema validation", () => {
  it("rejects empty text", () => {
    const result = MessagesSendInputSchema.safeParse({ channel_id: "C001", text: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing channel_id", () => {
    const result = MessagesSendInputSchema.safeParse({ text: "Hello" });
    expect(result.success).toBe(false);
  });

  it("accepts valid input without thread_ts", () => {
    const result = MessagesSendInputSchema.safeParse({ channel_id: "C001", text: "Hello" });
    expect(result.success).toBe(true);
  });

  it("accepts valid input with thread_ts", () => {
    const result = MessagesSendInputSchema.safeParse({
      channel_id: "C001",
      text: "Reply",
      thread_ts: "1709769600.000100",
    });
    expect(result.success).toBe(true);
  });
});
