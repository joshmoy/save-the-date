"use client";

import { Box, Button, Container, Flex, Link as ChakraLink, Text } from "@chakra-ui/react";
import { LogOut, QrCode, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AuthSession } from "../../lib/auth";

export function AuthHeader({ session }: { session: AuthSession }) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <Box borderBottomWidth="1px" borderColor="gray.200" bg="white">
      <Container maxW="1100px" mx="auto" px={6} py={4}>
        <Flex align="center" justify="space-between" gap={4} wrap="wrap">
          <Flex align="center" gap={3}>
            <Text fontFamily="heading" fontSize="2xl" color="burgundy">
              Adeola & Joshua
            </Text>
            <Text color="gray.400">/</Text>
            <Text color="gray.700" fontWeight="700">
              {session.role === "super_admin" ? "Admin" : "Security"}
            </Text>
          </Flex>

          <Flex align="center" gap={3} wrap="wrap">
            {session.role === "super_admin" ? (
              <ChakraLink asChild color="gray.700" fontWeight="600">
                <Link href="/admin/passes">
                  <QrCode size={16} />
                  Passes
                </Link>
              </ChakraLink>
            ) : null}
            <ChakraLink asChild color="gray.700" fontWeight="600">
              <Link href="/scanner">
                <ShieldCheck size={16} />
                Scanner
              </Link>
            </ChakraLink>
            <Text color="gray.500" fontSize="sm">
              {session.email}
            </Text>
            <Button size="sm" variant="outline" onClick={() => void handleLogout()} loading={isLoggingOut}>
              <LogOut size={16} />
              Logout
            </Button>
          </Flex>
        </Flex>
      </Container>
    </Box>
  );
}
