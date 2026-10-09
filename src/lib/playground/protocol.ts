import { parseRuntimeMessage as parseMessage } from "../../../playground-preview/protocol.mjs";
import type { WebFiles } from "../playground-preview";

export { PLAYGROUND_CHANNEL, MAX_CODE_LENGTH } from "../../../playground-preview/protocol.mjs";
export type RunMessage = {
  channel: "zulcode-playground";
  type: "run";
  runId: string;
  files: WebFiles;
};
export type RuntimeMessage = {
  channel: "zulcode-playground";
  runId: string;
} & (
  | { type: "booted"; tone: "normal"; text: "" }
  | { type: "console"; tone: "normal" | "warning" | "error"; text: string }
  | { type: "ready"; tone: "success"; text: string }
  | { type: "error" | "limit"; tone: "error"; text: string }
);
export function parseRuntimeMessage(value: unknown): RuntimeMessage | null {
  return parseMessage(value) as RuntimeMessage | null;
}
