"use client";
import { useState } from "react"
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
} from "@/components/ui/navbar"

export function NavbarDemo() {
  const { data: session } = useSession() // get session
  const navItems = [
    { name: "Admin", link: "/admin" },
    { name: "Organizations", link: "/organizations" },
    { name: "Verifier", link: "/verifier" },
    { name: "Certificate Playground", link: "/certificate-generator" },
  ]

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="relative w-full z-50 mt-[42px]">
      <Navbar className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        {/* Desktop Navigation */}
        <NavBody>
          <NavbarLogo />
          <NavItems items={navItems} />
          <div className="flex items-center gap-2">
            <GoogleTranslate />

            {session ? (
              <>
                <span className="text-sm text-muted-foreground hidden md:inline">
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
            <div className="flex items-center gap-2">
              <GoogleTranslate />
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
                <NavbarButton
                  onClick={() => setIsMobileMenuOpen(false)}
                  variant="secondary"
                  className="w-full"
                  href="/signin"
                >
                  Login
                </NavbarButton>
              )}
              <NavbarButton onClick={() => setIsMobileMenuOpen(false)} variant="primary" className="w-full">
                Connect Wallet
              </NavbarButton>
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>
    </div>
  )
}

// "use client"
// import {
//   Navbar,
//   NavBody,
//   NavItems,
//   MobileNav,
//   NavbarLogo,
//   NavbarButton,
//   MobileNavHeader,
//   MobileNavToggle,
//   MobileNavMenu,
// } from "@/components/ui/navbar";
// import { useState } from "react";
// import { ConnectButton } from "thirdweb/react";
// import { client } from "../lib/client";
// import { useSession, signOut } from "next-auth/react";

// export function NavbarDemo() {
//   const { data: session } = useSession(); // ✅ get session
//   const navItems = [
//     { name: "Admin", link: "/admin" },
//     { name: "Organizations", link: "/organizations" },
//     { name: "Verifier", link: "/verifier" },
//     { name: "Certificate Playground", link: "/certificate-generator" },
//   ];

//   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

//   return (
//     <div className="relative w-full z-50 mt-[42px]">
//       <Navbar className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
//         {/* Desktop Navigation */}
//         <NavBody>
//           <NavbarLogo />
//           <NavItems items={navItems} />
//           <div className="flex items-center gap-4">
//             {session ? (
//               <>
//                 <span className="text-sm text-gray-700 dark:text-gray-200">
//                   {session.user?.name || session.user?.username}
//                 </span>
//                 <NavbarButton variant="secondary" onClick={() => signOut()}>
//                   Logout
//                 </NavbarButton>
//               </>
//             ) : (
//               <NavbarButton variant="secondary" href="/signin">
//                 Login
//               </NavbarButton>
//             )}
//             <NavbarButton variant="primary">
//                 <ConnectButton client={client}
//                 connectButton={{
//                     style: {
//                         backgroundColor: "#1a202c",
//                         color: "#fff",
//                         borderRadius: "6px",
//                         padding: "8px 16px",
//                         fontSize: "14px",
//                         height: "36px",
//                         minWidth: "auto",
//                         display: "inline-flex",
//                         alignItems: "center",
//                         justifyContent: "center"
//                     },
//                     label: "Connect Wallet"
//                     }}
//                 />
//             </NavbarButton>
//           </div>
//         </NavBody>

//         {/* Mobile Navigation */}
//         <MobileNav>
//           <MobileNavHeader>
//             <NavbarLogo />
//             <MobileNavToggle
//               isOpen={isMobileMenuOpen}
//               onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
//             />
//           </MobileNavHeader>

//           <MobileNavMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)}>
//             {navItems.map((item, idx) => (
//               <a
//                 key={`mobile-link-${idx}`}
//                 href={item.link}
//                 onClick={() => setIsMobileMenuOpen(false)}
//                 className="relative text-neutral-600 dark:text-neutral-300"
//               >
//                 <span className="block">{item.name}</span>
//               </a>
//             ))}
//             <div className="flex w-full flex-col gap-4 mt-4">
//               {session ? (
//                 <NavbarButton
//                   onClick={() => {
//                     signOut();
//                     setIsMobileMenuOpen(false);
//                   }}
//                   variant="primary"
//                   className="w-full"
//                 >
//                   Logout
//                 </NavbarButton>
//               ) : (
//                 <NavbarButton
//                   onClick={() => setIsMobileMenuOpen(false)}
//                   variant="primary"
//                   className="w-full"
//                   href="/signin"
//                 >
//                   Login
//                 </NavbarButton>
//               )}
//             </div>
//           </MobileNavMenu>
//         </MobileNav>
//       </Navbar>
      
//       {/* Navbar */}
//     </div>
//   )
// }


