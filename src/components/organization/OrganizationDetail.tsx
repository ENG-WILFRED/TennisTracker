"use client";

import React, { useEffect, useState } from 'react';
import RegisterPlayerForm from './org/RegisterPlayerForm';
import StaffManager from './org/StaffManager';
import InventoryManager from './org/InventoryManager';
import { authenticatedFetch } from '@/lib/authenticatedFetch';
import { useAuth } from '@/context/AuthContext';

export default function OrganizationDetail({ org, onRefresh }: any) {
  const [staff, setStaff] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    fetchDetails();
  }, [org]);

  async function fetchDetails() {
    try {
      const [sres, ires] = await Promise.all([
        authenticatedFetch(`/api/organization/${org.id}/staff`),
        authenticatedFetch(`/api/organization/${org.id}/inventory`),
      ]);
      if (sres.ok) setStaff(await sres.json());
      if (ires.ok) setInventory(await ires.json());
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="bg-white rounded shadow p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="col-span-1">
          <RegisterPlayerForm orgId={org.id} onRegistered={fetchDetails} readOnly={!isLoggedIn} />
        </div>
        <div className="col-span-1">
          <StaffManager orgId={org.id} staff={staff} onChange={fetchDetails} readOnly={!isLoggedIn} />
        </div>
        <div className="col-span-2 md:col-span-1">
          <InventoryManager orgId={org.id} items={inventory} onChange={fetchDetails} readOnly={!isLoggedIn} />
        </div>
      </div>
    </div>
  );
}
