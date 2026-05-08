'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useRole } from '@/context/RoleContext';
import { StaffDashboard } from '@/components/dashboards/staff/StaffDashboard';
import { getStaffDashboardData, validateStaffAccess } from '@/actions/staff/getStaffDashboard';
import { StaffDashboardData, StaffDepartment } from '@/types/staff-dashboard';

export default function StaffDashboardPage() {
  const { isLoggedIn, user } = useAuth();
  const { currentOrgId } = useRole();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const [dashboardData, setDashboardData] = useState<StaffDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const department = params?.department as StaffDepartment;
  const userId = params?.userId as string;
  const org = searchParams?.get('org');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }
  }, [isLoggedIn, router]);

  // Load dashboard data
  useEffect(() => {
    if (!isLoggedIn || !user || !department || !userId) {
      return;
    }

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError(null);

        const organizationId = org || currentOrgId;

        if (!organizationId) {
          setError('Organization context required - please log in again');
          return;
        }

        // Validate that the user has access to this department
        const hasAccess = await validateStaffAccess(userId, department, organizationId);

        if (!hasAccess) {
          setError('Access denied');
          return;
        }

        // Fetch dashboard data
        const data = await getStaffDashboardData(userId, department, organizationId);

        if (!data) {
          setError('Failed to load dashboard');
          return;
        }

        setDashboardData(data);
      } catch (err) {
        console.error('Error loading staff dashboard:', err);
        setError('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [isLoggedIn, user, department, userId, org, currentOrgId]);

  if (!isLoggedIn) {
    return null; // Will redirect to login
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#0f1f0f',
        color: '#7dc142'
      }}>
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: 20,
        textAlign: 'center',
        color: '#e8f5e0',
        background: '#0f1f0f',
        minHeight: '100vh'
      }}>
        {error}
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div style={{
        padding: 20,
        textAlign: 'center',
        color: '#e8f5e0',
        background: '#0f1f0f',
        minHeight: '100vh'
      }}>
        Loading dashboard data...
      </div>
    );
  }

  return <StaffDashboard department={department} staffUser={dashboardData.user} dashboardData={dashboardData} />;
}
