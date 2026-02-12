"use client";

import { SignInButton } from "@clerk/nextjs";

export const UnauthenticatedView = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background">
      <h1 className="text-2xl font-bold mb-4">Welcome</h1>
      <p className="mb-4">Please sign in to continue.</p>
      <SignInButton />
    </div>
  );
};
