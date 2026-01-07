/**
 * SignUp component
 *
 * Renders the registration UI (name/email/password) with social login buttons.
 * - UI-only component (no handlers attached)
 * - Reuse `GlossButton` for social icons
 *
 * Ready for review and push to GitHub (comments added; formatting applied).
 */
"use client";

import { FaGithub, FaGoogle, FaLock, FaMicrosoft, FaUser } from "react-icons/fa";
import { HiEye, HiOutlineMail, HiUser } from "react-icons/hi";
import { GradientBars } from "../ui/GradientBars";
import { Link } from "react-router-dom";

/** SignUp: Presentational component for user registration. */
export default function SignUp() {
    return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <GradientBars />

            <div className="bg-[#0c0c0c] border border-white/10 rounded-xl p-6 w-[360px] shadow-2xl z-10">

                {/* Avatar */}
                <div className="flex justify-center mb-4">
                    <div className="w-14 h-14 rounded-full bg-[#141414] border border-white/10 flex items-center justify-center">
                        <span className="text-white/80 text-2xl">
                            <FaUser />
                        </span>
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-2xl font-bold text-white text-center">
                    Create Account
                </h1>
                <p className="text-gray-400 text-center text-sm mt-1">
                    Join DataForge today
                </p>

                {/* Inputs */}
                <div className="space-y-3 mt-5">

                    {/* Name */}
                    <div className="bg-[#0f0f0f] border border-white/15 rounded-lg px-3 h-10 flex items-center text-gray-300 focus-within:border-white transition">
                        <span className="mr-2 text-gray-400">
                            <HiUser />
                        </span>
                        <input
                            type="text"
                            placeholder="Full Name"
                            className="bg-transparent outline-none w-full text-sm"
                        />
                    </div>

                    {/* Email */}
                    <div className="bg-[#0f0f0f] border border-white/15 rounded-lg px-3 h-10 flex items-center text-gray-300 focus-within:border-white transition">
                        <span className="mr-2 text-gray-400">
                            <HiOutlineMail />
                        </span>
                        <input
                            type="email"
                            placeholder="Email Address"
                            className="bg-transparent outline-none w-full text-sm"
                        />
                    </div>

                    {/* Password */}
                    <div className="bg-[#0f0f0f] border border-white/15 rounded-lg px-3 h-10 flex items-center text-gray-300 focus-within:border-white transition">
                        <span className="mr-2 text-gray-400">
                            <FaLock />
                        </span>
                        <input
                            type="password"
                            placeholder="Password"
                            className="bg-transparent outline-none w-full text-sm"
                        />
                        <span className="text-gray-400 cursor-pointer ml-2">
                            <HiEye />
                        </span>
                    </div>
                </div>

                {/* Terms */}
                <div className="ml-15 text-xs text-gray-400 mt-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="accent-blue-500" />
                        I agree to the <span className="text-white hover:text-blue-500">Terms & Privacy</span>
                    </label>
                </div>

                {/* Signup Button */}
                <button className="group relative w-full h-10 mt-5 rounded-lg text-white text-sm font-medium bg-[#0f0f10] border border-white/15 overflow-hidden cursor-pointer">
                    <span className="relative z-10">
                        Create Account
                    </span>

                    <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[#e60a64]/60 to-transparent opacity-0 group-hover:opacity-100 group-hover:translate-x-full duration-[1600ms] ease-[cubic-bezier(0.45,0,0.2,1)] transition blur-sm" />
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 my-4">
                    <div className="h-[1px] bg-white/10 flex-1" />

                    <div className="text-center text-xs text-gray-400 leading-snug">
                        Or SignUp With
                    </div>

                    <div className="h-[1px] bg-white/10 flex-1" />
                </div>


                {/* Social */}
                <div className="flex justify-center gap-4">
                    <GlossButton><FaGoogle /></GlossButton>
                    <GlossButton><FaGithub /></GlossButton>
                    <GlossButton><FaMicrosoft /></GlossButton>
                </div>

                {/* Footer */}
                <p className="text-center text-gray-400 text-xs mt-6">
                    Already have an account?{" "}
                    <Link to={"/SignIn"}>
                        <span className="text-white cursor-pointer hover:underline">
                            Sign in
                        </span>
                    </Link>
                </p>
            </div>
        </div>
    );
}

/** GlossButton - compact social icon button with animated gloss effect.
 * Props:
 *  - children: React.ReactNode (icon)
 */
function GlossButton({ children }: { children: React.ReactNode }) {
    return (
        <button className="group relative w-16 h-10 text-lg text-white bg-[#0f0f0f] border border-white/15 rounded-xl flex items-center justify-center overflow-hidden cursor-pointer transition-all">
            <span className="relative z-10 opacity-80 group-hover:opacity-100 transition">
                {children}
            </span>

            <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[#e60a64]/60 to-transparent opacity-0 group-hover:opacity-100 group-hover:translate-x-full duration-[1600ms] ease-[cubic-bezier(0.45,0,0.2,1)] transition blur-sm" />
        </button>
    );
}
