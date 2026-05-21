'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useGetDisputeQuery, useAddDisputeMessageMutation } from '@/store/api/disputesApi';
import { useAppSelector } from '@/store';
import { formatRelativeTime, formatCurrency } from '@/lib/utils';
import {
  ChevronLeft, AlertTriangle, Loader2, Shield, Clock, DollarSign,
  Send, FileText, CheckCircle, XCircle, MessageSquare, User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  open: { label: 'Open', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400', icon: AlertTriangle },
  under_review: { label: 'Under Review', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400', icon: Shield },
  resolved: { label: 'Resolved', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400', icon: CheckCircle },
  closed: { label: 'Closed', color: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400', icon: XCircle },
};

export default function DisputeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAppSelector((s) => s.auth);
  const [message, setMessage] = useState('');

  const { data, isLoading, error } = useGetDisputeQuery(id);
  const [addMessage, { isLoading: sending }] = useAddDisputeMessageMutation();

  const dispute = data?.data;

  const handleSend = async () => {
    if (!message.trim()) return;
    try {
      await addMessage({ disputeId: id, message: message.trim() }).unwrap();
      setMessage('');
    } catch (err: any) {
      toast.error(err?.data?.message ?? 'Failed to send message');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 animate-spin text-nexus-500" />
      </div>
    );
  }

  if (error || !dispute) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 gap-4">
        <AlertTriangle className="w-12 h-12 text-red-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Dispute not found</h3>
        <Link href="/disputes" className="text-nexus-600 hover:underline">Back to disputes</Link>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[dispute.status] ?? STATUS_CONFIG.open;
  const StatusIcon = statusCfg.icon;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <Link href="/disputes" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back to Disputes
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-5">
          {/* Header */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn('flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium', statusCfg.color)}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    {statusCfg.label}
                  </span>
                  <span className="text-xs text-gray-400">#{dispute.disputeNumber}</span>
                </div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{dispute.title}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Opened {formatRelativeTime(dispute.createdAt)}
                </p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Dispute Description</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">{dispute.description}</p>
            </div>
          </div>

          {/* Messages */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Messages ({dispute.messages?.length ?? 0})
            </h2>

            <div className="space-y-4 mb-6 max-h-[480px] overflow-y-auto">
              {dispute.messages && dispute.messages.length > 0 ? (
                dispute.messages.map((msg: any) => {
                  const isMe = msg.sender?.id === user?.id;
                  const isAdmin = msg.sender?.role === 'admin';
                  return (
                    <div key={msg.id} className={cn('flex gap-3', isMe && 'flex-row-reverse')}>
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold',
                        isAdmin ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' : 'bg-nexus-100 dark:bg-nexus-900/50 text-nexus-600 dark:text-nexus-400'
                      )}>
                        {isAdmin ? <Shield className="w-4 h-4" /> : (msg.sender?.firstName?.[0] ?? <User className="w-4 h-4" />)}
                      </div>
                      <div className={cn('flex-1 max-w-[75%]', isMe && 'items-end flex flex-col')}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            {isMe ? 'You' : `${msg.sender?.firstName} ${msg.sender?.lastName}`}
                          </span>
                          {isAdmin && (
                            <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded text-xs">Admin</span>
                          )}
                          <span className="text-xs text-gray-400">{formatRelativeTime(msg.createdAt)}</span>
                        </div>
                        <div className={cn(
                          'px-4 py-3 rounded-xl text-sm leading-relaxed',
                          isMe
                            ? 'bg-nexus-600 text-white rounded-tr-sm'
                            : isAdmin
                              ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-900 dark:text-purple-100 rounded-tl-sm border border-purple-200 dark:border-purple-800'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-tl-sm'
                        )}>
                          {msg.message}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-gray-400 text-sm py-8">No messages yet. Add your first message below.</p>
              )}
            </div>

            {/* Message Input */}
            {dispute.status !== 'resolved' && dispute.status !== 'closed' && (
              <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                <div className="flex gap-3">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    rows={3}
                    placeholder="Describe your side of the issue... (Enter to send, Shift+Enter for new line)"
                    className="flex-1 px-4 py-3 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-nexus-500 bg-white dark:bg-gray-800 resize-none"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!message.trim() || sending}
                    className="px-4 py-3 bg-nexus-600 hover:bg-nexus-700 text-white rounded-xl disabled:opacity-50 transition-colors"
                  >
                    {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            {(dispute.status === 'resolved' || dispute.status === 'closed') && (
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-center text-sm text-gray-500 dark:text-gray-400">
                This dispute has been {dispute.status}. No further messages can be sent.
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Dispute Details */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Dispute Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500 dark:text-gray-400">Reason</span>
                <span className="font-medium text-gray-900 dark:text-white capitalize ml-auto">{dispute.reason?.replace(/_/g, ' ')}</span>
              </div>
              {dispute.claimedAmount && (
                <div className="flex items-center gap-3">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500 dark:text-gray-400">Claimed</span>
                  <span className="font-medium text-gray-900 dark:text-white ml-auto">{formatCurrency(dispute.claimedAmount)}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500 dark:text-gray-400">Opened</span>
                <span className="font-medium text-gray-900 dark:text-white ml-auto">{formatRelativeTime(dispute.createdAt)}</span>
              </div>
              {dispute.resolvedAt && (
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500 dark:text-gray-400">Resolved</span>
                  <span className="font-medium text-gray-900 dark:text-white ml-auto">{formatRelativeTime(dispute.resolvedAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Contract Link */}
          {dispute.contract && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Related Contract</h3>
              <Link href={`/contracts/${dispute.contract.id}`} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-nexus-50 dark:hover:bg-nexus-950/20 transition-colors">
                <FileText className="w-5 h-5 text-nexus-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{dispute.contract.title}</p>
                  <p className="text-xs text-nexus-600 dark:text-nexus-400 mt-0.5">View contract →</p>
                </div>
              </Link>
            </div>
          )}

          {/* Parties */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Parties Involved</h3>
            <div className="space-y-3">
              {[
                { role: 'Complainant', person: dispute.complainant },
                { role: 'Respondent', person: dispute.respondent },
              ].map(({ role, person }) => person ? (
                <div key={role} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-nexus-100 dark:bg-nexus-900/50 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {person.avatar ? (
                      <img src={person.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-nexus-600 dark:text-nexus-400">{person.firstName?.[0]}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">{role}</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{person.firstName} {person.lastName}</p>
                  </div>
                </div>
              ) : null)}
            </div>
          </div>

          {/* Resolution */}
          {dispute.resolution && (
            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl p-5">
              <h3 className="font-semibold text-green-800 dark:text-green-300 mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Resolution
              </h3>
              <p className="text-sm text-green-700 dark:text-green-400 leading-relaxed">{dispute.resolution}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
