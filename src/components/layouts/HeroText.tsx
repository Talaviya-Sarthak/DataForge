import React from "react";
import ShinyText from "@/components/ui/shinytext";
import GradientText from "@/components/ui/GradientText";
import { Button } from "@/components/ui/button";
import { FiBarChart2 } from "react-icons/fi";
import { FaPlayCircle } from "react-icons/fa";
import { Link } from "react-router-dom";
const HeroText: React.FC = () => {
    return (
        <div className="relative z-10 max-w-5xl mx-auto text-center px-4 sm:px-6 lg:px-8 mt-4 sm:mt-6 md:mt-8">
            <div className="text-xl sm:text-2xl md:text-[28px] font-bold">
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

            <h1 className="text-center font-semibold leading-[1.1] text-white text-4xl md:text-6xl lg:text-7xl mb-10 mt-5 [font-family:var(--font-heading)]">
                <span className="inline-flex items-baseline gap-2">
                    Forge
                    <GradientText
                        gradient={["#67E8F9", "#38BDF8", "#22D3EE"]}
                        className="inline-block align-baseline leading-none"
                    >
                        Intelligence
                    </GradientText>{" "}
                </span>

                <br />

                From Your Data
            </h1>

            <p className="text-gray-300 text-base md:text-lg lg:text-[15px] max-w-3xl mx-auto leading-relaxed mt-7 [font-family:var(--font-body)]">
                DataForge transforms messy, scattered data into clear intelligence. Build automated
                pipelines, uncover insights faster, and move from guessing to truly data-driven
                decisions — all in one platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-10">
                <Link to="/SignUp">
                <Button className="group relative overflow-hidden rounded-2xl px-6 py-2 text-white border border-white/25 bg-transparent transition-all duration-500 hover:text-cyan-200 hover:border-cyan-300 hover:shadow-[0_0_12px_1px_rgba(34,211,238,0.55)] cursor-pointer">
                    <span className="relative z-10">Get Started</span>

                    <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[#67E8F9] to-transparent opacity-0 group-hover:opacity-100 group-hover:translate-x-full duration-[1500ms] ease-[cubic-bezier(0.45,0,0.2,1)] transition blur-sm" />
                </Button>
                </Link>

                <Button className="group relative overflow-hidden rounded-2xl px-6 py-2 text-white border border-white/20 bg-transparent transition-all duration-500 hover:border-white hover:shadow-[0_0_10px_1px_rgba(255,255,255,0.35)] cursor-pointer">
                    <span className="relative z-10 inline-flex items-center gap-1">
                        <FaPlayCircle className="opacity-70" />
                        <span>View Demo</span>
                    </span>

                    <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[#F2F3F7] to-transparent opacity-0 group-hover:opacity-100 group-hover:translate-x-full duration-[1500ms] ease-[cubic-bezier(0.45,0,0.2,1)] transition blur-sm" />
                </Button>
            </div>

            <div className="mt-8 sm:mt-10 md:mt-12 text-center">
                <span className="inline-flex items-center text-lg font-medium tracking-wide">
                    <FiBarChart2 className="mr-1 text-violet-300" />

                    <GradientText
                        gradient={["#E9D5FF", "#C7D2FE", "#E0E7FF"]}
                    >
                        Trusted by teams who move faster with their data.
                    </GradientText>
                </span>
            </div>
            <div className="mt-2 w-24 h-[2px] mx-auto bg-gradient-to-r from-transparent via-violet-400 to-transparent opacity-60" />
        </div>
    );
};

export default HeroText;
