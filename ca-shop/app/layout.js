import "./globals.css";

export const metadata = {
  title: "ca.shop | Kasir",
  description: "Sistem kasir ca.shop",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}