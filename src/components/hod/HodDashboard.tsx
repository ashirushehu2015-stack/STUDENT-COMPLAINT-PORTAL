import React from 'react';
import { Complaint, ComplaintCategory, ReportingAnalytics } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  Download,
  Printer,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Users,
  Layers,
  ArrowRight,
  TrendingUp,
  FileCheck
} from 'lucide-react';

interface HodDashboardProps {
  complaints: Complaint[];
  categories: ComplaintCategory[];
  analytics: ReportingAnalytics | null;
  onSelectComplaint: (id: string) => void;
  onOpenPrintReport: () => void;
}

export const HodDashboard: React.FC<HodDashboardProps> = ({
  complaints,
  categories,
  analytics,
  onSelectComplaint,
  onOpenPrintReport
}) => {
  const { user } = useAuth();

  const escalatedCases = complaints.filter((c) => c.is_escalated || c.status === 'Escalated');
  const overdueCases = complaints.filter((c) => c.isOverdue);
  const proposedResolutions = complaints.filter((c) => c.status === 'Resolution Proposed');

  return (
    <div className="space-y-8 py-6">
      {/* Executive Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm border border-slate-800">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold uppercase tracking-wider">
            <span>Executive Management Desk</span>
            <span>·</span>
            <span>Department of Mechanical Engineering, BUK</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Head of Department (HOD) Oversight
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Welcome, <strong className="text-white">{user?.full_name}</strong> · Monitoring departmental compliance, escalations, and resolution standards.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
          <a
            href={api.getCsvExportUrl()}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors border border-slate-700"
          >
            <Download className="w-4 h-4" /> Export CSV
          </a>
          <button
            onClick={onOpenPrintReport}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-4 h-4" /> Department Dossier
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-1 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Departmental Cases</span>
          <span className="text-3xl font-bold text-slate-900 font-mono block tabular-nums">
            {analytics?.totalComplaints || complaints.length}
          </span>
          <span className="text-[11px] text-slate-400">Current Academic Session 2025/2026</span>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-1 shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-700 uppercase">Resolved / Closed</span>
          <span className="text-3xl font-bold text-emerald-700 font-mono block tabular-nums">
            {analytics?.resolvedCount || 0}
          </span>
          <span className="text-[11px] text-emerald-600 font-medium">
            {analytics?.resolutionRate || 0}% Overall Resolution Rate
          </span>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-1 shadow-xs">
          <span className="text-[11px] font-semibold text-amber-700 uppercase">Escalated to HOD</span>
          <span className="text-3xl font-bold text-amber-800 font-mono block tabular-nums">
            {escalatedCases.length}
          </span>
          <span className="text-[11px] text-amber-700 font-medium">Requires Executive Action</span>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-1 shadow-xs">
          <span className="text-[11px] font-semibold text-red-700 uppercase">Overdue SLA Target</span>
          <span className="text-3xl font-bold text-red-700 font-mono block tabular-nums">
            {overdueCases.length}
          </span>
          <span className="text-[11px] text-red-600 font-medium">Exceeded Service Targets</span>
        </div>
      </div>

      {/* Escalated Cases Requiring Immediate HOD Attention */}
      <div className="bg-white border border-amber-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-amber-100 flex items-center justify-between bg-amber-50/50">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h2 className="font-bold text-slate-900 text-sm">
              Escalated Complaints Awaiting HOD Direct Intervention
            </h2>
          </div>
          <span className="text-xs font-bold text-amber-800 font-mono">
            {escalatedCases.length} urgent cases
          </span>
        </div>

        {escalatedCases.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2 opacity-50" />
            <p className="text-xs">No pending complaints currently escalated to HOD.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {escalatedCases.map((c) => (
              <div
                key={c.id}
                onClick={() => onSelectComplaint(c.id)}
                className="p-4 sm:p-5 hover:bg-slate-50 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded">
                      {c.reference_no}
                    </span>
                    <span className="text-xs text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded font-bold uppercase">
                      Urgent Escalation
                    </span>
                    <span className="text-xs text-slate-500 font-medium">{c.studentName}</span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{c.title}</h3>

                  {c.escalation_reason && (
                    <p className="text-xs text-amber-900 bg-amber-50/80 p-2 rounded-lg border border-amber-200">
                      <strong>Escalation Justification:</strong> {c.escalation_reason}
                    </p>
                  )}
                </div>

                <button className="px-4 py-2 bg-blue-900 text-white rounded-lg text-xs font-semibold hover:bg-blue-800 shrink-0 self-start sm:self-auto flex items-center gap-1.5">
                  Review & Authorize <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Analytical Distributions (Categories & Handler Workload) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-900" /> Complaints by Category
            </h3>
            <span className="text-xs text-slate-400 font-mono">10 Categories</span>
          </div>

          <div className="space-y-3">
            {analytics?.byCategory.map((cat) => {
              const pct = analytics.totalComplaints > 0 ? Math.round((cat.count / analytics.totalComplaints) * 100) : 0;
              return (
                <div key={cat.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{cat.name}</span>
                    <span className="text-slate-500 font-mono font-medium">
                      {cat.count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-900 rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Staff Handler Workload Table */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-900" /> Handler Workload Distribution
            </h3>
            <span className="text-xs text-slate-400 font-mono">Authorized Handlers</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-100">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="p-2.5">Officer Name</th>
                  <th className="p-2.5 text-center">Active Dockets</th>
                  <th className="p-2.5 text-center">Resolved</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {analytics?.byHandler.map((h) => (
                  <tr key={h.name} className="hover:bg-slate-50">
                    <td className="p-2.5 font-semibold text-slate-900">{h.name}</td>
                    <td className="p-2.5 text-center font-mono font-bold text-blue-900">
                      {h.activeCount}
                    </td>
                    <td className="p-2.5 text-center font-mono font-bold text-emerald-700">
                      {h.resolvedCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
