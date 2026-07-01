import type { Metadata } from "next";
import { Providers } from "./providers";
import "../src/index.css";

export const metadata: Metadata = {
  title: "Adeola & Joshua 2026",
  description: "Save the date for Adeola and Joshua's wedding.",
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
