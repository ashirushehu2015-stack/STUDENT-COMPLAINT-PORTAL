import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Complaint,
  ComplaintCategory,
  ComplaintStatusHistory,
  ComplaintMessage,
  ComplaintAttachment,
  ComplaintInternalNote,
  StudentProfile,
  ComplaintStatus
} from '../../types';
import {
  ArrowLeft,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Send,
  Upload,
  FileText,
  Clock,
  ShieldAlert,
  ChevronRight,
  User as UserIcon
} from 'lucide-react';

interface ComplaintInvestigationWorkspaceProps {
  complaintId: string;
  onBack: () => void;
  onRefreshList?: () => void;
}

export const ComplaintInvestigationWorkspace: React.FC<ComplaintInvestigationWorkspaceProps> = ({
  complaintId,
  onBack,
  onRefreshList
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [category, setCategory] = useState<ComplaintCategory | null>(null);
  const [studentInfo, setStudentInfo] = useState<{ id: string; full_name: string; email: string; phone: string; profile?: StudentProfile } | null>(null);
  const [handlerInfo, setHandlerInfo] = useState<{ id: string; full_name: string; role: string; email: string } | null>(null);
  const [timeline, setTimeline] = useState<ComplaintStatusHistory[]>([]);
  const [messages, setMessages] = useState<ComplaintMessage[]>([]);
  const [attachments, setAttachments] = useState<ComplaintAttachment[]>([]);
  const [internalNotes, setInternalNotes] = useState<ComplaintInternalNote[]>([]);
  const [handlersList, setHandlersList] = useState<{ id: string; name: string; email: string; role: string }[]>([]);

  // Active view tab in workspace: 'thread' | 'internal_notes' | 'evidence' | 'timeline'
  const [activeTab, setActiveTab] = useState<'thread' | 'internal_notes' | 'evidence' | 'timeline'>('thread');

  // Modals state
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState<ComplaintStatus>('Under Investigation');
  const [statusComment, setStatusComment] = useState('');
  const [isVisibleToStudent, setIsVisibleToStudent] = useState(true);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignHandlerId, setAssignHandlerId] = useState('');
  const [assignReason, setAssignReason] = useState('');

  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [escalateReason, setEscalateReason] = useState('');

  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [resolutionAction, setResolutionAction] = useState('');
  const [asProposedOnly, setAsProposedOnly] = useState(false);

  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeComment, setCloseComment] = useState('');

  // Post official message state
  const [staffMsg, setStaffMsg] = useState('');
  const [isOfficialResponse, setIsOfficialResponse] = useState(true);
  const [sendingMsg, setSendingMsg] = useState(false);

  // New internal note state
  const [noteText, setNoteText] = useState('');
  const [actionRequired, setActionRequired] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const isReviewer = user?.role === 'reviewer';

  const loadData = async () => {
    try {
      setLoading(true);
      const [res, handlers] = await Promise.all([
        api.getComplaintDetail(complaintId),
        api.getStaffHandlers()
      ]);
      setComplaint(res.complaint);
      setCategory(res.category || null);
      setStudentInfo(res.student || null);
      setHandlerInfo(res.handler || null);
      setTimeline(res.timeline);
      setMessages(res.messages);
      setAttachments(res.attachments);
      setInternalNotes(res.internalNotes);
      setHandlersList(handlers);
      if (handlers.length > 0) setAssignHandlerId(handlers[0].id);
    } catch (err) {
      console.error('Failed to load workspace data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [complaintId]);

  // Permitted Next Statuses
  const getPermittedNextStatuses = (): ComplaintStatus[] => {
    if (!complaint) return [];
    switch (complaint.status) {
      case 'Submitted':
        return ['Under Initial Review', 'Rejected'];
      case 'Under Initial Review':
        return ['Assigned for Investigation', 'Awaiting Student Information', 'Rejected', 'Escalated'];
      case 'Awaiting Student Information':
        return ['Under Initial Review', 'Under Investigation'];
      case 'Assigned for Investigation':
        return ['Under Investigation', 'Escalated'];
      case 'Under Investigation':
        return ['Awaiting Student Information', 'Escalated', 'Resolution Proposed'];
      case 'Escalated':
        return ['Assigned for Investigation', 'Under Investigation', 'Resolution Proposed', 'Rejected'];
      case 'Resolution Proposed':
        return ['Resolved', 'Under Investigation', 'Rejected'];
      case 'Resolved':
        return ['Closed', 'Reopened'];
      case 'Closed':
        return ['Reopened'];
      case 'Reopened':
        return ['Under Initial Review'];
      default:
        return [];
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint) return;
    try {
      await api.updateComplaintStatus(complaint.id, newStatus, statusComment, isVisibleToStudent);
      setShowStatusModal(false);
      setStatusComment('');
      loadData();
      if (onRefreshList) onRefreshList();
    } catch (err: any) {
      alert(err.message || 'Status update failed.');
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint || !assignHandlerId) return;
    try {
      await api.assignComplaint(complaint.id, assignHandlerId, assignReason);
      setShowAssignModal(false);
      setAssignReason('');
      loadData();
      if (onRefreshList) onRefreshList();
    } catch (err: any) {
      alert(err.message || 'Assignment failed.');
    }
  };

  const handleEscalate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint || !escalateReason.trim()) return;
    try {
      await api.escalateComplaint(complaint.id, escalateReason.trim());
      setShowEscalateModal(false);
      setEscalateReason('');
      loadData();
      if (onRefreshList) onRefreshList();
    } catch (err: any) {
      alert(err.message || 'Escalation failed.');
    }
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint || !resolutionSummary.trim()) return;
    try {
      await api.resolveComplaint(complaint.id, resolutionSummary.trim(), resolutionAction.trim(), asProposedOnly);
      setShowResolveModal(false);
      setResolutionSummary('');
      setResolutionAction('');
      loadData();
      if (onRefreshList) onRefreshList();
    } catch (err: any) {
      alert(err.message || 'Resolution submission failed.');
    }
  };

  const handleClose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint) return;
    try {
      await api.closeComplaint(complaint.id, closeComment);
      setShowCloseModal(false);
      loadData();
      if (onRefreshList) onRefreshList();
    } catch (err: any) {
      alert(err.message || 'Failed to close complaint.');
    }
  };

  const handleSendStaffMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint || !staffMsg.trim()) return;
    setSendingMsg(true);
    try {
      const msg = await api.sendMessage(complaint.id, staffMsg.trim(), isOfficialResponse, false);
      setMessages([...messages, msg]);
      setStaffMsg('');
    } catch (err: any) {
      alert(err.message || 'Failed to post response.');
    } finally {
      setSendingMsg(false);
    }
  };

  const handleAddInternalNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint || !noteText.trim()) return;
    setSavingNote(true);
    try {
      const newNote = await api.addInternalNote(complaint.id, noteText.trim(), actionRequired.trim());
      setInternalNotes([...internalNotes, newNote]);
      setNoteText('');
      setActionRequired('');
    } catch (err: any) {
      alert(err.message || 'Failed to record internal note.');
    } finally {
      setSavingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-3 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500 font-medium">Opening investigation workspace...</p>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="py-20 text-center space-y-3">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
        <h2 className="text-base font-bold text-slate-900">Complaint Not Found</h2>
        <button onClick={onBack} className="px-4 py-2 bg-blue-900 text-white rounded-lg text-xs font-semibold">
          Return to Queue
        </button>
      </div>
    );
  }

  const permittedStatuses = getPermittedNextStatuses();

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-6">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Complaints Queue
        </button>
        <span className="text-xs text-slate-500 font-mono">
          Departmental Officer Docket Workspace
        </span>
      </div>

      {/* Main Docket Summary Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-bold text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded">
                {complaint.reference_no}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {category?.name}
              </span>
              {complaint.course_code && (
                <span className="text-xs font-mono font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                  {complaint.course_code}
                </span>
              )}
            </div>

            <h1 className="text-xl font-bold text-slate-900 leading-snug">
              {complaint.title}
            </h1>

            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>Submitted: {new Date(complaint.created_at).toLocaleDateString()}</span>
              <span>·</span>
              <span>Level: {complaint.level}</span>
              <span>·</span>
              <span>Semester: {complaint.semester}</span>
              <span>·</span>
              <span>Session: {complaint.academic_session}</span>
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end gap-1.5 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-3 py-1 rounded-full border bg-slate-900 text-white">
                {complaint.status}
              </span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full border border-amber-300 bg-amber-50 text-amber-800">
                {complaint.priority}
              </span>
            </div>
            {complaint.isOverdue && (
              <span className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                OVERDUE SLA WARNING
              </span>
            )}
            <span className="text-[11px] text-slate-500">
              Handler: <strong className="text-slate-800">{handlerInfo ? handlerInfo.full_name : 'Unassigned'}</strong>
            </span>
          </div>
        </div>

        {/* Student Dossier Strip */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Complainant</span>
            <span className="font-bold text-slate-900 block">{studentInfo ? studentInfo.full_name : 'Student'}</span>
            <span className="text-[11px] text-slate-500 block">{studentInfo?.email}</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Registration No</span>
            <span className="font-bold font-mono text-blue-900 block">
              {studentInfo?.profile ? studentInfo.profile.registration_number : 'N/A'}
            </span>
            <span className="text-[11px] text-slate-500 block">Entry: {studentInfo?.profile?.entry_year || '2020'}</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Phone Contact</span>
            <span className="font-mono text-slate-800 block">{studentInfo?.phone || 'N/A'}</span>
            <span className="text-[11px] text-slate-500 block">Undergraduate</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Target Resolution Due</span>
            <span className="font-mono font-semibold text-slate-900 block">
              {complaint.sla_due_at ? new Date(complaint.sla_due_at).toLocaleDateString() : 'N/A'}
            </span>
            <span className="text-[11px] text-slate-500 block">Category SLA: {category?.sla_hours || 72}h</span>
          </div>
        </div>

        {/* Statement of Complaint */}
        <div className="space-y-1.5">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
            Student Complaint Statement:
          </span>
          <p className="text-xs sm:text-sm text-slate-800 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200 whitespace-pre-wrap">
            {complaint.description}
          </p>
        </div>

        {complaint.requested_outcome && (
          <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-xs space-y-0.5">
            <span className="font-bold text-blue-900 uppercase text-[10px] block">Requested Outcome:</span>
            <p className="text-slate-800">{complaint.requested_outcome}</p>
          </div>
        )}

        {/* Workflow Actions Button Bar (Disabled for read-only reviewer) */}
        {!isReviewer && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                if (permittedStatuses.length > 0) setNewStatus(permittedStatuses[0]);
                setShowStatusModal(true);
              }}
              className="px-3.5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              Update Workflow Status...
            </button>

            <button
              onClick={() => setShowAssignModal(true)}
              className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
            >
              Assign / Reassign Handler...
            </button>

            <button
              onClick={() => setShowEscalateModal(true)}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              Escalate to HOD...
            </button>

            <button
              onClick={() => setShowResolveModal(true)}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              Propose / Resolve Case...
            </button>

            {complaint.status === 'Resolved' && (
              <button
                onClick={() => setShowCloseModal(true)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Formally Close Complaint
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tabs Navigation: Thread vs Confidential Internal Notes vs Evidence vs Timeline */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('thread')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'thread'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Student Correspondence ({messages.length})
        </button>

        <button
          onClick={() => setActiveTab('internal_notes')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'internal_notes'
              ? 'border-amber-600 text-amber-800 bg-amber-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Lock className="w-3.5 h-3.5 text-amber-600" />
          Confidential Internal Notes ({internalNotes.length})
        </button>

        <button
          onClick={() => setActiveTab('evidence')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'evidence'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Attached Evidence ({attachments.length})
        </button>

        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'timeline'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Audit History ({timeline.length})
        </button>
      </div>

      {/* Tab 1: Student Correspondence Thread */}
      {activeTab === 'thread' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center italic">
                No official messages sent to student yet.
              </p>
            ) : (
              messages.map((m) => {
                const isOfficer = m.sender_role === 'officer' || m.sender_role === 'hod';
                return (
                  <div
                    key={m.id}
                    className={`p-4 rounded-xl space-y-1.5 ${
                      isOfficer
                        ? 'bg-blue-50/70 border border-blue-200/80 ml-0 sm:ml-4'
                        : 'bg-slate-50 border border-slate-200 mr-0 sm:mr-4'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                        {m.sender_name}
                        {m.is_official_response && (
                          <span className="text-[10px] font-semibold text-blue-900 bg-blue-100 px-1.5 py-0.5 rounded">
                            Official Staff Response
                          </span>
                        )}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(m.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                      {m.message}
                    </p>
                  </div>
                );
              })
            )}
          </div>

          {!isReviewer && (
            <form onSubmit={handleSendStaffMessage} className="pt-4 border-t border-slate-100 space-y-3">
              <label className="block text-xs font-bold text-slate-900">
                Send Response to Student Complainant:
              </label>
              <textarea
                rows={3}
                value={staffMsg}
                onChange={(e) => setStaffMsg(e.target.value)}
                placeholder="Compose departmental official response or request for evidence..."
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isOfficialResponse}
                    onChange={(e) => setIsOfficialResponse(e.target.checked)}
                    className="rounded text-blue-900 focus:ring-blue-900"
                  />
                  <span>Mark as Official Departmental Response</span>
                </label>
                <button
                  type="submit"
                  disabled={sendingMsg || !staffMsg.trim()}
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" /> Send to Student
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Tab 2: Confidential Internal Staff Investigation Notes */}
      {activeTab === 'internal_notes' && (
        <div className="bg-amber-50/30 border border-amber-200/80 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="p-3 bg-amber-100/70 border border-amber-300 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
            <Lock className="w-4 h-4 mt-0.5 shrink-0 text-amber-700" />
            <div>
              <span className="font-bold block">CONFIDENTIAL STAFF INVESTIGATION NOTES</span>
              <span>
                These notes are strictly restricted to authorized departmental officers and the HOD. Students cannot view or access this content under any circumstances.
              </span>
            </div>
          </div>

          {/* Existing Internal Notes */}
          <div className="space-y-3">
            {internalNotes.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center italic">
                No internal notes recorded yet.
              </p>
            ) : (
              internalNotes.map((n) => (
                <div key={n.id} className="p-4 bg-white border border-amber-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                      {n.author_name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(n.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {n.note}
                  </p>
                  {n.action_required && (
                    <div className="p-2 bg-amber-50 rounded text-xs text-amber-900 font-medium">
                      <strong>Action Required:</strong> {n.action_required}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Add New Internal Note */}
          {!isReviewer && (
            <form onSubmit={handleAddInternalNote} className="pt-4 border-t border-amber-200 space-y-3">
              <label className="block text-xs font-bold text-slate-900">
                Record New Investigation Finding / Internal Note:
              </label>
              <textarea
                required
                rows={3}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="e.g. Cross-checked with course lecturer Engr. Bello; exam script mark verified as 24/30..."
                className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
              <input
                type="text"
                value={actionRequired}
                onChange={(e) => setActionRequired(e.target.value)}
                placeholder="Next internal action required (optional, e.g. Present at Faculty Board)"
                className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingNote || !noteText.trim()}
                  className="px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Lock className="w-3.5 h-3.5" /> Save Internal Note
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Tab 3: Attached Evidence Documents */}
      {activeTab === 'evidence' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Attached Supporting Documents</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {attachments.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 col-span-2 text-center italic">
                No documents or test slips uploaded for this complaint.
              </p>
            ) : (
              attachments.map((a) => (
                <div key={a.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="w-5 h-5 text-blue-900 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-900 truncate block font-mono">{a.file_name}</span>
                      <span className="text-[10px] text-slate-500">
                        Uploaded by {a.uploader_name} · {(a.file_size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>
                  {a.file_data_url && (
                    <a
                      href={a.file_data_url}
                      download={a.file_name}
                      className="text-xs font-semibold text-blue-900 hover:underline shrink-0"
                    >
                      Download
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Audit History */}
      {activeTab === 'timeline' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Tamper-Evident Status History</h3>
          <div className="relative border-l-2 border-slate-200 ml-3 space-y-5 py-2">
            {timeline.map((item) => (
              <div key={item.id} className="relative pl-6">
                <div className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-blue-900 border-2 border-white ring-2 ring-slate-100" />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{item.new_status}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(item.created_at).toLocaleString()}
                    </span>
                  </div>
                  {item.comment && (
                    <p className="text-xs text-slate-600 leading-relaxed">{item.comment}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- WORKFLOW MODALS --- */}

      {/* 1. Update Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900">Update Workflow Status</h3>
            <p className="text-xs text-slate-600">
              Current Status: <strong className="text-blue-900">{complaint.status}</strong>
            </p>

            <form onSubmit={handleUpdateStatus} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Permitted Next Status:
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as ComplaintStatus)}
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900"
                >
                  {permittedStatuses.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason / Status Change Note:
                </label>
                <textarea
                  rows={2}
                  value={statusComment}
                  onChange={(e) => setStatusComment(e.target.value)}
                  placeholder="Record justification for status transition..."
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="vis"
                  checked={isVisibleToStudent}
                  onChange={(e) => setIsVisibleToStudent(e.target.checked)}
                  className="rounded text-blue-900"
                />
                <label htmlFor="vis" className="text-xs text-slate-700 cursor-pointer">
                  Visible to student on tracking portal
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-900 text-white rounded-lg text-xs font-semibold hover:bg-blue-800"
                >
                  Apply Status Change
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Assign / Reassign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900">Assign Complaint Handler</h3>
            <form onSubmit={handleAssign} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Departmental Handler:
                </label>
                <select
                  value={assignHandlerId}
                  onChange={(e) => setAssignHandlerId(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900"
                >
                  {handlersList.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.role.toUpperCase()}) - {h.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assignment Directive / Reason:
                </label>
                <textarea
                  rows={2}
                  value={assignReason}
                  onChange={(e) => setAssignReason(e.target.value)}
                  placeholder="e.g. Assigned to Exam Officer for script audit..."
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-900 text-white rounded-lg text-xs font-semibold hover:bg-blue-800"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Escalate to HOD Modal */}
      {showEscalateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600" /> Escalate to Head of Department (HOD)
            </h3>
            <p className="text-xs text-slate-600">
              Escalation elevates complaint priority to <strong className="text-red-700">Urgent</strong> and places it in the HOD executive review docket.
            </p>

            <form onSubmit={handleEscalate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Formal Justification for Escalation:
                </label>
                <textarea
                  required
                  rows={3}
                  value={escalateReason}
                  onChange={(e) => setEscalateReason(e.target.value)}
                  placeholder="e.g. Cross-departmental timetable clash requires Faculty Examination Board authorization..."
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEscalateModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!escalateReason.trim()}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                >
                  Confirm Escalation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Propose or Complete Resolution Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Record Departmental Resolution
            </h3>

            <form onSubmit={handleResolve} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Resolution Summary (Student-Visible):
                </label>
                <textarea
                  required
                  rows={3}
                  value={resolutionSummary}
                  onChange={(e) => setResolutionSummary(e.target.value)}
                  placeholder="Clear description of outcome (e.g. Score rectified to 24/30 and submitted to exams officer)..."
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Corrective Action Taken (Internal Audit Record):
                </label>
                <textarea
                  rows={2}
                  value={resolutionAction}
                  onChange={(e) => setResolutionAction(e.target.value)}
                  placeholder="e.g. Cross-checked physical attendance register with lecturer and updated master spreadsheet..."
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="propOnly"
                  checked={asProposedOnly}
                  onChange={(e) => setAsProposedOnly(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                <label htmlFor="propOnly" className="text-xs text-slate-700 cursor-pointer">
                  Submit as "Resolution Proposed" (requires HOD sign-off before closing)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResolveModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!resolutionSummary.trim()}
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                >
                  {asProposedOnly ? 'Propose Resolution' : 'Finalize Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Close Complaint Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900">Formally Close Complaint</h3>
            <p className="text-xs text-slate-600">
              Confirm final departmental closure for <strong className="text-slate-800">{complaint.reference_no}</strong>.
            </p>
            <form onSubmit={handleClose} className="space-y-3">
              <textarea
                rows={2}
                value={closeComment}
                onChange={(e) => setCloseComment(e.target.value)}
                placeholder="Final closure remark..."
                className="w-full p-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCloseModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800"
                >
                  Formally Close Docket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
