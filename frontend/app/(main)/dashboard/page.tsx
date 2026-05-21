'use client';

import { useAppSelector } from '@/store';
import { ClientDashboard } from '@/components/dashboard/ClientDashboard';
import { FreelancerDashboard } from '@/components/dashboard/FreelancerDashboard';
import { AgencyDashboard } from '@/components/dashboard/AgencyDashboard';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';

export default function DashboardPage() {
  const { user } = useAppSelector((s) => s.auth);

  if (!user) return null;

  switch (user.role) {
    case 'client':
      return <ClientDashboard />;
    case 'freelancer':
      return <FreelancerDashboard />;
    case 'agency_owner':
      return <AgencyDashboard />;
    case 'admin':
      return <AdminDashboard />;
    default:
      return <FreelancerDashboard />;
  }
}
