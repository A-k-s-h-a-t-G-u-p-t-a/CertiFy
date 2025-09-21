// app/api/auth/[...nextauth]/route.js
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" }, // admin or organisation
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password || !credentials?.role) return null;

        let user;
        if (credentials.role === "organisation") {
          user = await prisma.organisation.findUnique({ where: { username: credentials.username } });
        } else if (credentials.role === "admin") {
          user = await prisma.admin.findUnique({ where: { username: credentials.username } });
        } else {
          return null;
        }

        if (!user || !user.hashedPassword) return null;

        const isValid = await compare(credentials.password, user.hashedPassword);
        if (!isValid) return null;

        return {
          id: user.id,
          username: user.username, // ✅ store username
          name: user.name || null,
          role: credentials.role,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username; // ✅ store username in JWT
        token.name = user.name || null;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.username = token.username; // ✅ session contains username
        session.user.name = token.name;
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/signin",
    error: "/signin",
  },
});

export { handler as GET, handler as POST };
