"use client";

import React, { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authenticatedFetch } from '@/lib/authenticatedFetch';
import { useToast } from '@/components/ToastProvider';
import { usePDFDownload } from '@/hooks/usePDFDownload';

interface OrganizationsReportProps {
  isOpen: boolean;
  orgs: any[];
  onClose: () => void;
}

export default function OrganizationsReport({ isOpen, orgs, onClose }: OrganizationsReportProps) {
  const router = useRouter();
  const reportRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();
  const { isDownloading, downloadProgress, downloadPDF } = usePDFDownload();

  // Persist report open state to localStorage
  useEffect(() => {
    if (isOpen) {
      localStorage.setItem('reportOpen', 'true');
    }
  }, [isOpen]);

  if (!isOpen || orgs.length === 0) return null;

  const handleDownloadPDF = async () => {
    if (!reportRef.current) {
      showToast('Failed to generate PDF', 'error');
      return;
    }

    await downloadPDF(reportRef.current, {
      filename: `Organizations-Report-${new Date().toISOString().split('T')[0]}.pdf`,
      margin: 10,
      orientation: 'portrait',
      format: 'a4',
      reportTitle: 'Organizations Report',
      reportDescription: `Comprehensive report covering ${orgs.length} organization(s) with member, staff, and inventory details`,
      reportDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    });
    
    // Close modal and go to organization page after download
    setTimeout(() => {
      onClose();
      router.push('/organization');
    }, 1000);
  };

  const handleShare = () => {
    showToast('Coming soon! Share feature will be available soon.', 'info');
  };

  const totalOrgs = orgs.length;
  const totalPlayers = orgs.reduce((sum, org) => sum + (org.players?.length || 0), 0);
  const totalStaff = orgs.reduce((sum, org) => sum + (org.staff?.length || 0), 0);
  const totalInventory = orgs.reduce((sum, org) => sum + (org.inventory?.length || 0), 0);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="relative px-8 pt-8 pb-6 bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 text-white">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold drop-shadow-lg">Organizations Report</h2>
              <p className="text-emerald-100 mt-2">Generated on {new Date().toLocaleDateString()}</p>
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
        <div className="max-h-[70vh] overflow-y-auto">
          <div ref={reportRef} className="p-8 space-y-8">
            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-lg border border-emerald-200">
                <div className="text-emerald-600 text-sm font-medium mb-2">Total Organizations</div>
                <div className="text-4xl font-bold text-gray-900">{totalOrgs}</div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-lg border border-blue-200">
                <div className="text-blue-600 text-sm font-medium mb-2">Total Members</div>
                <div className="text-4xl font-bold text-gray-900">{totalPlayers}</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-200">
                <div className="text-purple-600 text-sm font-medium mb-2">Total Staff</div>
                <div className="text-4xl font-bold text-gray-900">{totalStaff}</div>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-lg border border-orange-200">
                <div className="text-orange-600 text-sm font-medium mb-2">Inventory Items</div>
                <div className="text-4xl font-bold text-gray-900">{totalInventory}</div>
              </div>
            </div>

            {/* Organizations Details */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <svg className="w-6 h-6 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                </svg>
                Detailed Organization Information
              </h3>

              {orgs.map((org, index) => (
                <div key={org.id} className="border-2 border-gray-200 rounded-lg overflow-hidden">
                  {/* Organization Header with Logo */}
                  <div className="relative px-6 py-6 border-b border-gray-200" style={{ backgroundColor: `${(org.primaryColor || '#0ea5e9')}20` }}>
                    <div className="flex items-start gap-6">
                      {/* Logo Circle */}
                      <div 
                        className="flex-shrink-0 w-20 h-20 rounded-full flex items-center justify-center shadow-md"
                        style={{ backgroundColor: org.primaryColor || '#0ea5e9' }}
                      >
                        <div className="text-3xl font-bold text-white">
                          {org.name.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      
                      {/* Organization Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h4 className="text-2xl font-bold text-gray-900">{org.name}</h4>
                          <span 
                            className="inline-block px-3 py-1 text-xs font-medium rounded-full text-white"
                            style={{ backgroundColor: org.primaryColor || '#0ea5e9' }}
                          >
                            #{index + 1}
                          </span>
                        </div>
                        <p className="text-gray-600 mt-2">{org.description || 'No description'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h5 className="text-sm font-semibold text-gray-700 mb-3">Location</h5>
                        <div className="space-y-2 text-sm text-gray-600">
                          <p><span className="font-medium">City:</span> {org.city || 'N/A'}</p>
                          <p><span className="font-medium">Country:</span> {org.country || 'N/A'}</p>
                        </div>
                      </div>
                      <div>
                        <h5 className="text-sm font-semibold text-gray-700 mb-3">Contact Information</h5>
                        <div className="space-y-2 text-sm text-gray-600">
                          <p><span className="font-medium">Phone:</span> {org.phone || 'N/A'}</p>
                          <p><span className="font-medium">Email:</span> {org.email || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="col-span-2">
                        <h5 className="text-sm font-semibold text-gray-700 mb-3">Branding</h5>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Primary Color:</span>
                            <div 
                              className="w-10 h-10 rounded-lg border-2 border-gray-300 shadow-sm"
                              style={{ backgroundColor: org.primaryColor || '#0ea5e9' }}
                            ></div>
                            <span className="text-sm font-mono text-gray-700">{org.primaryColor || '#0ea5e9'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="col-span-2">
                        <h5 className="text-sm font-semibold text-gray-700 mb-3">Statistics</h5>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="bg-blue-50 p-3 rounded border border-blue-200">
                            <p className="text-xs text-blue-600 font-medium">Members</p>
                            <p className="text-xl font-bold text-blue-900">{org.players?.length || 0}</p>
                          </div>
                          <div className="bg-purple-50 p-3 rounded border border-purple-200">
                            <p className="text-xs text-purple-600 font-medium">Staff</p>
                            <p className="text-xl font-bold text-purple-900">{org.staff?.length || 0}</p>
                          </div>
                          <div className="bg-orange-50 p-3 rounded border border-orange-200">
                            <p className="text-xs text-orange-600 font-medium">Inventory Items</p>
                            <p className="text-xl font-bold text-orange-900">{org.inventory?.length || 0}</p>
                          </div>
                        </div>
                      </div>

                      {/* Members Section */}
                      {org.players && org.players.length > 0 && (
                        <div className="col-span-2">
                          <h5 className="text-sm font-semibold text-gray-700 mb-3 pb-3 border-b border-gray-200">Members ({org.players.length})</h5>
                          <div className="space-y-2">
                            {org.players.map((player: any) => (
                              <div key={player.id} className="bg-gradient-to-r from-blue-50 to-cyan-50 p-3 rounded border border-blue-200">
                                <div className="font-medium text-gray-900">{player.firstName} {player.lastName}</div>
                                <div className="text-xs text-gray-600 mt-1">Username: {player.username}</div>
                                <div className="text-xs text-gray-600">Email: {player.email}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Staff Section */}
                      {org.staff && org.staff.length > 0 && (
                        <div className="col-span-2">
                          <h5 className="text-sm font-semibold text-gray-700 mb-3 pb-3 border-b border-gray-200">Staff Members ({org.staff.length})</h5>
                          <div className="space-y-2">
                            {org.staff.map((staff: any) => (
                              <div key={staff.id} className="bg-gradient-to-r from-purple-50 to-pink-50 p-3 rounded border border-purple-200">
                                <div className="font-medium text-gray-900">{staff.name}</div>
                                <div className="text-xs text-gray-600 mt-1">Role: {staff.role}</div>
                                <div className="text-xs text-gray-600">Contact: {staff.email || staff.phone || 'N/A'}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Inventory Section */}
                      {org.inventory && org.inventory.length > 0 && (
                        <div className="col-span-2">
                          <h5 className="text-sm font-semibold text-gray-700 mb-3 pb-3 border-b border-gray-200">Inventory Items ({org.inventory.length})</h5>
                          <div className="grid grid-cols-2 gap-3">
                            {org.inventory.slice(0, 10).map((item: any) => (
                              <div key={item.id} className="bg-gradient-to-r from-orange-50 to-amber-50 p-3 rounded border border-orange-200">
                                <div className="font-medium text-gray-900">{item.name}</div>
                                <div className="text-xs text-gray-600 mt-1">Qty: <span className="font-semibold text-orange-600">{item.count}</span></div>
                                <div className="text-xs text-gray-600">Condition: {item.condition || 'N/A'}</div>
                              </div>
                            ))}
                            {org.inventory.length > 10 && (
                              <div className="col-span-2 text-center text-xs text-gray-500 py-2 bg-gray-50 rounded border border-gray-200">
                                ... and {org.inventory.length - 10} more items
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-500">
                        Created on {new Date(org.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })} • Last updated {new Date(org.updatedAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t-2 border-gray-200 pt-6 text-center text-sm text-gray-500">
              <p>© 2026 Vico - Confidential Report</p>
              <p>Report generated on {new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => {
              onClose();
              router.push('/organization');
            }}
            disabled={isDownloading}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Close
          </button>
          <button
            onClick={handleShare}
            disabled={isDownloading}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 font-medium transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C9.949 15.358 11.956 16 13.894 16h1.473c.604 0 .898-.756.292-1.362l-1.073-1.073c-.293-.293-.293-.768 0-1.061l2.8-2.8c.292-.293.767-.293 1.06 0l2.8 2.8c.294.293.294.768 0 1.061l-1.073 1.073c-.606.606-.31 1.362.292 1.362h.941c2.309 0 4.523-.536 6.45-1.488.75-.405.83-1.405.15-1.855-1.02-.67-2.13-1.293-3.308-1.744.529-1.636.93-3.357.93-5.206 0-5.225-4.575-9.45-10.208-9.45H13.894c-5.633 0-10.208 4.225-10.208 9.45 0 1.849.4 3.57.929 5.206-1.177.451-2.288 1.074-3.308 1.744-.68.45-.6 1.45.15 1.855z" />
            </svg>
            Share
          </button>
          <div className="relative">
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 font-medium transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed relative"
            >
              <svg className={`w-4 h-4 ${isDownloading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 16v-4m0 0V8m0 4h4m-4 0H8m4 16a8 8 0 100-16 8 8 0 000 16z" />
              </svg>
              {isDownloading ? `Downloading... ${downloadProgress}%` : 'Download PDF'}
            </button>
            {isDownloading && (
              <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-b-lg transition-all" style={{ width: `${downloadProgress}%` }}></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
