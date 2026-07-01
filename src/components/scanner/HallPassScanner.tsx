"use client";

import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  CircleSlash,
  Keyboard,
  RotateCcw,
  ScanLine,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { formatDateTime } from "../../lib/formatDate";
import type { HallPassRedeemResult } from "../../lib/hallPasses";

const statusContent = {
  valid: {
    label: "Valid",
    heading: "Pass Accepted",
    detail: "This QR code was valid and has now been marked as used.",
    color: "green",
    bg: "green.50",
    border: "green.500",
    icon: CheckCircle2,
  },
  used: {
    label: "Used",
    heading: "Already Used",
    detail: "This QR code has already been scanned. Do not admit with this pass.",
    color: "orange",
    bg: "orange.50",
    border: "orange.500",
    icon: AlertTriangle,
  },
  invalid: {
    label: "Invalid",
    heading: "Invalid Pass",
    detail: "This QR code does not match an issued hall pass.",
    color: "red",
    bg: "red.50",
    border: "red.500",
    icon: CircleSlash,
  },
} as const;

function ResultPanel({
  result,
  onScanNext,
  isStarting,
}: {
  result: HallPassRedeemResult;
  onScanNext: () => void;
  isStarting: boolean;
}) {
  const content = statusContent[result.status];
  const Icon = content.icon;

  return (
    <Box
      bg={content.bg}
      borderWidth="3px"
      borderColor={content.border}
      borderRadius="sm"
      p={{ base: 6, md: 8 }}
    >
      <Stack gap={6} align="center" textAlign="center">
        <Flex
          w="92px"
          h="92px"
          align="center"
          justify="center"
          borderRadius="full"
          bg="white"
          color={`${content.color}.700`}
          borderWidth="2px"
          borderColor={content.border}
        >
          <Icon size={52} />
        </Flex>

        <Stack gap={2} align="center">
          <Badge colorPalette={content.color}>{content.label}</Badge>
          <Heading fontFamily="subheading" color="textPrimary" fontSize={{ base: "4xl", md: "5xl" }}>
            {content.heading}
          </Heading>
          <Text color="gray.800" fontSize={{ base: "md", md: "lg" }}>
            {content.detail}
          </Text>
        </Stack>

        <Box w="full" bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="sm" p={4} textAlign="left">
          <Text fontSize="sm" color="gray.500">
            Ticket
          </Text>
          <Text fontWeight="700" color="textPrimary">
            {result.ticket_number ? `Ticket #${result.ticket_number.toString().padStart(3, "0")}` : "-"}
          </Text>

          <Text fontSize="sm" color="gray.500" mt={4}>
            Guest
          </Text>
          <Text fontWeight="700" color="textPrimary">
            {result.guest_name ?? "Guest"}
          </Text>

          {result.used_at ? (
            <>
              <Text fontSize="sm" color="gray.500" mt={4}>
                Used At
              </Text>
              <Text color="textPrimary">{formatDateTime(result.used_at)}</Text>
            </>
          ) : null}
        </Box>

        <Button bg="burgundy" color="white" onClick={onScanNext} loading={isStarting}>
          <ScanLine size={18} />
          Scan Next
        </Button>
      </Stack>
    </Box>
  );
}

