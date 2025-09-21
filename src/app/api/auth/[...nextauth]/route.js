import NextAuth from "next-auth";
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
        role: { label: "Role", type: "text" }, // "admin" or "organisation"
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password || !credentials?.role) return null;

        let user;

        if (credentials.role === "admin") {
          user = await prisma.admin.findUnique({
            where: { username: credentials.username },
          });
        } else if (credentials.role === "organisation") {
          user = await prisma.organisation.findUnique({
            where: { username: credentials.username },
          });
        } else {
          return null; // invalid role
        }

        if (!user || !user.hashedPassword) return null;

        const isValid = await compare(credentials.password, user.hashedPassword);
        if (!isValid) return null;

        return { id: user.id, username: user.username, name: user.name, role: credentials.role };
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
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.name = token.name;
        session.user.role = token.role;
      }
      return session;
    },
  },

  pages: {
    signIn: "/signin", // custom sign-in page
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
