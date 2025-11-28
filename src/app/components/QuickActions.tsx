import { Headphones, Sparkles, Wallet2 } from 'lucide-react'
import React from 'react'
import { IoWalletOutline } from 'react-icons/io5'
import { TbBulb } from 'react-icons/tb'


export default function QuickActions(){
return (
<div className="bg-white rounded-2xl px-6 py-4 shadow-sm">
<h4 className="text-sm text-gray-500 mb-3">Quick Actions</h4>
<div className="space-y-3">
<button className="w-full text-left px-4 py-3 rounded-lg bg-[#424BE0] text-white">
<div className='flex flex-row gap-x-4'>
<IoWalletOutline className='text-2xl mt-3 text-white'/>
<div className='flex flex-col'>
<p className='font-semibold'>Withdraw Earnings</p>
<p className='text-sm text-[#EFF0FD]/80'>Get your money instantly</p>
</div>
</div>
</button>
<button className="w-full text-left px-4 py-3 rounded-lg border border-[#E5E7EB]">
 <div className='flex flex-row gap-x-4'>
<Headphones className='text-2xl mt-3 text-black'/>
<div className='flex flex-col'>
<p className='font-semibold'>Support</p>
<p className='text-sm text-[#6B7280]/70'>Get help anytime</p>
</div>
</div>
</button>
<button className="w-full border-[#E5E7EB] text-left px-4 py-3 rounded-lg border">
<div className='flex flex-row gap-x-4'>
<Sparkles className='text-2xl mt-3 text-black'/>
<div className='flex flex-col'>
<p className='font-semibold'>Boost My Profile</p>
<p className='text-sm text-[#6B7280]/70'>Get more tasks</p>
</div>
</div>
</button>
<div className="w-full text-left px-4 py-3 rounded-lg border border-[#9AE042]/30 bg-[#D3FEB0]/10 text-md">
<div className='flex flex-row gap-x-4'>
<TbBulb className='text-2xl mt-3 text-[#7CB634]'/>
<div className='flex flex-col'>
<p className='font-semibold'>3 more errands to Tier 2</p>
<p className='text-sm text-[#6B7280]/70'>Unlock Caretask and earn more</p>
</div>
</div>
</div>

</div>
</div>
)
}