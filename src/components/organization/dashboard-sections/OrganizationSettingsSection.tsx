'use client';

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { authenticatedFetch } from '@/lib/authenticatedFetch';

const G = {
  dark: '#0f1f0f', sidebar: '#152515', card: '#1a3020', cardBorder: '#2d5a35',
  mid: '#2d5a27', bright: '#3d7a32', lime: '#7dc142', accent: '#a8d84e',
  text: '#e8f5e0', muted: '#7aaa6a', yellow: '#f0c040', blue: '#4ab0d0',
};

interface CoachPriceRule {
  id: string;
  coachName: string;
  role: string;
  pricePerSession: number;
  active: boolean;
}

interface OrgPricingConfig {
  pricePerHour: number;
  currency: string;
  minSessionDurationMinutes: number;
  roundingType: 'up' | 'down' | 'nearest';
}

interface OrganizationSettingsSectionProps {
  orgId?: string;
}

const defaultStaffSettings = [
  { id: 'coach_base_rate', label: 'Default coach session rate', value: '', placeholder: '$ per session' },
  { id: 'assistant_rate', label: 'Assistant coach session rate', value: '', placeholder: '$ per session' },
  { id: 'session_duration', label: 'Default session duration', value: '', placeholder: 'Minutes' },
  { id: 'coach_bonus_enabled', label: 'Enable coach bonus payouts', value: false },
];

const defaultOrgPricing: OrgPricingConfig = {
  pricePerHour: 60,
  currency: 'USD',
  minSessionDurationMinutes: 30,
  roundingType: 'up',
};

