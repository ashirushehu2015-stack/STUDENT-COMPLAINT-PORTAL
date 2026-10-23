import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { api } from './services/api';
import { Header } from './components/common/Header';
import { NotificationDrawer } from './components/common/NotificationDrawer';
import { PrintReportView } from './components/common/PrintReportView';
import { LandingView } from './components/landing/LandingView';
import { LoginView } from './components/auth/LoginView';
import { RegisterView } from './components/auth/RegisterView';
import { StudentDashboard } from './components/student/StudentDashboard';
import { SubmitComplaintForm } from './components/student/SubmitComplaintForm';
import { ComplaintDetailView } from './components/student/ComplaintDetailView';
import { StaffDashboard } from './components/staff/StaffDashboard';
import { ComplaintInvestigationWorkspace } from './components/staff/ComplaintInvestigationWorkspace';
import { HodDashboard } from './components/hod/HodDashboard';
import { AdminPortal } from './components/admin/AdminPortal';
import { GuidelinesView } from './components/common/GuidelinesView';
import { Complaint, ComplaintCategory, Notification, ReportingAnalytics } from './types';

function MainApp() {
  const { user, isLoading } = useAuth();

  const [currentTab, setCurrentTab] = useState<string>('landing');
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);

  const [categories, setCategories] = useState<ComplaintCategory[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [analytics, setAnalytics] = useState<ReportingAnalytics | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Load Categories & Notifications
  const refreshCoreData = async () => {
    try {
      const cats = await api.getCategories();
      setCategories(cats);

      if (user) {
        const notifs = await api.getNotifications();
        setNotifications(notifs);

        if (user.role === 'student') {
          const myComplaints = await api.getMyComplaints();
          setComplaints(myComplaints);
        } else {
          const [deptComplaints, stats] = await Promise.all([
            api.getStaffQueue(),
            api.getAnalytics()
          ]);
          setComplaints(deptComplaints);
          setAnalytics(stats);
        }
      }
    } catch (err) {
      console.error('Error refreshing core data:', err);
    }
  };

  useEffect(() => {
    refreshCoreData();
  }, [user]);

  // Sync tab with authentication state
  useEffect(() => {
    if (!isLoading) {
      if (user && currentTab === 'landing') {
        setCurrentTab('dashboard');
      } else if (!user && currentTab === 'dashboard') {
        setCurrentTab('landing');
      }
    }
  }, [user, isLoading]);

  const handleNavigate = (tab: string) => {
    setSelectedComplaintId(null);
    setCurrentTab(tab);
  };

  const handleSelectComplaint = (complaintId: string) => {
    setSelectedComplaintId(complaintId);
    if (user?.role === 'student') {
      setCurrentTab('complaint-detail');
    } else {
      setCurrentTab('workspace');
    }
  };

  const handleTrackByReference = async (refNo: string) => {
    try {
      if (!user) {
        // Quick guest lookup redirection: log in or show direct prompt
        setCurrentTab('login');
        return;
      }
      const complaint = await api.getComplaintDetail(refNo);
      if (complaint) {
        handleSelectComplaint(complaint.complaint.id);
      }
    } catch (err: any) {
      alert(`Complaint reference ${refNo} not found or you are not logged in as the owner.`);
    }
  };

  const unreadNotifsCount = notifications.filter((n) => !n.is_read).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Initializing OSCMS Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans antialiased">
      <Header
        currentTab={currentTab}
        onNavigate={handleNavigate}
        onOpenNotifications={() => setIsNotifDrawerOpen(true)}
        unreadCount={unreadNotifsCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Unauthenticated Landing */}
        {currentTab === 'landing' && (
          <LandingView
            categories={categories}
            onNavigate={handleNavigate}
            onTrackReference={handleTrackByReference}
          />
        )}

        {/* Authentication Views */}
        {currentTab === 'login' && (
          <LoginView
            onNavigate={handleNavigate}
            onSuccess={() => {
              setCurrentTab('dashboard');
              refreshCoreData();
            }}
          />
        )}

        {currentTab === 'register' && (
          <RegisterView
            onNavigate={handleNavigate}
          />
        )}

        {/* Guidelines View */}
        {currentTab === 'guidelines' && <GuidelinesView />}

        {/* Track by Reference Prompt if clicked while logged out */}
        {currentTab === 'track' && (
          <LandingView
            categories={categories}
            onNavigate={handleNavigate}
            onTrackReference={handleTrackByReference}
          />
        )}

        {/* Student Views */}
        {user?.role === 'student' && (
          <>
            {(currentTab === 'dashboard' || currentTab === 'my-complaints') && (
              <StudentDashboard
                complaints={complaints}
                categories={categories}
                onSelectComplaint={handleSelectComplaint}
                onSubmitNew={() => setCurrentTab('submit')}
              />
            )}

            {currentTab === 'submit' && (
              <SubmitComplaintForm
                categories={categories}
                onComplaintSubmitted={(cmp) => {
                  refreshCoreData();
                  handleSelectComplaint(cmp.id);
                }}
                onCancel={() => setCurrentTab('dashboard')}
              />
            )}

            {currentTab === 'complaint-detail' && selectedComplaintId && (
              <ComplaintDetailView
                complaintId={selectedComplaintId}
                onBack={() => setCurrentTab('dashboard')}
                onRefreshList={refreshCoreData}
              />
            )}
          </>
        )}

        {/* Staff / Complaint Officer Views */}
        {user && (user.role === 'officer' || user.role === 'reviewer') && (
          <>
            {(currentTab === 'dashboard' || currentTab === 'queue') && (
              <StaffDashboard
                complaints={complaints}
                categories={categories}
                analytics={analytics}
                onSelectComplaint={handleSelectComplaint}
                onOpenPrintReport={() => setIsPrintModalOpen(true)}
                onRefreshData={refreshCoreData}
              />
            )}

            {currentTab === 'workspace' && selectedComplaintId && (
              <ComplaintInvestigationWorkspace
                complaintId={selectedComplaintId}
                onBack={() => setCurrentTab('dashboard')}
                onRefreshList={refreshCoreData}
              />
            )}

            {currentTab === 'reports' && (
              <StaffDashboard
                complaints={complaints}
                categories={categories}
                analytics={analytics}
                onSelectComplaint={handleSelectComplaint}
                onOpenPrintReport={() => setIsPrintModalOpen(true)}
                onRefreshData={refreshCoreData}
              />
            )}
          </>
        )}

        {/* Head of Department (HOD) Views */}
        {user?.role === 'hod' && (
          <>
            {currentTab === 'dashboard' && (
              <HodDashboard
                complaints={complaints}
                categories={categories}
                analytics={analytics}
                onSelectComplaint={handleSelectComplaint}
                onOpenPrintReport={() => setIsPrintModalOpen(true)}
              />
            )}

            {(currentTab === 'queue' || currentTab === 'reports') && (
              <StaffDashboard
                complaints={complaints}
                categories={categories}
                analytics={analytics}
                onSelectComplaint={handleSelectComplaint}
                onOpenPrintReport={() => setIsPrintModalOpen(true)}
                onRefreshData={refreshCoreData}
              />
            )}

            {currentTab === 'workspace' && selectedComplaintId && (
              <ComplaintInvestigationWorkspace
                complaintId={selectedComplaintId}
                onBack={() => setCurrentTab('dashboard')}
                onRefreshList={refreshCoreData}
              />
            )}
          </>
        )}

        {/* Administrator Views */}
        {user?.role === 'admin' && (
          <>
            {(currentTab === 'dashboard' ||
              currentTab === 'admin-users' ||
              currentTab === 'admin-categories' ||
              currentTab === 'admin-audit') && <AdminPortal />}
          </>
        )}
      </main>

      {/* Notifications Drawer */}
      <NotificationDrawer
        isOpen={isNotifDrawerOpen}
        onClose={() => setIsNotifDrawerOpen(false)}
        notifications={notifications}
        onMarkRead={async (id) => {
          await api.markNotificationRead(id);
          setNotifications(notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
        }}
        onMarkAllRead={async () => {
          await api.markAllNotificationsRead();
          setNotifications(notifications.map((n) => ({ ...n, is_read: true })));
        }}
        onSelectComplaint={handleSelectComplaint}
      />

      {/* Formal Printable Department Report Modal */}
      {isPrintModalOpen && analytics && (
        <PrintReportView
          analytics={analytics}
          complaints={complaints}
          onClose={() => setIsPrintModalOpen(false)}
        />
      )}

      {/* Departmental Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            <span className="font-semibold text-slate-800">
              Department of Mechanical Engineering, Bayero University Kano
            </span>
            <span className="block text-[11px] text-slate-400">
              Online Student Complaint Management System (OSCMS) · Case Study Research & Implementation
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <button onClick={() => setCurrentTab('guidelines')} className="hover:text-blue-900 transition-colors">
              Department Guidelines
            </button>
            <span>·</span>
            <button
              onClick={() => {
                if (analytics) setIsPrintModalOpen(true);
                else api.getAnalytics().then((a) => { setAnalytics(a); setIsPrintModalOpen(true); });
              }}
              className="hover:text-blue-900 transition-colors"
            >
              Printable Report
            </button>
            <span>·</span>
            <span className="font-mono text-slate-400">P.M.B. 3011 Kano</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
