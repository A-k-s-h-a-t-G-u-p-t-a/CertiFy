"use client";
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
import { useState } from "react";
import { ConnectButton } from "thirdweb/react";
import { client } from "../lib/client";
import { useSession, signOut } from "next-auth/react";
import PWAInstallButton from "./PWAInstallButton";

export function NavbarDemo() {
  const { data: session } = useSession(); // ✅ get session
  const navItems = [
    { name: "Admin", link: "/admin" },
    { name: "Organizations", link: "/organizations" },
    { name: "Verifier", link: "/verifier" },
    { name: "Certificate Playground", link: "/certificate-generator" },
  ];

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="relative w-full">
      <Navbar>
        {/* Desktop Navigation */}
        <NavBody>
          <NavbarLogo />
          <NavItems items={navItems} />
          <div className="flex items-center gap-4">
            <PWAInstallButton />
            {session ? (
              <>
                <span className="text-sm text-gray-700 dark:text-gray-200">
                  {session.user?.name || session.user?.username}
                </span>
                <NavbarButton variant="secondary" onClick={() => signOut()}>
                  Logout
                </NavbarButton>
              </>
            ) : (
              <NavbarButton variant="secondary" href="/signin">
                Login
              </NavbarButton>
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
            <MobileNavToggle
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
          </MobileNavHeader>

          <MobileNavMenu
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          >
            {navItems.map((item, idx) => (
              <a
                key={`mobile-link-${idx}`}
                href={item.link}
                onClick={() => setIsMobileMenuOpen(false)}
                className="relative text-neutral-600 dark:text-neutral-300"
              >
                <span className="block">{item.name}</span>
              </a>
            ))}
            <div className="flex w-full flex-col gap-4 mt-4">
              {session ? (
                <NavbarButton
                  onClick={() => {
                    signOut();
                    setIsMobileMenuOpen(false);
                  }}
                  variant="primary"
                  className="w-full"
                >
                  Logout
                </NavbarButton>
              ) : (
                <NavbarButton
                  onClick={() => setIsMobileMenuOpen(false)}
                  variant="primary"
                  className="w-full"
                  href="/signin"
                >
                  Login
                </NavbarButton>
              )}
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>
    </div>
  );
}
