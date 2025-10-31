import RoleSelectionModal from "./components/RoleSelectionModal";
import { RoleModalProvider } from "./context/RoleModalContext";
import { UserProvider } from "./context/UserContext";
import "./globals.css";
import { Inter } from "next/font/google";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className}`}>
        <UserProvider>
        <RoleModalProvider>
        {children}
        <ToastContainer />
        <RoleSelectionModal />
        </RoleModalProvider>
        </UserProvider>
      </body>
    </html>
  )
}
