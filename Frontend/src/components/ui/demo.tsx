import { ExpandableTabs, Tab } from "@/components/ui/expandable-tabs";
import { Home, Bell, Settings, HelpCircle, Shield } from "lucide-react";

export function ExpandableTabsDemo() {
  const tabs: Tab[] = [
    {
      id: "home",
      label: "Home",
      icon: <Home className="w-5 h-5" />,
      content: <div className="p-4">Home content goes here</div>,
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: <Bell className="w-5 h-5" />,
      content: <div className="p-4">Notifications content goes here</div>,
    },
    {
      id: "settings",
      label: "Settings",
      icon: <Settings className="w-5 h-5" />,
      content: <div className="p-4">Settings content goes here</div>,
    },
    {
      id: "support",
      label: "Support",
      icon: <HelpCircle className="w-5 h-5" />,
      content: <div className="p-4">Support content goes here</div>,
    },
    {
      id: "about",
      label: "About Us",
      icon: <Shield className="w-5 h-5" />,
      content: <div className="p-4">About Us content goes here</div>,
    },
  ];

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Expandable Tabs Demo</h2>
      <ExpandableTabs
        tabs={tabs}
        defaultTab="home"
        onTabChange={(tabId) => console.log("Tab changed:", tabId)}
      />
    </div>
  );
}
