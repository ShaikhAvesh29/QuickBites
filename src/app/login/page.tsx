"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, Phone, ArrowLeft, Eye, EyeOff, Zap, AlertCircle } from "lucide-react";

const inputVariants = {
  initial: { opacity: 0, x: -16 },
  animate: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.08, duration: 0.3, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const handleAuth = async (action: "login" | "signup") => {
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      if (action === "signup") {
        if (!fullName.trim() || !phoneNumber.trim()) {
          throw new Error("Full name and phone number are required for sign up.");
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName, phone_number: phoneNumber } },
        });
        if (error) throw error;
        setSuccessMsg("Account created! Redirecting…");
        setTimeout(() => router.push("/"), 1200);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/");
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "An error occurred during authentication.";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-hidden">
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-orange-200/40 blur-3xl" />
        <div className="absolute top-1/3 -left-24 w-64 h-64 rounded-full bg-red-200/30 blur-3xl" />
        <div className="absolute -bottom-24 right-1/4 w-56 h-56 rounded-full bg-amber-200/30 blur-3xl" />
      </div>

      {/* Top Hero Banner */}
      <div className="qb-gradient relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full border-2 border-white"
              style={{
                width: `${(i + 1) * 60}px`,
                height: `${(i + 1) * 60}px`,
                top: "50%",
                right: "-20px",
                transform: "translateY(-50%)",
                opacity: 1 - i * 0.15,
              }}
            />
          ))}
        </div>
        <div className="max-w-md mx-auto px-5 py-8 relative">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-6 transition-colors"
          >
            <ArrowLeft size={15} />
            Back to menu
          </button>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-3xl font-black text-white tracking-tight">QuickBite</span>
            <Zap size={20} className="text-yellow-300 fill-yellow-300" />
          </div>
          <p className="text-white/70 text-sm">Your campus canteen, pre-ordered.</p>

          {/* Food emojis */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-right flex flex-col gap-1 opacity-80">
            <span className="text-3xl">🍛</span>
            <span className="text-2xl ml-4">🥤</span>
            <span className="text-3xl">🍱</span>
          </div>
        </div>
      </div>

      {/* Auth Card */}
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="flex-1 max-w-md mx-auto w-full px-4 -mt-4 relative z-10"
      >
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/80 overflow-hidden">
          {/* Tab Header */}
          <div className="flex border-b border-slate-100">
            {(["login", "signup"] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setErrorMsg(""); setSuccessMsg(""); }}
                className={`flex-1 py-4 text-sm font-bold relative transition-colors ${
                  tab === t ? "text-orange-600" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {t === "login" ? "Login" : "Sign Up"}
                {tab === t && (
                  <motion.div
                    layoutId="tab-underline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 qb-gradient rounded-t-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Error / Success */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mx-5 mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100 flex items-start gap-2">
                  <AlertCircle size={14} className="shrink-0 mt-0.5 text-red-500" />
                  {errorMsg}
                </div>
              </motion.div>
            )}
            {successMsg && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mx-5 mt-4 p-3 bg-green-50 text-green-700 text-sm rounded-xl border border-green-100 flex items-center gap-2">
                  ✅ {successMsg}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <div className="p-5 pt-4">
            <AnimatePresence mode="wait">
              {tab === "login" ? (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="space-y-4"
                >
                  {/* Email */}
                  <motion.div custom={0} variants={inputVariants} initial="initial" animate="animate" className="space-y-1.5">
                    <Label htmlFor="email-login" className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <Input
                        id="email-login"
                        type="email"
                        placeholder="student@college.edu"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 rounded-xl border-slate-200 bg-slate-50 focus:bg-white h-12 text-sm focus:border-orange-300 focus:ring-orange-200/50"
                        required
                      />
                    </div>
                  </motion.div>

                  {/* Password */}
                  <motion.div custom={1} variants={inputVariants} initial="initial" animate="animate" className="space-y-1.5">
                    <Label htmlFor="password-login" className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <Input
                        id="password-login"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 rounded-xl border-slate-200 bg-slate-50 focus:bg-white h-12 text-sm focus:border-orange-300 focus:ring-orange-200/50"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </motion.div>

                  {/* Login Button */}
                  <motion.div custom={2} variants={inputVariants} initial="initial" animate="animate">
                    <motion.button
                      onClick={() => handleAuth("login")}
                      disabled={loading}
                      whileTap={{ scale: 0.97 }}
                      className="w-full qb-gradient text-white font-black text-base py-4 rounded-2xl shadow-lg shadow-orange-300/30 disabled:opacity-60 disabled:shadow-none hover:shadow-xl hover:shadow-orange-400/30 transition-shadow mt-2"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                            className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full"
                          />
                          Signing In…
                        </span>
                      ) : (
                        "Login →"
                      )}
                    </motion.button>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  key="signup"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="space-y-4"
                >
                  {/* Full Name */}
                  <motion.div custom={0} variants={inputVariants} initial="initial" animate="animate" className="space-y-1.5">
                    <Label htmlFor="fullname" className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Full Name
                    </Label>
                    <div className="relative">
                      <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <Input
                        id="fullname"
                        type="text"
                        placeholder="Rahul Sharma"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-10 rounded-xl border-slate-200 bg-slate-50 focus:bg-white h-12 text-sm focus:border-orange-300 focus:ring-orange-200/50"
                        required
                      />
                    </div>
                  </motion.div>

                  {/* Phone */}
                  <motion.div custom={1} variants={inputVariants} initial="initial" animate="animate" className="space-y-1.5">
                    <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Phone Number
                    </Label>
                    <div className="relative">
                      <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="9876543210"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="pl-10 rounded-xl border-slate-200 bg-slate-50 focus:bg-white h-12 text-sm focus:border-orange-300 focus:ring-orange-200/50"
                        required
                      />
                    </div>
                  </motion.div>

                  {/* Email */}
                  <motion.div custom={2} variants={inputVariants} initial="initial" animate="animate" className="space-y-1.5">
                    <Label htmlFor="email-signup" className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <Input
                        id="email-signup"
                        type="email"
                        placeholder="student@college.edu"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 rounded-xl border-slate-200 bg-slate-50 focus:bg-white h-12 text-sm focus:border-orange-300 focus:ring-orange-200/50"
                        required
                      />
                    </div>
                  </motion.div>

                  {/* Password */}
                  <motion.div custom={3} variants={inputVariants} initial="initial" animate="animate" className="space-y-1.5">
                    <Label htmlFor="password-signup" className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <Input
                        id="password-signup"
                        type={showPassword ? "text" : "password"}
                        placeholder="Min. 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 rounded-xl border-slate-200 bg-slate-50 focus:bg-white h-12 text-sm focus:border-orange-300 focus:ring-orange-200/50"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </motion.div>

                  {/* Sign Up Button */}
                  <motion.div custom={4} variants={inputVariants} initial="initial" animate="animate">
                    <motion.button
                      onClick={() => handleAuth("signup")}
                      disabled={loading}
                      whileTap={{ scale: 0.97 }}
                      className="w-full qb-gradient text-white font-black text-base py-4 rounded-2xl shadow-lg shadow-orange-300/30 disabled:opacity-60 disabled:shadow-none hover:shadow-xl hover:shadow-orange-400/30 transition-shadow mt-2"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                            className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full"
                          />
                          Creating Account…
                        </span>
                      ) : (
                        "Create Account →"
                      )}
                    </motion.button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-slate-400 pb-5 px-5">
            By continuing, you agree to QuickBite&apos;s{" "}
            <span className="text-orange-600 font-medium">Terms of Service</span>
          </p>
        </div>

        {/* Bottom Tagline */}
        <p className="text-center text-xs text-slate-400 mt-4 pb-8">
          🍽️ Made with love for campus foodies
        </p>
      </motion.div>
    </div>
  );
}
