"use client";

import React, { useEffect, useState } from 'react';
import RegisterPlayerForm from './org/RegisterPlayerForm';
import StaffManager from './org/StaffManager';
import InventoryManager from './org/InventoryManager';
import { authenticatedFetch } from '@/lib/authenticatedFetch';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import LoginModal from '@/components/LoginModal';

export default function OrganizationDetail({ org, onRefresh }: any) {
  const [staff, setStaff] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const { user, isLoggedIn, logout } = useAuth();
  const router = useRouter();
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    fetchDetails();
  }, [org]);

  async function fetchDetails() {
    try {
      const [sres, ires] = await Promise.all([
        authenticatedFetch(`/api/organization/${org.id}/staff`, { requireAuth: false }),
        authenticatedFetch(`/api/organization/${org.id}/inventory`, { requireAuth: false }),
      ]);
      if (sres.ok) setStaff(await sres.json());
      if (ires.ok) setInventory(await ires.json());
    } catch (err) {
      console.error(err);
    }
  }

  const canEdit = (() => {
    if (!isLoggedIn || !user) return false;
    if (user.role === 'org') return true;
    if (org?.createdBy && user.id === org.createdBy) return true;
    return false;
  })();

  function handleLoginClick() {
    if (isLoggedIn) {
      logout();
    } else {
      setShowLoginModal(true);
    }
  }

  return (
    <div className="bg-white rounded shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div />
        <div className="flex items-center gap-3">
          {canEdit ? (
            <div className="px-3 py-1 bg-green-100 text-green-800 rounded-lg text-sm font-medium">Editing enabled</div>
          ) : (
            <div className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">Read only</div>
          )}
          <button onClick={handleLoginClick} className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm font-medium">{isLoggedIn ? 'Logout' : 'Login'}</button>
        </div>
        <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} title={`Login to ${org?.name || 'Organization'}`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="col-span-1">
          <RegisterPlayerForm orgId={org.id} onRegistered={fetchDetails} readOnly={!canEdit} />
        </div>
        <div className="col-span-1">
          <StaffManager orgId={org.id} staff={staff} onChange={fetchDetails} readOnly={!canEdit} />
        </div>
        <div className="col-span-2 md:col-span-1">
          <InventoryManager orgId={org.id} items={inventory} onChange={fetchDetails} readOnly={!canEdit} />
        </div>
      </div>
    </div>
  );
}
