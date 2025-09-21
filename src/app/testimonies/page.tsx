"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import TestDecorator from "./TestDecorator";

type Testimony = {
  text: string;
  name: string;
  location: string;
  img: string;
};

const testimonies: Testimony[] = [
  {
    text: "Posted my first task in under 2 minutes. Runner showed up. All done 😍",
    name: "Emeka",
    location: "Lagos",
    img: "/user1.jpg",
  },
  {
    text: "Such a lifesaver! I got my documents picked up from the other side of town within an hour.",
    name: "Aisha",
    location: "Abuja",
    img: "/user2.webp",
  },
  {
    text: "Great service! I used it to buy groceries while at work. Everything was fresh and fast.",
    name: "Tunde",
    location: "Ibadan",
    img: "/user3.webp",
  },
];

export default function Testimonies() {
  const [current, setCurrent] = useState(0);

  // Autoplay logic
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonies.length);
    }, 5000); // Change every 5s
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="testimonies" className="bg-[#424BE0] text-white py-16 px-4 text-center">
        <div className="flex flex-row justify-between">
        <div className="mx-auto text-left">
      <h2 className="text-2xl md:text-4xl max-w-sm leading-tight text-left font-bold mb-4">
        People are Saying About Errand Tribe
      </h2>
      <p className="text-sm md:text-base max-w-sm text-left leading-relaxed mb-8 text-[#D1D1D1]">
        Everything you need to know from real stories through people in your
        neighborhood and international
      </p>
        </div>

      {/* Testimony Carousel */}
      <div className="relative max-w-2xl mx-auto">
        <TestDecorator />
        <div className="mx-auto max-w-lg">
        <blockquote className="text-lg italic mb-6 text-left mt-8 text-[#A6A6A6]">
          “{testimonies[current].text}”
        </blockquote>
        </div>
        <div className="flex flex-row text-center items-center">
          <Image
            src={testimonies[current].img}
            alt={testimonies[current].name}
            width={50}
            height={50}
            className="rounded-full border-2 border-white mr-4"
          />
          <p className="text-sm font-semibold text-[#A6A6A6]">
            {testimonies[current].name}, {testimonies[current].location}
          </p>
        </div>

        {/* Dots Navigation */}
        <div className="flex justify-center mt-1 space-x-2">
          {testimonies.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-3 h-3 rounded-full ${
                  current === i ? "bg-white" : "bg-white/50"
                }`}
                />
          ))}
                </div>
        </div>
      </div>
    </section>
  );
}
