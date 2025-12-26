import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EmpraDB - The World's Largest Math Database",
  description: "Every formula. Every concept. Every curriculum. One system.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"
          integrity="sha384-n8MVd4RsNIU0tAv4ct0nTaAbDJwPJzDEaqSD1odI+WdtXRGWt2kTvGFasHpSy3SV"
          crossOrigin="anonymous"
        />
      </head>
      <body className="bg-black text-white antialiased">
        <div className="min-h-screen flex flex-col">
          <header className="border-b border-gray-800 px-6 py-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🖤</span>
                <h1 className="text-xl font-bold">EmpraDB</h1>
              </div>
              <nav className="flex gap-6 text-sm">
                <a href="/" className="hover:text-gray-400 transition">
                  Search
                </a>
                <a href="/study" className="hover:text-gray-400 transition">
                  Study Hub
                </a>
                <a href="/graph" className="hover:text-gray-400 transition">
                  Graph
                </a>
              </nav>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="border-t border-gray-800 px-6 py-4 text-center text-sm text-gray-600">
            <p>
              EmpraDB · Open Source Math Knowledge System · No ads, no scores,
              no stress
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}
