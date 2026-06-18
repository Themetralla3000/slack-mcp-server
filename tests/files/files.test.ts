import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { WebClient } from "@slack/web-api";
import { uploadFile } from "../../src/files/service.js";
import { FilesUploadInputSchema } from "../../src/files/schemas.js";

// Use real tmp file for existence checks
import { writeFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

function makeMockClient(): WebClient {
  return {
    files: {
      uploadV2: vi.fn(),
    },
  } as unknown as WebClient;
}

const FAKE_UPLOAD_RESPONSE = {
  files: [
    {
      id: "F12345678",
      name: "report.pdf",
      permalink: "https://slack.com/files/U001/F12345678/report.pdf",
    },
  ],
};

describe("uploadFile", () => {
  let client: WebClient;
  let tmpFile: string;

  beforeEach(() => {
    client = makeMockClient();
    // Create a real temp file so existsSync passes
    tmpFile = join(tmpdir(), `mcp-slack-test-${Date.now()}.pdf`);
    writeFileSync(tmpFile, "fake pdf content");
    vi.mocked(client.files.uploadV2).mockResolvedValue(FAKE_UPLOAD_RESPONSE as never);
  });

  // Clean up temp file after each test
  afterEach(() => {
    try { unlinkSync(tmpFile); } catch { /* already gone */ }
  });

  it("throws before calling uploadV2 when file does not exist", async () => {
    await expect(
      uploadFile(client, { file_path: "/nonexistent/file.pdf", channel_id: "C001" })
    ).rejects.toThrow("File not found: /nonexistent/file.pdf");

    expect(client.files.uploadV2).not.toHaveBeenCalled();
  });

  it("calls uploadV2 with correct channel_id and filename", async () => {
    await uploadFile(client, { file_path: tmpFile, channel_id: "C001" });

    expect(client.files.uploadV2).toHaveBeenCalledWith(
      expect.objectContaining({ channel_id: "C001" })
    );
  });

  it("derives filename from basename of file_path when filename is not provided", async () => {
    await uploadFile(client, { file_path: tmpFile, channel_id: "C001" });

    const callArg = vi.mocked(client.files.uploadV2).mock.calls[0][0] as Record<string, unknown>;
    expect(callArg.filename).toBe(tmpFile.split("/").pop());
  });

  it("uses custom filename when provided", async () => {
    await uploadFile(client, { file_path: tmpFile, channel_id: "C001", filename: "quarterly-report.pdf" });

    const callArg = vi.mocked(client.files.uploadV2).mock.calls[0][0] as Record<string, unknown>;
    expect(callArg.filename).toBe("quarterly-report.pdf");
  });

  it("maps uploadV2 response to output schema correctly", async () => {
    const result = await uploadFile(client, { file_path: tmpFile, channel_id: "C001" });

    expect(result).toEqual({
      id: "F12345678",
      name: "report.pdf",
      permalink: "https://slack.com/files/U001/F12345678/report.pdf",
      channel: "C001",
    });
  });

  // US2: initial_comment forwarding
  it("forwards initial_comment to uploadV2 when provided", async () => {
    await uploadFile(client, {
      file_path: tmpFile,
      channel_id: "C001",
      initial_comment: "Here is the Q1 report",
    });

    const callArg = vi.mocked(client.files.uploadV2).mock.calls[0][0] as Record<string, unknown>;
    expect(callArg.initial_comment).toBe("Here is the Q1 report");
  });

  it("does not include initial_comment in uploadV2 call when not provided", async () => {
    await uploadFile(client, { file_path: tmpFile, channel_id: "C001" });

    const callArg = vi.mocked(client.files.uploadV2).mock.calls[0][0] as Record<string, unknown>;
    expect(callArg).not.toHaveProperty("initial_comment");
  });
});

describe("FilesUploadInputSchema validation", () => {
  it("rejects missing file_path", () => {
    const result = FilesUploadInputSchema.safeParse({ channel_id: "C001" });
    expect(result.success).toBe(false);
  });

  it("rejects empty file_path", () => {
    const result = FilesUploadInputSchema.safeParse({ file_path: "", channel_id: "C001" });
    expect(result.success).toBe(false);
  });

  it("rejects missing channel_id", () => {
    const result = FilesUploadInputSchema.safeParse({ file_path: "/tmp/file.pdf" });
    expect(result.success).toBe(false);
  });

  it("rejects empty filename when provided", () => {
    const result = FilesUploadInputSchema.safeParse({
      file_path: "/tmp/file.pdf",
      channel_id: "C001",
      filename: "",
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid input with all optional fields", () => {
    const result = FilesUploadInputSchema.safeParse({
      file_path: "/tmp/file.pdf",
      channel_id: "C001",
      filename: "report.pdf",
      initial_comment: "See attached",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid input with required fields only", () => {
    const result = FilesUploadInputSchema.safeParse({
      file_path: "/tmp/file.pdf",
      channel_id: "C001",
    });
    expect(result.success).toBe(true);
  });
});