// // "use client";
// // import {
// //   Navbar,
// //   NavBody,
// //   NavItems,
// //   MobileNav,
// //   NavbarLogo,
// //   NavbarButton,
// //   MobileNavHeader,
// //   MobileNavToggle,
// //   MobileNavMenu,
// // } from "@/components/ui/navbar";
// // import { useState } from "react";
// // import { ConnectButton } from "thirdweb/react";
// // import { client } from "../lib/client";
// // import { useSession, signOut } from "next-auth/react";
// // import GoogleTranslate from "./GoogleTranslate";

// // export function NavbarDemo() {
// //   const { data: session } = useSession(); // ✅ get session
// //   const navItems = [
// //     { name: "Admin", link: "/admin" },
// //     { name: "Organizations", link: "/organizations" },
// //     { name: "Verifier", link: "/verifier" },
// //     { name: "Certificate Playground", link: "/certificate-generator" },
// //   ];

// //   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

// //   return (
// //     <div className="relative w-full">
// //       <Navbar>
// //         {/* Desktop Navigation */}
// //         <NavBody>
// //           <NavbarLogo />
// //           <NavItems items={navItems} />
// //           <div className="flex items-center gap-4">
// //             {session ? (
// //               <>
// //                 <span className="text-sm text-gray-700 dark:text-gray-200">
// //                   {session.user?.name || session.user?.username}
// //                 </span>
// //                 <NavbarButton variant="secondary" onClick={() => signOut()}>
// //                   Logout
// //                 </NavbarButton>
// //               </>
// //             ) : (
// //               <NavbarButton variant="secondary" href="/signin">
// //                 Login
// //               </NavbarButton>
// //             )}
// //             <NavbarButton variant="primary">
// //               <ConnectButton
// //                 client={client}
// //                 connectButton={{
// //                   style: {
// //                     backgroundColor: "#1a202c",
// //                     color: "#fff",
// //                     borderRadius: "6px",
// //                     padding: "8px 16px",
// //                     fontSize: "14px",
// //                     height: "36px",
// //                     minWidth: "auto",
// //                     display: "inline-flex",
// //                     alignItems: "center",
// //                     justifyContent: "center",
// //                   },
// //                   label: "Connect Wallet",
// //                 }}
// //               />
// //             </NavbarButton>
// //           </div>
// //         </NavBody>

// //         {/* Place Google Translate widget */}
// //         <div className="ml-4 p-2 border rounded bg-white dark:bg-gray-800">
// //           <GoogleTranslate />
// //         </div>

// //         {/* Mobile Navigation */}
// //         <MobileNav>
// //           <MobileNavHeader>
// //             <NavbarLogo />
// //             <MobileNavToggle
// //               isOpen={isMobileMenuOpen}
// //               onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
// //             />
// //           </MobileNavHeader>

// //           <MobileNavMenu
// //             isOpen={isMobileMenuOpen}
// //             onClose={() => setIsMobileMenuOpen(false)}
// //           >
// //             {navItems.map((item, idx) => (
// //               <a
// //                 key={`mobile-link-${idx}`}
// //                 href={item.link}
// //                 onClick={() => setIsMobileMenuOpen(false)}
// //                 className="relative text-neutral-600 dark:text-neutral-300"
// //               >
// //                 <span className="block">{item.name}</span>
// //               </a>
// //             ))}
// //             <div className="flex w-full flex-col gap-4 mt-4">
// //               {session ? (
// //                 <NavbarButton
// //                   onClick={() => {
// //                     signOut();
// //                     setIsMobileMenuOpen(false);
// //                   }}
// //                   variant="primary"
// //                   className="w-full"
// //                 >
// //                   Logout
// //                 </NavbarButton>
// //               ) : (
// //                 <NavbarButton
// //                   onClick={() => setIsMobileMenuOpen(false)}
// //                   variant="primary"
// //                   className="w-full"
// //                   href="/signin"
// //                 >
// //                   Login
// //                 </NavbarButton>
// //               )}
// //             </div>
// //           </MobileNavMenu>
// //         </MobileNav>
// //       </Navbar>
// //     </div>
// //   );
// // }


// // // "use client";

// // // import {
// // //   Navbar,
// // //   NavBody,
// // //   NavItems,
// // //   MobileNav,
// // //   NavbarLogo,
// // //   NavbarButton,
// // //   MobileNavHeader,
// // //   MobileNavToggle,
// // //   MobileNavMenu,
// // // } from "@/components/ui/navbar";
// // // import { useState, useEffect } from "react";
// // // import { ConnectButton } from "thirdweb/react";
// // // import { client } from "../lib/client";
// // // import { useSession, signOut } from "next-auth/react";
// // // import { useTranslation } from "react-i18next";
// // // import Link from "next/link";
// // // import LocaleSwitcher from "./LocaleSwitcher";

