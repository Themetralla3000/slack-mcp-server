import { existsSync, readFileSync } from "node:fs";
import { basename } from "node:path";
import type { WebClient } from "@slack/web-api";
import type { FilesUploadInput, FilesUploadOutput } from "./schemas.js";

export async function uploadFile(
  client: WebClient,
  input: FilesUploadInput
): Promise<FilesUploadOutput> {
  if (!existsSync(input.file_path)) {
    throw new Error(`File not found: ${input.file_path}`);
  }

  const fileBuffer = readFileSync(input.file_path);
  const displayName = input.filename ?? basename(input.file_path);

  const result = await client.files.uploadV2({
    channel_id: input.channel_id,
    filename: displayName,
    file: fileBuffer,
    ...(input.initial_comment !== undefined && { initial_comment: input.initial_comment }),
  }) as { files?: Array<{ id?: string; name?: string; permalink?: string }> };

  const uploaded = Array.isArray(result.files) ? result.files[0] : undefined;
  return {
    id: uploaded?.id ?? "",
    name: uploaded?.name ?? displayName,
    permalink: uploaded?.permalink ?? "",
    channel: input.channel_id,
  };
}
