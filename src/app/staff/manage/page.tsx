"use client"

import React, { useEffect, useState } from 'react'
import StaffManager from '@/components/StaffManager'
import { getAllStaff } from '@/actions/staff'

export default function ManageStaffPage() {
  const [staff, setStaff] = useState<any[]>([])

  async function load() {
    try {
      const list = await getAllStaff()
      setStaff(list || [])
    } catch (e) {
      // silent
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-sky-100 py-8 flex flex-col items-stretch w-full">
      <div className="w-full px-4 max-w-full flex-1">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-extrabold text-green-800">Manage Staff</h1>
          <div className="text-sm text-gray-600">Create, edit, or remove staff (club accounts only)</div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <StaffManager initialStaff={staff} />
        </div>
      </div>
    </div>
  )
}