export default function OrganizationSettingsSection({ orgId }: OrganizationSettingsSectionProps) {
  const [staffSettings, setStaffSettings] = useState<any[]>(defaultStaffSettings);
  const [orgPricing, setOrgPricing] = useState<OrgPricingConfig>(defaultOrgPricing);
  const [coachRates, setCoachRates] = useState<CoachPriceRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settingsApiAvailable, setSettingsApiAvailable] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    fetchSettings();
  }, [orgId]);

  async function fetchSettings() {
    setIsLoading(true);
    try {
      const res = await authenticatedFetch(`/api/organization/${orgId}/settings`);

      if (res.status === 404) {
        setSettingsApiAvailable(false);
        setStaffSettings(defaultStaffSettings);
        setCoachRates([]);
        setError(null);
        return;
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Failed to load settings`);
      }

      const data = await res.json();
      setStaffSettings(data.staffSettings || defaultStaffSettings);
      setCoachRates(data.coachRates || data.coachPrices || []);
      setOrgPricing(data.orgPricing || defaultOrgPricing);
      setError(null);
      setSettingsApiAvailable(true);
    } catch (err: any) {
      console.warn('Settings fetch error:', err.message);
      setStaffSettings(defaultStaffSettings);
      setCoachRates([]);
      setOrgPricing(defaultOrgPricing);
      setError(null);
      setSettingsApiAvailable(false);
    } finally {
      setIsLoading(false);
    }
  }

  const handleStaffSettingChange = (id: string, value: string | number | boolean) => {
    setStaffSettings(prev => prev.map(s => s.id === id ? { ...s, value } : s));
  };

  const handleOrgPricingChange = (field: keyof OrgPricingConfig, value: string | number) => {
    setOrgPricing(prev => ({ ...prev, [field]: value }));
  };

  const handleCoachRateChange = (id: string, field: keyof CoachPriceRule, value: string | number | boolean) => {
    setCoachRates(prev => prev.map(rate => rate.id === id ? { ...rate, [field]: value } : rate));
  };

  const handleSave = async () => {
    if (!orgId || !settingsApiAvailable) {
      toast.error('Settings API is not available yet. No save was attempted.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        staffSettings,
        coachRates,
        orgPricing,
      };
      const res = await authenticatedFetch(`/api/organization/${orgId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to save settings');
      toast.success('Settings saved successfully');
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Unable to save settings');
      toast.error(err.message || 'Unable to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const addCoachRate = () => {
    setCoachRates(prev => [
      ...prev,
      {
        id: `coach_rate_${Date.now()}`,
        coachName: '',
        role: 'coach',
        pricePerSession: 0,
        active: true,
      },
    ]);
  };

  const removeCoachRate = (id: string) => {
    setCoachRates(prev => prev.filter(rate => rate.id !== id));
  };

  return (
    <div className="w-full min-h-screen">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">⚙️ Organization Settings</h1>
          <p className="text-sm text-[#a8d84e] max-w-2xl mt-2">Configure staff pay rates, session settings, and organization-wide operational options from one place.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving || !settingsApiAvailable}
          className="inline-flex items-center justify-center rounded-xl bg-[#7dc142] px-5 py-3 text-sm font-semibold text-[#0f1f0f] transition hover:bg-[#9bd861] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-600 bg-red-950/80 p-4 text-sm text-red-200 mb-6">
          {error}
        </div>
      )}

      {!settingsApiAvailable && (
        <div className="rounded-2xl border border-yellow-600 bg-yellow-950/80 p-4 text-sm text-yellow-200 mb-6">
          Organization settings are not yet available on the backend. You can configure values locally, but saving is disabled until the API is implemented.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-3xl border border-[#2d5a35] bg-[#121f12]/90 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.30)]">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">Staff & Session Defaults</h2>
                <p className="text-sm text-[#7aaa6a]">Set rates and session defaults for coaches and assistants.</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {staffSettings.map(setting => (
                <div key={setting.id} className="rounded-3xl border border-[#263f25] bg-[#162a17] p-4">
                  <div className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#7aaa6a]">{setting.label}</div>
                  {typeof setting.value === 'boolean' ? (
                    <button
                      onClick={() => handleStaffSettingChange(setting.id, !setting.value)}
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${setting.value ? 'bg-[#7dc142] text-[#0f1f0f]' : 'bg-[#263f25] text-[#9bb593]'}`}>
                      {setting.value ? 'Enabled' : 'Disabled'}
                    </button>
                  ) : (
                    <input
                      type={setting.placeholder.includes('Minutes') ? 'number' : 'text'}
                      value={setting.value}
                      placeholder={setting.placeholder}
                      onChange={(e) => handleStaffSettingChange(setting.id, setting.placeholder.includes('Minutes') ? Number(e.target.value) : e.target.value)}
                      className="w-full rounded-3xl border border-[#2d5a35] bg-[#0f1d0f] px-4 py-3 text-sm text-white outline-none transition focus:border-[#7dc142] focus:ring-2 focus:ring-[#7dc142]/30"
                    />
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-[#2d5a35] bg-[#121f12]/90 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.30)]">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-white">Organization Pricing</h2>
              <p className="text-sm text-[#7aaa6a]">Configure the default hourly rate, session minimums, and rounding for session pricing estimates.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm text-[#e8f5e0]">
                Hourly Rate
                <input
                  type="number"
                  value={orgPricing.pricePerHour}
                  onChange={(e) => handleOrgPricingChange('pricePerHour', Number(e.target.value))}
                  placeholder="Hourly rate"
                  className="rounded-3xl border border-[#2d5a35] bg-[#0f1d0f] px-4 py-3 text-sm text-white outline-none transition focus:border-[#7dc142] focus:ring-2 focus:ring-[#7dc142]/30"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-[#e8f5e0]">
                Minimum Session Duration
                <input
                  type="number"
                  value={orgPricing.minSessionDurationMinutes}
                  onChange={(e) => handleOrgPricingChange('minSessionDurationMinutes', Number(e.target.value))}
                  placeholder="Minutes"
                  className="rounded-3xl border border-[#2d5a35] bg-[#0f1d0f] px-4 py-3 text-sm text-white outline-none transition focus:border-[#7dc142] focus:ring-2 focus:ring-[#7dc142]/30"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-[#e8f5e0]">
                Rounding Type
                <select
                  value={orgPricing.roundingType}
                  onChange={(e) => handleOrgPricingChange('roundingType', e.target.value)}
                  className="rounded-3xl border border-[#2d5a35] bg-[#0f1d0f] px-4 py-3 text-sm text-white outline-none transition focus:border-[#7dc142] focus:ring-2 focus:ring-[#7dc142]/30"
                >
                  <option value="up">Up to next quarter hour</option>
                  <option value="nearest">Nearest quarter hour</option>
                  <option value="down">Down to previous quarter hour</option>
                </select>
              </label>
            </div>
          </section>

          <section className="rounded-3xl border border-[#2d5a35] bg-[#121f12]/90 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.30)]">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">Coach Pricing Rules</h2>
                <p className="text-sm text-[#7aaa6a]">Create custom session pricing per coach or role.</p>
              </div>
              <button
                onClick={addCoachRate}
                className="rounded-full bg-[#7dc142] px-4 py-2 text-sm font-semibold text-[#0f1f0f] transition hover:bg-[#9bd861]"
              >
                + Add Rate
              </button>
            </div>

            <div className="space-y-4">
              {coachRates.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-[#2d5a35] bg-[#0f1b0f] p-6 text-sm text-[#7aaa6a]">
                  No coach-specific rate rules configured yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {coachRates.map((rate) => (
                    <div key={rate.id} className="rounded-3xl border border-[#2d5a35] bg-[#0f1d0f] p-4 shadow-inner shadow-black/20">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="text-sm font-semibold text-white">{rate.coachName || 'Unnamed coach rate'}</div>
                          <div className="text-xs text-[#7aaa6a]">Role: {rate.role}</div>
                        </div>
                        <button
                          onClick={() => removeCoachRate(rate.id)}
                          className="rounded-full border border-[#2d5a35] px-3 py-1 text-xs font-semibold text-[#f0c040] transition hover:border-[#f0c040]"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2 mt-4">
                        <label className="flex flex-col gap-2 text-sm text-[#e8f5e0]">
                          Coach Name
                          <input
                            type="text"
                            value={rate.coachName}
                            onChange={(e) => handleCoachRateChange(rate.id, 'coachName', e.target.value)}
                            placeholder="Enter coach or staff name"
                            className="rounded-3xl border border-[#2d5a35] bg-[#0f1d0f] px-4 py-3 text-sm text-white outline-none transition focus:border-[#7dc142] focus:ring-2 focus:ring-[#7dc142]/30"
                          />
                        </label>
                        <label className="flex flex-col gap-2 text-sm text-[#e8f5e0]">
                          Rate per session
                          <input
                            type="number"
                            value={rate.pricePerSession}
                            onChange={(e) => handleCoachRateChange(rate.id, 'pricePerSession', Number(e.target.value))}
                            placeholder="Amount"
                            className="rounded-3xl border border-[#2d5a35] bg-[#0f1d0f] px-4 py-3 text-sm text-white outline-none transition focus:border-[#7dc142] focus:ring-2 focus:ring-[#7dc142]/30"
                          />
                        </label>
                        <label className="flex flex-col gap-2 text-sm text-[#e8f5e0]">
                          Role
                          <select
                            value={rate.role}
                            onChange={(e) => handleCoachRateChange(rate.id, 'role', e.target.value as any)}
                            className="rounded-3xl border border-[#2d5a35] bg-[#0f1d0f] px-4 py-3 text-sm text-white outline-none transition focus:border-[#7dc142] focus:ring-2 focus:ring-[#7dc142]/30"
                          >
                            <option value="coach">Coach</option>
                            <option value="assistant">Assistant</option>
                            <option value="trainer">Trainer</option>
                          </select>
                        </label>
                        <label className="flex items-center gap-3 text-sm text-[#e8f5e0]">
                          <input
                            type="checkbox"
                            checked={rate.active}
                            onChange={(e) => handleCoachRateChange(rate.id, 'active', e.target.checked)}
                            className="h-4 w-4 rounded border-[#2d5a35] bg-[#0f1d0f] text-[#7dc142] focus:ring-[#7dc142]"
                          />
                          Active
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-6 lg:w-full lg:max-w-sm">
          <div className="rounded-3xl border border-[#2d5a35] bg-[#121f12]/90 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.30)]">
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#7aaa6a] mb-3">Quick Actions</div>
            <div className="space-y-3">
              <button className="w-full rounded-3xl border border-[#2d5a35] bg-[#0f1d0f] px-4 py-3 text-left text-sm text-[#e8f5e0] transition hover:border-[#7dc142] hover:bg-[#162a17]">
                View configured coaches
              </button>
              <button className="w-full rounded-3xl border border-[#2d5a35] bg-[#0f1d0f] px-4 py-3 text-left text-sm text-[#e8f5e0] transition hover:border-[#7dc142] hover:bg-[#162a17]">
                Review session payment rules
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-[#2d5a35] bg-[#121f12]/90 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.30)]">
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#7aaa6a] mb-3">Tips</div>
            <p className="text-sm leading-6 text-[#b1c78b]">Use coach-specific rate rules to reward premium staff and keep standard session costs consistent across the organization.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
