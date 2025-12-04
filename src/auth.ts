import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { AuthService } from "@/server/services/auth.service";
import { LoginSchema } from "@/schemas/auth.schema";

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        try {
          const parsed = LoginSchema.parse(credentials);
          const user = await AuthService.validateUser(
            parsed.email,
            parsed.password
          );
          return {
            id: user.id,
            email: user.email,
            name: user.nome,
            role: user.role,
          };
        } catch (error) {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        if (user.id) {
          token.id = user.id;
        }

        if (user.role) {
          token.role = user.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});