// // // export function NavbarDemo() {
// // //   const { data: session } = useSession();
// // //   const { t, i18n } = useTranslation();
// // //   //const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); 
// // //   // Keep track of client mount to avoid hydration mismatch
// // //   const [mounted, setMounted] = useState(false);
// // //   useEffect(() => {
// // //     setMounted(true);
// // //   }, []);

// // //   // Normalize locale to remove region codes (like en-IN to en)
// // //   const rawLocale = i18n.language || "en";
// // //   const locale = rawLocale.split("-")[0];

// // //   if (!mounted) {
// // //     // Render nothing or a simple placeholder until client mount to avoid mismatch
// // //     return null;
// // //   }

// // //   const navItems = [
// // //     { name: t("admin"), link: `/${locale}/admin` },
// // //     { name: t("organizations"), link: `/${locale}/organizations` },
// // //     { name: t("verifier"), link: `/${locale}/verifier` },
// // //     { name: t("certificate_playground"), link: `/${locale}/certificate-generator` },
// // //   ];

// // //   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

// // //   return (
// // //     <div className="relative w-full" role="navigation" aria-label={t("navigation") || "Main navigation"}>
// // //       <Navbar>
// // //         <NavBody>
// // //           <NavbarLogo />
// // //           <NavItems items={navItems} />
// // //           <div className="flex items-center gap-4">
// // //             <LocaleSwitcher />

// // //             {session ? (
// // //               <>
// // //                 <span className="text-sm text-gray-700 dark:text-gray-200">
// // //                   {session.user?.name || session.user?.username}
// // //                 </span>
// // //                 <NavbarButton variant="secondary" onClick={() => signOut()}>
// // //                   {t("logout")}
// // //                 </NavbarButton>
// // //               </>
// // //             ) : (
// // //               <NavbarButton variant="secondary" href={`/${locale}/signin`}>
// // //                 {t("login")}
// // //               </NavbarButton>
// // //             )}

// // //             <NavbarButton variant="primary" aria-label={t("connect_wallet")}>
// // //               <ConnectButton
// // //                 client={client}
// // //                 connectButton={{
// // //                   style: {
// // //                     backgroundColor: "#1a202c",
// // //                     color: "#fff",
// // //                     borderRadius: "6px",
// // //                     padding: "8px 16px",
// // //                     fontSize: "14px",
// // //                     height: "36px",
// // //                     minWidth: "auto",
// // //                     display: "inline-flex",
// // //                     alignItems: "center",
// // //                     justifyContent: "center",
// // //                   },
// // //                   label: t("connect_wallet"),
// // //                 }}
// // //               />
// // //             </NavbarButton>
// // //           </div>
// // //         </NavBody>

// // //         <MobileNav>
// // //           <MobileNavHeader>
// // //             <NavbarLogo />
// // //             <MobileNavToggle
// // //               isOpen={isMobileMenuOpen}
// // //               onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
// // //               aria-expanded={isMobileMenuOpen}
// // //               aria-controls="mobile-main-menu"
// // //             />
// // //           </MobileNavHeader>

// // //           <MobileNavMenu
// // //             id="mobile-main-menu"
// // //             isOpen={isMobileMenuOpen}
// // //             onClose={() => setIsMobileMenuOpen(false)}
// // //             aria-hidden={!isMobileMenuOpen}
// // //           >
// // //             {navItems.map((item, idx) => (
// // //               <Link
// // //                 key={`mobile-link-${idx}`}
// // //                 href={item.link}
// // //                 onClick={() => setIsMobileMenuOpen(false)}
// // //                 className="relative text-neutral-600 dark:text-neutral-300"
// // //               >
// // //                 <span className="block">{item.name}</span>
// // //               </Link>
// // //             ))}
// // //             <div className="flex w-full flex-col gap-4 mt-4">
// // //               {session ? (
// // //                 <NavbarButton
// // //                   onClick={() => {
// // //                     signOut();
// // //                     setIsMobileMenuOpen(false);
// // //                   }}
// // //                   variant="primary"
// // //                   className="w-full"
// // //                 >
// // //                   {t("logout")}
// // //                 </NavbarButton>
// // //               ) : (
// // //                 <NavbarButton
// // //                   onClick={() => setIsMobileMenuOpen(false)}
// // //                   variant="primary"
// // //                   className="w-full"
// // //                   href={`/${locale}/signin`}
// // //                 >
// // //                   {t("login")}
// // //                 </NavbarButton>
// // //               )}
// // //             </div>
// // //           </MobileNavMenu>
// // //         </MobileNav>
// // //       </Navbar>
// // //     </div>
// // //   );
// // // }



