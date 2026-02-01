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
import { GradientBars } from "../../components/ui/GradientBars";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/components/ui/toast/Toast"
import { useAuth } from "@/contexts/AuthContext";
import UserInfoForm from "@/components/ui/UserInfoForm";


/** SignUp: Presentational component for user registration. */
export default function SignUp() {

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; agree?: string }>({});
    const [agree, setAgree] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [tempUserData, setTempUserData] = useState<any>(null);
    const [showPassword, setShowPassword] = useState(false);
    const { show } = useToast()
    const { login } = useAuth()
    const navigate = useNavigate();

    const handleOnboardingComplete = (formData: any) => {
        const userData = {
            id: tempUserData?.id || "USR-2024-001",
            name: tempUserData?.name || name,
            email: tempUserData?.email || email,
            phone: "+1 (555) 123-4567",
            role: formData.profession || "Data Scientist",
            organization: formData.company || "DataForge Analytics",
            status: "active" as const,
            avatar: undefined,
        }

        login(userData)
        show({ type: "success", message: "Welcome to DataForge! Your account is ready." });
        navigate("/HomePage");
    }

    if (showOnboarding) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4">
                <div className="relative z-10 w-full">
                    <UserInfoForm
                        onComplete={handleOnboardingComplete}
                        initialData={{ name, email }}
                    />
                </div>
            </div>
        )
    }

    function validate() {
        const e: typeof errors = {};

        if (!name || name.trim().length === 0) {
            e.name = "Name is required";
        }

        if (!email) e.email = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,10}$/.test(email))
            e.email = "Enter a valid email";

        if (!password) e.password = "Password is required";
        else if (password.length < 8)
            e.password = "Password must be at least 8 characters";

        if (!agree) {
            e.agree = "You must accept Terms & Privacy";
        }

        setErrors(e);
        return Object.keys(e).length === 0;
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!validate()) return;

        const apiBase = import.meta.env.VITE_NODE_API_URL;

        if (!apiBase) {
            show({ type: "error", message: "API URL not configured. Please set VITE_NODE_API_URL in .env file" });
            return;
        }

        fetch(`${apiBase}/api/users/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password }),
        })

            .then(async (r) => {
                const data = await r.json().catch(() => ({}));
                if (!r.ok) throw new Error(data?.error || "Signup failed");

                // Store temp user data and show onboarding
                setTempUserData({ name, email, ...data });
                setShowOnboarding(true);
            })
            .catch((err) => {
                show({ type: "error", message: err?.message || "Signup failed" });
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
                        Create Account
                    </h1>
                    <p className="text-gray-400 text-center text-sm mt-1">
                        Join DataForge today
                    </p>

                    {/* Inputs */}
                    <div className="space-y-3 mt-5">

                        {/* Name */}
                        <div className={`bg-[#0f0f0f] border rounded-lg px-3 h-10 flex items-center text-gray-300 focus-within:border-white transition ${errors.name ? "border-red-500" : "border-white/15"}`}>
                            <span className="mr-2 text-gray-400">
                                <HiUser />
                            </span>
                            <input
                                type="text"
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value);
                                    if (errors.name) {
                                        setErrors((prev) => ({ ...prev, name: undefined }));
                                    }
                                }}
                                className="auth-input bg-transparent outline-none w-full text-sm"
                            />
                        </div>
                        {errors.name && (
                            <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                        )}

                        {/* Email */}
                        <div className="bg-[#0f0f0f] border border-white/15 rounded-lg px-3 h-10 flex items-center text-gray-300 focus-within:border-white transition">
                            <span className="mr-2 text-gray-400">
                                <HiOutlineMail />
                            </span>
                            <input
                                type="email"
                                name="email"
                                placeholder="johndoe26@gmail.com"
                                autoComplete="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);

                                    // clear email error as soon as user types
                                    if (errors.email) {
                                        setErrors((prev) => ({ ...prev, email: undefined }));
                                    }
                                }}
                                className="auth-input bg-transparent outline-none w-full text-sm"
                            />
                        </div>
                        {errors.email && (
                            <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                        )}

                        {/* Password */}
                        <div className="bg-[#0f0f0f] border border-white/15 rounded-lg px-3 h-10 flex items-center text-gray-300 focus-within:border-white transition">
                            <span className="mr-2 text-gray-400">
                                <FaLock />
                            </span>
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                autoComplete="new-password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    if (errors.password) {
                                        setErrors((prev) => ({ ...prev, password: undefined }));
                                    }
                                }}
                                className="auth-input bg-transparent outline-none w-full text-sm"
                            />
                            <span
                                className="text-gray-400 cursor-pointer ml-2"
                                onClick={() => setShowPassword((prev) => !prev)}
                            >
                                <HiEye />
                            </span>
                        </div>
                        {errors.password && (
                            <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                        )}
                    </div>
                    {/* Terms */}
                    <div className="ml-15 text-xs text-gray-400 mt-4 flex gap-2.5">
                        <label className="flex items-center gap-2 font-semibold cursor-pointer">
                            <input type="checkbox" checked={agree}
                                onChange={(e) => {
                                    setAgree(e.target.checked);

                                    // clear checkbox error immediately
                                    if (errors.agree) {
                                        setErrors((prev) => ({ ...prev, agree: undefined }));
                                    }
                                }} className="accent-blue-500" />
                            I agree to the
                        </label>
                        <span className="text-white hover:text-blue-500 cursor-pointer"><a href="/public/terms/terms_and_condition.pdf">Terms & Conditions</a></span>
                    </div>
                    {errors.agree && (
                        <p className="text-red-500 text-xs mt-1 ml-17">{errors.agree}</p>
                    )}


                    {/* Signup Button */}
                    <button className="group relative w-full h-10 mt-5 rounded-lg text-white text-sm font-medium bg-[#0f0f10] border border-white/15 overflow-hidden cursor-pointer">
                        <span className="relative z-10">
                            Create Account
                        </span>

                        <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[#e60a64]/60 to-transparent opacity-0 group-hover:opacity-100 group-hover:translate-x-full duration-[1600ms] ease-[cubic-bezier(0.45,0,0.2,1)] transition blur-sm" />
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-3 my-4">
                        <div className="h-px bg-white/10 flex-1" />

                        <div className="text-center text-xs text-gray-400 leading-snug">
                            Or SignUp With
                        </div>

                        <div className="h-px bg-white/10 flex-1" />
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
        </form>
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