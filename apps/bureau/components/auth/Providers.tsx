"use client";

/**
 * components/auth/Providers.tsx
 *
 * Client wrapper that makes NextAuth session available to client components
 * via the `useSession` hook.
 *
 * WHY a separate component: the root layout is a Server Component and cannot
 * use `SessionProvider` directly (it is a client-only context). Wrapping it
 * here keeps the layout lean and the boundary explicit.
 */
import { SessionProvider } from "next-auth/react";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
