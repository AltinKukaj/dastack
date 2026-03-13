/** Settings layout — sub-layout with dynamic tab bar (Files tab conditionally added). */
import { isUploadsEnabled } from "@/lib/features";
import { SettingsTabs, type SettingsTab } from "./settings-tabs";

const BASE_TABS: SettingsTab[] = [
  { href: "/dashboard/settings", icon: "profile", label: "Profile" },
  { href: "/dashboard/settings/security", icon: "security", label: "Security" },
  { href: "/dashboard/settings/passkeys", icon: "passkeys", label: "Passkeys" },
  { href: "/dashboard/settings/sessions", icon: "sessions", label: "Sessions" },
  { href: "/dashboard/settings/danger", icon: "danger", label: "Danger" },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tabs: SettingsTab[] = isUploadsEnabled()
    ? [...BASE_TABS.slice(0, 4), { href: "/dashboard/settings/files", icon: "files", label: "Files" }, BASE_TABS[4]!]
    : BASE_TABS;

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <p className="section-label">Settings</p>
        <h1 className="mt-1 heading-page">Account settings</h1>
      </div>

      <SettingsTabs tabs={tabs} />

      <div className="animate-fade-in">
        {children}
      </div>
    </div>
  );
}
