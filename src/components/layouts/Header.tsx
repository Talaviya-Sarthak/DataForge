import React from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { ExpandableTabs, Tab } from "@/components/ui/expandable-tabs";
import { useTheme } from "@/contexts/ThemeContext";
import {
  HiUser,
  HiCog,
  HiQuestionMarkCircle,
  HiOutlineTable,
  HiOutlineAdjustments,
  HiLogout,
  HiBriefcase,
  HiInformationCircle,
  HiChip,
  HiOutlineSparkles,
  HiHome,
} from "react-icons/hi";
import { RiBarChartBoxAiLine } from "react-icons/ri";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Switch from "@/components/ui/sky-toggle";
import { SiCurseforge } from "react-icons/si";

const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active tab based on current path
  const getActiveTab = () => {
    if (location.pathname === "/") return "home";
    if (location.pathname === "/DataSet") return "dataset";
    return "home"; // default
  };

  // Navigation tabs configuration
  const tabs: Tab[] = [
    {
      id: "home",
      label: "Home",
      icon: <HiHome className="w-5 h-5" />,
    },
    {
      id: "dataset",
      label: "Dataset",
      icon: <HiOutlineTable className="w-5 h-5" />,
    },
    {
      id: "cleaning",
      label: "Cleaning",
      icon: <HiOutlineAdjustments className="w-5 h-5" />,
    },
    {
      id: "enhance",
      label: "Enhance",
      icon: <HiOutlineSparkles className="w-5 h-5" />,
    },
    {
      id: "models",
      label: "Models",
      icon: <HiChip className="w-5 h-5" />,
    },
    {
      id: "analysis",
      label: "Analysis",
      icon: <RiBarChartBoxAiLine className="w-5 h-5" />,
    },
    {
      id: "about us",
      label: "About Us",
      icon: <HiInformationCircle className="w-5 h-5" />,
    },
  ];

  return (
    // Header layout with logo, navigation, and user controls
    <nav
      className={`shadow-sm pt-5 pb-0 relative  z-10 transition-colors ${theme === "dark" ? "bg-transparent" : "bg-white"}`}
    >
      {/* Logo positioned at left corner */}
      <Link to="/" className="absolute left-5 top-5 flex items-center cursor-pointer">
        <SiCurseforge
          className={`text-2xl pt-2 ${theme === "dark" ? "text-white" : "text-gray-800"}`}
        />
        <p
          className={`text-2xl ml-2 flex ${theme === "dark" ? "text-white" : "text-gray-800"}`}
        >
          {" "}
          DataForge
        </p>
      </Link>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex justify-between items-start">
          <div className="w-12 md:w-20" />

          {/* Expandable Tabs Navigation - Centered */}
          <div className="flex-1 flex justify-center ml-5">
            <ExpandableTabs
              tabs={tabs}
              activeTab={getActiveTab()}
              onTabChange={(tabId) => {
                if (tabId === "home") navigate("/");
                else if (tabId === "dataset") navigate("/DataSet");
                // Add more routes as needed
              }}
            />
          </div>

          {/* Theme Toggle & Account Button - Right Side */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle Switch */}
            <Switch checked={theme === "dark"} onChange={toggleTheme} />
            {/* User Dropdown Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${theme === "dark" ? "bg-black hover:bg-gray-900 text-white border border-gray-800" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
                >
                  <HiUser className="w-4 h-4" />
                  <span>Account</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className={`w-fit ${theme === "dark" ? "bg-black border-gray-800 text-white" : "bg-white border-gray-200 text-gray-900"}`}
              >
                <DropdownMenuLabel
                  className={`${theme === "dark" ? "text-white" : ""} px-2 py-1.5`}
                >
                  My Account
                </DropdownMenuLabel>
                <DropdownMenuSeparator
                  className={theme === "dark" ? "bg-gray-800" : "bg-gray-200"}
                />
                <DropdownMenuItem
                  className={`cursor-pointer whitespace-nowrap ${theme === "dark" ? "focus:bg-gray-900 focus:text-white text-white" : "focus:bg-gray-100 focus:text-gray-900"}`}
                >
                  <HiUser className="w-4 h-4 mr-2" />
                  Account
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={`cursor-pointer whitespace-nowrap ${theme === "dark" ? "focus:bg-gray-900 focus:text-white text-white" : "focus:bg-gray-100 focus:text-gray-900"}`}
                >
                  <HiBriefcase className="w-4 h-4 mr-2" />
                  Billing
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={`cursor-pointer whitespace-nowrap ${theme === "dark" ? "focus:bg-gray-900 focus:text-white text-white" : "focus:bg-gray-100 focus:text-gray-900"}`}
                >
                  <HiQuestionMarkCircle className="w-4 h-4 mr-2" />
                  Support
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={`cursor-pointer whitespace-nowrap ${theme === "dark" ? "focus:bg-gray-900 focus:text-white text-white" : "focus:bg-gray-100 focus:text-gray-900"}`}
                >
                  <HiCog className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator
                  className={theme === "dark" ? "bg-gray-800" : "bg-gray-200"}
                />
                <DropdownMenuItem
                  className={`cursor-pointer whitespace-nowrap ${theme === "dark" ? "focus:bg-gray-900 text-red-400 focus:text-red-400" : "focus:bg-gray-100 text-red-600 focus:text-red-600"}`}
                >
                  <HiLogout className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
