import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Complaint,
  ComplaintCategory,
  ComplaintStatusHistory,
  ComplaintMessage,
  ComplaintAttachment,
  StudentProfile
} from '../../types';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
  Upload,
  FileText,
  RotateCcw,
  ShieldAlert,
  User as UserIcon
} from 'lucide-react';

interface ComplaintDetailViewProps {
  complaintId: string;
  onBack: () => void;
  onRefreshList?: () => void;
}

export const ComplaintDetailView: React.FC<ComplaintDetailViewProps> = ({
  complaintId,
  onBack,
  onRefreshList
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [category, setCategory] = useState<ComplaintCategory | null>(null);
  const [studentInfo, setStudentInfo] = useState<{ id: string; full_name: string; email: string; profile?: StudentProfile } | null>(null);
  const [timeline, setTimeline] = useState<ComplaintStatusHistory[]>([]);
  const [messages, setMessages] = useState<ComplaintMessage[]>([]);
  const [attachments, setAttachments] = useState<ComplaintAttachment[]>([]);

  // Follow-up message state
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Reopen modal state
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [reopening, setReopening] = useState(false);
  const [reopenError, setReopenError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getComplaintDetail(complaintId);
      setComplaint(res.complaint);
      setCategory(res.category || null);
      setStudentInfo(res.student || null);
      setTimeline(res.timeline);
      setMessages(res.messages);
      setAttachments(res.attachments);
    } catch (err) {
      console.error('Failed to load complaint detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [complaintId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !complaint) return;
    setSendingMsg(true);
    try {
      const newMsg = await api.sendMessage(complaint.id, replyMessage.trim(), false, false);
      setMessages([...messages, newMsg]);
      setReplyMessage('');
    } catch (err: any) {
      alert(err.message || 'Failed to post message.');
    } finally {
      setSendingMsg(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !complaint) return;

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Attachment size exceeds 5MB limit.');
      return;
    }

    setUploading(true);
    setUploadError('');

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const att = await api.uploadAttachment(
          complaint.id,
          file.name,
          file.size,
          file.type,
          reader.result as string,
          'student_and_staff'
        );
        setAttachments([...attachments, att]);
      } catch (err: any) {
        setUploadError(err.message || 'Upload failed.');
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleReopen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reopenReason.trim() || !complaint) return;
    setReopening(true);
    setReopenError('');

    try {
      const updated = await api.reopenComplaint(complaint.id, reopenReason.trim());
      setComplaint(updated);
      setShowReopenModal(false);
      loadData();
      if (onRefreshList) onRefreshList();
    } catch (err: any) {
      setReopenError(err.message || 'Could not reopen complaint.');
    } finally {
      setReopening(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-3 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500 font-medium">Loading complaint docket...</p>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="py-20 text-center space-y-3">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
        <h2 className="text-base font-bold text-slate-900">Complaint Record Not Found</h2>
        <p className="text-xs text-slate-500">The requested docket is unavailable or access was restricted.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-blue-900 text-white rounded-lg text-xs font-semibold"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const isResolvedOrClosed = complaint.status === 'Resolved' || complaint.status === 'Closed';

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Complaints
        </button>
        <span className="text-xs text-slate-400 font-mono">
          Department of Mechanical Engineering, BUK
        </span>
      </div>

      {/* Complaint Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-bold text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded">
                {complaint.reference_no}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {category?.name || 'Departmental Matter'}
              </span>
              {complaint.course_code && (
                <span className="text-xs font-mono font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                  {complaint.course_code}
                </span>
              )}
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
              {complaint.title}
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold px-3 py-1 rounded-full border bg-slate-900 text-white">
              {complaint.status}
            </span>
            <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              {complaint.priority} Priority
            </span>
          </div>
        </div>

        {/* Docket Meta Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-slate-600">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Submitted Date</span>
            <span className="font-mono text-slate-800">{new Date(complaint.created_at).toLocaleDateString()}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Level / Semester</span>
            <span className="text-slate-800">{complaint.level} · {complaint.semester}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Academic Session</span>
            <span className="text-slate-800">{complaint.academic_session}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">SLA Target Due</span>
            <span className="font-mono text-slate-800">
              {complaint.sla_due_at ? new Date(complaint.sla_due_at).toLocaleDateString() : 'N/A'}
            </span>
          </div>
        </div>

        {/* Detailed Description */}
        <div className="pt-2 space-y-2">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Statement of Complaint
          </h3>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50/70 p-4 rounded-xl border border-slate-100 whitespace-pre-wrap">
            {complaint.description}
          </p>
        </div>

        {/* Requested Outcome if any */}
        {complaint.requested_outcome && (
          <div className="p-3.5 bg-blue-50/40 border border-blue-100 rounded-xl space-y-1">
            <span className="text-[11px] font-bold text-blue-900 block uppercase">
              Student Requested Outcome
            </span>
            <p className="text-xs text-slate-700">{complaint.requested_outcome}</p>
          </div>
        )}

        {/* Official Resolution Summary (When Resolved or Closed) */}
        {complaint.resolution_summary && (
          <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5 uppercase">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Official Departmental Resolution
              </span>
              {complaint.resolved_at && (
                <span className="text-[11px] text-emerald-700 font-mono">
                  Resolved: {new Date(complaint.resolved_at).toLocaleDateString()}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-emerald-950 font-medium leading-relaxed">
              {complaint.resolution_summary}
            </p>
            {complaint.resolution_action_taken && (
              <div className="pt-2 text-xs text-emerald-800 border-t border-emerald-200/60">
                <span className="font-semibold block">Action Taken:</span>
                <span>{complaint.resolution_action_taken}</span>
              </div>
            )}

            {/* Reopen Action for Student */}
            {user?.role === 'student' && (
              <div className="pt-3 flex justify-end">
                <button
                  onClick={() => setShowReopenModal(true)}
                  className="px-3.5 py-1.5 bg-white border border-emerald-300 text-emerald-900 hover:bg-emerald-100/80 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Request Review / Reopen
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Investigation Timeline */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Workflow & Status History</h3>
        <div className="relative border-l-2 border-slate-200 ml-3 space-y-5 py-2">
          {timeline.map((item, idx) => (
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

      {/* Official Communication & Messages Thread */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Departmental Correspondence Thread</h3>
            <p className="text-xs text-slate-500">Official communication between student and authorized staff</p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {messages.length} {messages.length === 1 ? 'message' : 'messages'}
          </span>
        </div>

        {/* Messages List */}
        <div className="space-y-4">
          {messages.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center italic">
              No correspondence logged yet on this complaint.
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

        {/* Send Follow-up Message */}
        <form onSubmit={handleSendMessage} className="pt-2 space-y-2">
          <label className="block text-xs font-semibold text-slate-700">
            Send Follow-up Message / Provide Requested Clarification:
          </label>
          <div className="flex gap-2">
            <textarea
              rows={2}
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder="Type your response or inquiry here..."
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
            <button
              type="submit"
              disabled={sendingMsg || !replyMessage.trim()}
              className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 self-end disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" /> Send
            </button>
          </div>
        </form>
      </div>

      {/* Supporting Attachments Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900">Attached Documents & Evidence</h3>
          <div>
            <input
              type="file"
              id="detail-attachment-file"
              onChange={handleFileUpload}
              accept=".pdf,.png,.jpg,.jpeg,.docx"
              className="hidden"
            />
            <label
              htmlFor="detail-attachment-file"
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Upload className="w-3.5 h-3.5" /> Upload Additional Proof
            </label>
          </div>
        </div>

        {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
        {uploading && <p className="text-xs text-slate-500 font-mono">Uploading attachment...</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {attachments.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 col-span-2 italic">
              No evidence documents uploaded yet.
            </p>
          ) : (
            attachments.map((a) => (
              <div
                key={a.id}
                className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className="w-5 h-5 text-blue-900 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-900 truncate block font-mono">
                      {a.file_name}
                    </span>
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

      {/* Reopen Complaint Modal */}
      {showReopenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-amber-600" /> Request Review / Reopening
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Under BUK departmental guidelines, you may request reopening within 7 days if the resolution has not taken effect or new verifiable evidence is available.
            </p>

            {reopenError && <p className="text-xs text-red-600">{reopenError}</p>}

            <form onSubmit={handleReopen} className="space-y-3">
              <textarea
                required
                rows={3}
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                placeholder="State clearly why this complaint requires reopening (min 10 characters)..."
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReopenModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reopening || reopenReason.trim().length < 10}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                >
                  {reopening ? 'Reopening...' : 'Submit Reopening Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
