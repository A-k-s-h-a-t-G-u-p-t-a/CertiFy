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
import { client } from "../lib/client";
import { ConnectButton } from "thirdweb/react";
export function NavbarDemo() {
  const navItems = [
    {
      name: "Admin",
      link: "#admin",
    },
    {
      name: "Organizations",
      link: "#organizations",
    },
    {
      name: "Verifier",
      link: "#verifier",
    },
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
            <NavbarButton variant="secondary" href="/signin">Login</NavbarButton>
            <NavbarButton variant="primary">
                <ConnectButton client={client}
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
                        justifyContent: "center"
                    },
                    label: "Connect Wallet"
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
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
          </MobileNavHeader>

          <MobileNavMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)}>
            {navItems.map((item, idx) => (
              <a
                key={`mobile-link-${idx}`}
                href={item.link}
                onClick={() => setIsMobileMenuOpen(false)}
                className="relative text-neutral-600 dark:text-neutral-300">
                <span className="block">{item.name}</span>
              </a>
            ))}
            <div className="flex w-full flex-col gap-4">
              <NavbarButton
                onClick={() => setIsMobileMenuOpen(false)}
                variant="primary"
                className="w-full">
                Login
              </NavbarButton>
              <NavbarButton
                onClick={() => setIsMobileMenuOpen(false)}
                variant="primary"
                className="w-full">
                Book a call
              </NavbarButton>
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>
      
      {/* Navbar */}
    </div>
  );
}
