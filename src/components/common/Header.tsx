import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, LogOut, Shield, User as UserIcon, CheckCircle2, ChevronDown, BookOpen } from 'lucide-react';
import { Notification, DemoAccount } from '../../types';
import { api } from '../../services/api';

interface HeaderProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  onOpenNotifications: () => void;
  unreadCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onNavigate,
  onOpenNotifications,
  unreadCount
}) => {
  const { user, profile, logout, switchDemoUser } = useAuth();
  const [demoAccounts, setDemoAccounts] = useState<DemoAccount[]>([]);
  const [showDemoDropdown, setShowDemoDropdown] = useState(false);

  useEffect(() => {
    api.getDemoAccounts().then(setDemoAccounts).catch(console.error);
  }, []);

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'student':
        return 'Student';
      case 'officer':
        return 'Complaint Officer';
      case 'hod':
        return 'Head of Dept (HOD)';
      case 'admin':
        return 'System Admin';
      case 'reviewer':
        return 'QA Reviewer';
      default:
        return 'Guest';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {/* Quick Demo Switcher Strip for Instant Evaluation */}
      <div className="bg-slate-900 text-slate-200 text-xs py-1.5 px-4 sm:px-6 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-amber-400">BUK Mech Eng Demo Mode:</span>
          <span className="text-slate-400 hidden md:inline">Instant 1-Click Role Switcher</span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          {demoAccounts.map((demo) => {
            const isCurrent = user?.role === demo.role;
            return (
              <button
                key={demo.role}
                onClick={() => switchDemoUser(demo)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all whitespace-nowrap ${
                  isCurrent
                    ? 'bg-amber-500 text-slate-950 font-semibold shadow-xs'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
                title={`Switch to ${demo.name} (${demo.roleTitle})`}
              >
                {demo.role === 'student' && '🎓 Student'}
                {demo.role === 'officer' && '📋 Complaint Officer'}
                {demo.role === 'hod' && '🏛️ HOD'}
                {demo.role === 'admin' && '⚙️ Admin'}
                {demo.role === 'reviewer' && '🔍 Reviewer'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Top Bar Contract (3 Zones) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigate(user ? 'dashboard' : 'landing')}
            className="flex items-center gap-3 text-left group"
          >
            {/* Department Emblem SVG */}
            <div className="w-10 h-10 rounded-lg bg-blue-900 flex items-center justify-center text-amber-400 font-bold border border-blue-800 shadow-xs">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </div>
            <div>
              <div className="text-base font-bold text-slate-900 leading-tight group-hover:text-blue-900 transition-colors whitespace-nowrap">
                OSCMS · Mech Eng BUK
              </div>
              <div className="text-xs text-slate-500 font-medium whitespace-nowrap">
                Online Student Complaint Management System
              </div>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links (Single-Line, 4-5 links max) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          {user ? (
            <>
              <button
                onClick={() => onNavigate('dashboard')}
                className={`hover:text-blue-900 transition-colors whitespace-nowrap shrink-0 ${
                  currentTab === 'dashboard' ? 'text-blue-900 font-semibold border-b-2 border-blue-900 pb-0.5' : ''
                }`}
              >
                Dashboard
              </button>

              {user.role === 'student' && (
                <>
                  <button
                    onClick={() => onNavigate('submit')}
                    className={`hover:text-blue-900 transition-colors whitespace-nowrap shrink-0 ${
                      currentTab === 'submit' ? 'text-blue-900 font-semibold border-b-2 border-blue-900 pb-0.5' : ''
                    }`}
                  >
                    Submit Complaint
                  </button>
                  <button
                    onClick={() => onNavigate('my-complaints')}
                    className={`hover:text-blue-900 transition-colors whitespace-nowrap shrink-0 ${
                      currentTab === 'my-complaints' ? 'text-blue-900 font-semibold border-b-2 border-blue-900 pb-0.5' : ''
                    }`}
                  >
                    My Complaints
                  </button>
                </>
              )}

              {(user.role === 'officer' || user.role === 'hod' || user.role === 'reviewer') && (
                <>
                  <button
                    onClick={() => onNavigate('queue')}
                    className={`hover:text-blue-900 transition-colors whitespace-nowrap shrink-0 ${
                      currentTab === 'queue' ? 'text-blue-900 font-semibold border-b-2 border-blue-900 pb-0.5' : ''
                    }`}
                  >
                    Complaint Queue
                  </button>
                  <button
                    onClick={() => onNavigate('reports')}
                    className={`hover:text-blue-900 transition-colors whitespace-nowrap shrink-0 ${
                      currentTab === 'reports' ? 'text-blue-900 font-semibold border-b-2 border-blue-900 pb-0.5' : ''
                    }`}
                  >
                    Department Reports
                  </button>
                </>
              )}

              {user.role === 'admin' && (
                <>
                  <button
                    onClick={() => onNavigate('admin-users')}
                    className={`hover:text-blue-900 transition-colors whitespace-nowrap shrink-0 ${
                      currentTab === 'admin-users' ? 'text-blue-900 font-semibold border-b-2 border-blue-900 pb-0.5' : ''
                    }`}
                  >
                    User Management
                  </button>
                  <button
                    onClick={() => onNavigate('admin-categories')}
                    className={`hover:text-blue-900 transition-colors whitespace-nowrap shrink-0 ${
                      currentTab === 'admin-categories' ? 'text-blue-900 font-semibold border-b-2 border-blue-900 pb-0.5' : ''
                    }`}
                  >
                    Categories & SLA
                  </button>
                  <button
                    onClick={() => onNavigate('admin-audit')}
                    className={`hover:text-blue-900 transition-colors whitespace-nowrap shrink-0 ${
                      currentTab === 'admin-audit' ? 'text-blue-900 font-semibold border-b-2 border-blue-900 pb-0.5' : ''
                    }`}
                  >
                    Audit Trail
                  </button>
                </>
              )}

              <button
                onClick={() => onNavigate('guidelines')}
                className={`hover:text-blue-900 transition-colors whitespace-nowrap shrink-0 ${
                  currentTab === 'guidelines' ? 'text-blue-900 font-semibold border-b-2 border-blue-900 pb-0.5' : ''
                }`}
              >
                Workflow Policy
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onNavigate('landing')}
                className={`hover:text-blue-900 transition-colors whitespace-nowrap shrink-0 ${
                  currentTab === 'landing' ? 'text-blue-900 font-semibold' : ''
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => onNavigate('track')}
                className={`hover:text-blue-900 transition-colors whitespace-nowrap shrink-0 ${
                  currentTab === 'track' ? 'text-blue-900 font-semibold' : ''
                }`}
              >
                Track by Reference
              </button>
              <button
                onClick={() => onNavigate('guidelines')}
                className={`hover:text-blue-900 transition-colors whitespace-nowrap shrink-0 ${
                  currentTab === 'guidelines' ? 'text-blue-900 font-semibold' : ''
                }`}
              >
                Complaint Guidelines
              </button>
            </>
          )}
        </nav>

        {/* Zone 3: Primary Action / User Profile */}
        <div className="flex items-center gap-3 shrink-0">
          {user ? (
            <div className="flex items-center gap-3">
              {/* Notifications Bell */}
              <button
                onClick={onOpenNotifications}
                className="relative p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
                title="Notifications"
                aria-label="View notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center font-mono">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* User Identity Pill & Role */}
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-900 leading-tight">
                  {user.full_name}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {getRoleBadge(user.role)} {profile ? `· ${profile.registration_number}` : ''}
                </span>
              </div>

              {/* Logout Button */}
              <button
                onClick={logout}
                className="p-2 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                title="Log out"
                aria-label="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('login')}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-blue-900 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Sign In
              </button>
              <button
                onClick={() => onNavigate('register')}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors shadow-xs whitespace-nowrap shrink-0"
              >
                Student Register
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
