import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

export interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  content?: React.ReactNode;
}

export interface ExpandableTabsProps {
  tabs: Tab[];
  defaultTab?: string;
  activeTab?: string;
  className?: string;
  onTabChange?: (tabId: string) => void;
}

export function ExpandableTabs({
  tabs,
  defaultTab,
  activeTab: controlledActiveTab,
  className,
  onTabChange,
}: ExpandableTabsProps) {
  const [internalActiveTab, setInternalActiveTab] = React.useState<string>(
    defaultTab || tabs[0]?.id || "",
  );
  const [hoveredTab, setHoveredTab] = React.useState<string | null>(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab;

  const handleTabClick = (tabId: string) => {
    if (controlledActiveTab === undefined) {
      setInternalActiveTab(tabId);
    }
    onTabChange?.(tabId);
  };

  const activeTabData = tabs.find((tab) => tab.id === activeTab);

  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "flex items-center gap-2 rounded-full p-1 transition-colors",
          isDark ? "bg-black border border-gray-800" : "bg-gray-100",
        )}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const isHovered = hoveredTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              onMouseEnter={() => setHoveredTab(tab.id)}
              onMouseLeave={() => setHoveredTab(null)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full transition-all cursor-pointer",
                isActive
                  ? isDark
                    ? "bg-gray-900 shadow-sm text-white"
                    : "bg-white shadow-sm text-gray-900"
                  : isDark
                    ? "text-gray-400 hover:text-white"
                    : "text-gray-600 hover:text-gray-900",
              )}
            >
              {tab.icon && <span className="w-5 h-5 shrink-0">{tab.icon}</span>}
              <AnimatePresence mode="wait">
                {isHovered && (
                  <motion.span
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: "auto", opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm font-medium whitespace-nowrap overflow-hidden"
                  >
                    {tab.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </div>

      {activeTabData?.content && (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mt-4"
          >
            {activeTabData.content}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
