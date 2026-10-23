import React, { useState } from 'react';
import { Complaint, ComplaintCategory } from '../../types';
import { Plus, Search, Filter, Clock, CheckCircle2, AlertTriangle, ArrowRight, FileText, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface StudentDashboardProps {
  complaints: Complaint[];
  categories: ComplaintCategory[];
  onSelectComplaint: (id: string) => void;
  onSubmitNew: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  complaints,
  categories,
  onSelectComplaint,
  onSubmitNew
}) => {
  const { user, profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // KPI calculations
  const total = complaints.length;
  const underReview = complaints.filter((c) => c.status === 'Submitted' || c.status === 'Under Initial Review').length;
  const underInvestigation = complaints.filter(
    (c) => c.status === 'Assigned for Investigation' || c.status === 'Under Investigation' || c.status === 'Escalated'
  ).length;
  const awaitingStudent = complaints.filter((c) => c.status === 'Awaiting Student Information').length;
  const resolved = complaints.filter((c) => c.status === 'Resolved' || c.status === 'Closed').length;

  const filteredComplaints = complaints.filter((c) => {
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchRef = c.reference_no.toLowerCase().includes(q);
      const matchTitle = c.title.toLowerCase().includes(q);
      const matchCourse = c.course_code?.toLowerCase().includes(q);
      if (!matchRef && !matchTitle && !matchCourse) return false;
    }
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Resolved':
      case 'Closed':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'Escalated':
        return 'text-amber-800 bg-amber-50 border-amber-300';
      case 'Awaiting Student Information':
        return 'text-purple-800 bg-purple-50 border-purple-200';
      case 'Under Investigation':
      case 'Assigned for Investigation':
        return 'text-blue-800 bg-blue-50 border-blue-200';
      case 'Rejected':
        return 'text-rose-700 bg-rose-50 border-rose-200';
      default:
        return 'text-slate-700 bg-slate-100 border-slate-200';
    }
  };

  return (
    <div className="space-y-8 py-6">
      {/* Student Profile & Quick Actions Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Faculty of Engineering</span>
            <span>·</span>
            <span>Department of Mechanical Engineering</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Welcome, {user?.full_name}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 font-medium">
            <span className="font-mono bg-slate-100 px-2.5 py-0.5 rounded text-slate-800 font-bold">
              {profile?.registration_number || 'UG20/ENG/MEC/1042'}
            </span>
            <span>Level: {profile?.level || '500L'}</span>
            <span>·</span>
            <span>Academic Session: {profile?.academic_session || '2025/2026'}</span>
          </div>
        </div>

        <button
          onClick={onSubmitNew}
          className="px-5 py-3 bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 shrink-0 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" /> Submit New Complaint
        </button>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Submitted</span>
          <span className="text-2xl font-bold text-slate-900 font-mono block tabular-nums">{total}</span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Under Review</span>
          <span className="text-2xl font-bold text-slate-700 font-mono block tabular-nums">{underReview}</span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Under Investigation</span>
          <span className="text-2xl font-bold text-blue-900 font-mono block tabular-nums">{underInvestigation}</span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-1">
          <span className="text-[11px] font-semibold text-purple-700 uppercase">Action Required</span>
          <span className="text-2xl font-bold text-purple-900 font-mono block tabular-nums">{awaitingStudent}</span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-1">
          <span className="text-[11px] font-semibold text-emerald-700 uppercase">Resolved Cases</span>
          <span className="text-2xl font-bold text-emerald-700 font-mono block tabular-nums">{resolved}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Reference, Course Code, or Title..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-900"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'Submitted', 'Assigned for Investigation', 'Under Investigation', 'Escalated', 'Resolved', 'Closed'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Complaints List Table / Cards */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <h2 className="font-bold text-slate-900 text-sm">My Registered Complaints</h2>
          <span className="text-xs text-slate-500 font-mono tabular-nums">
            {filteredComplaints.length} {filteredComplaints.length === 1 ? 'docket' : 'dockets'}
          </span>
        </div>

        {filteredComplaints.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-3">
            <FileText className="w-10 h-10 mx-auto opacity-30" />
            <p className="text-sm font-medium">No complaints match your active filter.</p>
            <button
              onClick={onSubmitNew}
              className="text-xs text-blue-900 font-semibold hover:underline"
            >
              Submit your first complaint
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredComplaints.map((c) => (
              <div
                key={c.id}
                onClick={() => onSelectComplaint(c.id)}
                className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded">
                      {c.reference_no}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {c.category?.name || 'Departmental Matter'}
                    </span>
                    {c.course_code && (
                      <span className="text-[11px] font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                        {c.course_code}
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-semibold text-slate-900 group-hover:text-blue-900 transition-colors line-clamp-1">
                    {c.title}
                  </h3>

                  <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                    <span>Submitted: {new Date(c.created_at).toLocaleDateString()}</span>
                    <span>·</span>
                    <span>Semester: {c.semester}</span>
                    <span>·</span>
                    <span>Priority: {c.priority}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                      c.status
                    )}`}
                  >
                    {c.status}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-900 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
