import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { User, ComplaintCategory, SystemSetting, AuditLog, StudentProfile } from '../../types';
import {
  Users,
  Settings,
  Shield,
  Layers,
  Activity,
  Plus,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Search,
  Lock
} from 'lucide-react';

export const AdminPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'categories' | 'settings' | 'audit' | 'system'>('users');
  const [users, setUsers] = useState<(User & { is_active: boolean; profile?: StudentProfile })[]>([]);
  const [categories, setCategories] = useState<ComplaintCategory[]>([]);
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // New User Form State
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [newUserData, setNewUserData] = useState({
    email: '',
    password: 'Password@123',
    role: 'officer',
    full_name: '',
    phone: '',
    registration_number: '',
    level: '500L'
  });

  // Category Edit State
  const [editingCategory, setEditingCategory] = useState<ComplaintCategory | null>(null);

  // Settings Feedback
  const [settingMessage, setSettingMessage] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [u, c, s, a] = await Promise.all([
        api.getAdminUsers(),
        api.getAllCategoriesAdmin(),
        api.getSettingsAdmin(),
        api.getAuditLogsAdmin()
      ]);
      setUsers(u);
      setCategories(c);
      setSettings(s);
      setAuditLogs(a);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleUserActive = async (userId: string, currentActive: boolean) => {
    try {
      await api.updateAdminUser(userId, { is_active: !currentActive });
      setUsers(users.map((u) => (u.id === userId ? { ...u, is_active: !currentActive } : u)));
    } catch (err: any) {
      alert(err.message || 'Failed to update user');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAdminUser(newUserData);
      setShowNewUserModal(false);
      setNewUserData({
        email: '',
        password: 'Password@123',
        role: 'officer',
        full_name: '',
        phone: '',
        registration_number: '',
        level: '500L'
      });
      loadData();
    } catch (err: any) {
      alert(err.message || 'User creation failed');
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    try {
      await api.updateCategoryAdmin(editingCategory.id, {
        name: editingCategory.name,
        sla_hours: Number(editingCategory.sla_hours),
        default_priority: editingCategory.default_priority,
        is_active: editingCategory.is_active
      });
      setEditingCategory(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update category');
    }
  };

  const handleUpdateSetting = async (key: string, value: string) => {
    try {
      await api.updateSettingAdmin(key, value);
      setSettings(settings.map((s) => (s.key === key ? { ...s, value } : s)));
      setSettingMessage(`Setting "${key}" updated successfully.`);
      setTimeout(() => setSettingMessage(''), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update setting');
    }
  };

  const handleResetDemo = async () => {
    if (!window.confirm('Reset database to initial demonstration sample data? All newly entered complaints will be reverted.')) return;
    try {
      await api.resetDemoData();
      alert('System successfully reset to seed demonstration data.');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Reset failed');
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-3 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500 font-medium">Loading administrator control console...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6">
      {/* Admin Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Administration</h1>
          <p className="text-xs text-slate-500">
            Department of Mechanical Engineering, Bayero University Kano · Configuration & Security
          </p>
        </div>

        <button
          onClick={handleResetDemo}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset Demo Records
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'users' ? 'border-blue-900 text-blue-900' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5" /> Users ({users.length})
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'categories' ? 'border-blue-900 text-blue-900' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5" /> Categories & SLA ({categories.length})
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'settings' ? 'border-blue-900 text-blue-900' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Settings className="w-3.5 h-3.5" /> System Settings
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'audit' ? 'border-blue-900 text-blue-900' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Shield className="w-3.5 h-3.5" /> Security Audit Trail ({auditLogs.length})
        </button>
      </div>

      {/* Tab 1: User Management */}
      {activeTab === 'users' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs space-y-4 p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-slate-900 text-sm">Account Management</h2>
              <p className="text-xs text-slate-500">Manage departmental staff and student portal accounts</p>
            </div>
            <button
              onClick={() => setShowNewUserModal(true)}
              className="px-3.5 py-1.5 bg-blue-900 text-white font-semibold text-xs rounded-lg hover:bg-blue-800 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Create Account
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-100">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="p-3">User Name</th>
                  <th className="p-3">Email Address</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Student Reg No / Staff ID</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-900">{u.full_name}</td>
                    <td className="p-3 font-mono text-slate-600">{u.email}</td>
                    <td className="p-3">
                      <span className="font-bold uppercase text-[10px] bg-slate-100 px-2 py-0.5 rounded">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-600">
                      {u.profile ? u.profile.registration_number : 'Staff / Admin'}
                    </td>
                    <td className="p-3">
                      {u.is_active ? (
                        <span className="text-emerald-700 font-semibold">Active</span>
                      ) : (
                        <span className="text-rose-600 font-semibold">Suspended</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleToggleUserActive(u.id, u.is_active)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded transition-colors ${
                          u.is_active
                            ? 'text-red-700 hover:bg-red-50'
                            : 'text-emerald-700 hover:bg-emerald-50'
                        }`}
                      >
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Categories & SLA Management */}
      {activeTab === 'categories' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-slate-900 text-sm">Complaint Categories & Service Level Agreements</h2>
              <p className="text-xs text-slate-500">Configure category response thresholds and priorities</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-100">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Code</th>
                  <th className="p-3">Category Name</th>
                  <th className="p-3">SLA Target</th>
                  <th className="p-3">Default Priority</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-blue-900">{c.code}</td>
                    <td className="p-3 font-semibold text-slate-900">{c.name}</td>
                    <td className="p-3 font-mono tabular-nums">{c.sla_hours} hours</td>
                    <td className="p-3 uppercase text-[10px] font-bold">{c.default_priority}</td>
                    <td className="p-3">
                      <span className={c.is_active ? 'text-emerald-700 font-semibold' : 'text-slate-400'}>
                        {c.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setEditingCategory(c)}
                        className="text-xs text-blue-900 font-semibold hover:underline"
                      >
                        Edit SLA
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: System Settings */}
      {activeTab === 'settings' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div>
            <h2 className="font-bold text-slate-900 text-sm">Institutional & Workflow Settings</h2>
            <p className="text-xs text-slate-500">Configure global parameters for the Mechanical Engineering department</p>
          </div>

          {settingMessage && (
            <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{settingMessage}</span>
            </div>
          )}

          <div className="space-y-4 divide-y divide-slate-100">
            {settings.map((s) => (
              <div key={s.id} className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="max-w-md">
                  <span className="font-bold font-mono text-slate-900 block">{s.key}</span>
                  <span className="text-slate-500">{s.description}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    defaultValue={s.value}
                    onBlur={(e) => {
                      if (e.target.value !== s.value) {
                        handleUpdateSetting(s.key, e.target.value);
                      }
                    }}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-mono text-slate-900 focus:ring-2 focus:ring-blue-900"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Security Audit Trail */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div>
            <h2 className="font-bold text-slate-900 text-sm">Security & Administrative Audit Trail</h2>
            <p className="text-xs text-slate-500">Tamper-evident logs of logins, escalations, assignments, and resolutions</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-100">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">User</th>
                  <th className="p-3">Entity</th>
                  <th className="p-3">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="p-3 text-slate-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="p-3 font-bold text-blue-900 whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="p-3 text-slate-800 whitespace-nowrap">
                      {log.user_email} ({log.user_role})
                    </td>
                    <td className="p-3 text-slate-600">
                      {log.entity_type} #{log.entity_id}
                    </td>
                    <td className="p-3 text-slate-400">
                      {log.ip_address || '127.0.0.1'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Account Modal */}
      {showNewUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900">Create New Account</h3>
            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUserData.full_name}
                  onChange={(e) => setNewUserData({ ...newUserData, full_name: e.target.value })}
                  placeholder="e.g. Engr. Sani Danladi"
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  placeholder="e.g. sani.d@buk.edu.ng"
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Account Role</label>
                <select
                  value={newUserData.role}
                  onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg"
                >
                  <option value="officer">Department Complaint Officer</option>
                  <option value="hod">Head of Department (HOD)</option>
                  <option value="student">Student</option>
                  <option value="reviewer">Auditor / Reviewer</option>
                  <option value="admin">System Administrator</option>
                </select>
              </div>

              {newUserData.role === 'student' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Registration Number</label>
                  <input
                    type="text"
                    required
                    value={newUserData.registration_number}
                    onChange={(e) => setNewUserData({ ...newUserData, registration_number: e.target.value })}
                    placeholder="UG22/ENG/MEC/1001"
                    className="w-full p-2 text-xs border border-slate-300 rounded-lg font-mono uppercase"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewUserModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-900 text-white rounded-lg text-xs font-semibold hover:bg-blue-800"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900">Edit Category SLA: {editingCategory.name}</h3>
            <form onSubmit={handleSaveCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">SLA Target (Hours)</label>
                <input
                  type="number"
                  required
                  value={editingCategory.sla_hours}
                  onChange={(e) => setEditingCategory({ ...editingCategory, sla_hours: Number(e.target.value) })}
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Default Priority</label>
                <select
                  value={editingCategory.default_priority}
                  onChange={(e) => setEditingCategory({ ...editingCategory, default_priority: e.target.value as any })}
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg"
                >
                  <option value="Low">Low</option>
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="catActive"
                  checked={editingCategory.is_active}
                  onChange={(e) => setEditingCategory({ ...editingCategory, is_active: e.target.checked })}
                  className="rounded text-blue-900"
                />
                <label htmlFor="catActive" className="text-xs text-slate-700">
                  Active for student complaint submission
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-900 text-white rounded-lg text-xs font-semibold hover:bg-blue-800"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
