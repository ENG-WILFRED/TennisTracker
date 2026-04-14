'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getAvailableCourts, getPlayerBookings, getAllAvailableOrganizations } from '@/actions/bookings';
import { BookingItem } from './BookingItem';
import { CourtDetailModal } from './CourtDetailModal';

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-[#1a3020] border border-[#2d5a35] rounded-xl p-4 ${className}`}>
    {children}
  </div>
);

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-[10px] font-bold uppercase tracking-wider text-[#a8d84e] mb-2">{children}</div>
);

interface BookingViewProps {
  organizationId?: string;
  onClose?: () => void;
  isEmbedded?: boolean;
  canBook?: boolean;
}

export function BookingView({ organizationId, onClose, isEmbedded, canBook }: BookingViewProps) {
  const { user: authUser } = useAuth();
  const router = useRouter();
  const userId = authUser?.id;

  const [courts, setCourts] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState(organizationId || '');
  const [matchType, setMatchType] = useState<'singles' | 'doubles' | 'practice'>('singles');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'booking' | 'myBookings' | 'history'>('booking');
  const [showCourtModal, setShowCourtModal] = useState(false);
  const [selectedCourt, setSelectedCourt] = useState<any>(null);
  const [loadingCourtId, setLoadingCourtId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'confirmed' | 'pending' | 'rejected' | 'cancelled' | 'completed'>('all');
  const [filterTime, setFilterTime] = useState<'all' | 'today' | 'week' | 'upcoming' | 'past'>('upcoming');
  const [isMobile, setIsMobile] = useState(false);
  const [mobileTabOpen, setMobileTabOpen] = useState(false);

  // Load organizations on mount
  useEffect(() => {
    const loadOrgs = async () => {
      if (!userId) return;
      try {
        const orgsData = await getAllAvailableOrganizations();
        setOrganizations(orgsData);
        if (organizationId) {
          setSelectedOrgId(organizationId);
        } else if (orgsData.length > 0) {
          setSelectedOrgId(orgsData[0].id);
        }
      } catch (error) {
        console.error('Failed to load organizations', error);
      } finally {
        setLoading(false);
      }
    };
    loadOrgs();
  }, [userId, organizationId]);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load courts and bookings when org changes
  useEffect(() => {
    const loadData = async () => {
      if (!userId || !selectedOrgId) return;
      try {
        const courtsData = await getAvailableCourts(userId, selectedOrgId);
        setCourts(courtsData);

        const bookingsData = await getPlayerBookings(userId, selectedOrgId);
        setBookings(bookingsData);
      } catch (error) {
        console.error('Failed to load courts', error);
      }
    };
    loadData();
  }, [userId, selectedOrgId]);

  const handleCourtSelect = (court: any) => {
    setLoadingCourtId(court.id);
    // Show loading spinner briefly for better UX
    setTimeout(() => {
      setSelectedCourt(court);
      setShowCourtModal(true);
      setLoadingCourtId(null);
    }, 300);
  };

  const handleConfirmCourt = () => {
    if (selectedCourt && selectedOrgId) {
      router.push(`/player/booking/details?court=${selectedCourt.id}&org=${selectedOrgId}&type=${matchType}`);
      setShowCourtModal(false);
    }
  };

  // Filter functions
  const getFilteredBookings = (bookingsToFilter: any[]) => {
    let filtered = bookingsToFilter;

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(b => b.status === filterStatus);
    }

    // Apply time filter
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const endOfWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    switch (filterTime) {
      case 'today':
        filtered = filtered.filter(b => {
          const bookingDate = new Date(b.startTime);
          return bookingDate >= today && bookingDate < endOfToday;
        });
        break;
      case 'week':
        filtered = filtered.filter(b => {
          const bookingDate = new Date(b.startTime);
          return bookingDate >= today && bookingDate < endOfWeek;
        });
        break;
      case 'upcoming':
        filtered = filtered.filter(b => new Date(b.startTime) >= now);
        break;
      case 'past':
        filtered = filtered.filter(b => new Date(b.startTime) < now);
        break;
      case 'all':
      default:
        // No time filter
        break;
    }

    return filtered;
  };

  if (loading) {
    return (
      <Card className="text-center py-12">
        <div className="text-3xl animate-spin">⏳</div>
        <div className="text-sm text-[#7aaa6a] mt-3">Loading booking dashboard…</div>
      </Card>
    );
  }

  const upcomingCount = bookings.filter(b => new Date(b.startTime) >= new Date() && b.status !== 'cancelled').length;

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-[#7dc142] tracking-tight">🎾 Court Booking</h1>
        <p className="text-sm text-[#7aaa6a] mt-1">Reserve a court for your next session</p>
      </div>

      {/* Stats */}
      <div className={`grid gap-3 ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
        {[
          { icon: '📅', label: 'My Bookings', value: bookings.filter(b => b.status !== 'cancelled').length },
          { icon: '🎾', label: 'Courts Open', value: courts.length },
          { icon: '⏰', label: 'Upcoming', value: upcomingCount },
          { icon: '💰', label: 'Avg. Price', value: '$45/hr' },
        ].map(s => (
          <Card key={s.label} className="flex items-center gap-3 py-3">
            <span className="text-xl">{s.icon}</span>
            <div>
              <div className="text-[9px] text-[#7aaa6a] font-medium">{s.label}</div>
              <div className="text-lg font-black text-[#a8d84e]">{s.value}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: '24px' }}>
        {/* Mobile Tab Selector */}
        <div className="mobile-tab-selector" style={{ display: isMobile ? 'flex' : 'none' }}>
          <p style={{ fontSize: 12, fontStyle: 'italic', color: '#7aaa6a', margin: '0 0 8px 0', fontFamily: "'Epilogue', sans-serif" }}>
            Tap here to switch between booking sections.
          </p>
          <button
            onClick={() => setMobileTabOpen(!mobileTabOpen)}
            className="mobile-tab-button"
          >
            <span>
              {activeTab === 'booking' && '+ New Booking'}
              {activeTab === 'myBookings' && `📋 My Bookings (${upcomingCount})`}
              {activeTab === 'history' && '🕑 History'}
            </span>
            <span style={{ transform: mobileTabOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>⌄</span>
          </button>

          {mobileTabOpen && (
            <div className="mobile-tab-dropdown">
              <button
                onClick={() => {
                  setActiveTab('booking');
                  setMobileTabOpen(false);
                }}
                className={`mobile-tab-option ${activeTab === 'booking' ? 'active' : ''}`}
              >
                + New Booking
              </button>
              <button
                onClick={() => {
                  setActiveTab('myBookings');
                  setMobileTabOpen(false);
                }}
                className={`mobile-tab-option ${activeTab === 'myBookings' ? 'active' : ''}`}
              >
                📋 My Bookings ({upcomingCount})
              </button>
              <button
                onClick={() => {
                  setActiveTab('history');
                  setMobileTabOpen(false);
                }}
                className={`mobile-tab-option ${activeTab === 'history' ? 'active' : ''}`}
              >
                🕑 History
              </button>
            </div>
          )}
        </div>

        {/* Desktop Tabs */}
        <div className="tab-navigation" style={{ display: isMobile ? 'none' : 'flex' }}>
          {[
            { id: 'booking', label: '+ New Booking' },
            { id: 'myBookings', label: `📋 My Bookings (${upcomingCount})` },
            { id: 'history', label: '🕑 History' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* BOOKING TAB */}
      {activeTab === 'booking' && (
        <div className="space-y-6">
          {/* Select Organization */}
          {organizations.length > 1 && (
            <Card>
              <Label>Select Organization</Label>
              <select
                value={selectedOrgId}
                onChange={(e) => setSelectedOrgId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#2d5a35] bg-[#152515] text-[#e8f5e0] text-sm focus:outline-none focus:border-[#7dc142]"
              >
                {organizations.map(org => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>
            </Card>
          )}

          {/* Match Type */}
          <Card>
            <Label>Match Type</Label>
            <div className="flex gap-2">
              {(['singles', 'doubles', 'practice'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setMatchType(t)}
                  className={`flex-1 py-3 rounded-lg border text-xs font-bold capitalize transition-all ${
                    matchType === t
                      ? 'bg-[#7dc142] border-[#7dc142] text-[#0f1f0f]'
                      : 'bg-[#152515] border-[#2d5a35] text-[#7aaa6a] hover:border-[#7dc142]/60'
                  }`}
                >
                  {t === 'singles' ? '🎾' : t === 'doubles' ? '👥' : '🏋️'} {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </Card>

          {/* Court Selection - Scrollable */}
          <Card>
            <Label>Select Court</Label>
            <div style={{ maxHeight: 'calc(100vh - 400px)', overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: '#7dc142 #152515' }}>
              <style>{`
                div[style*="calc(100vh - 400px)"]::-webkit-scrollbar {
                  width: 8px;
                }
                div[style*="calc(100vh - 400px)"]::-webkit-scrollbar-track {
                  background: #152515;
                  border-radius: 10px;
                }
                div[style*="calc(100vh - 400px)"]::-webkit-scrollbar-thumb {
                  background: #7dc142;
                  border-radius: 10px;
                }
                div[style*="calc(100vh - 400px)"]::-webkit-scrollbar-thumb:hover {
                  background: #a8d84e;
                }
              `}</style>
              {courts.length === 0 ? (
                <div className="text-center py-8 text-[#7aaa6a]">
                  <div className="text-3xl mb-2">🎾</div>
                  <div className="text-sm">No courts available in this organization</div>
                </div>
              ) : (
                <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} pr-2`}>
                  {courts.map(court => (
                    <button
                      key={court.id}
                      onClick={() => handleCourtSelect(court)}
                      className="text-left p-4 rounded-xl border-2 border-[#2d5a35] bg-[#152515] hover:border-[#7dc142]/50 hover:bg-[#2d5a27]/30 transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="text-sm font-bold text-[#e8f5e0]">🎾 {court.name}</div>
                          <div className="text-[10px] text-[#7aaa6a] mt-0.5">{court.surface || 'Hard Court'}</div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {['🌞 Outdoor', '💡 Floodlit', '🔒 Access'].map(f => (
                          <span key={f} className="text-[9px] bg-[#0f1f0f] text-[#7aaa6a] px-1.5 py-0.5 rounded">{f}</span>
                        ))}
                      </div>
                      <div className={`w-full py-2 text-xs font-bold rounded-lg transition-colors text-center pointer-events-none ${
                        loadingCourtId === court.id
                          ? 'bg-[#a8d84e] text-[#0f1f0f] opacity-75'
                          : 'bg-[#7dc142] text-[#0f1f0f] hover:bg-[#a8d84e]'
                      }`}>
                        {loadingCourtId === court.id ? (
                          <span className="inline-block animate-spin mr-1">⏳</span>
                        ) : (
                          <span>View Details →</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* MY BOOKINGS TAB */}
      {activeTab === 'myBookings' && (
        <div>
          {/* Filters */}
          <Card className="mb-4">
            <div>
              <Label>🔍 Filter by Status</Label>
              <div className="flex gap-2 flex-wrap mb-4">
                {['all', 'confirmed', 'pending', 'rejected', 'cancelled', 'completed'].map(status => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      filterStatus === status
                        ? 'bg-[#7dc142] text-[#0f1f0f]'
                        : 'bg-[#152515] text-[#7aaa6a] border border-[#2d5a35] hover:border-[#7dc142]'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>

              <Label>⏰ Filter by Time</Label>
              <div className="flex gap-2 flex-wrap">
                {(['all', 'today', 'week', 'upcoming', 'past'] as const).map(time => (
                  <button
                    key={time}
                    onClick={() => setFilterTime(time)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      filterTime === time
                        ? 'bg-[#7dc142] text-[#0f1f0f]'
                        : 'bg-[#152515] text-[#7aaa6a] border border-[#2d5a35] hover:border-[#7dc142]'
                    }`}
                  >
                    {time === 'all' ? 'All Time' : time.charAt(0).toUpperCase() + time.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Bookings List */}
          <div style={{ maxHeight: 'calc(100vh - 400px)', overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: '#7dc142 #152515' }}>
            <style>{`
              .bookings-scrollable::-webkit-scrollbar {
                width: 8px;
              }
              .bookings-scrollable::-webkit-scrollbar-track {
                background: #152515;
                border-radius: 10px;
              }
              .bookings-scrollable::-webkit-scrollbar-thumb {
                background: #7dc142;
                border-radius: 10px;
              }
              .bookings-scrollable::-webkit-scrollbar-thumb:hover {
                background: #a8d84e;
              }
            `}</style>
            <div className="bookings-scrollable pr-2">
              {getFilteredBookings(bookings).length === 0 ? (
                <Card className="text-center py-12">
                  <div className="text-4xl mb-3">📅</div>
                  <div className="text-sm font-bold text-[#e8f5e0] mb-1">No bookings found</div>
                  <div className="text-xs text-[#7aaa6a]">Try adjusting your filters</div>
                </Card>
              ) : (
                <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  {getFilteredBookings(bookings).map(booking => (
                    <div
                      key={booking.id}
                      onClick={() => router.push(`/player/booking/${booking.id}?org=${selectedOrgId}&tab=myBookings`)}
                      className="cursor-pointer"
                    >
                      <BookingItem booking={booking} canView />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* HISTORY TAB */}
      {activeTab === 'history' && (
        <div>
          {/* Filters */}
          <Card className="mb-4">
            <Label>🔍 Filter by Status</Label>
            <div className="flex gap-2 flex-wrap">
              {['all', 'confirmed', 'pending', 'rejected', 'cancelled', 'completed'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filterStatus === status
                      ? 'bg-[#7dc142] text-[#0f1f0f]'
                      : 'bg-[#152515] text-[#7aaa6a] border border-[#2d5a35] hover:border-[#7dc142]'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </Card>

          {/* History List */}
          <div style={{ maxHeight: 'calc(100vh - 350px)', overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: '#7dc142 #152515' }}>
            <style>{`
              .history-scrollable::-webkit-scrollbar {
                width: 8px;
              }
              .history-scrollable::-webkit-scrollbar-track {
                background: #152515;
                border-radius: 10px;
              }
              .history-scrollable::-webkit-scrollbar-thumb {
                background: #7dc142;
                border-radius: 10px;
              }
              .history-scrollable::-webkit-scrollbar-thumb:hover {
                background: #a8d84e;
              }
            `}</style>
            <div className="history-scrollable pr-2">
              {bookings.filter(b => (new Date(b.startTime) < new Date() || b.status === 'cancelled') && (filterStatus === 'all' || b.status === filterStatus)).length === 0 ? (
                <Card className="text-center py-12">
                  <div className="text-4xl mb-3">🕑</div>
                  <div className="text-sm text-[#7aaa6a]">No past sessions found</div>
                </Card>
              ) : (
                <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  {bookings
                    .filter(b => new Date(b.startTime) < new Date() || b.status === 'cancelled')
                    .filter(b => filterStatus === 'all' || b.status === filterStatus)
                    .map(booking => (
                      <BookingItem key={booking.id} booking={booking} />
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Court Detail Modal */}
      <CourtDetailModal
        court={selectedCourt}
        isOpen={showCourtModal}
        onConfirm={handleConfirmCourt}
        onCancel={() => setShowCourtModal(false)}
      />

      <style jsx>{`
        .tab-navigation {
          display: flex;
          gap: 1px;
          background: #152515;
          padding: 4px;
          border-radius: 12px;
        }

        .tab-button {
          flex: 1;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          transition: all 0.2s ease;
          background: transparent;
          color: #7aaa6a;
          border: none;
          cursor: pointer;
        }

        .tab-button:hover {
          color: #e8f5e0;
        }

        .tab-button.active {
          background: #2d5a27;
          color: #7dc142;
          border: 1px solid #7dc14266;
        }

        .mobile-tab-selector {
          position: relative;
          width: 100%;
          margin-bottom: 16px;
        }

        .mobile-tab-button {
          width: 100%;
          padding: 12px 16px;
          background: #1a3020;
          border: 1px solid #2a4a30;
          border-radius: 8px;
          color: #e8f5e8;
          font-family: 'Epilogue', sans-serif;
          font-size: 16px;
          font-weight: 500;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .mobile-tab-button:hover {
          background: #2a4a30;
          border-color: #3a5a40;
        }

        .mobile-tab-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: #1a3020;
          border: 1px solid #2a4a30;
          border-radius: 8px;
          margin-top: 4px;
          z-index: 10;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .mobile-tab-option {
          width: 100%;
          padding: 12px 16px;
          background: none;
          border: none;
          color: #e8f5e8;
          font-family: 'Epilogue', sans-serif;
          font-size: 16px;
          font-weight: 500;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s ease;
          border-bottom: 1px solid #2a4a30;
        }

        .mobile-tab-option:last-child {
          border-bottom: none;
        }

        .mobile-tab-option:hover {
          background: #2a4a30;
        }

        .mobile-tab-option.active {
          background: #3a5a40;
          color: #7aaa6a;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
