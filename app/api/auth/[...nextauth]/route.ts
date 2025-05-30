import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@/lib/generated/prisma"; // Adjusted path

const prisma = new PrismaClient();

// Define and export authOptions
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    // Add other providers here if needed
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async session({ session, user }) {
      // Send properties to the client, like an access_token and user.id from a provider.
      // The user object here is the user from the database.
      if (session.user) {
        session.user.id = user.id; // Add the user's DB ID to the session object
      }
      return session;
    }
  }
  // You can add other configurations like pages for custom sign-in, etc.
  // pages: {
  //   signIn: '/auth/signin',
  // }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 