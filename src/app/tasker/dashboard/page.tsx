"use client";

import { useState } from "react";
import { FiHome, FiClipboard, FiSearch, FiMessageCircle, FiCreditCard, FiUser, FiPower } from "react-icons/fi";
import Image from "next/image";

export default function TaskerDashboard() {
  const [active, setActive] = useState("Home");

  const menu = [
    { name: "Home", icon: <FiHome /> },
    { name: "My Task", icon: <FiClipboard /> },
    { name: "Browse task", icon: <FiSearch /> },
    { name: "Messages", icon: <FiMessageCircle /> },
    { name: "Wallet", icon: <FiCreditCard /> },
    { name: "Profile & Settings", icon: <FiUser /> },
  ];

  return (
    <div className="flex min-h-screen bg-[#F2F2FD] text-[#1E1E1E]">
      {/* Sidebar */}
      <aside className="w-64 bg-white flex flex-col justify-between py-6 border-r">
        <div>
          <div className="px-6 pb-6 text-2xl font-semibold text-[#424BE0]">
            Errand Tribe
          </div>
          <nav className="space-y-2">
            {menu.map((item) => (
              <button
                key={item.name}
                onClick={() => setActive(item.name)}
                className={`flex items-center w-full gap-3 px-6 py-3 text-left rounded-xl transition ${
                  active === item.name
                    ? "bg-[#ECEDFC] text-[#424BE0] font-medium"
                    : "text-gray-600 hover:bg-[#F6F7FF]"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.name}
              </button>
            ))}
          </nav>
        </div>

        <button className="flex items-center gap-3 px-6 py-3 text-red-500 hover:bg-red-50 transition">
          <FiPower />
          Log out
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8">
        {/* Topbar */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-xl font-semibold">Good Morning, Sharon 👋</h1>
            <p className="text-gray-500 text-sm">
              Sharon! Let’s get your first errand done today
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button className="bg-[#424BE0] text-white px-4 py-2 rounded-lg hover:bg-[#353CCB] transition text-sm flex items-center gap-2">
              Post a task <span className="text-lg font-semibold">+</span>
            </button>
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-700">
              S
            </div>
          </div>
        </div>

        {/* Wallet Overview */}
        <div className="bg-gradient-to-r from-[#8087F5] to-[#A8AFF9] text-white rounded-2xl p-6 mb-8 flex justify-between items-center shadow">
          <div>
            <h2 className="text-lg font-semibold">Wallet Overview</h2>
            <p className="text-2xl font-bold mt-2">In Escrow: ₦0</p>
          </div>
          <button className="bg-white text-[#424BE0] px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition">
            Fund Wallet
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          {[
            { title: "Time Saved", value: 0 },
            { title: "Repeated Runner", value: "-" },
            { title: "Total Spent", value: 0 },
            { title: "Success Rate", value: 0 },
            { title: "Common Errand", value: "-" },
            { title: "Avg cost per errand", value: 0 },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl shadow-sm p-4 border hover:shadow-md transition"
            >
              <p className="text-sm text-gray-500">{stat.title}</p>
              <p className="text-xl font-semibold mt-2">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* CTA card */}
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center border">
          <h3 className="text-lg font-semibold mb-2">Start your First Task</h3>
          <p className="text-gray-500 mb-6">
            Take the burden off and find the help you need on Escrow
          </p>
          <button className="bg-[#424BE0] text-white px-5 py-2 rounded-lg font-medium hover:bg-[#353CCB] transition flex items-center justify-center mx-auto gap-2">
            Post a task <span className="text-lg font-semibold">+</span>
          </button>
        </div>
      </main>
    </div>
  );
}
