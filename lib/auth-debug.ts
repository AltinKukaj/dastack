type AuthDebugData = Record<string, unknown> | undefined;

const AUTH_DEBUG_ENABLED = process.env.AUTH_DEBUG !== "0";

export function authDebug(event: string, data?: AuthDebugData) {
  if (!AUTH_DEBUG_ENABLED) return;
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[auth-debug][server][${timestamp}] ${event}`, data);
    return;
  }
  console.log(`[auth-debug][server][${timestamp}] ${event}`);
}
