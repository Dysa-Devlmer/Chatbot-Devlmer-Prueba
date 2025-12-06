import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "WhatsApp Chatbot JARVIS",
  description: "WhatsApp Business API Integration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
