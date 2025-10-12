import Link from "next/link";
import { FaTwitter, FaLinkedinIn, FaFacebook } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-[#161F63] text-white py-8 px-6 md:px-16">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between max-w-6xl mx-auto space-y-6 md:space-y-0">
        {/* Logo */}
        <div className="text-xl font-bold">ErrandTribe</div>

        {/* Links */}
        <nav className="flex space-x-6 text-sm">
          <Link href="#howItWorks">How it Works</Link>
          <Link href="#features">Features</Link>
          <Link href="#testimonies">Testimonies</Link>
          <Link href="#category">Categories</Link>
        </nav>

        {/* Social Icons */}
        <div className="flex space-x-4 text-lg">
          <Link href="#">
            <FaTwitter />
          </Link>
          <Link href="#">
            <FaLinkedinIn />
          </Link>
          <Link href="#">
            <FaFacebook />
          </Link>
        </div>
      </div>

      {/* Copyright */}
      <p className="text-center text-xs mt-6 opacity-70">
        Copyright &copy;  ErrandTribe 2025. All Rights Reserved
      </p>
    </footer>
  );
}