// // // "use client";
// // // import {
// // //   Navbar,
// // //   NavBody,
// // //   NavItems,
// // //   MobileNav,
// // //   NavbarLogo,
// // //   NavbarButton,
// // //   MobileNavHeader,
// // //   MobileNavToggle,
// // //   MobileNavMenu,
// // // } from "@/components/ui/navbar";
// // // import { useState } from "react";
// // // import { ConnectButton } from "thirdweb/react";
// // // import { client } from "../lib/client";
// // // import { useSession, signOut } from "next-auth/react";
// // // import { useTranslation } from "react-i18next";
// // // import Link from "next/link";
// // // import LocaleSwitcher from "./LocaleSwitcher"; 


// // // export function NavbarDemo() {
// // //   const { data: session } = useSession();
// // //   const t = useTranslation("Navbar");
// // //   const locale = i18n.language || "en"; // Get current language from i18n

// // //   // Navigation items translated
// // //   const navItems = [
// // //     { name: t("admin"), link: `/${locale}/admin` },
// // //     { name: t("organizations"), link: `/${locale}/organizations` },
// // //     { name: t("verifier"), link: `/${locale}/verifier` },
// // //     { name: t("certificate_playground"), link: `/${locale}/certificate-generator` },
// // //   ];

// // //   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

// // //   return (
// // //     <div className="relative w-full" role="navigation" aria-label={t("navigation") || "Main navigation"}>
// // //       <Navbar>
// // //         <NavBody>
// // //           <NavbarLogo />
// // //           <NavItems items={navItems} />
// // //           <div className="flex items-center gap-4">
// // //             <LocaleSwitcher locales={['en','hi']} /> {/* accessible language switcher */}
// // //             {session ? (
// // //               <>
// // //                 <span className="text-sm text-gray-700 dark:text-gray-200">
// // //                   {session.user?.name || session.user?.username}
// // //                 </span>
// // //                 <NavbarButton variant="secondary" onClick={() => signOut()}>
// // //                   {t("logout")}
// // //                 </NavbarButton>
// // //               </>
// // //             ) : (
// // //               <NavbarButton variant="secondary" href={`/${locale}/signin`}>
// // //                 {t("login")}
// // //               </NavbarButton>
// // //             )}
// // //             <NavbarButton variant="primary" aria-label={t("connect_wallet")}>
// // //               <ConnectButton
// // //                 client={client}
// // //                 connectButton={{
// // //                   style: {
// // //                     backgroundColor: "#1a202c",
// // //                     color: "#fff",
// // //                     borderRadius: "6px",
// // //                     padding: "8px 16px",
// // //                     fontSize: "14px",
// // //                     height: "36px",
// // //                     minWidth: "auto",
// // //                     display: "inline-flex",
// // //                     alignItems: "center",
// // //                     justifyContent: "center",
// // //                   },
// // //                   label: t("connect_wallet"),
// // //                 }}
// // //               />
// // //             </NavbarButton>
// // //           </div>
// // //         </NavBody>

// // //         <MobileNav>
// // //           <MobileNavHeader>
// // //             <NavbarLogo />
// // //             <MobileNavToggle
// // //               isOpen={isMobileMenuOpen}
// // //               onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
// // //               aria-expanded={isMobileMenuOpen}
// // //               aria-controls="mobile-main-menu"
// // //             />
// // //           </MobileNavHeader>

// // //           <MobileNavMenu
// // //             id="mobile-main-menu"
// // //             isOpen={isMobileMenuOpen}
// // //             onClose={() => setIsMobileMenuOpen(false)}
// // //             aria-hidden={!isMobileMenuOpen}
// // //           >
// // //             {navItems.map((item, idx) => (
// // //               <Link
// // //                 key={`mobile-link-${idx}`}
// // //                 href={item.link}
// // //                 onClick={() => setIsMobileMenuOpen(false)}
// // //                 className="relative text-neutral-600 dark:text-neutral-300"
// // //               >
// // //                 <span className="block">{item.name}</span>
// // //               </Link>
// // //             ))}
// // //             <div className="flex w-full flex-col gap-4 mt-4">
// // //               {session ? (
// // //                 <NavbarButton
// // //                   onClick={() => {
// // //                     signOut();
// // //                     setIsMobileMenuOpen(false);
// // //                   }}
// // //                   variant="primary"
// // //                   className="w-full"
// // //                 >
// // //                   {t("logout")}
// // //                 </NavbarButton>
// // //               ) : (
// // //                 <NavbarButton
// // //                   onClick={() => setIsMobileMenuOpen(false)}
// // //                   variant="primary"
// // //                   className="w-full"
// // //                   href={`/${locale}/signin`}
// // //                 >
// // //                   {t("login")}
// // //                 </NavbarButton>
// // //               )}
// // //             </div>
// // //           </MobileNavMenu>
// // //         </MobileNav>
// // //       </Navbar>
// // //     </div>
// // //   );
// // // }


