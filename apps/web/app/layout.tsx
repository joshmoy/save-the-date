import type { Metadata } from "next";
import { Providers } from "./providers";
import "../src/index.css";
import "../src/harbour.css";
import "@fontsource/source-serif-4/latin-400.css";

export const metadata: Metadata = {
  title: "Save The Date",
  description: "Your wedding website, celebrations and memories, together.",
  icons: {
    icon: [{ url: "/favicon.ico", sizes: "any" }],
    shortcut: [{ url: "/favicon.ico" }],
    apple: [{ url: "/favicon.ico" }],
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
