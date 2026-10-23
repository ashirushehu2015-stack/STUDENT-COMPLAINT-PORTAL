import React from 'react';
import { ReportingAnalytics, Complaint } from '../../types';
import { Printer, X, Download } from 'lucide-react';
import { api } from '../../services/api';

interface PrintReportViewProps {
  analytics: ReportingAnalytics;
  complaints: Complaint[];
  onClose: () => void;
}

export const PrintReportView: React.FC<PrintReportViewProps> = ({ analytics, complaints, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 overflow-y-auto p-4 sm:p-8 flex justify-center backdrop-blur-xs">
      <div className="bg-white w-full max-w-4xl min-h-[90vh] rounded-xl shadow-2xl p-8 sm:p-12 relative flex flex-col justify-between print:p-0 print:shadow-none print:w-full">
        {/* Floating Controls (Hidden during print) */}
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-2 text-slate-700">
            <span className="font-semibold text-sm">Official Departmental Dossier</span>
            <span className="text-xs text-slate-400">· Ready for Archival Print / PDF Export</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={api.getCsvExportUrl()}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Export Raw CSV
            </a>
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" /> Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Letterhead */}
        <div className="text-center border-b-2 border-slate-900 pb-6 mb-8">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-blue-900 text-amber-400 font-bold flex items-center justify-center border-2 border-blue-950">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
            Bayero University, Kano
          </h1>
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Faculty of Engineering · Department of Mechanical Engineering
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            P.M.B. 3011, Kano State, Nigeria · Academic Session: 2025/2026
          </p>
          <div className="mt-3 inline-block bg-slate-100 text-slate-800 px-3 py-1 text-xs font-bold rounded-sm border border-slate-300 uppercase">
            Formal Complaint Management & Resolution Summary Docket
          </div>
        </div>

        {/* Statistical Summary Grid */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded text-center">
            <span className="text-[11px] text-slate-500 uppercase font-semibold block">Total Dockets</span>
            <span className="text-xl font-bold text-slate-900 font-mono tabular-nums">{analytics.totalComplaints}</span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded text-center">
            <span className="text-[11px] text-slate-500 uppercase font-semibold block">Resolved / Closed</span>
            <span className="text-xl font-bold text-emerald-700 font-mono tabular-nums">{analytics.resolvedCount}</span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded text-center">
            <span className="text-[11px] text-slate-500 uppercase font-semibold block">Resolution Rate</span>
            <span className="text-xl font-bold text-blue-900 font-mono tabular-nums">{analytics.resolutionRate}%</span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded text-center">
            <span className="text-[11px] text-slate-500 uppercase font-semibold block">Overdue / SLA Alert</span>
            <span className="text-xl font-bold text-amber-700 font-mono tabular-nums">{analytics.overdueCount}</span>
          </div>
        </div>

        {/* Active Complaints Docket Table */}
        <div className="mb-8">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
            Summary of Current Departmental Complaints
          </h3>
          <table className="w-full text-left text-xs border border-slate-300 divide-y divide-slate-200">
            <thead className="bg-slate-100 text-slate-700 font-semibold uppercase text-[10px]">
              <tr>
                <th className="p-2 border-r border-slate-300">Reference No</th>
                <th className="p-2 border-r border-slate-300">Category</th>
                <th className="p-2 border-r border-slate-300">Student Name</th>
                <th className="p-2 border-r border-slate-300">Title / Scope</th>
                <th className="p-2 border-r border-slate-300">Status</th>
                <th className="p-2">Assigned Handler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {complaints.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="p-2 font-mono font-semibold text-slate-900 border-r border-slate-300 whitespace-nowrap">
                    {c.reference_no}
                  </td>
                  <td className="p-2 text-slate-600 border-r border-slate-300 whitespace-nowrap">
                    {c.category?.name || 'General'}
                  </td>
                  <td className="p-2 text-slate-800 border-r border-slate-300 whitespace-nowrap">
                    {c.studentName || 'Student'} ({c.studentRegNo || c.level})
                  </td>
                  <td className="p-2 text-slate-800 border-r border-slate-300">
                    <span className="font-semibold">{c.title}</span>
                    {c.course_code && <span className="text-slate-500 text-[10px] block font-mono">Course: {c.course_code}</span>}
                  </td>
                  <td className="p-2 font-medium border-r border-slate-300 whitespace-nowrap">
                    <span className="text-[11px]">{c.status}</span>
                  </td>
                  <td className="p-2 text-slate-600 whitespace-nowrap">
                    {c.handlerName || 'Unassigned'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Verification Signatures Block */}
        <div className="pt-12 mt-auto border-t border-slate-300 grid grid-cols-2 gap-12 text-xs">
          <div>
            <div className="border-b border-slate-400 pb-1 mb-2">
              <span className="font-bold text-slate-900 block">Dr. Mustapha Bello</span>
              <span className="text-slate-500 text-[11px]">Departmental Complaint & Examination Officer</span>
            </div>
            <span className="text-slate-400 text-[10px]">Signature & Date</span>
          </div>

          <div>
            <div className="border-b border-slate-400 pb-1 mb-2">
              <span className="font-bold text-slate-900 block">Prof. A. S. Garba</span>
              <span className="text-slate-500 text-[11px]">Head, Department of Mechanical Engineering</span>
            </div>
            <span className="text-slate-400 text-[10px]">Official Stamp & Date</span>
          </div>
        </div>

        <div className="mt-8 text-center text-[10px] text-slate-400 font-mono border-t border-slate-100 pt-3">
          Document generated via OSCMS (Department of Mechanical Engineering, Bayero University Kano) · Timestamp: {new Date().toUTCString()}
        </div>
      </div>
    </div>
  );
};
