"use client";

import { ChakraProvider } from "@chakra-ui/react";
import type { ReactNode } from "react";
import system from "../src/theme";
import { Toaster } from "../src/components/ui/toaster";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ChakraProvider value={system}>
      {children}
      <Toaster />
    </ChakraProvider>
  );
}
