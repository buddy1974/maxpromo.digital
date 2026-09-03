/**
 * types/next-auth.d.ts
 *
 * Module augmentation for NextAuth v4 / Auth.js.
 * Extends the built-in Session, User, and JWT types with the fields our
 * Credentials provider injects during sign-in.
 *
 * WHY here: NextAuth ships narrow base types; augmenting them at the project
 * level avoids casting `session.user as any` throughout the codebase.
 */
import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getServerSession`, and passed to `session` callback.
   */
  interface Session {
    user: {
      id: string;
      businessId: string;
      role: string;
    } & DefaultSession["user"];
  }

  /**
   * The shape returned by the `authorize` callback in the Credentials provider.
   */
  interface User extends DefaultUser {
    id: string;
    businessId: string;
    role: string;
  }
}

declare module "next-auth/jwt" {
  /**
   * The decoded JWT — what the `jwt` callback receives and writes.
   */
  interface JWT extends DefaultJWT {
    userId: string;
    businessId: string;
    role: string;
  }
}
