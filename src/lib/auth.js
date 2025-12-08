// lib/auth.js
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" }, // "admin", "organisation", or "user"
      },
      async authorize(credentials) {
        console.log("=== AUTH DEBUG ===");
        console.log("Credentials received:", {
          username: credentials?.username,
          password: credentials?.password ? "PROVIDED" : "MISSING",
          role: credentials?.role
        });
        
        if (!credentials?.username || !credentials?.password || !credentials?.role) {
          console.log("❌ Missing required credentials");
          return null;
        }

        let user;

        try {
          if (credentials.role === "admin") {
            console.log("🔍 Looking for admin user...");
            user = await prisma.admin.findUnique({
              where: { username: credentials.username },
            });
          } else if (credentials.role === "organisation") {
            console.log("🔍 Looking for organisation user...");
            user = await prisma.organisation.findUnique({
              where: { username: credentials.username },
            });
          } else if (credentials.role === "user") {
            console.log("🔍 Looking for user...");
            // Try to find user by apaarId first, then by mobile
            user = await prisma.user.findFirst({
              where: {
                OR: [
                  { apaarId: credentials.username },
                  { mobile: credentials.username }
                ]
              }
            });
          } else {
            console.log("❌ Invalid role:", credentials.role);
            return null;
          }

          console.log("User found in DB:", user ? "✅ YES" : "❌ NO");
          if (user) {
            console.log("User data:", {
              id: user.id,
              username: user.username,
              hasPassword: user.hashedPassword ? "YES" : "NO"
            });
          }

          if (!user || !user.hashedPassword) {
            console.log("❌ No user found or no hashed password");
            return null;
          }

          console.log("🔐 Comparing passwords...");
          const isValid = await compare(credentials.password, user.hashedPassword);
          console.log("Password comparison result:", isValid ? "✅ VALID" : "❌ INVALID");
          
          if (!isValid) {
            console.log("❌ Password mismatch");
            return null;
          }

          console.log("✅ Authentication successful");
          return {
            id: user.id,
            username: user.apaarId, // Always use apaarId as the unique identifier
            name: user.name,
            mobile: user.mobile,
            role: credentials.role,
          };
        } catch (error) {
          console.error("❌ Auth error:", error);
          return null;
        }
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.name = user.name;
        token.role = user.role;
        token.mobile = user.mobile;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.name = token.name;
        session.user.role = token.role;
        session.user.mobile = token.mobile;
      }
      return session;
    },
  },

  pages: {
    signIn: "/signin",
  },

  secret: process.env.NEXTAUTH_SECRET,
};
