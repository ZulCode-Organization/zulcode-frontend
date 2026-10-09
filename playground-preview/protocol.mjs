export const PLAYGROUND_CHANNEL = "zulcode-playground";
export const MAX_CODE_LENGTH = 100_000;
export const MAX_OUTPUT_LENGTH = 12_000;

function record(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function exactKeys(value, keys) {
  return Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
}
function validRunId(value) {
  return typeof value === "string" && /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(value);
}
export function isRunMessage(value) {
  return record(value) && exactKeys(value, ["channel", "type", "runId", "files"]) &&
    value.channel === PLAYGROUND_CHANNEL && value.type === "run" && validRunId(value.runId) &&
    record(value.files) && exactKeys(value.files, ["html", "css", "javascript"]) &&
    Object.values(value.files).every(source => typeof source === "string" && source.length <= MAX_CODE_LENGTH);
}
export function parseRuntimeMessage(value) {
  if (!record(value) || !exactKeys(value, ["channel", "type", "runId", "tone", "text"]) ||
      value.channel !== PLAYGROUND_CHANNEL || !validRunId(value.runId) ||
      typeof value.text !== "string" || value.text.length > MAX_OUTPUT_LENGTH) return null;
  if (value.type === "booted") return value.tone === "normal" && value.text === "" ? value : null;
  if (value.type === "ready") return value.tone === "success" ? value : null;
  if (value.type === "error" || value.type === "limit") return value.tone === "error" ? value : null;
  if (value.type === "console" && ["normal", "warning", "error"].includes(value.tone)) return value;
  return null;
}
