'use client';

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

export function AppSessionProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider
      refetchInterval={0}
      refetchOnWindowFocus={true}
    >
      {children}
    </SessionProvider>
  );
}

