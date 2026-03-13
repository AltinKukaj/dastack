/** Dashboard data helpers — activity data generation, device breakdown, and security score calculation. */
export interface RecentSession {
  createdAt: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface ActivityPoint {
  name: string;
  sessions: number;
}

export interface DeviceBreakdownItem {
  name: "Desktop" | "Mobile" | "Other";
  value: number;
  color: string;
}

export function generateActivityData(
  recentSessions: RecentSession[],
): ActivityPoint[] {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const now = new Date();
  const data: ActivityPoint[] = [];

  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    const sessionsOnDay = recentSessions.filter((session) => {
      const sessionDate = new Date(session.createdAt);
      return sessionDate.toDateString() === date.toDateString();
    }).length;

    data.push({
      name: days[date.getDay()] ?? "Day",
      sessions: sessionsOnDay,
    });
  }

  return data;
}

export function getDeviceBreakdown(
  recentSessions: RecentSession[],
): DeviceBreakdownItem[] {
  let desktop = 0;
  let mobile = 0;
  let other = 0;

  for (const session of recentSessions) {
    const userAgent = session.userAgent?.toLowerCase() ?? "";

    if (
      userAgent.includes("mobile") ||
      userAgent.includes("android") ||
      userAgent.includes("iphone")
    ) {
      mobile += 1;
    } else if (
      userAgent.includes("windows") ||
      userAgent.includes("mac") ||
      userAgent.includes("linux")
    ) {
      desktop += 1;
    } else {
      other += 1;
    }
  }

  const devices: DeviceBreakdownItem[] = [
    { name: "Desktop", value: desktop, color: "#a1a1aa" },
    { name: "Mobile", value: mobile, color: "#71717a" },
    { name: "Other", value: other, color: "#3f3f46" },
  ];

  return devices.filter((item) => item.value > 0);
}

export function getSecurityScore(
  emailVerified: boolean,
  twoFactorEnabled: boolean,
  passkeys: number,
  accounts: number,
) {
  let score = 0;

  if (emailVerified) score += 30;
  if (twoFactorEnabled) score += 30;
  if (passkeys > 0) score += 25;
  if (accounts > 1) score += 15;

  return score;
}
