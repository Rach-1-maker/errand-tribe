// "use client";

// import { useRouter } from "next/navigation";
// import { MdOutlineArrowBackIos, MdClear } from "react-icons/md";
// import Image from "next/image";
// import { useEffect, useState } from "react";

// interface Bank {
//   name: string
//   code: string
// }

// export default function WithdrawalMethodIntro() {
//   const router = useRouter();
//   const [banks, setBanks] = useState<Bank[]>([])
//   const [selectedBank, setSelectedBank] = useState<Bank | null>(null)
//   const [showModal, setShowModal] = useState(false);
//   const [searchTerm, setSearchTerm] = useState("");

//   const API_URL = process.env.NEXT_PUBLIC_API_URL

//   useEffect(() => {
//     async function fetchBanks() {
//       const res = await fetch(`${API_URL}/api/flutterwave/banks/?country=NG`);
//       const data = await res.json();
//       if (data.status === "success") setBanks(data.data);
//     }
//     fetchBanks();
//   }, [API_URL]);

//   const filteredBanks = banks.filter((b) =>
//     b.name.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   return (
//     <div className="h-screen flex flex-col md:flex-row bg-[#424BE0] relative">
//       {/* Form Section */}
//       <div className="flex-1 bg-white rounded-tr-[70px] rounded-br-[70px] px-8 md:px-12 py-8 flex flex-col">
//         {/* Back Navigation */}
//         <button
//           onClick={() => router.back()}
//           className="flex items-center text-gray-600 mb-16 ml-12 hover:text-gray-800"
//         >
//           <MdOutlineArrowBackIos className="mr-2" /> Back
//         </button>

//         {/* Heading */}
//         <h1 className="text-2xl lg:text-4xl font-bold text-[#1A202C] mb-4 ml-12">
//           Withdrawal Method
//         </h1>
//         <p className="text-[#222124] mb-10 max-w-md ml-12">
//           Add payout details now or later.
//         </p>

//         {/* Balance Section */}
//         <div className="py-4 px-2 w-[75%] rounded-xl ml-22 bg-[#FAFAFA] border border-[#E1E1E1] flex flex-col gap-6">
//           <div className="bg-[#EEEEEE] py-2 ml-16 mr-16 px-1 rounded-lg text-center">
//             <p className="text-[#252C2B] text-xs">Current Balance</p>
//             <h2 className="text-2xl font-bold text-[#424BE0]">₦0.00</h2>
//             <p className="font-semibold text-[#1A202C]">
//               {selectedBank ? selectedBank.name : "No bank added"}
//             </p>
//           </div>

//           {/* Add Withdrawal Bank Button */}
//           <button
//             onClick={() => setShowModal(true)}
//             className="w-[50%] py-3 bg-white border text-sm border-[#F1F1F1] text-black rounded-lg font-medium ml-36 transition"
//           >
//             {"\u002B"} Add Withdrawal Bank
//           </button>
//           <p className="text-[#252C2B] text-xs text-center">
//             Add bank details for quick withdrawals.
//           </p>
//         </div>

//         {/* Continue Button */}
//         <button
//           onClick={() => router.push("/dashboard")}
//           className="w-[85%] py-3 mt-16 ml-14 bg-[#424BE0] text-white rounded-lg font-medium hover:bg-indigo-700 transition"
//         >
//           Continue
//         </button>
//       </div>

//       {/* Illustration */}
//       <div className="hidden md:flex flex-1 items-center justify-center text-center px-8">
//         <div>
//           <h2 className="text-white text-2xl md:text-3xl font-semibold mb-6 max-w-md leading-tight">
//             Earn with every errand safe, seamless, and rewarding with Errand Tribe.
//           </h2>
//           <Image
//             src="/wallet.svg"
//             alt="Withdrawal Illustration"
//             width={400}
//             height={400}
//             className="mx-auto"
//           />
//         </div>
//       </div>

//       {/* Bank Selection Modal */}
//       {showModal && (
//         <div className="fixed inset-0 backdrop-blur-lg bg-black/30 flex items-center justify-center z-50">
//           <div
//             className="relative bg-white rounded-2xl shadow-lg w-[90%] md:w-[450px] p-6 overflow-hidden flex flex-col"
//             onClick={(e) => e.stopPropagation()}
//           >
//             {/* Close Button */}
//             <MdClear
//               className="absolute top-3 right-4 text-black text-xl hover:text-gray-700 cursor-pointer"
//               onClick={() => setShowModal(false)}
//             />

//             {/* Header */}
//             <h2 className="text-center text-black/50 border-b border-[#E6E6E6] font-semibold px-3 py-4 text-lg mb-4">
//               Select Bank
//             </h2>
//             <input
//               type="text"
//               placeholder="Search bank..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="w-full border border-[#E4E4E4] bg-[#F7F6F6] rounded-lg px-3 py-3 mb-4 text-sm outline-none"
//             />

//             {/* Scrollable Bank List */}
//             <ul className="flex-1 overflow-y-auto max-h-[250px] space-y-2 pr-2">
//               {filteredBanks.map((bank) => (
//                 <li
//                   key={bank.code}
//                   onClick={() => { 
//                     setSelectedBank(bank)
//                     setShowModal(false)
//                   }}
//                   className={`p-3 rounded-lg border cursor-pointer transition ${
//                     selectedBank?.code === bank.code
//                       ? "bg-[#424BE0]/10 border-[#424BE0] text-[#424BE0]"
//                       : "bg-[#F9F9F9] border-[#E5E5E5] text-gray-700 hover:bg-gray-100"
//                   }`}
                  
//                 >
//                   {bank.name}
//                 </li>
//               ))}
//             </ul>
//             <button
//               disabled={!selectedBank}
//               onClick={() => {
//                 setShowModal(false);
//                 router.push(`/account-setup/withdrawal-bank?bank=${selectedBank?.name}&code=${selectedBank?.code}`);
//               }}
//               className={`mt-6 w-full py-3 rounded-lg font-medium transition ${
//                 selectedBank
//                   ? "bg-[#424BE0] text-white hover:bg-indigo-700"
//                   : "bg-gray-300 text-gray-500 cursor-not-allowed"
//               }`}
//             >
//               Continue
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
