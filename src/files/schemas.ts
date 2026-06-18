import { z } from "zod";

// ── files_upload ─────────────────────────────────────────────────────────────

export const FilesUploadInputSchema = z.object({
  file_path: z.string().min(1),
  channel_id: z.string().min(1),
  filename: z.string().min(1).optional(),
  initial_comment: z.string().optional(),
});
export type FilesUploadInput = z.infer<typeof FilesUploadInputSchema>;

export const FilesUploadOutputSchema = z.object({
  id: z.string(),
  name: z.string(),
  permalink: z.string(),
  channel: z.string(),
});
export type FilesUploadOutput = z.infer<typeof FilesUploadOutputSchema>;
