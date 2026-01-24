import "./globals.css";
import Header from "@/components/Header";
import { spectral, sourceSans } from "./fonts";

import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { SettingsProvider } from "@/lib/settings/SettingsContext";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${sourceSans.variable} ${spectral.variable}`}
    >
      <body className="min-h-screen bg-bg text-fg ">
        <ThemeProvider defaultTheme="system" enableSystem disableTransitionOnChange>
          <SettingsProvider>
            <Header />
            <main className="w-full max-w-none px-6 py-6">{children}</main>
          </SettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
