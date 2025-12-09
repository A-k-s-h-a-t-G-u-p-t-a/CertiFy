"use client";
import { useState, useRef, useEffect } from "react"
import { ConnectButton } from "thirdweb/react"
import { client } from "../lib/client"
import { useSession, signOut } from "next-auth/react"
import GoogleTranslate from "./google-translate"
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarLogo,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/components/ui/navbar";
import { User, LogOut, ChevronDown, LogIn, UserPlus, Award, FileSpreadsheet, Building2 } from "lucide-react";

export function NavbarDemo() {
  const { data: session } = useSession() // get session
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isEnterDropdownOpen, setIsEnterDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const enterDropdownRef = useRef(null)
  const navItems = [
    { name: "Skill India Digital Hub", link: "/admin" },
    { name: "Organizations", link: "/org" },
    { name: "Verifier/Employer", link: "/verifier2" },
  ]

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
      if (enterDropdownRef.current && !enterDropdownRef.current.contains(event.target)) {
        setIsEnterDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }

  return (
    <div className="relative w-full z-50 mt-[42px]">
      <Navbar className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        {/* Desktop Navigation */}
        <NavBody>
          <NavbarLogo />
          <NavItems items={navItems} />
          <div className="flex items-center gap-3">
            <div className="relative z-[60]">
              <GoogleTranslate />
            </div>

            {session ? (
              <div className="relative z-50" ref={dropdownRef}>
                <button 
                  onClick={toggleDropdown}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-[#a7d7b8] text-white hover:bg-[#66b2a0] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#66b2a0] focus:ring-offset-2"
                >
                  <User className="w-5 h-5" />
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-[100]">
                    <div className="py-1">
                      <div className="px-4 py-2 text-sm font-medium text-[#4e796b] border-b border-gray-100 flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        {session.user?.name || session.user?.username || "User"}
                      </div>
                      {session.user?.role === "user" && (
                        <a
                          href="/userportal"
                          onClick={() => setIsDropdownOpen(false)}
                          className="w-full px-4 py-2 text-sm text-[#4e796b] hover:bg-gray-50 flex items-center transition-colors duration-150"
                        >
                          <Award className="w-4 h-4 mr-2" />
                          My Certificates
                        </a>
                      )}
                      {session.user?.role === "organisation" && (
                        <>
                          <a
                            href="/organizations"
                            onClick={() => setIsDropdownOpen(false)}
                            className="w-full px-4 py-2 text-sm text-[#4e796b] hover:bg-gray-50 flex items-center transition-colors duration-150"
                          >
                            <Building2 className="w-4 h-4 mr-2" />
                            My Portal
                          </a>
                          <a
                            href="/upload-certificates"
                            onClick={() => setIsDropdownOpen(false)}
                            className="w-full px-4 py-2 text-sm text-[#4e796b] hover:bg-gray-50 flex items-center transition-colors duration-150"
                          >
                            <FileSpreadsheet className="w-4 h-4 mr-2" />
                            Upload Certificates
                          </a>
                        </>
                      )}
                      <button
                        onClick={() => {
                          signOut()
                          setIsDropdownOpen(false)
                        }}
                        className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center transition-colors duration-150"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative z-50" ref={enterDropdownRef}>
                <button
                  onClick={() => setIsEnterDropdownOpen(!isEnterDropdownOpen)}
                  className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#4e796b] to-[#66b2a0] hover:from-[#3d5f55] hover:to-[#559089] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#66b2a0] focus:ring-offset-2 rounded-lg shadow-md whitespace-nowrap"
                >
                  <LogIn className="w-4 h-4" />
                  Login/Signup
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isEnterDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isEnterDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-xl z-[100] overflow-hidden">
                    <div className="py-2">
                      {/* Learner Option */}
                      <div className="px-3 py-1">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1 mb-2">Learner</p>
                        <a
                          href="/user-signin"
                          onClick={() => setIsEnterDropdownOpen(false)}
                          className="w-full px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center transition-colors duration-150 rounded"
                        >
                          <LogIn className="w-4 h-4 mr-2 text-blue-500" />
                          Learner Login
                        </a>
                        <a
                          href="/signup"
                          onClick={() => setIsEnterDropdownOpen(false)}
                          className="w-full px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center transition-colors duration-150 rounded"
                        >
                          <UserPlus className="w-4 h-4 mr-2 text-blue-500" />
                          Learner Signup
                        </a>
                      </div>

                      <div className="h-px bg-gray-100 my-2"></div>

                      {/* SIDH/Organization Option */}
                      <div className="px-3 py-1">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1 mb-2">SIDH & Organization</p>
                        <a
                          href="/signin"
                          onClick={() => setIsEnterDropdownOpen(false)}
                          className="w-full px-3 py-2 text-sm text-gray-700 hover:bg-slate-50 hover:text-slate-700 flex items-center transition-colors duration-150 rounded"
                        >
                          <LogIn className="w-4 h-4 mr-2 text-slate-600" />
                          SIDH/Org Login
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            <NavbarButton variant="primary">
              <ConnectButton
                client={client}
                connectButton={{
                  style: {
                    backgroundColor: "#1a202c",
                    color: "#fff",
                    borderRadius: "6px",
                    padding: "8px 16px",
                    fontSize: "14px",
                    height: "36px",
                    minWidth: "auto",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  },
                  label: "Connect Wallet",
                }}
              />
            </NavbarButton>
          </div>
        </NavBody>

        {/* Mobile Navigation */}
        <MobileNav>
          <MobileNavHeader>
            <NavbarLogo />
            <div className="flex items-center gap-2">
              <div className="relative z-[60]">
                <GoogleTranslate />
              </div>
              <MobileNavToggle isOpen={isMobileMenuOpen} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
            </div>
          </MobileNavHeader>

          <MobileNavMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)}>
            {navItems.map((item, idx) => (
              <a
                key={`mobile-link-${idx}`}
                href={item.link}
                onClick={() => setIsMobileMenuOpen(false)}
                className="relative text-neutral-600 dark:text-neutral-300 hover:text-foreground transition-colors"
              >
                <span className="block py-2">{item.name}</span>
              </a>
            ))}
            <div className="flex w-full flex-col gap-4 mt-4 pt-4 border-t">
              {session ? (
                <>
                  <span className="text-sm text-muted-foreground px-2">
                    {session.user?.name || session.user?.username}
                  </span>
                  <NavbarButton
                    onClick={() => {
                      signOut()
                      setIsMobileMenuOpen(false)
                    }}
                    variant="secondary"
                    className="w-full"
                  >
                    Logout
                  </NavbarButton>
                </>
              ) : (
                <>
                  {/* Learner Login/Signup Section */}
                  <div className="border-b pb-3 mb-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 mb-2">Learner</p>
                    <NavbarButton
                      onClick={() => setIsMobileMenuOpen(false)}
                      variant="secondary"
                      className="w-full justify-start"
                      href="/user-signin"
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      Learner Login
                    </NavbarButton>
                    <NavbarButton
                      onClick={() => setIsMobileMenuOpen(false)}
                      variant="secondary"
                      className="w-full justify-start mt-2"
                      href="/signup"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Learner Signup
                    </NavbarButton>
                  </div>

                  {/* SIDH/Organization Login Section */}
                  <div className="border-b pb-3 mb-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 mb-2">SIDH & Organization</p>
                    <NavbarButton
                      onClick={() => setIsMobileMenuOpen(false)}
                      variant="secondary"
                      className="w-full justify-start"
                      href="/signin"
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      SIDH/Org Login
                    </NavbarButton>
                  </div>
                </>
              )}
              <NavbarButton onClick={() => setIsMobileMenuOpen(false)} variant="primary" className="w-full">
                Connect Wallet
              </NavbarButton>
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>
    </div>
  );
}
