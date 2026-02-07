"use client";

import React from "react";
import { ClerkProvider, useAuth, UserButton } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import {
  Authenticated,
  AuthLoading,
  ConvexReactClient,
  Unauthenticated,
} from "convex/react";
import { ThemeProvider } from "./ui/theme-provider";
import { UnauthenticatedView } from "@/featuers/auth/componentes/unatuhenticated-view";
import { AuthLoadingView } from "@/featuers/auth/componentes/auth-loqding-view";

const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL!
);

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <ClerkProvider>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Authenticated>
            <UserButton />
            {children}
          </Authenticated>
          <Unauthenticated>
            <UnauthenticatedView />
          </Unauthenticated>
          <AuthLoading>
            <AuthLoadingView />
          </AuthLoading>
        </ThemeProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
};
