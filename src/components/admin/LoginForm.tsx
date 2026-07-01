"use client";

import { Box, Button, Container, Field, Heading, Input, Stack, Text } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      setError("Invalid email or password.");
      return;
    }

    const data = (await response.json()) as { role?: string };
    const fallbackPath = data.role === "bouncer" ? "/scanner" : "/admin/passes";

    router.push(nextPath ?? fallbackPath);
    router.refresh();
  }

  return (
    <Box minH="100vh" bg="cream" display="flex" alignItems="center">
      <Container maxW="420px" mx="auto" px={6}>
        <Box bg="white" borderWidth="1px" borderColor="oldRose" borderRadius="sm" p={8} shadow="elegant">
          <Stack gap={6}>
            <Box textAlign="center">
              <Text textStyle="accent" color="roseWine" mb={2}>
                Hall Pass Admin
              </Text>
              <Heading fontFamily="subheading" color="burgundy" fontSize="3xl">
                Sign in
              </Heading>
            </Box>

            <form onSubmit={handleSubmit}>
              <Stack gap={4}>
                <Field.Root required>
                  <Field.Label>Email</Field.Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                  />
                </Field.Root>

                <Field.Root required>
                  <Field.Label>Password</Field.Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                  />
                </Field.Root>

                {error ? (
                  <Text color="red.600" fontSize="sm">
                    {error}
                  </Text>
                ) : null}

                <Button type="submit" bg="burgundy" color="white" loading={isSubmitting}>
                  Sign in
                </Button>
              </Stack>
            </form>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
