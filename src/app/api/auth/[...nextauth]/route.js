// app/api/auth/[...nextauth]/route.ts
import NextAuth, { DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";   // ✅ use shared prisma instance
import { compare } from "bcryptjs";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
        name: { label: "Name", type: "text" },
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials) {
        if (
          !credentials?.username ||
          !credentials?.password ||
          !credentials?.name ||
          !credentials?.role
        ) return null;

        let user;
        if (credentials.role === "organisation") {
        user = await prisma.organisation.findUnique({
          where: { username: credentials.username },
        });
      } else if (credentials.role === "admin") {
        user = await prisma.admin.findUnique({
          where: { username: credentials.username },
        });
      } else {
        return null; // invalid role
      }
        

        if (!user || !user.hashedPassword) return null;

        const isValid = await compare(credentials.password, user.hashedPassword);
        if (!isValid) return null;

        return { id: user.id, username: user.username, name: user.name };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/signin",
    error: "/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name || null;
        token.username = user.username || null;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id || undefined;
        session.user.name = token.name || null;
        session.user.username = token.username || null;
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };
