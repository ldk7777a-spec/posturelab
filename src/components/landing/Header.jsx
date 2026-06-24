import React, { useState, useEffect } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/landing/Logo";

const navItems = ["Product", "Features", "Use Cases", "Resources", "Pricing"];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/80 backdrop-blur-lg shadow-sm" : "bg-white"
      } border-b border-gray-200/60`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-[72px]">
          {/* Logo */}
          <a href="#" className="flex-shrink-0">
            <Logo className="h-14 lg:h-16" />
          </a>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <a
                key={item}
                href={item === "Pricing" ? "#pricing" : "#"}
                className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-600 hover:text-[#1A1A2E] transition-colors rounded-lg hover:bg-gray-50"
              >
                {item}
                <ChevronDown className="w-3.5 h-3.5 opacity-50" />
              </a>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-3">
            <a href="#" className="text-sm font-medium text-gray-600 hover:text-[#1A1A2E] transition-colors px-3 py-2">
              Sign in
            </a>
            <Button className="bg-[#FF6B4A] hover:bg-[#e55a3a] text-white font-semibold px-5 h-10 rounded-lg shadow-sm shadow-orange-200/50">
              Start Free Trial
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 text-gray-600 hover:text-[#1A1A2E]"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-1">
          {navItems.map((item) => (
            <a
              key={item}
              href={item === "Pricing" ? "#pricing" : "#"}
              className="flex items-center justify-between px-3 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
              onClick={() => setMobileOpen(false)}
            >
              {item}
              <ChevronDown className="w-4 h-4 opacity-40" />
            </a>
          ))}
          <div className="pt-3 border-t border-gray-100 space-y-2">
            <a href="#" className="block px-3 py-2 text-base font-medium text-gray-600">Sign in</a>
            <Button className="w-full bg-[#FF6B4A] hover:bg-[#e55a3a] text-white font-semibold h-11 rounded-lg">
              Start Free Trial
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}