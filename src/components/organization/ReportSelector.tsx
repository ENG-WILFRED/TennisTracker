"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ReportSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  orgs: any[];
  onConfirm: (selectedOrgs: any[]) => void;
}

export default function ReportSelector({ isOpen, onClose, orgs, onConfirm }: ReportSelectorProps) {
  const router = useRouter();
  const [reportType, setReportType] = useState<'all' | 'selected'>('all');
  const [selectedOrgIds, setSelectedOrgIds] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const handleOrgToggle = (orgId: string) => {
    const newSelected = new Set(selectedOrgIds);
    if (newSelected.has(orgId)) {
      newSelected.delete(orgId);
    } else {
      newSelected.add(orgId);
    }
    setSelectedOrgIds(newSelected);
  };

  const handleConfirm = () => {
    if (reportType === 'all') {
      onConfirm(orgs);
    } else {
      const selected = orgs.filter(org => selectedOrgIds.has(org.id));
      onConfirm(selected);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="relative px-8 pt-8 pb-6 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white drop-shadow-lg">Generate Report</h2>
              <p className="text-emerald-100 mt-2 text-sm">Select organizations to include</p>
            </div>
            <button
              onClick={() => {
                onClose();
                router.push('/organization');
              }}
              className="text-white/80 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {/* Report Type Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 mb-3">Report Type</label>
            
            <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-emerald-300 hover:bg-emerald-50 transition-all" style={{ borderColor: reportType === 'all' ? '#059669' : '', backgroundColor: reportType === 'all' ? '#f0fdf4' : '' }}>
              <input
                type="radio"
                name="reportType"
                value="all"
                checked={reportType === 'all'}
                onChange={(e) => setReportType(e.target.value as 'all')}
                className="w-4 h-4 text-emerald-600 cursor-pointer"
              />
              <div className="ml-4">
                <p className="font-medium text-gray-900">All Organizations</p>
                <p className="text-sm text-gray-500">Generate report for all {orgs.length} organizations</p>
              </div>
            </label>

            <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-emerald-300 hover:bg-emerald-50 transition-all" style={{ borderColor: reportType === 'selected' ? '#059669' : '', backgroundColor: reportType === 'selected' ? '#f0fdf4' : '' }}>
              <input
                type="radio"
                name="reportType"
                value="selected"
                checked={reportType === 'selected'}
                onChange={(e) => setReportType(e.target.value as 'selected')}
                className="w-4 h-4 text-emerald-600 cursor-pointer"
              />
              <div className="ml-4">
                <p className="font-medium text-gray-900">Selected Organizations</p>
                <p className="text-sm text-gray-500">Choose specific organizations</p>
              </div>
            </label>
          </div>

          {/* Organization Selection */}
          {reportType === 'selected' && (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              <label className="block text-sm font-medium text-gray-700">Select Organizations</label>
              {orgs.map(org => (
                <label key={org.id} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-all">
                  <input
                    type="checkbox"
                    checked={selectedOrgIds.has(org.id)}
                    onChange={() => handleOrgToggle(org.id)}
                    className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                  />
                  <div className="ml-3 flex-1">
                    <p className="font-medium text-gray-900">{org.name}</p>
                    <p className="text-xs text-gray-500">{org.city}, {org.country}</p>
                  </div>
                </label>
              ))}
              {selectedOrgIds.size === 0 && reportType === 'selected' && (
                <p className="text-sm text-gray-500 text-center py-4">Select at least one organization</p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => {
              onClose();
              router.push('/organization');
            }}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={reportType === 'selected' && selectedOrgIds.size === 0}
            className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Generate Report
          </button>
        </div>
      </div>
    </div>
  );
}
