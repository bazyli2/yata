import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";

import { ThemeRegistry } from "@/components/theme-provider";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "yata — a list that only holds today",
  description:
    "Write the task, give it a day if it needs one, check it off. Everything else waits its turn instead of shouting at you.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${archivo.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {/* Collects emotion's styles during SSR so MUI markup arrives styled
            on first paint instead of flashing unstyled. */}
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <ThemeRegistry>{children}</ThemeRegistry>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
