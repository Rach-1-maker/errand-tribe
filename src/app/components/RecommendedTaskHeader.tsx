import React from 'react'
import { FiSearch } from 'react-icons/fi'


type Props = {
onSearch?: (q: string) => void
onSort?: (v: string) => void
onType?: (v: string) => void
}


export default function RecommendedTaskHeader({onSearch, onSort, onType}: Props){
return (
<div className="mb-0 pb-0">
<div className="flex items-start justify-between">
<div>
<h2 className="text-lg md:text-xl font-semibold">Recommended for Your First Task</h2>
<p className="text-sm text-gray-500 mt-1">We've picked the best tasks to help you get started</p>
</div>
</div>


<div className="flex flex-col mt-2 md:flex-row gap-4 items-center">
<div className="flex-1 relative w-full md:max-w-xl">
<FiSearch className="absolute left-4 top-4 text-gray-400 text-sm" />
<input
aria-label="Search tasks"
onChange={(e)=> onSearch?.(e.target.value)}
placeholder="Search guests by name, email, phone..."
className="w-full pl-10 pr-4 py-3 text-sm rounded-lg border-2 border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#424BE0]"
/>
</div>


<div className="flex gap-3 items-center">
<select
onChange={(e)=> onSort?.(e.target.value)}
className="px-4 py-2 text-sm rounded-lg border border-gray-200 bg-white"
>
<option value="recent">Recent</option>
<option value="popular">Popular</option>
<option value="nearby">Nearby</option>
</select>


<select
onChange={(e)=> onType?.(e.target.value)}
className="px-2 py-2 rounded-lg text-sm border border-gray-200 bg-white"
>
<option value="local-errands">Local Errands</option>
<option value="supermarket">Supermarket Runs</option>
<option value="pickup-delivery">Pickup & Delivery</option>
</select>
</div>
</div>
</div>
)
}