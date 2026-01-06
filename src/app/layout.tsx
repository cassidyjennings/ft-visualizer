import "./globals.css";
import Header from "@/components/Header";
import { SettingsProvider } from "@/lib/settings/SettingsContext";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-black text-white">
        <SettingsProvider>
          <Header />
          <main className="w-full max-w-none px-6 py-6">{children}</main>
        </SettingsProvider>
      </body>
    </html>
  );
}
