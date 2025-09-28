import { Geist, Geist_Mono } from "next/font/google";
import { NavbarDemo } from "@/components/NavbarContent";
import { ThirdwebProvider } from "thirdweb/react";
import { client } from "../lib/client";
import SessionProvider from "@/components/SessionProvider"; // ✅ import
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import PWATestInstall from "@/components/PWATestInstall";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "CertiFy - Certificate Verification Platform",
  description: "A progressive web application for certificate verification and management",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CertiFy",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="application-name" content="CertiFy" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="CertiFy" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icon-192x192.png" />
        
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512x512.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="mask-icon" href="/mask.svg" color="#000000" />
        <link rel="shortcut icon" href="/certify-logo.png" />
        
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:url" content="https://yourwebsite.com" />
        <meta name="twitter:title" content="CertiFy" />
        <meta name="twitter:description" content="Certificate Verification Platform" />
        <meta name="twitter:image" content="https://yourwebsite.com/icon-192x192.png" />
        <meta name="twitter:creator" content="@YourTwitterHandle" />
        
        <meta property="og:type" content="website" />
        <meta property="og:title" content="CertiFy" />
        <meta property="og:description" content="Certificate Verification Platform" />
        <meta property="og:site_name" content="CertiFy" />
        <meta property="og:url" content="https://yourwebsite.com" />
        <meta property="og:image" content="https://yourwebsite.com/icon-512x512.png" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SessionProvider> {/* ✅ wrap with SessionProvider */}
          <ThirdwebProvider client={client}>
            <ServiceWorkerRegistration />
            <NavbarDemo />
            {children}
            <PWAInstallPrompt />
            <PWATestInstall />
          </ThirdwebProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
