type AuthDebugData = Record<string, unknown> | undefined;

function isAuthDebugEnabled(): boolean {
  if (typeof window === "undefined") return false;
  const flag = window.localStorage.getItem("AUTH_DEBUG");
  // Default to enabled for rapid production debugging.
  return flag !== "0";
}

export function authDebugClient(event: string, data?: AuthDebugData) {
  if (!isAuthDebugEnabled()) return;
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[auth-debug][client][${timestamp}] ${event}`, data);
    return;
  }
  console.log(`[auth-debug][client][${timestamp}] ${event}`);
}
