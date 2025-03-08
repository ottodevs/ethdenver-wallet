import type { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: AuthOptions = {
  // debug: true,
  secret: process.env.AUTH_SECRET,
  providers: [
    GoogleProvider({ // Configure Google Provider
      clientId: process.env.GOOGLE_CLIENT_ID!, // From .env
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!, // From .env
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, /*user,*/ account }) {
      if (account) {
        token.id_token = account.id_token;
      }
      return token;
    },
    async session({ session, token }) {
      //@ts-expect-error - id_token is not defined on type Session
      session.id_token = token.id_token;
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin', // Custom sign-in page
  },
}; 