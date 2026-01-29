import React from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { ExpandableTabs, Tab } from "@/components/ui/expandable-tabs";
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

const Header: React.FC = () => {
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
    <nav className="py-4 relative z-10 transition-colors bg-transparent">
      {/* Logo positioned at left corner */}
      <Link to="/" className="absolute left-2 sm:left-4 md:left-5 top-1/2 -translate-y-1/2 flex items-center cursor-pointer">
        <img 
          src="/src/assets/FinalLogo.png" 
          alt="Logo" 
          className="h-32 sm:h-36 md:h-40 w-auto object-contain pb-2"
        />
      </Link>
      <div className="max-w-7xl xl:max-w-8xl 2xl:max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex justify-between items-center">
          <div className="w-24 sm:w-32 md:w-40" />

          {/* Expandable Tabs Navigation - Centered */}
          <div className="flex-1 flex justify-center px-2">
            <ExpandableTabs
              tabs={tabs}
              activeTab={getActiveTab()}
              onTabChange={(tabId) => {
                if (tabId === "home") navigate("/");
                else if (tabId === "dataset") navigate("/DataSet");
                else if (tabId === "about us") navigate("/About");
                // Add more routes as needed
              }}
            />
          </div>

          {/* Account Button - Right Side */}
          <div className="w-24 sm:w-32 md:w-40 flex justify-end">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* User Dropdown Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors cursor-pointer bg-black hover:bg-gray-900 text-white border border-gray-800"
                >
                  <HiUser className="w-4 h-4" />
                  <span className="hidden sm:inline">Account</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-fit bg-black border-gray-800 text-white"
              >
                <DropdownMenuLabel className="text-white px-2 py-1.5">
                  My Account
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-800" />
                <DropdownMenuItem className="cursor-pointer whitespace-nowrap focus:bg-gray-900 focus:text-white text-white">
                  <HiUser className="w-4 h-4 mr-2" />
                  Account
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer whitespace-nowrap focus:bg-gray-900 focus:text-white text-white">
                  <HiBriefcase className="w-4 h-4 mr-2" />
                  Billing
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer whitespace-nowrap focus:bg-gray-900 focus:text-white text-white">
                  <HiQuestionMarkCircle className="w-4 h-4 mr-2" />
                  Support
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer whitespace-nowrap focus:bg-gray-900 focus:text-white text-white">
                  <HiCog className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-800" />
                <DropdownMenuItem className="cursor-pointer whitespace-nowrap focus:bg-gray-900 text-red-400 focus:text-red-400">
                  <HiLogout className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </div>
            </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
