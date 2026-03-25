'use client';

import React, { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getAccessToken } from '@/lib/tokenManager';

interface ToggleSetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

export const SettingsView: React.FC<{ isEmbedded?: boolean }> = ({ isEmbedded = false }) => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'account' | 'privacy' | 'notifications' | 'preferences' | 'payment' | 'appearance'>('account');
  const [showSaveMessage, setShowSaveMessage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('+1-555-0000');
  const [bio, setBio] = useState('');

  const [notificationSettings, setNotificationSettings] = useState<ToggleSetting[]>([
    { id: 'email_match', label: 'Match Reminders', description: 'Get email reminders before your matches', enabled: true },
    { id: 'email_booking', label: 'Booking Confirmations', description: 'Receive booking confirmation emails', enabled: true },
    { id: 'sms_alerts', label: 'SMS Alerts', description: 'Get important updates via SMS', enabled: false },
    { id: 'push_news', label: 'Push Notifications', description: 'Receive app push notifications', enabled: true },
    { id: 'newsletter', label: 'Newsletter', description: 'Get weekly tennis tips and updates', enabled: false },
    { id: 'tournament_updates', label: 'Tournament Updates', description: 'Notifications about tournament changes', enabled: true },
  ]);

  const [privacySettings, setPrivacySettings] = useState<ToggleSetting[]>([
    { id: 'profile_public', label: 'Public Profile', description: 'Your profile is visible to other players', enabled: true },
    { id: 'show_stats', label: 'Show Statistics', description: 'Display your match stats publicly', enabled: true },
    { id: 'show_ranking', label: 'Show Ranking', description: 'Display your ranking position', enabled: true },
    { id: 'allow_messages', label: 'Allow Messages', description: 'Allow other players to message you', enabled: true },
    { id: 'activity_hidden', label: 'Hide Activity', description: "Don't show your activity status", enabled: false },
  ]);

  const [courtSurfacePrefs, setCourtSurfacePrefs] = useState([
    { name: 'Clay', selected: true },
    { name: 'Hard', selected: true },
    { name: 'Grass', selected: false },
  ]);
  const [playingLevel, setPlayingLevel] = useState('intermediate');
  const [preferredTime, setPreferredTime] = useState('evening');

  const handleToggle = (id: string, settingArray: ToggleSetting[], setter: React.Dispatch<React.SetStateAction<ToggleSetting[]>>) => {
    setter(settingArray.map(s => (s.id === id ? { ...s, enabled: !s.enabled } : s)));
  };

  const makeApiCall = useCallback(async (endpoint: string, data: any) => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const token = getAccessToken();
      if (!token) throw new Error('No authentication token found');
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'API call failed');
      }
      return await response.json();
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to save changes');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const showSuccess = () => {
    setShowSaveMessage(true);
    setTimeout(() => setShowSaveMessage(false), 3000);
  };

  const handleSave = useCallback(async () => {
    if (!user?.id) return setErrorMessage('User not found');
    const result = await makeApiCall(`/api/players/${user.id}`, { firstName, lastName, email, phone, bio });
    if (result?.success) showSuccess();
  }, [user?.id, firstName, lastName, email, phone, bio, makeApiCall]);

  const handleSaveNotifications = useCallback(async () => {
    if (!user?.id) return setErrorMessage('User not found');
    const result = await makeApiCall('/api/user-settings', { userId: user.id, settingType: 'notifications', data: notificationSettings });
    if (result?.success) showSuccess();
  }, [user?.id, notificationSettings, makeApiCall]);

  const handleSavePrivacy = useCallback(async () => {
    if (!user?.id) return setErrorMessage('User not found');
    const result = await makeApiCall('/api/user-settings', { userId: user.id, settingType: 'privacy', data: privacySettings });
    if (result?.success) showSuccess();
  }, [user?.id, privacySettings, makeApiCall]);

  const handleSavePreferences = useCallback(async () => {
    if (!user?.id) return setErrorMessage('User not found');
    const result = await makeApiCall('/api/user-settings', { userId: user.id, settingType: 'preferences', data: { courtSurfacePrefs, playingLevel, preferredTime } });
    if (result?.success) showSuccess();
  }, [user?.id, courtSurfacePrefs, playingLevel, preferredTime, makeApiCall]);

  const handleSaveAppearance = useCallback(async () => {
    if (!user?.id) return setErrorMessage('User not found');
    const result = await makeApiCall('/api/user-settings', { userId: user.id, settingType: 'appearance', data: { theme: 'dark', colorScheme: 'forest-green', fontSize: 'medium', compactMode: false } });
    if (result?.success) showSuccess();
  }, [user?.id, makeApiCall]);

  // Shared input class
  const inputCls = 'w-full bg-[#2d5a27] border border-[#2d5a35] text-[#e8f5e0] rounded-md px-3 py-2 text-sm outline-none focus:border-[#7dc142] focus:ring-1 focus:ring-[#7dc142]/40 transition-colors placeholder-[#7aaa6a]';
  const labelCls = 'block text-[10px] font-bold uppercase tracking-wider text-[#a8d84e] mb-1.5';

  const tabs = [
    { id: 'account', icon: '👤', label: 'Account' },
    { id: 'privacy', icon: '🔐', label: 'Privacy' },
    { id: 'notifications', icon: '🔔', label: 'Alerts' },
    { id: 'preferences', icon: '⚙️', label: 'Prefs' },
    { id: 'payment', icon: '💳', label: 'Payment' },
    { id: 'appearance', icon: '🎨', label: 'Look' },
  ] as const;

  const Toggle = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
    <button
      onClick={onToggle}
      className={`relative w-11 h-6 rounded-full border transition-all flex-shrink-0 ${
        enabled ? 'bg-[#7dc142] border-[#7dc142]' : 'bg-[#152515] border-[#2d5a35]'
      }`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
          enabled ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );

  const ToggleRow = ({ setting, onToggle }: { setting: ToggleSetting; onToggle: () => void }) => (
    <div className="flex items-center justify-between px-4 py-3 bg-[#152515] border border-[#2d5a35] rounded-lg hover:border-[#7dc142]/50 transition-colors">
      <div className="flex-1 min-w-0 mr-4">
        <div className="text-sm font-semibold text-[#e8f5e0]">{setting.label}</div>
        <div className="text-xs text-[#7aaa6a] mt-0.5">{setting.description}</div>
      </div>
      <Toggle enabled={setting.enabled} onToggle={onToggle} />
    </div>
  );

  const SaveButton = ({ onClick, label = '💾 Save Changes' }: { onClick: () => void; label?: string }) => (
    <button
      onClick={onClick}
      disabled={isLoading}
      className="w-full mt-4 bg-[#7dc142] hover:bg-[#a8d84e] text-[#0f1f0f] font-bold text-sm rounded-lg py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {label}
    </button>
  );

  const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <div className={`bg-[#1a3020] border border-[#2d5a35] rounded-xl p-5 ${className}`}>
      {children}
    </div>
  );

  const CardTitle = ({ children }: { children: React.ReactNode }) => (
    <h2 className="text-base font-bold text-[#7dc142] mb-4">{children}</h2>
  );

  return (
    <div className={`w-full ${isEmbedded ? 'bg-gradient-to-br from-[#0f2710] via-[#0f1f0f] to-[#0d1f0d] p-5 rounded-xl' : ''}`}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-[#7dc142] tracking-tight">⚙️ Settings</h1>
        <p className="text-sm text-[#7aaa6a] mt-1">Manage your account and preferences</p>
      </div>

      {/* Coming Soon Implementation Notice */}
      <div className="mb-6 p-5 bg-gradient-to-br from-[#1a3020] to-[#152515] border-2 border-[#f0c040] rounded-xl shadow-lg shadow-[#f0c040]/20">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">✨</span>
              <h2 className="text-base font-bold text-[#f0c040]">Settings Implementation</h2>
            </div>
            <p className="text-sm text-[#7aaa6a] leading-relaxed">
              We're rolling out enhanced settings management with improved functionality, better organization, and more customization options. Stay tuned for the complete implementation!
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 whitespace-nowrap">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#f0c040] text-[#0f1f0f] rounded-lg">
              <span className="inline-block w-2 h-2 bg-[#0f1f0f] rounded-full animate-pulse"></span>
              <span className="text-xs font-bold">In Progress</span>
            </div>
            <p className="text-xs text-[#7aaa6a] italic">Rolling out soon</p>
          </div>
        </div>
      </div>

      {/* Error */}
      {errorMessage && (
        <div className="mb-4 px-4 py-3 bg-red-900/20 border border-red-700/50 rounded-lg text-red-400 text-sm">
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-[#1a3020] border border-[#7dc142] rounded-xl px-8 py-6 text-center shadow-2xl">
            <div className="text-3xl mb-2 animate-spin">⏳</div>
            <p className="text-[#7dc142] font-bold text-sm">Saving changes…</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="grid grid-cols-6 gap-1.5 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-lg border text-xs font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-[#2d5a27] border-[#7dc142] text-[#7dc142]'
                : 'bg-[#1a3020] border-[#2d5a35] text-[#7aaa6a] hover:border-[#7dc142]/60 hover:text-[#e8f5e0]'
            }`}
          >
            <span className="text-base">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-4">

        {/* ACCOUNT */}
        {activeTab === 'account' && (
          <div className="space-y-4">
            <Card>
              <CardTitle>Personal Information</CardTitle>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className={labelCls}>First Name</label>
                  <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First name" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Last Name</label>
                  <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last name" className={inputCls} />
                </div>
              </div>
              <div className="space-y-3 mb-1">
                <div>
                  <label className={labelCls}>Email Address</label>
                  <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="your@email.com" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Phone Number</label>
                  <input value={phone} onChange={e => setPhone(e.target.value)} type="tel" placeholder="+1-555-0000" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Bio</label>
                  <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder="Tell us about your tennis journey…" className={`${inputCls} resize-none`} />
                </div>
              </div>
              <SaveButton onClick={handleSave} />
            </Card>

            <Card>
              <CardTitle>Account Security</CardTitle>
              <div className="space-y-2">
                {[
                  { icon: '🔑', label: 'Change Password', sub: 'Last changed 3 months ago' },
                  { icon: '🛡️', label: 'Two-Factor Authentication', sub: 'Add an extra layer of security' },
                  { icon: '📱', label: 'Connected Devices', sub: 'Manage your active sessions' },
                ].map(item => (
                  <button
                    key={item.label}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-[#152515] border border-[#2d5a35] rounded-lg text-left hover:border-[#7dc142]/60 hover:bg-[#2d5a27]/30 transition-all group"
                  >
                    <span className="text-lg">{item.icon}</span>
                    <div>
                      <div className="text-sm font-semibold text-[#e8f5e0] group-hover:text-[#7dc142] transition-colors">{item.label}</div>
                      <div className="text-xs text-[#7aaa6a]">{item.sub}</div>
                    </div>
                    <span className="ml-auto text-[#7aaa6a] group-hover:text-[#7dc142]">›</span>
                  </button>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* PRIVACY */}
        {activeTab === 'privacy' && (
          <Card>
            <CardTitle>Privacy &amp; Security Settings</CardTitle>
            <div className="space-y-2">
              {privacySettings.map(s => (
                <ToggleRow key={s.id} setting={s} onToggle={() => handleToggle(s.id, privacySettings, setPrivacySettings)} />
              ))}
            </div>
            <SaveButton onClick={handleSavePrivacy} label="💾 Save Privacy Settings" />
          </Card>
        )}

        {/* NOTIFICATIONS */}
        {activeTab === 'notifications' && (
          <Card>
            <CardTitle>Notification Preferences</CardTitle>
            <div className="space-y-2">
              {notificationSettings.map(s => (
                <ToggleRow key={s.id} setting={s} onToggle={() => handleToggle(s.id, notificationSettings, setNotificationSettings)} />
              ))}
            </div>
            <SaveButton onClick={handleSaveNotifications} label="💾 Save Notification Settings" />
          </Card>
        )}

        {/* PREFERENCES */}
        {activeTab === 'preferences' && (
          <div className="space-y-4">
            <Card>
              <CardTitle>Playing Preferences</CardTitle>
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Preferred Court Surface</label>
                  <div className="grid grid-cols-3 gap-2">
                    {courtSurfacePrefs.map(surface => (
                      <button
                        key={surface.name}
                        onClick={() => setCourtSurfacePrefs(courtSurfacePrefs.map(s => s.name === surface.name ? { ...s, selected: !s.selected } : s))}
                        className={`py-2.5 rounded-lg border text-sm font-bold transition-all ${
                          surface.selected
                            ? 'bg-[#7dc142] text-[#0f1f0f] border-[#7dc142]'
                            : 'bg-[#152515] text-[#e8f5e0] border-[#2d5a35] hover:border-[#7dc142]/60'
                        }`}
                      >
                        {surface.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Playing Level</label>
                  <select value={playingLevel} onChange={e => setPlayingLevel(e.target.value)} className={inputCls}>
                    <option value="beginner">🟢 Beginner</option>
                    <option value="intermediate">🟡 Intermediate</option>
                    <option value="advanced">🔴 Advanced</option>
                    <option value="professional">⭐ Professional</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Preferred Playing Time</label>
                  <select value={preferredTime} onChange={e => setPreferredTime(e.target.value)} className={inputCls}>
                    <option value="morning">🌅 Morning (6–10 AM)</option>
                    <option value="afternoon">☀️ Afternoon (10 AM–6 PM)</option>
                    <option value="evening">🌆 Evening (6–10 PM)</option>
                    <option value="anytime">🔄 Any Time</option>
                  </select>
                </div>
              </div>
              <SaveButton onClick={handleSavePreferences} label="💾 Save Preferences" />
            </Card>

            <Card>
              <CardTitle>Favourite Courts</CardTitle>
              <div className="py-8 text-center">
                <div className="text-4xl mb-3">🎾</div>
                <p className="text-sm text-[#7aaa6a]">You haven't marked any favourite courts yet.</p>
                <p className="text-xs text-[#7aaa6a]/70 mt-1">Visit the courts page and click the heart icon to save your favourites!</p>
              </div>
            </Card>
          </div>
        )}

        {/* PAYMENT */}
        {activeTab === 'payment' && (
          <Card>
            <CardTitle>Payment Methods</CardTitle>
            <div className="space-y-3 mb-4">
              {/* Visa */}
              <div className="flex items-center justify-between px-4 py-3.5 bg-gradient-to-r from-blue-700 to-blue-600 rounded-xl border border-[#2d5a35]">
                <div>
                  <div className="text-sm font-bold text-white">💳 Visa Card</div>
                  <div className="text-xs text-blue-200 mt-0.5">**** **** **** 4242</div>
                  <div className="text-xs text-blue-200">Expires 12/26</div>
                </div>
                <button className="text-red-300 hover:text-red-200 text-lg leading-none transition-colors">✕</button>
              </div>
              {/* M-Pesa */}
              <div className="flex items-center justify-between px-4 py-3.5 bg-gradient-to-r from-orange-600 to-orange-500 rounded-xl border border-[#2d5a35]">
                <div>
                  <div className="text-sm font-bold text-white">📱 M-Pesa</div>
                  <div className="text-xs text-orange-100 mt-0.5">+254 700 123 456</div>
                  <div className="text-xs text-orange-100">Primary Method</div>
                </div>
                <button className="text-red-300 hover:text-red-200 text-lg leading-none transition-colors">✕</button>
              </div>
            </div>
            <button className="w-full py-2.5 border border-[#7dc142]/60 text-[#7dc142] rounded-lg text-sm font-bold hover:bg-[#7dc142]/10 transition-colors">
              + Add Payment Method
            </button>

            <div className="mt-5 pt-5 border-t border-[#2d5a35]">
              <h3 className="text-sm font-bold text-[#7dc142] mb-3">Billing History</h3>
              <div className="space-y-1.5">
                {[
                  { label: 'Court Booking – May 21, 2026', amount: '$45.00' },
                  { label: 'Court Booking – May 19, 2026', amount: '$60.00' },
                  { label: 'Tournament Registration – May 15, 2026', amount: '$50.00' },
                ].map(item => (
                  <div key={item.label} className="flex justify-between items-center px-3 py-2.5 bg-[#152515] rounded-lg border border-[#2d5a35]">
                    <span className="text-xs text-[#e8f5e0]">{item.label}</span>
                    <span className="text-xs font-bold text-[#7dc142]">{item.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* APPEARANCE */}
        {activeTab === 'appearance' && (
          <Card>
            <CardTitle>Appearance Settings</CardTitle>
            <div className="space-y-5">
              <div>
                <label className={labelCls}>Theme</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: '🌙 Dark', active: true },
                    { label: '☀️ Light', active: false },
                    { label: '🖥️ System', active: false },
                  ].map(t => (
                    <button
                      key={t.label}
                      className={`py-3 rounded-lg border text-sm font-bold transition-all ${
                        t.active
                          ? 'bg-[#2d5a27] border-[#7dc142] text-[#7dc142]'
                          : 'bg-[#152515] border-[#2d5a35] text-[#7aaa6a] hover:border-[#7dc142]/60'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelCls}>Color Scheme</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { color: 'bg-green-600', active: true, title: 'Forest Green' },
                    { color: 'bg-blue-600', active: false, title: 'Ocean Blue' },
                    { color: 'bg-purple-600', active: false, title: 'Royal Purple' },
                    { color: 'bg-orange-500', active: false, title: 'Sunset Orange' },
                  ].map(c => (
                    <button
                      key={c.title}
                      title={c.title}
                      className={`h-11 rounded-lg border-2 transition-all ${c.color} ${
                        c.active ? 'border-[#7dc142] scale-105 shadow-lg shadow-[#7dc142]/20' : 'border-transparent hover:border-[#7dc142]/40'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className={labelCls}>Font Size</label>
                <div className="flex gap-2">
                  {[
                    { label: 'A', size: 'text-xs', sizeLabel: 'Small', active: false },
                    { label: 'A', size: 'text-sm', sizeLabel: 'Medium', active: true },
                    { label: 'A', size: 'text-lg', sizeLabel: 'Large', active: false },
                  ].map(f => (
                    <button
                      key={f.sizeLabel}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg border text-sm font-bold transition-all ${
                        f.active
                          ? 'bg-[#7dc142] border-[#7dc142] text-[#0f1f0f]'
                          : 'bg-[#152515] border-[#2d5a35] text-[#7aaa6a] hover:border-[#7dc142]/60'
                      }`}
                    >
                      <span className={f.size}>{f.label}</span>
                      <span className="text-xs">{f.sizeLabel}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between px-4 py-3 bg-[#152515] border border-[#2d5a35] rounded-lg">
                <div>
                  <div className="text-sm font-semibold text-[#e8f5e0]">Compact Mode</div>
                  <div className="text-xs text-[#7aaa6a]">Reduce spacing throughout the interface</div>
                </div>
                <button className="relative w-11 h-6 rounded-full border border-[#2d5a35] bg-[#152515]">
                  <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow" />
                </button>
              </div>
            </div>
            <SaveButton onClick={handleSaveAppearance} label="💾 Save Appearance Settings" />
          </Card>
        )}
      </div>

      {/* Toast */}
      {showSaveMessage && (
        <div className="fixed bottom-6 right-6 bg-[#7dc142] text-[#0f1f0f] px-5 py-3 rounded-xl font-bold text-sm shadow-xl shadow-[#7dc142]/20 border border-[#a8d84e] z-50">
          ✅ Settings saved successfully!
        </div>
      )}

      {/* Danger Zone */}
      <div className="mt-8 pt-6 border-t border-[#2d5a35]">
        <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-3">Danger Zone</p>
        <div className="grid grid-cols-2 gap-3">
          <button className="py-2.5 bg-red-900/20 border border-red-700/50 text-red-400 rounded-lg font-bold text-sm hover:bg-red-900/30 transition-colors">
            🔄 Reset Account
          </button>
          <button className="py-2.5 bg-red-900/20 border border-red-700/50 text-red-400 rounded-lg font-bold text-sm hover:bg-red-900/30 transition-colors">
            🗑️ Delete Account
          </button>
        </div>
      </div>
    </div>
  );
};