/**
 * SignIn component
 *
 * Renders the sign-in UI (email/password) with social login buttons.
 * Uses env-based API URL with validation.
 *
 * Ready for review and push to GitHub.
 */
"use client";

import { FaGithub, FaGoogle, FaLock, FaMicrosoft, FaUser } from "react-icons/fa";
import { HiEye, HiEyeOff, HiOutlineMail } from "react-icons/hi";
import { GradientBars } from "../../components/ui/GradientBars";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/components/ui/toast/Toast";

/** SignIn: Presentational + logic component for user sign-in screen. */
export default function SignIn() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
    const { show } = useToast();
    const navigate = useNavigate();

    function validate() {
        const e: typeof errors = {};

        if (!email) e.email = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,10}$/.test(email))
            e.email = "Enter a valid email";

        if (!password) e.password = "Password is required";
        else if (password.length < 8)
            e.password = "Password must be at least 8 characters";

        setErrors(e);
        return Object.keys(e).length === 0;
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!validate()) return;

        const apiBase = import.meta.env.VITE_NODE_API_URL;

        if (!apiBase) {
            show({
                type: "error",
                message: "API URL not configured. Please set VITE_NODE_API_URL in .env file",
            });
            return;
        }

        fetch(`${apiBase}/api/auth/signin`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        })
            .then(async (r) => {
                const data = await r.json().catch(() => ({}));
                if (!r.ok) throw new Error(data?.error || "Login failed");

                show({ type: "success", message: "You logged in successfully" });
                navigate("/HomePage");
            })
            .catch((err) => {
                show({
                    type: "error",
                    message: err?.message || "Login failed",
                });
            });
    }

    return (
        <form onSubmit={handleSubmit}>
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
                        Welcome Back
                    </h1>
                    <p className="text-gray-400 text-center text-sm mt-1">
                        Sign in to continue
                    </p>

                    {/* Inputs */}
                    <div className="space-y-3 mt-5">
                        {/* Email */}
                        <div
                            className={`bg-[#0f0f0f] border rounded-lg px-3 h-10 flex items-center text-gray-300 focus-within:border-white transition ${
                                errors.email ? "border-red-500" : "border-white/15"
                            }`}
                        >
                            <span className="mr-2 text-gray-400">
                                <HiOutlineMail />
                            </span>
                            <input
                                type="email"
                                autoComplete="email"
                                placeholder="Email Address"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (errors.email) {
                                        setErrors((prev) => ({ ...prev, email: undefined }));
                                    }
                                }}
                                className="bg-transparent outline-none w-full text-sm"
                            />
                        </div>
                        {errors.email && (
                            <p className="text-red-500 text-xs">{errors.email}</p>
                        )}

                        {/* Password */}
                        <div className="bg-[#0f0f0f] border border-white/15 rounded-lg px-3 h-10 flex items-center text-gray-300 focus-within:border-white transition">
                            <span className="mr-2 text-gray-400">
                                <FaLock />
                            </span>
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    if (errors.password) {
                                        setErrors((prev) => ({ ...prev, password: undefined }));
                                    }
                                }}
                                className="bg-transparent outline-none w-full text-sm"
                            />
                            <span
                                className="text-gray-400 cursor-pointer ml-2"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <HiEyeOff /> : <HiEye />}
                            </span>
                        </div>
                        {errors.password && (
                            <p className="text-red-500 text-xs">{errors.password}</p>
                        )}
                    </div>

                    {/* Options */}
                    <div className="flex justify-between items-center text-xs text-gray-400 mt-5">
                        <label className="flex items-center gap-1 cursor-pointer">
                            <input type="checkbox" className="accent-blue-500" />
                            Remember me
                        </label>
                        <button type="button" className="hover:text-white">
                            Forgot password?
                        </button>
                    </div>

                    {/* Sign In */}
                    <button className="relative group w-full h-10 rounded-lg mt-5 text-white bg-[#0f0f10] text-sm font-medium border border-white/15 overflow-hidden">
                        <span className="relative z-10">Sign In</span>
                        <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r via-[#e60a64]/60 to-transparent opacity-0 group-hover:opacity-100 group-hover:translate-x-full duration-[1600ms] blur-sm" />
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-3 my-4">
                        <div className="h-[1px] bg-white/10 flex-1" />
                        <div className="text-xs text-gray-400">Or Sign In With</div>
                        <div className="h-[1px] bg-white/10 flex-1" />
                    </div>

                    {/* Social Buttons */}
                    <div className="flex justify-center gap-4">
                        <GlossButton><FaGoogle /></GlossButton>
                        <GlossButton><FaGithub /></GlossButton>
                        <GlossButton><FaMicrosoft /></GlossButton>
                    </div>

                    {/* Footer */}
                    <p className="text-center text-gray-400 text-xs mt-6">
                        Don&apos;t have an account?{" "}
                        <Link to="/SignUp">
                            <span className="text-white hover:underline">Sign up</span>
                        </Link>
                    </p>
                </div>
            </div>
        </form>
    );
}

/** GlossButton - compact social icon button */
function GlossButton({ children }: { children: React.ReactNode }) {
    return (
        <button className="group relative w-16 h-10 text-lg text-white bg-[#0f0f0f] border border-white/15 rounded-xl flex items-center justify-center overflow-hidden">
            <span className="relative z-10 opacity-80 group-hover:opacity-100">
                {children}
            </span>
            <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r via-[#e60a64]/60 to-transparent opacity-0 group-hover:opacity-100 group-hover:translate-x-full duration-[1600ms] blur-sm" />
        </button>
    );
}