export function HallPassScanner() {
  const scannerRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);
  const hasScannedRef = useRef(false);
  const isUnmountedRef = useRef(false);
  const prefixRef = useRef<HTMLInputElement>(null);
  const firstCodeRef = useRef<HTMLInputElement>(null);
  const secondCodeRef = useRef<HTMLInputElement>(null);
  const [manualParts, setManualParts] = useState({
    prefix: "",
    first: "",
    second: "",
  });
  const [fallbackValue, setFallbackValue] = useState("");
  const [useFallbackEntry, setUseFallbackEntry] = useState(false);
  const [result, setResult] = useState<HallPassRedeemResult | null>(null);
  const [error, setError] = useState("");
  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop().catch(() => undefined);
    }
  }, []);

  const clearScanner = useCallback(async () => {
    const scanner = scannerRef.current;

    if (!scanner) return;

    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
      await scanner.clear();
      scannerRef.current = null;
    } catch {
      try {
        if (scanner.isScanning) {
          await scanner.stop();
        }
        await scanner.clear();
        scannerRef.current = null;
      } catch {
        // Ignore camera cleanup races during route transitions.
      }
    }
  }, []);

  const redeemQrValue = useCallback(
    async (value: string) => {
      if (!value.trim()) {
        setError("Scan or enter a QR value first.");
        return;
      }

      setError("");
      setResult(null);
      setIsRedeeming(true);
      await stopScanner();

      const response = await fetch("/api/passes/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });

      setIsRedeeming(false);
      setIsCameraVisible(false);

      if (!response.ok) {
        setError("Could not verify this QR code.");
        return;
      }

      const data = (await response.json()) as { result: HallPassRedeemResult };
      setResult(data.result);
    },
    [stopScanner],
  );

  const openScanner = useCallback(() => {
    setError("");
    setResult(null);
    setIsCameraVisible(true);
    setIsStarting(true);
    hasScannedRef.current = false;
  }, []);

  const startScanner = useCallback(async () => {
    setIsStarting(true);

    try {
      if (!window.isSecureContext && window.location.hostname !== "localhost") {
        throw new Error("Camera access requires HTTPS on mobile browsers.");
      }

      if (!document.getElementById("hall-pass-scanner")) {
        throw new Error("Scanner container is not ready.");
      }

      const { Html5Qrcode } = await import("html5-qrcode");

      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("hall-pass-scanner");
      }

      if (scannerRef.current.isScanning) {
        await scannerRef.current.stop().catch(() => undefined);
      }

      await scannerRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          if (hasScannedRef.current) return;
          hasScannedRef.current = true;
          void redeemQrValue(decodedText);
        },
        () => undefined,
      );
      if (isUnmountedRef.current) {
        await clearScanner();
        return;
      }
      setIsStarting(false);
    } catch {
      if (isUnmountedRef.current) return;
      setIsStarting(false);
      setIsCameraVisible(false);
      setError(
        window.isSecureContext
          ? "Camera access is unavailable. Check browser permissions, then try again."
          : "Camera access requires HTTPS on mobile browsers. Open the deployed HTTPS site or use manual entry.",
      );
    }
  }, [clearScanner, redeemQrValue]);

  function handleManualSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const structuredToken = `${manualParts.prefix}-${manualParts.first}-${manualParts.second}`;
    const value = useFallbackEntry ? fallbackValue : structuredToken;

    void redeemQrValue(value);
  }

  function cleanTokenPart(value: string, maxLength: number) {
    return value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, maxLength);
  }

  function applyFullToken(value: string) {
    const match = value.toUpperCase().match(/([A-Z0-9]{2})[-\s]?([A-Z0-9]{4})[-\s]?([A-Z0-9]{4})/);

    if (!match) return false;

    setManualParts({
      prefix: match[1],
      first: match[2],
      second: match[3],
    });
    setFallbackValue("");
    setUseFallbackEntry(false);
    secondCodeRef.current?.focus();

    return true;
  }

  function handleStructuredChange(
    part: "prefix" | "first" | "second",
    maxLength: number,
    nextInput?: HTMLInputElement | null,
  ) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;

      if (value.length > maxLength && applyFullToken(value)) {
        return;
      }

      const nextValue = cleanTokenPart(value, maxLength);

      setManualParts((current) => ({
        ...current,
        [part]: nextValue,
      }));

      if (nextValue.length === maxLength) {
        nextInput?.focus();
      }
    };
  }

  async function resetScanner() {
    await stopScanner();
    setResult(null);
    setError("");
    setManualParts({ prefix: "", first: "", second: "" });
    setFallbackValue("");
    setUseFallbackEntry(false);
    setIsCameraVisible(false);
    hasScannedRef.current = false;
  }

  async function scanNext() {
    await resetScanner();
    openScanner();
  }

  useEffect(() => {
    isUnmountedRef.current = false;

    return () => {
      isUnmountedRef.current = true;
      void clearScanner();
    };
  }, [clearScanner]);

  useEffect(() => {
    if (!isCameraVisible || result) return;

    let isCancelled = false;
    const frameId = window.requestAnimationFrame(() => {
      if (!isCancelled) {
        void startScanner();
      }
    });

    return () => {
      isCancelled = true;
      window.cancelAnimationFrame(frameId);
    };
  }, [isCameraVisible, result, startScanner]);

  return (
    <Box minH="100vh" bg="#F7FAFC">
      <Container maxW="640px" mx="auto" px={6} py={8}>
        <Stack gap={6}>
          <Box textAlign="center">
            <Text textStyle="accent" color="roseWine">
              Security
            </Text>
            <Heading fontFamily="subheading" color="burgundy" fontSize="4xl">
              Scan Hall Pass
            </Heading>
            <Text color="gray.600" mt={2}>
              Scan a QR code to verify whether the hall pass is valid, used, or invalid.
            </Text>
          </Box>

          {!result ? (
            <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="sm" p={5}>
              <Stack gap={4}>
                {!isCameraVisible ? (
                  <Button bg="burgundy" color="white" onClick={openScanner} loading={isStarting || isRedeeming}>
                    <Camera size={18} />
                    Scan QR
                  </Button>
                ) : (
                  <>
                    <Box
                      id="hall-pass-scanner"
                      minH="320px"
                      overflow="hidden"
                      borderRadius="sm"
                      bg="black"
                    />
                    {isStarting ? (
                      <Text color="gray.600" fontSize="sm" textAlign="center">
                        Starting camera...
                      </Text>
                    ) : null}
                    <Button variant="outline" onClick={resetScanner}>
                      <RotateCcw size={18} />
                      Cancel Scan
                    </Button>
                  </>
                )}
              </Stack>
            </Box>
          ) : null}

          {result ? (
            <ResultPanel result={result} onScanNext={() => void scanNext()} isStarting={isStarting} />
          ) : null}

          {error ? (
            <Box bg="red.50" borderWidth="1px" borderColor="red.200" borderRadius="sm" p={4}>
              <Text color="red.700">{error}</Text>
            </Box>
          ) : null}

          <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="sm" p={5}>
            <form onSubmit={handleManualSubmit}>
              <Stack gap={3}>
                <Text fontWeight="700" color="textPrimary">
                  <Keyboard size={18} /> Manual entry
                </Text>
                {!useFallbackEntry ? (
                  <Flex align="center" gap={2}>
                    <Input
                      ref={prefixRef}
                      value={manualParts.prefix}
                      onChange={handleStructuredChange("prefix", 2, firstCodeRef.current)}
                      placeholder="HP"
                      maxLength={10}
                      textAlign="center"
                      fontFamily="mono"
                      fontWeight="700"
                      aria-label="Token prefix"
                    />
                    <Text color="gray.500" fontWeight="700">
                      -
                    </Text>
                    <Input
                      ref={firstCodeRef}
                      value={manualParts.first}
                      onChange={handleStructuredChange("first", 4, secondCodeRef.current)}
                      placeholder="XXXX"
                      maxLength={12}
                      textAlign="center"
                      fontFamily="mono"
                      fontWeight="700"
                      aria-label="Token first code"
                    />
                    <Text color="gray.500" fontWeight="700">
                      -
                    </Text>
                    <Input
                      ref={secondCodeRef}
                      value={manualParts.second}
                      onChange={handleStructuredChange("second", 4)}
                      placeholder="XXXX"
                      maxLength={12}
                      textAlign="center"
                      fontFamily="mono"
                      fontWeight="700"
                      aria-label="Token second code"
                    />
                  </Flex>
                ) : (
                  <Input
                    value={fallbackValue}
                    onChange={(event) => setFallbackValue(event.target.value.toUpperCase())}
                    placeholder="Paste QR value"
                  />
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  alignSelf="start"
                  onClick={() => setUseFallbackEntry((current) => !current)}
                >
                  {useFallbackEntry ? "Use structured token" : "Use raw QR value"}
                </Button>
                <Button type="submit" bg="burgundy" color="white" loading={isRedeeming}>
                  Verify Pass
                </Button>
              </Stack>
            </form>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
