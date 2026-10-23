import React, { useState } from 'react';
import { Search, ArrowRight, ShieldCheck, Clock, FileText, CheckCircle2, AlertCircle, BookOpen, UserCheck, Layers } from 'lucide-react';
import { api } from '../../services/api';
import { ComplaintCategory, DemoAccount } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface LandingViewProps {
  categories: ComplaintCategory[];
  onNavigate: (tab: string) => void;
  onTrackReference: (ref: string) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ categories, onNavigate, onTrackReference }) => {
  const { switchDemoUser } = useAuth();
  const [searchRef, setSearchRef] = useState('');
  const [searchError, setSearchError] = useState('');
  const [demoAccounts, setDemoAccounts] = useState<DemoAccount[]>([]);

  React.useEffect(() => {
    api.getDemoAccounts().then(setDemoAccounts).catch(console.error);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchRef.trim()) {
      setSearchError('Please enter a complaint reference number.');
      return;
    }
    setSearchError('');
    onTrackReference(searchRef.trim().toUpperCase());
  };

  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-950 via-slate-900 to-slate-900 text-white rounded-2xl p-8 sm:p-12 lg:p-16 border border-slate-800 shadow-xl">
        <div className="max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/80 border border-blue-700/60 text-xs text-blue-200">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>Case Study: Department of Mechanical Engineering</span>
            <span>·</span>
            <span>Bayero University Kano</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-white">
            Online Student Complaint Management System
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
            A transparent, accredited departmental platform for undergraduate students to lodge, track, and resolve academic and administrative complaints without depending on physical office visits.
          </p>

          {/* Quick Track Search Input */}
          <form onSubmit={handleSearch} className="pt-2 max-w-xl">
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Have a Complaint Reference ID? Track progress instantly:
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchRef}
                  onChange={(e) => setSearchRef(e.target.value)}
                  placeholder="e.g. MECH-2026-000001"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/90 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono uppercase"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm rounded-lg transition-colors flex items-center gap-2 shrink-0 shadow-md"
              >
                Track Status <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            {searchError && <p className="text-xs text-rose-400 mt-1.5">{searchError}</p>}
          </form>

          {/* Primary CTAs */}
          <div className="pt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('submit')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-lg shadow-sm transition-all flex items-center gap-2"
            >
              Submit New Complaint <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('login')}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm rounded-lg border border-slate-700 transition-all"
            >
              Staff & Student Login
            </button>
          </div>
        </div>

        {/* Evaluation Demo Switcher Banner */}
        <div className="mt-12 pt-8 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">
              Direct Evaluation Logins (1-Click Switch):
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {demoAccounts.map((demo) => (
              <button
                key={demo.role}
                onClick={() => switchDemoUser(demo)}
                className="p-3 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-lg text-left transition-colors group"
              >
                <span className="text-[10px] text-amber-400 font-semibold uppercase block">
                  {demo.roleTitle}
                </span>
                <span className="text-xs font-bold text-white group-hover:text-amber-300 block truncate">
                  {demo.name.split('(')[0]}
                </span>
                <span className="text-[11px] text-slate-400 font-mono block truncate">
                  {demo.email}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 4-Step Standardized Departmental Workflow */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Standard Departmental Complaint Lifecycle
          </h2>
          <p className="text-sm text-slate-600">
            Complaints follow strict departmental governance workflows with documented audit logs and official staff responses.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center font-bold text-sm">
              01
            </div>
            <h3 className="font-semibold text-slate-900 text-sm">Online Submission</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Student fills out structured form with course code, level, description, and supporting proof. An automated unique reference ID (<span className="font-mono text-slate-700">MECH-2026-XXXXXX</span>) is generated.
            </p>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center font-bold text-sm">
              02
            </div>
            <h3 className="font-semibold text-slate-900 text-sm">Docket Review & Assignment</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              The Departmental Complaint Officer screens the docket, sets priority SLA, and assigns an authorised investigation officer (e.g. Exam Officer or Level Coordinator).
            </p>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center font-bold text-sm">
              03
            </div>
            <h3 className="font-semibold text-slate-900 text-sm">Investigation & Liaison</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Authorized officer investigates records, requests student clarification if needed, records confidential internal notes, and escalates to HOD when cross-departmental action is required.
            </p>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center font-bold text-sm">
              04
            </div>
            <h3 className="font-semibold text-slate-900 text-sm">Resolution & Formal Closure</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              An official resolution summary with verified corrective action is recorded. The student inspects the outcome and has a 7-day window to request reopening before final closure.
            </p>
          </div>
        </div>
      </section>

      {/* Categories Showcase */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Permitted Complaint Categories
            </h2>
            <p className="text-sm text-slate-600">
              Departmentally approved categories with target Service Level Agreement (SLA) response times.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">10 Active Categories</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-400 transition-colors space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded">
                  {cat.code}
                </span>
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> SLA: {cat.sla_hours}h
                </span>
              </div>
              <h3 className="text-sm font-semibold text-slate-900">{cat.name}</h3>
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{cat.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Institutional Notice & Disclaimer */}
      <section className="p-6 bg-slate-100 rounded-xl border border-slate-200 space-y-2 text-xs text-slate-600 leading-relaxed">
        <div className="flex items-center gap-2 font-semibold text-slate-900">
          <ShieldCheck className="w-4 h-4 text-blue-900" />
          <span>Case Study & Academic Compliance Notice</span>
        </div>
        <p>
          This system is developed as an academic case study for the Department of Mechanical Engineering, Bayero University Kano (BUK), Kano State, Nigeria. It provides a functional, secure web application for research, institutional review, and student complaint processing. Confidential student records and internal staff investigation notes are protected through server-side authorization controls.
        </p>
      </section>
    </div>
  );
};
