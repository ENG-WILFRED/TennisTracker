import React from 'react';

export default function EditProfileModal({
  show,
  editForm,
  onChange,
  onClose,
  onSubmit,
  saving,
}: any) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/25 flex items-center justify-center z-40">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl relative">
        <button onClick={onClose} aria-label="Close" className="absolute top-4 right-4 text-gray-500 text-2xl">&times;</button>
        <h2 className="text-xl font-bold text-green-800 mb-4">Edit Profile</h2>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="flex gap-3 flex-wrap">
            <input name="firstName" value={editForm.firstName} onChange={onChange} required className="flex-1 border border-green-200 rounded px-3 py-2" placeholder="First Name" />
            <input name="lastName" value={editForm.lastName} onChange={onChange} required className="flex-1 border border-green-200 rounded px-3 py-2" placeholder="Last Name" />
          </div>
          <div className="flex gap-3 flex-wrap">
            <input name="email" type="email" value={editForm.email} onChange={onChange} required className="flex-1 border border-green-200 rounded px-3 py-2" placeholder="Email" />
            <input name="phone" value={editForm.phone} onChange={onChange} className="flex-1 border border-green-200 rounded px-3 py-2" placeholder="Phone" />
          </div>
          <div className="flex gap-3 flex-wrap">
            <select name="gender" value={editForm.gender} onChange={onChange} className="border border-green-200 rounded px-3 py-2">
              <option value="">Select</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
            <input name="dateOfBirth" type="date" value={editForm.dateOfBirth} onChange={onChange} className="border border-green-200 rounded px-3 py-2" />
          </div>
          <input name="nationality" value={editForm.nationality} onChange={onChange} className="w-full border border-green-200 rounded px-3 py-2" placeholder="Nationality" />
          <textarea name="bio" value={editForm.bio} onChange={onChange} rows={2} className="w-full border border-green-200 rounded px-3 py-2" placeholder="Bio" />
          <input name="photo" value={editForm.photo} onChange={onChange} className="w-full border border-green-200 rounded px-3 py-2" placeholder="Photo URL" />
          <button type="submit" disabled={saving} className="w-full bg-green-500 text-white font-bold py-2 rounded">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
