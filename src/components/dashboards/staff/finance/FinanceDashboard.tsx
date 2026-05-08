'use client';

import React from 'react';
import { StaffUser, DepartmentConfig, RoleConfig } from '@/types/staff-dashboard';

const G = {
  dark: '#0f1f0f', sidebar: '#152515', card: '#1a3020', cardBorder: '#2d5a35',
  mid: '#2d7a27', bright: '#3d7a32', lime: '#7dc142', accent: '#a8d84e',
  text: '#e8f5e0', muted: '#7aaa6a', yellow: '#f0c040',
};

interface FinanceDashboardProps {
  staffUser: StaffUser;
  department: string;
  departmentConfig: DepartmentConfig;
  roleConfig: RoleConfig;
  activeSection: string;
  onNavigate: (section: string) => void;
  stats?: Record<string, any>;
  sectionData?: Record<string, any>;
}

const FinanceDashboard: React.FC<FinanceDashboardProps> = ({ activeSection, roleConfig, stats, sectionData }) => {
  const baseStats = {
    totalRevenue: 142300,
    monthlyExpenses: 6256,
    activeMembers: 320,
    monthlyRevenue: 8420,
    netProfit: 5210,
    collectionRate: 94,
    pendingPayments: 3450,
    approvedInvoices: 28,
    ...stats,
  };

  const revenueData: number[] = sectionData?.revenueData ?? [5200, 6100, 5800, 7200, 6900, 8400, 7800, 8200, 7600, 8900, 8100, 8420];
  const expenseData: number[] = sectionData?.expenseData ?? [3100, 3400, 3200, 3800, 3600, 4100, 3900, 4200, 3800, 4500, 4100, 6256];
  const recentTransactions: Array<{ label: string; amount: string; status: string; date: string }> =
    sectionData?.recentTransactions?.map((transaction: any) => ({
      label: transaction.type ? `${transaction.type}` : 'Payment',
      amount: `$${transaction.amount.toLocaleString()}`,
      status: transaction.status || 'Pending',
      date: transaction.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    })) ?? [
      { label: 'Membership – Gold', amount: '$120', status: 'Paid', date: 'Mar 19' },
      { label: 'Court Booking ×3', amount: '$90', status: 'Paid', date: 'Mar 18' },
      { label: 'Tournament Entry', amount: '$50', status: 'Paid', date: 'Mar 18' },
      { label: 'Membership – Silver', amount: '$80', status: 'Pending', date: 'Mar 17' },
      { label: 'Coaching Session', amount: '$60', status: 'Overdue', date: 'Mar 14' },
    ];

  const budgets: Array<{ name: string; amount: string; status: string }> = sectionData?.budgets ?? [
    { name: 'Court Upgrades', amount: '$12,500', status: 'Approved' },
    { name: 'Staff Training', amount: '$4,000', status: 'Proposed' },
    { name: 'Marketing', amount: '$3,200', status: 'In Review' },
  ];

  const payroll: Array<{ period: string; amount: string; status: string }> = sectionData?.payroll ?? [
    { period: 'Mar 2026', amount: '$12,300', status: 'Completed' },
    { period: 'Feb 2026', amount: '$11,900', status: 'Completed' },
    { period: 'Jan 2026', amount: '$12,000', status: 'Completed' },
  ];

  const statusColor = (status: string) => (status === 'Paid' ? G.lime : status === 'Pending' ? G.yellow : '#e57373');

  const renderOverview = () => (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-10" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
        {[
          { label: 'Total Revenue', value: `$${(baseStats.totalRevenue / 1000).toFixed(1)}k`, icon: '💵' },
          { label: 'Monthly Expenses', value: `$${baseStats.monthlyExpenses.toLocaleString()}`, icon: '💸' },
          { label: 'Net Profit', value: `$${baseStats.netProfit.toLocaleString()}`, icon: '📈' },
          { label: 'Collection Rate', value: `${baseStats.collectionRate}%`, icon: '✅' },
        ].map((item, index) => (
          <div key={index} style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 16 }}>
            <div style={{ color: G.muted, fontSize: 10 }}>{item.label}</div>
            <div style={{ color: G.accent, fontSize: 22, fontWeight: 800, marginTop: 8 }}>{item.icon} {item.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-12" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 18 }}>
          <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>📈 Revenue Trend</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>${baseStats.totalRevenue.toLocaleString()}</div>
          <div style={{ color: G.muted, fontSize: 11, marginBottom: 14 }}>Revenue collected in the last 12 months</div>
          <div style={{ width: '100%', height: 110, background: '#09120f', borderRadius: 12, padding: 12 }}>
            <div style={{ color: G.text, fontSize: 10, marginBottom: 10 }}>Monthly revenue</div>
            <div style={{ width: '100%', height: 68, borderRadius: 8, background: '#071109' }} />
          </div>
        </div>

        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 18 }}>
          <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>💸 Expense Snapshot</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>${baseStats.monthlyExpenses.toLocaleString()}</div>
          <div style={{ color: G.muted, fontSize: 11, marginBottom: 14 }}>Expenses booked this month</div>
          <div style={{ width: '100%', height: 110, background: '#09120f', borderRadius: 12, padding: 12 }}>
            <div style={{ color: G.text, fontSize: 10, marginBottom: 10 }}>Expense categories</div>
            <div style={{ width: '100%', height: 68, borderRadius: 8, background: '#071109' }} />
          </div>
        </div>
      </div>

      <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 18 }}>
        <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>📝 Recent Activity</div>
        {recentTransactions.map((row, index) => (
          <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: index < recentTransactions.length - 1 ? `1px solid ${G.cardBorder}33` : 'none' }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700 }}>{row.label}</div>
              <div style={{ fontSize: 10, color: G.muted }}>{row.date}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, fontWeight: 700 }}>{row.amount}</div>
              <div style={{ color: statusColor(row.status), fontSize: 10 }}>{row.status}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );

  const renderTransactions = () => (
    <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 18 }}>
      <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>📄 Transactions</div>
      <div style={{ color: G.muted, fontSize: 12 }}>The full accounting history and transaction feed are available here.</div>
    </div>
  );

  const renderExpenses = () => (
    <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 18 }}>
      <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>🔧 Expense Management</div>
      <div style={{ color: G.muted, fontSize: 12 }}>Review supplier invoices, budgets, and payment approvals.</div>
    </div>
  );

  const renderPayroll = () => (
    <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 18 }}>
      <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>👥 Payroll</div>
      {payroll.map((row, index) => (
        <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: index < payroll.length - 1 ? `1px solid ${G.cardBorder}33` : 'none' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700 }}>{row.period}</div>
            <div style={{ fontSize: 10, color: G.muted }}>{row.status}</div>
          </div>
          <div style={{ fontWeight: 700 }}>{row.amount}</div>
        </div>
      ))}
    </div>
  );

  const renderInvoices = () => (
    <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 18 }}>
      <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>📄 Invoices</div>
      {recentTransactions.slice(0, 4).map((row, index) => (
        <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: index < 3 ? `1px solid ${G.cardBorder}33` : 'none' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700 }}>{row.label}</div>
            <div style={{ fontSize: 10, color: G.muted }}>{row.date}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 700 }}>{row.amount}</div>
            <div style={{ fontSize: 10, color: statusColor(row.status) }}>{row.status}</div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderBudgets = () => (
    <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 18 }}>
      <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>📊 Budget Requests</div>
      {budgets.map((row, index) => (
        <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: index < budgets.length - 1 ? `1px solid ${G.cardBorder}33` : 'none' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700 }}>{row.name}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 700 }}>{row.amount}</div>
            <div style={{ fontSize: 10, color: G.muted }}>{row.status}</div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderReports = () => (
    <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 12, padding: 18 }}>
      <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>📊 Reports</div>
      <div style={{ color: G.muted, fontSize: 12 }}>
        {roleConfig.canViewReports ? 'Use reports to analyze revenue, expenses, and forecast planning.' : 'Reports are restricted for your role.'}
      </div>
    </div>
  );

  const sectionRenderers: Record<string, () => React.ReactElement> = {
    overview: renderOverview,
    transactions: renderTransactions,
    expenses: renderExpenses,
    payroll: renderPayroll,
    invoices: renderInvoices,
    reports: renderReports,
    budgets: renderBudgets,
  };

  const renderer = sectionRenderers[activeSection] || sectionRenderers.overview;

  return <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{renderer()}</div>;
};

export default FinanceDashboard;
