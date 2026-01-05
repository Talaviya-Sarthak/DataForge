import { useTheme } from "@/contexts/ThemeContext";
import LightRays from "@/components/ui/lightrays";
import Header from "@/components/layouts/Header";
import ShinyText from "@/components/ui/shinytext";
import { Button } from "@/components/ui/button";

const HomePage = () => {
  const { theme, toggleTheme } = useTheme();
  const handleAnimationComplete = () => {
    console.log("All letters have animated!");
  };
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
      <div className="relative ml-50 z-10 max-w-5xl text-center px-6 mt-10">
        <div className="text-[25px] mb-3 font-bold">
          <ShinyText
            text="DataForge — AI-Driven Insights"
            speed={2}
            delay={0}
            color="#c2c2c2"
            shineColor="#FFDFA8"
            spread={120}
            direction="left"
            yoyo={false}
            pauseOnHover={false}
          />
        </div>
        <h1
          id="hero-title"
          className="font-semibold leading-[1.1] text-white text-4xl md:text-6xl lg:text-7xl mb-6 mt-5"
        >
          Forge Intelligence
          <br className="hidden md:block" />
          From Your Data
        </h1>

        <p
          id="hero-sub"
          className="text-gray-300 text-base md:text-lg lg:text-xl max-w-3xl mx-auto leading-relaxed mb-10"
        >
          Turn raw data into clear, actionable insight. Clean pipelines,
          automated analysis, and decision-ready dashboards — all in one
          platform.
        </p>

        <div className="flex justify-center gap-4">
          <button className="px-6 py-3 rounded-xl bg-cyan-400 text-[#060A12] font-medium text-sm md:text-base hover:bg-cyan-300 transition">
            Get Started
          </button>
          <button className="px-6 py-3 rounded-xl border border-gray-600 text-white font-medium text-sm md:text-base hover:bg-white/10 transition">
            View Demo
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
