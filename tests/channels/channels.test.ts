import { describe, it, expect, vi, beforeEach } from "vitest";
import type { WebClient } from "@slack/web-api";
import { createChannel, inviteUsers, listChannels } from "../../src/channels/service.js";
import { ChannelsCreateInputSchema, ChannelsInviteInputSchema } from "../../src/channels/schemas.js";

function makeMockClient(): WebClient {
  return {
    conversations: {
      list: vi.fn(),
      create: vi.fn(),
      invite: vi.fn(),
    },
  } as unknown as WebClient;
}

describe("listChannels", () => {
  let client: WebClient;

  beforeEach(() => {
    client = makeMockClient();
  });

  it("maps conversations.list response to output schema", async () => {
    vi.mocked(client.conversations.list).mockResolvedValue({
      ok: true,
      channels: [
        { id: "C001", name: "general", is_private: false, num_members: 10 },
        { id: "C002", name: "random", is_private: false, num_members: 5 },
      ],
    } as never);

    const result = await listChannels(client, { limit: 100, exclude_archived: true });

    expect(result.channels).toHaveLength(2);
    expect(result.channels[0]).toEqual({
      id: "C001",
      name: "general",
      is_private: false,
      num_members: 10,
    });
    expect(client.conversations.list).toHaveBeenCalledWith({
      limit: 100,
      exclude_archived: true,
    });
  });

  it("forwards exclude_archived: false to include archived channels", async () => {
    vi.mocked(client.conversations.list).mockResolvedValue({
      ok: true,
      channels: [],
    } as never);

    await listChannels(client, { limit: 50, exclude_archived: false });

    expect(client.conversations.list).toHaveBeenCalledWith({
      limit: 50,
      exclude_archived: false,
    });
  });

  it("returns empty array when workspace has no channels", async () => {
    vi.mocked(client.conversations.list).mockResolvedValue({
      ok: true,
      channels: [],
    } as never);

    const result = await listChannels(client, { limit: 100, exclude_archived: true });

    expect(result.channels).toHaveLength(0);
  });

  it("handles missing optional fields with safe defaults", async () => {
    vi.mocked(client.conversations.list).mockResolvedValue({
      ok: true,
      channels: [{ id: undefined, name: undefined, is_private: undefined, num_members: undefined }],
    } as never);

    const result = await listChannels(client, { limit: 100, exclude_archived: true });

    expect(result.channels[0]).toEqual({
      id: "",
      name: "",
      is_private: false,
      num_members: 0,
    });
  });
});

describe("createChannel", () => {
  let client: WebClient;

  beforeEach(() => {
    client = makeMockClient();
  });

  it("passes name and is_private to conversations.create and maps response", async () => {
    vi.mocked(client.conversations.create).mockResolvedValue({
      ok: true,
      channel: { id: "C003", name: "incident-2024", is_private: false, created: 1709769600 },
    } as never);

    const result = await createChannel(client, { name: "incident-2024", is_private: false });

    expect(result).toEqual({
      id: "C003",
      name: "incident-2024",
      is_private: false,
      created: 1709769600,
    });
    expect(client.conversations.create).toHaveBeenCalledWith({
      name: "incident-2024",
      is_private: false,
    });
  });

  it("creates a private channel when is_private is true", async () => {
    vi.mocked(client.conversations.create).mockResolvedValue({
      ok: true,
      channel: { id: "C004", name: "secret-project", is_private: true, created: 1709769700 },
    } as never);

    const result = await createChannel(client, { name: "secret-project", is_private: true });

    expect(result.is_private).toBe(true);
  });
});

describe("inviteUsers", () => {
  let client: WebClient;

  beforeEach(() => {
    client = makeMockClient();
  });

  it("joins user_ids with comma and passes to conversations.invite", async () => {
    vi.mocked(client.conversations.invite).mockResolvedValue({
      ok: true,
      channel: { id: "C003", name: "incident-2024", num_members: 3 },
    } as never);

    const result = await inviteUsers(client, {
      channel_id: "C003",
      user_ids: ["U001", "U002"],
    });

    expect(result).toEqual({ id: "C003", name: "incident-2024", num_members: 3 });
    expect(client.conversations.invite).toHaveBeenCalledWith({
      channel: "C003",
      users: "U001,U002",
    });
  });

  it("works with a single user ID", async () => {
    vi.mocked(client.conversations.invite).mockResolvedValue({
      ok: true,
      channel: { id: "C003", name: "incident-2024", num_members: 2 },
    } as never);

    await inviteUsers(client, { channel_id: "C003", user_ids: ["U001"] });

    expect(client.conversations.invite).toHaveBeenCalledWith({
      channel: "C003",
      users: "U001",
    });
  });
});

describe("ChannelsCreateInputSchema validation", () => {
  it("rejects names with uppercase letters", () => {
    const result = ChannelsCreateInputSchema.safeParse({ name: "MyChannel" });
    expect(result.success).toBe(false);
  });

  it("rejects names with spaces", () => {
    const result = ChannelsCreateInputSchema.safeParse({ name: "my channel" });
    expect(result.success).toBe(false);
  });

  it("accepts valid lowercase names", () => {
    const result = ChannelsCreateInputSchema.safeParse({ name: "my-channel_01" });
    expect(result.success).toBe(true);
  });
});

describe("ChannelsInviteInputSchema validation", () => {
  it("rejects empty user_ids array", () => {
    const result = ChannelsInviteInputSchema.safeParse({ channel_id: "C001", user_ids: [] });
    expect(result.success).toBe(false);
  });

  it("accepts a single user ID", () => {
    const result = ChannelsInviteInputSchema.safeParse({ channel_id: "C001", user_ids: ["U001"] });
    expect(result.success).toBe(true);
  });
});
