import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { ComplaintCategory, Complaint } from '../../types';
import { FileText, Send, Upload, CheckCircle2, AlertCircle, ArrowLeft, Clock } from 'lucide-react';

interface SubmitComplaintFormProps {
  categories: ComplaintCategory[];
  onComplaintSubmitted: (complaint: Complaint) => void;
  onCancel: () => void;
}

export const SubmitComplaintForm: React.FC<SubmitComplaintFormProps> = ({
  categories,
  onComplaintSubmitted,
  onCancel
}) => {
  const { user, profile } = useAuth();
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [semester, setSemester] = useState<'First Semester' | 'Second Semester'>('First Semester');
  const [requestedOutcome, setRequestedOutcome] = useState('');
  const [declaredAccuracy, setDeclaredAccuracy] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState<{ name: string; size: number; type: string; dataUrl: string } | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdComplaint, setCreatedComplaint] = useState<Complaint | null>(null);

  const selectedCategory = categories.find((c) => c.id === categoryId);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds the 5MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachmentFile({
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl: reader.result as string
      });
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!declaredAccuracy) {
      setError('Please certify that the submitted complaint information is accurate.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const newComplaint = await api.submitComplaint({
        category_id: categoryId,
        title,
        description,
        course_code: courseCode || undefined,
        level: profile?.level || '500L',
        semester,
        academic_session: profile?.academic_session || '2025/2026',
        requested_outcome: requestedOutcome || undefined
      });

      // Upload attachment if selected
      if (attachmentFile) {
        try {
          await api.uploadAttachment(
            newComplaint.id,
            attachmentFile.name,
            attachmentFile.size,
            attachmentFile.type,
            attachmentFile.dataUrl,
            'student_and_staff'
          );
        } catch (attErr) {
          console.warn('Attachment upload failed, complaint saved:', attErr);
        }
      }

      setCreatedComplaint(newComplaint);
    } catch (err: any) {
      setError(err.message || 'Submission failed.');
    } finally {
      setLoading(false);
    }
  };

  if (createdComplaint) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-6 shadow-sm">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">Complaint Lodged Successfully</h2>
            <p className="text-xs text-slate-600">
              Your academic docket has been entered into the departmental complaint register.
            </p>
          </div>

          {/* Reference Card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-center">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Complaint Reference Number
            </span>
            <span className="text-2xl font-bold font-mono text-blue-900 tracking-wider">
              {createdComplaint.reference_no}
            </span>
            <span className="text-[11px] text-slate-500 block pt-1">
              Please preserve this reference number for correspondence and tracking.
            </span>
          </div>

          <div className="text-xs text-slate-500 bg-blue-50/50 p-3.5 rounded-lg border border-blue-100 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium text-slate-700">
              <Clock className="w-4 h-4 text-blue-900" /> Target SLA: {selectedCategory?.sla_hours || 72} hours
            </span>
            <span className="text-slate-600">Category: {selectedCategory?.name}</span>
          </div>

          <div className="flex gap-3 justify-center pt-2">
            <button
              onClick={() => onComplaintSubmitted(createdComplaint)}
              className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors"
            >
              View Complaint Docket
            </button>
            <button
              onClick={onCancel}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
        <span className="text-xs text-slate-500 font-mono">
          BUK · MECH OSCMS Form
        </span>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Departmental Complaint Submission
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Department of Mechanical Engineering, Bayero University Kano.
          </p>
        </div>

        {/* Authenticated Student Profile Bar (No redundant re-entry required!) */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Student Name</span>
            <span className="font-bold text-slate-900 truncate block">{user?.full_name}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Reg / Matric No</span>
            <span className="font-bold font-mono text-blue-900 block">{profile?.registration_number || 'UG20/ENG/MEC/1042'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Level</span>
            <span className="font-bold text-slate-800 block">{profile?.level || '500L'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Session</span>
            <span className="font-bold text-slate-800 block">{profile?.academic_session || '2025/2026'}</span>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Category Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              Complaint Category <span className="text-red-500">*</span>
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (Code: {c.code}) · Target SLA: {c.sla_hours}h
                </option>
              ))}
            </select>
            {selectedCategory && (
              <p className="text-[11px] text-slate-500 mt-1 italic">
                {selectedCategory.description}
              </p>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              Complaint Title / Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Omission of Mid-Semester Continuous Assessment Score for MEC3301"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          {/* Course Code & Semester Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Relevant Course Code (Optional)
              </label>
              <input
                type="text"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
                placeholder="e.g. MEC3301, MEC4204"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Semester
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
              >
                <option value="First Semester">First Semester</option>
                <option value="Second Semester">Second Semester</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              Detailed Description of Complaint <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide explicit details: dates, lecturers involved, venues, test scores, or specific circumstances encountered..."
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          {/* Requested Outcome */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              Specific Requested Outcome (Optional)
            </label>
            <input
              type="text"
              value={requestedOutcome}
              onChange={(e) => setRequestedOutcome(e.target.value)}
              placeholder="e.g. Rectification of continuous assessment score to 24/30 and update on master composite sheet."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          {/* Document / Evidence Upload */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              Attach Supporting Evidence (Optional)
            </label>
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:bg-slate-50/50 transition-colors">
              <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
              <input
                type="file"
                id="complaint-file"
                onChange={handleFileUpload}
                accept=".pdf,.png,.jpg,.jpeg,.docx"
                className="hidden"
              />
              <label
                htmlFor="complaint-file"
                className="text-xs font-semibold text-blue-900 hover:underline cursor-pointer"
              >
                {attachmentFile ? 'Change uploaded file' : 'Click to select supporting document or image'}
              </label>
              <p className="text-[11px] text-slate-400 mt-0.5">
                PDF, PNG, JPG or DOCX up to 5MB (e.g. test attendance slip, result printout)
              </p>

              {attachmentFile && (
                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-900 rounded-md text-xs font-mono">
                  <span>{attachmentFile.name}</span>
                  <span className="text-[10px] text-slate-500">
                    ({(attachmentFile.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Declaration Checkbox */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
            <input
              type="checkbox"
              id="declaration"
              checked={declaredAccuracy}
              onChange={(e) => setDeclaredAccuracy(e.target.checked)}
              className="mt-0.5 rounded text-blue-900 focus:ring-blue-900"
            />
            <label htmlFor="declaration" className="text-xs text-slate-700 leading-snug cursor-pointer">
              I hereby certify that all information submitted herein is genuine and accurate to the best of my knowledge, and I consent to departmental investigation under BUK academic regulations.
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Registering Docket...' : 'Submit Complaint to Department'}
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
