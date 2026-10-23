import React from 'react';
import { Shield, Clock, FileCheck, AlertCircle, BookOpen, Layers } from 'lucide-react';

export const GuidelinesView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-900 uppercase tracking-wider">
          <span>Department of Mechanical Engineering · BUK</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
          Departmental Complaint Regulations & Guidelines
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Operational framework for academic and administrative grievance handling at Bayero University Kano.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-2.5">
          <Clock className="w-5 h-5 text-blue-900" />
          <h3 className="font-bold text-slate-900 text-sm">Response Standards (SLA)</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Urgent cases (e.g. examination timetable clashes) receive departmental intervention within <strong>24 hours</strong>. Result omission complaints are audited within <strong>48 hours</strong>.
          </p>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-2.5">
          <Shield className="w-5 h-5 text-amber-700" />
          <h3 className="font-bold text-slate-900 text-sm">Escalation Protocol</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            If an investigation involves multiple engineering departments or requires Faculty Board waiver, the docket is formally escalated to the Head of Department.
          </p>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-2.5">
          <FileCheck className="w-5 h-5 text-emerald-700" />
          <h3 className="font-bold text-slate-900 text-sm">Resolution & Reopening</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Students have a <strong>7-day calendar window</strong> following resolution to verify results and request reopening if tangible discrepancies remain unresolved.
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6 text-xs text-slate-700 leading-relaxed">
        <div className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">1. Legitimate Grounds for Complaint</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Omission or typographical errors in continuous assessment scores and exam marks.</li>
            <li>Direct timetable clashes involving approved core or departmental elective modules.</li>
            <li>Prerequisite errors and maximum unit cap discrepancies on the DICT registration portal.</li>
            <li>Experimental machine breakdown, laboratory hazard, or lack of workshop tooling.</li>
            <li>Extended supervisor unavailability for final-year engineering projects (MEC5305).</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">2. Matters Inadmissible Under this Platform</h2>
          <p>
            The system cannot entertain frivolous claims, unverified hearsay, anonymous harassment allegations, or requests to circumvent University Senate academic standing regulations. All submissions are tied to verified student matriculation records.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">3. Privacy and Data Protection Notice</h2>
          <p>
            In compliance with the <strong>Nigeria Data Protection Act (NDPA 2023)</strong> and Bayero University data governance policies, all complainant records are securely encrypted. Internal investigation notes between academic staff are confidential and will not be disclosed to third parties without lawful departmental authority.
          </p>
        </div>
      </div>
    </div>
  );
};
