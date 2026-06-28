import React, { useState, useEffect } from "react";
import { ChevronDown, Menu, X, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Logo from "@/components/landing/Logo";
import { useLang, T } from "@/lib/LanguageContext";
import AuthModal from "@/components/auth/AuthModal";
import { base44 } from "@/api/base44Client";

const NAV_KO = ["제품", "기능", "활용사례", "리소스", "요금제"];
const NAV_EN = ["Product", "Features", "Use Cases", "Resources", "Pricing"];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [user, setUser] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { lang, toggleLang } = useLang();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const navItems = lang === "ko" ? NAV_KO : NAV_EN;

  const handleLogout = () => {
    base44.auth.logout("/");
    setUser(null);
    setUserMenuOpen(false);
  };

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/80 backdrop-blur-lg shadow-sm" : "bg-white"
      } border-b border-gray-200/60`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-[72px]">
            {/* Logo */}
            <Link to="/" className="flex-shrink-0">
              <Logo className="h-14 lg:h-16" />
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item, i) => (
                <a key={item}
                  href={i === 4 ? "#pricing" : "#"}
                  className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-600 hover:text-[#1A1A2E] transition-colors rounded-lg hover:bg-gray-50">
                  {item}
                  <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                </a>
              ))}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center gap-3">
              <button onClick={toggleLang}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 hover:border-[#FF6B4A] hover:text-[#FF6B4A] transition-all">
                {lang === "ko" ? "🇰🇷 KO" : "🇺🇸 EN"}
              </button>

              {user ? (
                <div className="relative">
                  <button onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:border-[#FF6B4A] transition-all">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#FF6B4A] to-orange-300 flex items-center justify-center text-white text-xs font-bold">
                      {(user.full_name || "U")[0].toUpperCase()}
                    </div>
                    {user.full_name?.split(" ")[0]}
                    <ChevronDown className="w-3 h-3 opacity-50" />
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                      <Link to="/mypage" onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <User className="w-4 h-4 text-gray-400" />
                        {lang === "ko" ? "마이페이지" : "My Page"}
                      </Link>
                      {user.role === "admin" && (
                        <Link to="/admin" onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          <Settings className="w-4 h-4 text-gray-400" />
                          {lang === "ko" ? "관리자" : "Admin"}
                        </Link>
                      )}
                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button onClick={handleLogout}
                          className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                          {lang === "ko" ? "로그아웃" : "Sign out"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button onClick={() => setShowAuth(true)}
                  className="text-sm font-medium text-gray-600 hover:text-[#1A1A2E] transition-colors px-3 py-2">
                  {T.signIn[lang]}
                </button>
              )}

              <Link to="/analyze">
                <Button className="bg-[#FF6B4A] hover:bg-[#e55a3a] text-white font-semibold px-5 h-10 rounded-lg shadow-sm shadow-orange-200/50">
                  {T.startTrial[lang]}
                </Button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <button onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 text-gray-600 hover:text-[#1A1A2E]">
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="lg:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-1">
            {navItems.map((item, i) => (
              <a key={item} href={i === 4 ? "#pricing" : "#"}
                className="flex items-center justify-between px-3 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
                onClick={() => setMobileOpen(false)}>
                {item}
                <ChevronDown className="w-4 h-4 opacity-40" />
              </a>
            ))}
            <div className="pt-3 border-t border-gray-100 space-y-2">
              <button onClick={toggleLang}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-gray-200 text-sm font-bold text-gray-600">
                {lang === "ko" ? "🇰🇷 한국어" : "🇺🇸 English"}
                <span className="text-xs text-gray-400">→ {lang === "ko" ? "English" : "한국어"}</span>
              </button>
              {user ? (
                <>
                  <Link to="/mypage" onClick={() => setMobileOpen(false)}
                    className="block px-3 py-2 text-base font-medium text-gray-600 hover:bg-gray-50 rounded-lg">
                    {lang === "ko" ? "마이페이지" : "My Page"}
                  </Link>
                  {user.role === "admin" && (
                    <Link to="/admin" onClick={() => setMobileOpen(false)}
                      className="block px-3 py-2 text-base font-medium text-gray-600 hover:bg-gray-50 rounded-lg">
                      {lang === "ko" ? "관리자" : "Admin"}
                    </Link>
                  )}
                  <button onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-base font-medium text-red-500 hover:bg-red-50 rounded-lg">
                    {lang === "ko" ? "로그아웃" : "Sign out"}
                  </button>
                </>
              ) : (
                <button onClick={() => { setShowAuth(true); setMobileOpen(false); }}
                  className="block w-full text-left px-3 py-2 text-base font-medium text-gray-600">
                  {T.signIn[lang]}
                </button>
              )}
              <Link to="/analyze" onClick={() => setMobileOpen(false)}>
                <Button className="w-full bg-[#FF6B4A] hover:bg-[#e55a3a] text-white font-semibold h-11 rounded-lg">
                  {T.startTrial[lang]}
                </Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onSuccess={() => setShowAuth(false)} />}
    </>
  );
}