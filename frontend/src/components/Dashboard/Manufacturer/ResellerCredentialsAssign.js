import React, { useEffect, useState } from 'react';
import { manufacturerResellerAPI } from '../../../services/api';

const ResellerCredentialsAssign = () => {
  const [resellers, setResellers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [passwords, setPasswords] = useState({ resellerId: '', newPassword: '' });

  const loadResellers = () => {
    manufacturerResellerAPI
      .listResellers()
      .then((res) => setResellers(res.data))
      .catch(() => setResellers([]));
  };

  useEffect(() => {
    loadResellers();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await manufacturerResellerAPI.createReseller(form);
      setForm({ name: '', email: '', phone: '', password: '' });
      loadResellers();
      alert('Reseller created');
    } catch (e) {
      alert(e?.response?.data || 'Failed to create reseller');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!passwords.resellerId) return;
    setLoading(true);
    try {
      await manufacturerResellerAPI.resetResellerPassword(passwords.resellerId, { newPassword: passwords.newPassword });
      setPasswords({ resellerId: '', newPassword: '' });
      alert('Password updated');
    } catch (e) {
      alert(e?.response?.data || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="bg-gradient-to-r from-indigo-600 to-fuchsia-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-1">Assign Login Credentials</h1>
        <p className="text-indigo-100">Create reseller accounts and reset passwords</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Create Reseller</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border rounded px-3 py-2" required />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border rounded px-3 py-2" required />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Phone</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full border rounded px-3 py-2" required />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Password</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full border rounded px-3 py-2" required />
            </div>
            <div className="flex justify-end">
              <button disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50">Create</button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Reset Password</h2>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Reseller</label>
              <select value={passwords.resellerId} onChange={(e) => setPasswords({ ...passwords, resellerId: e.target.value })} className="w-full border rounded px-3 py-2" required>
                <option value="">Select reseller</option>
                {resellers.map((r) => (
                  <option key={r.id} value={r.id}>{r.name} - {r.email}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">New Password</label>
              <input type="password" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} className="w-full border rounded px-3 py-2" required />
            </div>
            <div className="flex justify-end">
              <button disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50">Update</button>
            </div>
          </form>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Resellers</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {resellers.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-2 text-sm">{r.name}</td>
                  <td className="px-4 py-2 text-sm">{r.email}</td>
                  <td className="px-4 py-2 text-sm">{r.phone}</td>
                  <td className="px-4 py-2 text-sm">{new Date(r.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ResellerCredentialsAssign;


