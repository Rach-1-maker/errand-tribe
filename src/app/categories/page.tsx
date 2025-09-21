import Image from "next/image";
import React, { JSX } from "react";

type Category = {
  img: string;
  title: string;
  desc: string;
};

const categories: Category[] = [
  {
    img: "/cat1.png",
    title: "Local Errands",
    desc: "Admin runs, form submissions, location pickups",
  },
  {
    img: "/cat2.png",
    title: "Supermarket Runs",
    desc: "Have groceries delivered to your door",
  },
  {
    img: "/cat3.png",
    title: "Pickup & Delivery",
    desc: "We transport items safely and securely",
  },
  {
    img: "/cat4.png",
    title: "Care Tasks",
    desc: "Check-ins and compassionate care",
  },
  {
    img: "/cat5.png",
    title: "Verify It",
    desc: "Property & identity checks, business legitimacy",
  }
];

export default function CategoriesSection(): JSX.Element {
  return (
    <section id="category" className="py-10 px-4 md:px-16 mb-32">
      <h1 className="text-[#363636] text-4xl font-bold text-center mb-8">
        Errand Categories
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16 max-w-6xl mx-auto">
        {categories.slice(0, 3).map((cat, index) => (
          <div
            key={index}
            className="bg-white shadow-xl rounded-2xl flex flex-col items-center py-4 px-3"
          >
            <Image
              src={cat.img}
              alt={cat.title}
              width={400}
              height={400}
              className="object-contain mb-6"
            />
            <p className="text-xl text-[#252C2B] text-center font-semibold mb-2">
              {cat.title}
            </p>
            <p className="text-sm text-[#626262] text-center mb-2">
              {cat.desc}
            </p>
            <button className="bg-[#424BE0] text-white text-sm px-6 py-2 rounded-full hover:bg-[#2F36A4] transition">
              Request Service
            </button>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 justify-center max-w-3xl mx-auto">
        {categories.slice(3).map((cat, index) => (
          <div
            key={index}
            className="bg-white shadow-xl rounded-2xl flex flex-col items-center py-4 px-3"
          >
            <Image
              src={cat.img}
              alt={cat.title}
              width={400}
              height={400}
              className="object-contain mb-6"
            />
            <p className="text-xl text-[#252C2B] text-center font-semibold mb-1">
              {cat.title}
            </p>
            <p className="text-sm text-[#626262] text-center mb-2">
              {cat.desc}
            </p>
            <button className="bg-[#424BE0] text-white text-sm px-6 py-2 rounded-full hover:bg-[#2F36A4] transition">
              Request Service
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
