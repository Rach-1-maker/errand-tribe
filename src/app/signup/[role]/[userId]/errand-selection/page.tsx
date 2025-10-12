'use client'
import ErrandPreference from '@/app/components/ErrandSelection'
import { useParams } from 'next/navigation'
import React from 'react'

export default function SelectErrand() {
    const {role, userId} = useParams()
  return (
    <ErrandPreference
    role={role as "tasker" | "runner"}
    userId={userId as string} />
  )
}
