import RoleSelectionModal from "./components/RoleSelectionModal";
import { RoleModalProvider } from "./context/RoleModalContext";
import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className}`}>
        <RoleModalProvider>
        {children}
        <RoleSelectionModal />
        </RoleModalProvider>
      </body>
    </html>
  )
}
