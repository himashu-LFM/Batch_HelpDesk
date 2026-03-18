export type LogLevel = "info" | "error";

export function log(level: LogLevel, message: string, meta: Record<string, unknown> = {}) {
  const base = {
    level,
    message,
    timestamp: new Date().toISOString()
  };
  console.log(JSON.stringify({ ...base, ...meta }));
}