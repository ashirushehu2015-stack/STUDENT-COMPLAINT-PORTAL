import React from 'react';
import { Notification } from '../../types';
import { Bell, Check, X, ArrowRight, Clock, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onSelectComplaint?: (complaintId: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead,
  onSelectComplaint
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-900" />
            <h3 className="font-semibold text-slate-900 text-sm">Notifications</h3>
            {notifications.filter((n) => !n.is_read).length > 0 && (
              <span className="text-[11px] font-bold bg-blue-100 text-blue-900 px-2 py-0.5 rounded-full font-mono">
                {notifications.filter((n) => !n.is_read).length} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onMarkAllRead}
              className="text-xs text-blue-900 hover:underline font-medium"
            >
              Mark all read
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No notifications yet.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-3.5 rounded-lg transition-colors ${
                  !n.is_read ? 'bg-blue-50/60 hover:bg-blue-50' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    {n.type === 'escalated' && <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />}
                    {n.type === 'resolved' && <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />}
                    {n.type === 'status_change' && <Clock className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />}
                    {n.type === 'info' && <Info className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />}

                    <div>
                      <h4 className="text-xs font-semibold text-slate-900 leading-snug">{n.title}</h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                      <span className="text-[10px] text-slate-400 font-mono mt-1.5 block">
                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ·{' '}
                        {new Date(n.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {!n.is_read && (
                    <button
                      onClick={() => onMarkRead(n.id)}
                      className="p-1 text-slate-400 hover:text-blue-900 hover:bg-white rounded transition-colors shrink-0"
                      title="Mark as read"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {n.complaint_id && onSelectComplaint && (
                  <button
                    onClick={() => {
                      onSelectComplaint(n.complaint_id!);
                      onClose();
                    }}
                    className="mt-2 text-[11px] font-semibold text-blue-900 hover:underline flex items-center gap-1"
                  >
                    View complaint details <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
