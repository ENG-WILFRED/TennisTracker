import React, { useState } from 'react';
import { Tournament } from './types';
import { createCommunityPost } from '@/actions/community';

export function RepostModal({ t, user, onClose }: { t: Tournament; user: any; onClose: () => void }) {
  const [platform, setPlatform] = useState('feed');
  const [done, setDone] = useState(false);
  const [note, setNote] = useState(`Check out this tournament: ${t.name}! Entry fee: $${t.entryFee || 'Free'} | Prize pool: $${t.prizePool || 0} | Starts ${new Date(t.startDate).toLocaleDateString()}`);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const platforms = [
    { key: 'feed', label: 'My Feed' },
    { key: 'community', label: 'Community Post' },
    { key: 'whatsapp', label: 'WhatsApp' },
    { key: 'twitter', label: 'Twitter/X' },
    { key: 'email', label: 'Email' }
  ];

  const handleShare = async () => {
    if (platform === 'community') {
      setLoading(true);
      setError(null);
      try {
        const tournamentLink = `${window.location.origin}/tournaments/${t.id}`;
        const postContent = `shared 1 time\n\n${note}\n\n🏆 ${t.name}\n📅 ${new Date(t.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}\n📍 ${t.location}\n💰 Entry: $${t.entryFee || 'Free'} | Prize: $${t.prizePool?.toLocaleString() || '0'}\n\n${tournamentLink}`;

        await createCommunityPost(user?.id!, postContent, 'public', t.id);
        setDone(true);
      } catch (err: any) {
        setError(err?.message || 'Failed to share to community');
      } finally {
        setLoading(false);
      }
    } else {
      setDone(true);
    }
  };

  if (done) return (
    <div className="fixed inset-0 bg-[rgba(2,7,3,0.85)] backdrop-blur-lg z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#0a1510] border border-[rgba(99,153,34,0.2)] rounded-[18px] w-full max-w-[480px] overflow-hidden animate-[modalIn_0.2s_ease]" onClick={e => e.stopPropagation()}>
        {/* Success Body */}
        <div className="p-8 text-center">
          <div className="text-4xl mb-4">🚀</div>
          <div className="text-xl font-semibold text-[#e8f8d8] mb-2">Posted!</div>
          <p className="text-sm text-[#5a7242] leading-relaxed">
            Tournament has been shared to your {platforms.find(p => p.key === platform)?.label}.
          </p>
        </div>
        {/* Footer */}
        <div className="flex justify-center px-5 py-4 border-t border-[rgba(99,153,34,0.15)]">
          <button className="btn btn-md btn-primary min-w-[160px]" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-[rgba(2,7,3,0.85)] backdrop-blur-lg z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#0a1510] border border-[rgba(99,153,34,0.2)] rounded-[18px] w-full max-w-[480px] overflow-hidden animate-[modalIn_0.2s_ease]" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-5 py-4 border-b border-[rgba(99,153,34,0.16)]">
          <div className="text-3xl mb-2">↗</div>
          <h3 className="text-lg font-semibold text-[#e8f8d8] mb-1">Repost Tournament</h3>
          <p className="text-sm text-[#5a7242]">Share this tournament with your network</p>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Preview */}
          <div className="bg-[rgba(99,153,34,0.06)] border border-[rgba(99,153,34,0.15)] rounded-lg p-3 mb-4">
            <div className="font-semibold text-[#c8e0a8] mb-1">{t.name}</div>
            <div className="text-xs text-[#5a7242]">
              {new Date(t.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {t.location} · ${t.prizePool?.toLocaleString()} prize · {t.maxParticipants - t.currentParticipants} spots left
            </div>
          </div>

          {/* Platform Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#4a6335] mb-2">Share to</label>
            <div className="grid grid-cols-2 gap-2">
              {platforms.map(p => (
                <button
                  key={p.key}
                  className={`p-3 rounded-lg border text-sm font-medium transition-colors ${platform === p.key
                    ? 'border-[#8dc843] bg-[rgba(99,153,34,0.12)] text-[#c8e0a8]'
                    : 'border-[rgba(99,153,34,0.12)] bg-transparent text-[#dde8d4] hover:border-[rgba(99,153,34,0.25)]'
                    }`}
                  onClick={() => setPlatform(p.key)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Note */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#4a6335] mb-2">Add a note</label>
            <textarea
              className="w-full bg-[rgba(99,153,34,0.05)] border border-[rgba(99,153,34,0.12)] rounded-md p-2.5 px-4 text-sm text-[#dde8d4] font-epilogue outline-none transition-colors focus:border-[rgba(99,153,34,0.4)] min-h-[80px] resize-none"
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={3}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-sm text-red-400 bg-red-900/20 border border-red-800/30 rounded-md p-3">
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-5 py-4 border-t border-[rgba(99,153,34,0.15)]">
          <button
            className="btn btn-md btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleShare}
            disabled={loading}
          >
            {loading ? '⏳ Sharing…' : '↗ Share Now'}
          </button>
          <button className="btn btn-md btn-ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}