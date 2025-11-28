import React, {useEffect, useState} from 'react'
import { useUser } from '@/app/context/UserContext'
import { PiTrendUp } from 'react-icons/pi'
import Image from 'next/image'
import { ChartSpline } from 'lucide-react'
const API_URL = process.env.NEXT_PUBLIC_API_URL


export default function WalletSummary(){
const { userData } = useUser()
const [balance, setBalance] = useState<number | null>(null)
const [loading, setLoading] = useState(false)


useEffect(()=>{
if (!userData) return
let mounted = true
const load = async ()=>{
try{
setLoading(true)
const res = await fetch(`${API_URL}/api/wallets/${userData.id}/summary/`)
if (!res.ok) throw new Error('Failed')
const d = await res.json()
if (mounted) setBalance(d.current_balance ?? 0)
}catch(err){
console.warn(err)
}finally{ setLoading(false) }
}
load()
return ()=>{ mounted = false }
}, [userData])


return (
<div className="bg-white rounded-2xl p-6 shadow-sm">
<h3 className="text-lg text-black font-semibold">Your Wallet</h3>
<p className='text-sm mt-2 text-[#454545]'>Current balance</p>
<div className="mt-3">
<div className="text-3xl font-semibold">₦{loading ? '...' : (balance ?? 0).toLocaleString()}</div>
<p className="text-xs text-[#454545] mt-1">Complete your first tasks to start earning</p>
</div>


<div className="mt-4 grid grid-cols-2 gap-3 ">
<div className="p-3 text-left bg-white shadow-xs border border-[#E1E1E1]/88 rounded-lg">
<div className='p-3 bg-[#F9FAFB]'> 
<div className='flex gap-x-3'>
<p className="text-xs text-[#717182]">Total Earned</p>
<Image src={'/interest.svg'} alt='Interest icon' width={28} height={28}/>
</div>
<p className="font-semibold mt-2">₦0</p>
<span className='flex gap-x-1 text-[#CCCCCC]'>
<PiTrendUp className='mt-2'/> 0
</span>
</div>
</div>
<div className="p-3 bg-white shadow-xs border border-[#E1E1E1]/88 rounded-lg text-left">
<div className='p-3 bg-[#F9FAFB]'>
<div className='flex gap-x-4'>
<p className="text-xs text-gray-500">Incoming Pay</p>
<ChartSpline className='text-lg text-[#424BE0]'/>
</div>
<p className="font-semibold mt-2">₦0</p>
<span className='flex gap-x-1 text-[#CCCCCC]'>
<PiTrendUp className='mt-2'/> 0
</span>
</div>
</div>
</div>
</div>
)
}