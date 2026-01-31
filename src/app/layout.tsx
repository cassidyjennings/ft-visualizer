import "./globals.css";
import Header from "@/components/Header";
import { spectral, sourceSans } from "./fonts";
import { SettingsProvider } from "@/lib/settings/SettingsContext";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${sourceSans.variable} ${spectral.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function () {
  try {
    const raw = localStorage.getItem("ftv_settings_v1");
    const s = raw ? JSON.parse(raw) : null;
    const mode = s?.coloring || "system";
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldDark = mode === "dark" ? true : mode === "light" ? false : prefersDark;
    document.documentElement.classList.toggle("dark", shouldDark);
  } catch (e) {}
})();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-bg text-fg">
        <SettingsProvider>
          <Header />
          <main className="w-full max-w-none px-6 py-6">{children}</main>
        </SettingsProvider>
      </body>
    </html>
  );
}
