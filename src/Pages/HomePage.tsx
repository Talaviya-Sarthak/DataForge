import { useTheme } from "@/contexts/ThemeContext";
import LightRays from "@/components/ui/lightrays";
import Header from "@/components/layouts/Header";
import HeroText from "@/components/HeroText";
const HomePage = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div
      className={`min-h-screen relative transition-colors ${theme === "dark" ? "bg-black" : "bg-gray-50"}`}
    >
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{ width: "100%", height: "100%" }}
      >
        <LightRays
          raysOrigin="top-center"
          raysColor="#33E6FF"
          raysSpeed={1.5}
          lightSpread={2}
          rayLength={3}
          followMouse={true}
          mouseInfluence={0.1}
          noiseAmount={0}
          distortion={0}
          className="custom-rays"
        />
      </div>
      {/* Navbar */}
      <Header />
      {/* Page Content */}
      <HeroText />
    </div>
  );
};

export default HomePage;
