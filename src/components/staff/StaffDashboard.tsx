import React, { useState } from 'react';
import { Complaint, ComplaintCategory, ReportingAnalytics } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  Search,
  Filter,
  Download,
  Printer,
  AlertTriangle,
  Clock,
  UserCheck,
  CheckCircle2,
  ChevronRight,
  ShieldAlert,
  ArrowUpDown
} from 'lucide-react';

interface StaffDashboardProps {
  complaints: Complaint[];
  categories: ComplaintCategory[];
  analytics: ReportingAnalytics | null;
  onSelectComplaint: (id: string) => void;
  onOpenPrintReport: () => void;
  onRefreshData: () => void;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({
  complaints,
  categories,
  analytics,
  onSelectComplaint,
  onOpenPrintReport,
  onRefreshData
}) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [assignedOnlyMe, setAssignedOnlyMe] = useState(false);
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);

  // Departmental Queue Metrics
  const total = complaints.length;
  const unassigned = complaints.filter((c) => !c.assigned_to_id && c.status !== 'Resolved' && c.status !== 'Closed').length;
  const assignedToMe = complaints.filter(
    (c) => c.assigned_to_id === user?.id && c.status !== 'Resolved' && c.status !== 'Closed'
  ).length;
  const escalated = complaints.filter((c) => c.is_escalated || c.status === 'Escalated').length;
  const overdue = complaints.filter((c) => c.isOverdue).length;

  const filtered = complaints.filter((c) => {
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    if (categoryFilter !== 'ALL' && c.category_id !== categoryFilter) return false;
    if (priorityFilter !== 'ALL' && c.priority !== priorityFilter) return false;
    if (assignedOnlyMe && c.assigned_to_id !== user?.id) return false;
    if (showOverdueOnly && !c.isOverdue) return false;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchRef = c.reference_no.toLowerCase().includes(q);
      const matchTitle = c.title.toLowerCase().includes(q);
      const matchStudent = c.studentName?.toLowerCase().includes(q);
      const matchReg = c.studentRegNo?.toLowerCase().includes(q);
      const matchCourse = c.course_code?.toLowerCase().includes(q);
      if (!matchRef && !matchTitle && !matchStudent && !matchReg && !matchCourse) return false;
    }

    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Resolved':
      case 'Closed':
        return 'text-emerald-800 bg-emerald-50 border-emerald-200';
      case 'Escalated':
        return 'text-amber-800 bg-amber-50 border-amber-300';
      case 'Under Investigation':
      case 'Assigned for Investigation':
        return 'text-blue-900 bg-blue-50 border-blue-200';
      case 'Awaiting Student Information':
        return 'text-purple-800 bg-purple-50 border-purple-200';
      case 'Resolution Proposed':
        return 'text-teal-800 bg-teal-50 border-teal-200';
      default:
        return 'text-slate-700 bg-slate-100 border-slate-200';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'Urgent':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'High':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'Normal':
        return 'text-slate-600 bg-slate-100 border-slate-200';
      default:
        return 'text-slate-500 bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="space-y-8 py-6">
      {/* Department Header & Actions */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Departmental Queue</span>
            <span>·</span>
            <span>Department of Mechanical Engineering, BUK</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Complaint Officer Workspace
          </h1>
          <p className="text-xs text-slate-600">
            Authenticated Officer: <span className="font-semibold text-slate-900">{user?.full_name}</span> ({user?.role.toUpperCase()})
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <a
            href={api.getCsvExportUrl()}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4" /> Export CSV
          </a>
          <button
            onClick={onOpenPrintReport}
            className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-4 h-4" /> Formal Dossier
          </button>
        </div>
      </div>

      {/* Queue Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Total in Docket</span>
          <span className="text-2xl font-bold text-slate-900 font-mono block tabular-nums">{total}</span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Unassigned</span>
          <span className="text-2xl font-bold text-slate-800 font-mono block tabular-nums">{unassigned}</span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-1">
          <span className="text-[11px] font-semibold text-blue-900 uppercase">Assigned to Me</span>
          <span className="text-2xl font-bold text-blue-900 font-mono block tabular-nums">{assignedToMe}</span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-1">
          <span className="text-[11px] font-semibold text-amber-800 uppercase">Escalated</span>
          <span className="text-2xl font-bold text-amber-800 font-mono block tabular-nums">{escalated}</span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-1">
          <span className="text-[11px] font-semibold text-red-700 uppercase">Overdue SLA</span>
          <span className="text-2xl font-bold text-red-700 font-mono block tabular-nums">{overdue}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search reference, student name, matric no, course..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
            >
              <option value="ALL">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Normal">Normal</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5">
            {['ALL', 'Submitted', 'Assigned for Investigation', 'Under Investigation', 'Escalated', 'Resolution Proposed', 'Resolved', 'Closed'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold text-slate-700">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={assignedOnlyMe}
                onChange={(e) => setAssignedOnlyMe(e.target.checked)}
                className="rounded text-blue-900 focus:ring-blue-900"
              />
              <span>Assigned to me only</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-red-700">
              <input
                type="checkbox"
                checked={showOverdueOnly}
                onChange={(e) => setShowOverdueOnly(e.target.checked)}
                className="rounded text-red-600 focus:ring-red-500"
              />
              <span>Overdue SLA only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Complaints Queue Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <h2 className="font-bold text-slate-900 text-sm">Departmental Complaints Docket</h2>
          <span className="text-xs text-slate-500 font-mono tabular-nums">
            {filtered.length} {filtered.length === 1 ? 'case' : 'cases'}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <Clock className="w-8 h-8 mx-auto opacity-30" />
            <p className="text-xs font-medium">No complaints match your active filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-100">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="p-3.5 pl-5">Reference</th>
                  <th className="p-3.5">Student / Reg No</th>
                  <th className="p-3.5">Category & Title</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Priority</th>
                  <th className="p-3.5">Handler</th>
                  <th className="p-3.5 pr-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => onSelectComplaint(c.id)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="p-3.5 pl-5 font-mono font-bold text-blue-900 whitespace-nowrap">
                      {c.reference_no}
                      {c.isOverdue && (
                        <span className="ml-1.5 text-[10px] text-red-600 font-semibold block sm:inline">
                          OVERDUE
                        </span>
                      )}
                    </td>

                    <td className="p-3.5 whitespace-nowrap">
                      <span className="font-semibold text-slate-900 block">{c.studentName}</span>
                      <span className="text-[11px] text-slate-500 font-mono">{c.studentRegNo || c.level}</span>
                    </td>

                    <td className="p-3.5 max-w-xs sm:max-w-md">
                      <span className="text-[11px] text-slate-500 block truncate font-medium">
                        {c.category?.name}
                      </span>
                      <span className="font-semibold text-slate-900 block truncate group-hover:text-blue-900">
                        {c.title}
                      </span>
                      {c.course_code && (
                        <span className="text-[10px] font-mono text-slate-500">
                          Course: {c.course_code}
                        </span>
                      )}
                    </td>

                    <td className="p-3.5 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full font-semibold text-[11px] border ${getStatusBadge(c.status)}`}>
                        {c.status}
                      </span>
                    </td>

                    <td className="p-3.5 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${getPriorityBadge(c.priority)}`}>
                        {c.priority}
                      </span>
                    </td>

                    <td className="p-3.5 whitespace-nowrap text-slate-700">
                      {c.handlerName || <span className="text-slate-400 italic">Unassigned</span>}
                    </td>

                    <td className="p-3.5 pr-5 text-right whitespace-nowrap">
                      <span className="text-xs font-semibold text-blue-900 hover:underline inline-flex items-center gap-1">
                        Investigate <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
