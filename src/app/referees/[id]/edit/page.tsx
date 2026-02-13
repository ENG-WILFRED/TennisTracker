"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  User, 
  Globe, 
  Camera, 
  BookOpen, 
  Award,
  Shield,
  Lock,
  LogIn,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Upload,
  Image as ImageIcon
} from 'lucide-react';

export default function EditRefereePage({ params }: { params: { id: string } }) {
  const { id } = params as { id: string };
  const { user } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({ 
    bio: '', 
    photo: '', 
    nationality: '', 
    experience: '',
    certifications: [] as string[]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [newCertification, setNewCertification] = useState('');
  const [refereeName, setRefereeName] = useState('');

  useEffect(() => {
    async function fetchRef() {
      try {
        const res = await fetch(`/api/referees/${id}`);
        if (!res.ok) return;
        const data = await res.json();
        setForm({ 
          bio: data.bio || '', 
          photo: data.photo || '', 
          nationality: data.nationality || '', 
          experience: data.experience || '',
          certifications: data.certifications || []
        });
        setRefereeName(`${data.firstName} ${data.lastName}`);
      } catch (err) {
        console.error(err);
      }
    }
    fetchRef();
  }, [id]);

  const isAuthorized = user && user.role === 'referee' && user.id === id;

  // Unauthorized Access Screen
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-pink-50 to-fuchsia-100 relative overflow-hidden flex items-center justify-center p-4">
        {/* Decorative Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-pink-300 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-fuchsia-300 rounded-full blur-3xl opacity-20 translate-y-1/2 -translate-x-1/2"></div>
        </div>

        <div className="relative max-w-2xl w-full">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-12 shadow-2xl border-2 border-pink-200 text-center">
            {/* Icon */}
            <div className="mb-6 flex justify-center">
              <div className="bg-gradient-to-br from-pink-500 to-fuchsia-600 p-6 rounded-3xl shadow-xl">
                <Lock className="w-16 h-16 text-white" />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-4xl font-black text-slate-900 mb-4">
              Access Restricted
            </h2>
            
            {/* Message */}
            <div className="bg-gradient-to-br from-pink-50 to-fuchsia-50 rounded-2xl p-6 mb-8 border-2 border-pink-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-pink-600 flex-shrink-0 mt-1" />
                <div className="text-left">
                  <p className="text-lg font-bold text-slate-900 mb-2">
                    You are not authorized to edit this profile
                  </p>
                  <p className="text-slate-600">
                    Only the profile owner can make changes to their referee information. 
                    Please log in with the correct account or return to browse other profiles.
                  </p>
                </div>
              </div>
            </div>

            {/* Current User Info */}
            {user ? (
              <div className="bg-white rounded-2xl p-4 mb-8 border-2 border-slate-200">
                <p className="text-sm font-bold text-slate-600 mb-2">Currently logged in as:</p>
                <div className="flex items-center justify-center gap-3">
                  <div className="bg-gradient-to-br from-pink-500 to-fuchsia-600 p-2 rounded-full">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-black text-slate-900">{user.email}</p>
                    <p className="text-sm text-slate-600 capitalize">Role: {user.role}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-pink-100 to-fuchsia-100 rounded-2xl p-4 mb-8 border-2 border-pink-300">
                <p className="text-slate-700 font-bold">
                  You are not currently logged in
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!user && (
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-3 bg-gradient-to-r from-pink-500 to-fuchsia-600 hover:from-pink-600 hover:to-fuchsia-700 text-white font-black px-8 py-4 rounded-2xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-105"
                >
                  <LogIn className="w-5 h-5" />
                  Login to Continue
                </Link>
              )}
              
              <Link
                href={`/referees/${id}`}
                className="inline-flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-700 font-black px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all border-2 border-pink-200 hover:border-pink-400"
              >
                <ArrowLeft className="w-5 h-5" />
                View Profile
              </Link>

              <Link
                href="/referees"
                className="inline-flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-700 font-black px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all border-2 border-pink-200 hover:border-pink-400"
              >
                <ArrowLeft className="w-5 h-5" />
                All Referees
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      const tokens = localStorage.getItem('authTokens');
      const parsed = tokens ? JSON.parse(tokens) : null;
      const res = await fetch(`/api/referees/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: parsed ? `Bearer ${parsed.accessToken}` : '' 
        },
        body: JSON.stringify(form),
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save changes');
      }
      
      setSuccess(true);
      setTimeout(() => {
        router.push(`/referees/${id}`);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to save changes. Please try again.');
    }
    setLoading(false);
  }

  function addCertification() {
    if (newCertification.trim() && !form.certifications.includes(newCertification.trim())) {
      setForm({ ...form, certifications: [...form.certifications, newCertification.trim()] });
      setNewCertification('');
    }
  }

  function removeCertification(cert: string) {
    setForm({ ...form, certifications: form.certifications.filter(c => c !== cert) });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-pink-50 to-fuchsia-100 relative overflow-hidden py-12 px-4">
      {/* Decorative Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-pink-300 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-fuchsia-300 rounded-full blur-3xl opacity-20 translate-y-1/2 -translate-x-1/2"></div>
      </div>

      <div className="relative max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href={`/referees/${id}`}
            className="inline-flex items-center gap-2 text-pink-700 hover:text-pink-900 mb-6 font-bold transition-colors bg-white/70 backdrop-blur-sm px-5 py-3 rounded-full shadow-md hover:shadow-lg"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Profile
          </Link>

          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border-2 border-pink-200">
            <div className="flex items-center gap-4 mb-2">
              <div className="bg-gradient-to-br from-pink-500 to-fuchsia-600 p-4 rounded-2xl shadow-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black bg-gradient-to-r from-pink-600 to-fuchsia-600 bg-clip-text text-transparent">
                  Edit Your Profile
                </h1>
                <p className="text-lg text-slate-600 font-semibold mt-1">
                  {refereeName || 'Update your referee information'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl p-6 shadow-xl border-2 border-green-400 animate-pulse">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6" />
              <div>
                <p className="font-black text-lg">Profile Updated Successfully!</p>
                <p className="text-sm opacity-90">Redirecting to your profile...</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-2xl p-6 shadow-xl border-2 border-red-400">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6" />
              <div>
                <p className="font-black text-lg">Error</p>
                <p className="text-sm opacity-90">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Bio Section */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border-2 border-pink-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-br from-pink-500 to-fuchsia-600 p-3 rounded-2xl shadow-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-black text-slate-900">Biography</h2>
            </div>
            <textarea 
              value={form.bio} 
              onChange={(e) => setForm({ ...form, bio: e.target.value })} 
              className="w-full border-2 border-pink-200 rounded-2xl p-4 focus:border-pink-500 focus:ring-4 focus:ring-pink-200 transition-all font-medium text-slate-700 resize-none"
              rows={6}
              placeholder="Tell us about your refereeing experience, philosophy, and achievements..."
            />
            <p className="text-sm text-slate-500 mt-2 font-semibold">
              {form.bio.length} characters
            </p>
          </div>

          {/* Photo Section */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border-2 border-pink-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-br from-pink-500 to-fuchsia-600 p-3 rounded-2xl shadow-lg">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-black text-slate-900">Profile Photo</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">
                  Photo URL
                </label>
                <div className="relative">
                  <input 
                    type="url"
                    value={form.photo} 
                    onChange={(e) => setForm({ ...form, photo: e.target.value })} 
                    className="w-full border-2 border-pink-200 rounded-2xl p-4 pl-12 focus:border-pink-500 focus:ring-4 focus:ring-pink-200 transition-all font-medium text-slate-700"
                    placeholder="https://example.com/photo.jpg"
                  />
                  <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-pink-500" />
                </div>
              </div>

              {/* Photo Preview */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">
                  Preview
                </label>
                <div className="relative h-32 bg-gradient-to-br from-pink-200 to-fuchsia-200 rounded-2xl overflow-hidden border-2 border-pink-300">
                  {form.photo ? (
                    <img 
                      src={form.photo} 
                      alt="Profile preview" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&q=80';
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Camera className="w-12 h-12 text-pink-400" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Personal Info Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Nationality */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border-2 border-pink-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-gradient-to-br from-pink-500 to-fuchsia-600 p-3 rounded-2xl shadow-lg">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-black text-slate-900">Nationality</h2>
              </div>
              <input 
                type="text"
                value={form.nationality} 
                onChange={(e) => setForm({ ...form, nationality: e.target.value })} 
                className="w-full border-2 border-pink-200 rounded-2xl p-4 focus:border-pink-500 focus:ring-4 focus:ring-pink-200 transition-all font-bold text-slate-700"
                placeholder="e.g., United States"
              />
            </div>

            {/* Experience */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border-2 border-pink-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-gradient-to-br from-pink-500 to-fuchsia-600 p-3 rounded-2xl shadow-lg">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-black text-slate-900">Experience</h2>
              </div>
              <input 
                type="text"
                value={form.experience} 
                onChange={(e) => setForm({ ...form, experience: e.target.value })} 
                className="w-full border-2 border-pink-200 rounded-2xl p-4 focus:border-pink-500 focus:ring-4 focus:ring-pink-200 transition-all font-bold text-slate-700"
                placeholder="e.g., 10+ years"
              />
            </div>
          </div>

          {/* Certifications */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border-2 border-pink-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-br from-pink-500 to-fuchsia-600 p-3 rounded-2xl shadow-lg">
                <Award className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-black text-slate-900">Certifications</h2>
            </div>

            {/* Add Certification Input */}
            <div className="flex gap-3 mb-6">
              <input 
                type="text"
                value={newCertification}
                onChange={(e) => setNewCertification(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCertification())}
                className="flex-1 border-2 border-pink-200 rounded-2xl p-4 focus:border-pink-500 focus:ring-4 focus:ring-pink-200 transition-all font-medium text-slate-700"
                placeholder="e.g., FIFA Referee License"
              />
              <button
                type="button"
                onClick={addCertification}
                className="bg-gradient-to-r from-pink-500 to-fuchsia-600 hover:from-pink-600 hover:to-fuchsia-700 text-white font-black px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all"
              >
                Add
              </button>
            </div>

            {/* Certifications List */}
            <div className="flex flex-wrap gap-3">
              {form.certifications.map((cert, idx) => (
                <div 
                  key={idx}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white px-5 py-3 rounded-full font-black shadow-lg group"
                >
                  <span>{cert}</span>
                  <button
                    type="button"
                    onClick={() => removeCertification(cert)}
                    className="hover:bg-white/20 rounded-full p-1 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {form.certifications.length === 0 && (
                <p className="text-slate-500 italic">No certifications added yet</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="submit"
              disabled={loading || success}
              className="flex-1 inline-flex items-center justify-center gap-3 bg-gradient-to-r from-pink-500 to-fuchsia-600 hover:from-pink-600 hover:to-fuchsia-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-black px-8 py-5 rounded-2xl shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-4 border-white border-t-transparent"></div>
                  Saving Changes...
                </>
              ) : success ? (
                <>
                  <CheckCircle className="w-6 h-6" />
                  Saved Successfully!
                </>
              ) : (
                <>
                  <Save className="w-6 h-6" />
                  Save Changes
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => router.push(`/referees/${id}`)}
              disabled={loading || success}
              className="flex-1 inline-flex items-center justify-center gap-3 bg-white hover:bg-slate-50 disabled:bg-slate-100 text-slate-700 font-black px-8 py-5 rounded-2xl shadow-lg hover:shadow-xl transition-all border-2 border-pink-200 hover:border-pink-400 disabled:cursor-not-allowed"
            >
              <X className="w-6 h-6" />
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}