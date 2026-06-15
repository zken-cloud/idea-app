import NextAuth from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/db";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { logAudit } from "./audit";
import { rateLimit } from "./rateLimit";

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials) return null;

        // Rate limit credential attempts per username to slow brute-force
        if (!rateLimit(`login:${credentials.username}`, 5, 15 * 60 * 1000)) {
          throw new Error("Too many login attempts. Please try again later.");
        }

        // Local Admin Check
        if (credentials.username === "admin") {
          const adminPassword = process.env.LOCAL_ADMIN_PASSWORD;
          if (adminPassword && credentials.password === adminPassword) {
            let user = await prisma.user.findUnique({
              where: { email: "admin@local" },
            });

            if (!user) {
              user = await prisma.user.create({
                data: {
                  email: "admin@local",
                  name: "Local Admin",
                  role: "Admin",
                },
              });
            }

            return user;
          }
        }

        // Standard User Login (if implemented later)
        // const user = await prisma.user.findUnique({ where: { email: credentials.username } });
        // if (user && user.passwordHash && bcrypt.compareSync(credentials.password, user.passwordHash)) {
        //   return user;
        // }

        return null;
      },
    }),
  ],
  events: {
    async signIn({ user, account, profile, isNewUser }: any) {
      await logAudit("SIGN_IN", `User ${user.email} signed in`, user);
    },
    async signOut({ token }: any) {
      if (token?.sub) {
        await logAudit("SIGN_OUT", `User ${token.email} signed out`, {
          id: token.sub,
          name: token.name,
          email: token.email,
        });
      }
    },
  },
  callbacks: {
    async jwt({ token, user, account, profile }: any) {
      if (account?.provider === "google" && profile?.picture) {
        token.image = profile.picture;
        if (token.sub) {
          await prisma.user.update({
            where: { id: token.sub },
            data: { image: profile.picture },
          });
        }
      }

      if (user) {
        token.role = user.role;
        token.id = user.id;
        if (user.image && !token.image) {
          token.image = user.image;
        }
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session?.user) {
        session.user.role = token.role;
        session.user.id = token.sub; // Use token.sub as user ID
        session.user.image = token.image;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt" as const,
    maxAge: 8 * 60 * 60, // 8 hours
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
  },
};

export default NextAuth(authOptions);

declare module "next-auth" {
  interface Session {
    user?: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string | null;
      id?: string | null;
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string | null;
    id?: string | null;
  }
}
