import React, { useState } from "react";
import { X, Eye, EyeOff, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import Logo from "@/components/landing/Logo";

export default function AuthModal({ onClose, onSuccess }) {
  const [mode, setMode] = useState("login"); // login | register
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [otpMode, setOtpMode] = useState(false);
  const [otp, setOtp] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      onSuccess?.();
      window.location.href = "/";
    } catch (err) {
      setError(err.message || "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPw) { setError("비밀번호가 일치하지 않습니다."); return; }
    setLoading(true);
    try {
      await base44.auth.register({ email, password, full_name: fullName });
      setOtpMode(true);
    } catch (err) {
      setError(err.message || "회원가입에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { access_token } = await base44.auth.verifyOtp({ email, otpCode: otp });
      base44.auth.setToken(access_token);
      onSuccess?.();
      window.location.href = "/";
    } catch (err) {
      setError(err.message || "인증 코드가 올바르지 않습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8"
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>

          <div className="flex justify-center mb-6">
            <Logo className="h-10" />
          </div>

          {otpMode ? (
            <form onSubmit={handleOtp} className="space-y-4">
              <div className="text-center mb-4">
                <h2 className="text-xl font-bold text-[#1A1A2E]">이메일 인증</h2>
                <p className="text-sm text-gray-400 mt-1">{email}로 전송된 코드를 입력하세요</p>
              </div>
              <input
                type="text"
                placeholder="인증 코드 6자리"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center text-2xl tracking-widest font-mono focus:outline-none focus:border-[#FF6B4A]"
                maxLength={6}
              />
              {error && <p className="text-sm text-red-500 text-center">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full bg-[#FF6B4A] hover:bg-[#e55a3a] text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "인증 완료"}
              </button>
              <button type="button" onClick={() => base44.auth.resendOtp(email)}
                className="w-full text-sm text-gray-400 hover:text-gray-600 text-center">
                코드 재전송
              </button>
            </form>
          ) : (
            <>
              {/* Tabs */}
              <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
                {["login", "register"].map((m) => (
                  <button key={m} onClick={() => { setMode(m); setError(""); }}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                      mode === m ? "bg-white text-[#1A1A2E] shadow-sm" : "text-gray-500"
                    }`}>
                    {m === "login" ? "로그인" : "회원가입"}
                  </button>
                ))}
              </div>

              <form onSubmit={mode === "login" ? handleLogin : handleRegister} className="space-y-3">
                {mode === "register" && (
                  <input
                    type="text" placeholder="이름" value={fullName}
                    onChange={(e) => setFullName(e.target.value)} required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FF6B4A]"
                  />
                )}
                <input
                  type="email" placeholder="이메일" value={email}
                  onChange={(e) => setEmail(e.target.value)} required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FF6B4A]"
                />
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"} placeholder="비밀번호" value={password}
                    onChange={(e) => setPassword(e.target.value)} required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:border-[#FF6B4A]"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {mode === "register" && (
                  <input
                    type="password" placeholder="비밀번호 확인" value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)} required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FF6B4A]"
                  />
                )}
                {error && <p className="text-sm text-red-500">{error}</p>}
                <button type="submit" disabled={loading}
                  className="w-full bg-[#FF6B4A] hover:bg-[#e55a3a] text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors mt-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === "login" ? "로그인" : "회원가입"}
                </button>
                {mode === "login" && (
                  <div className="text-center mt-1">
                    <Link to="/forgot-password" className="text-xs text-gray-400 hover:text-[#FF6B4A]">
                      비밀번호를 잊으셨나요?
                    </Link>
                  </div>
                )}
              </form>

              <div className="mt-4 text-center">
                <button onClick={() => base44.auth.loginWithProvider("google", "/")}
                  className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google로 계속하기
                </button>
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}