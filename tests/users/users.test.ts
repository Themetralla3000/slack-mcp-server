import { describe, it, expect, vi, beforeEach } from "vitest";
import type { WebClient } from "@slack/web-api";
import { listUsers } from "../../src/users/service.js";

function makeMockClient(): WebClient {
  return {
    users: {
      list: vi.fn(),
    },
  } as unknown as WebClient;
}

describe("listUsers", () => {
  let client: WebClient;

  beforeEach(() => {
    client = makeMockClient();
  });

  it("maps users.list response to output schema", async () => {
    vi.mocked(client.users.list).mockResolvedValue({
      ok: true,
      members: [
        {
          id: "U001",
          name: "jane.doe",
          real_name: "Jane Doe",
          profile: { email: "jane@example.com" },
          is_bot: false,
        },
      ],
    } as never);

    const result = await listUsers(client, { limit: 100 });

    expect(result.members).toHaveLength(1);
    expect(result.members[0]).toEqual({
      id: "U001",
      name: "jane.doe",
      real_name: "Jane Doe",
      email: "jane@example.com",
      is_bot: false,
    });
  });

  it("forwards limit parameter to WebClient", async () => {
    vi.mocked(client.users.list).mockResolvedValue({
      ok: true,
      members: [],
    } as never);

    await listUsers(client, { limit: 25 });

    expect(client.users.list).toHaveBeenCalledWith({ limit: 25 });
  });

  it("sets is_bot: true for bot accounts", async () => {
    vi.mocked(client.users.list).mockResolvedValue({
      ok: true,
      members: [
        {
          id: "B001",
          name: "mybot",
          real_name: "My Bot",
          profile: { email: "" },
          is_bot: true,
        },
      ],
    } as never);

    const result = await listUsers(client, { limit: 100 });

    expect(result.members[0].is_bot).toBe(true);
  });

  it("returns empty array when workspace has no members", async () => {
    vi.mocked(client.users.list).mockResolvedValue({
      ok: true,
      members: [],
    } as never);

    const result = await listUsers(client, { limit: 100 });

    expect(result.members).toHaveLength(0);
  });
});
