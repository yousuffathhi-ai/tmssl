import React, { useState, useEffect, useRef } from 'react';
import { DirectMessageRecord, CommunityTeacherProfile } from '../../types';
import {
  fetchDirectMessagesDb,
  sendDirectMessageDb,
} from '../../lib/supabase';
import { X, Send, School, CheckCheck } from 'lucide-react';

interface DirectChatModalProps {
  currentUserId: string;
  currentUserName: string;
  teacher: CommunityTeacherProfile;
  onClose: () => void;
}

export const DirectChatModal: React.FC<DirectChatModalProps> = ({
  currentUserId,
  currentUserName,
  teacher,
  onClose,
}) => {
  const [messages, setMessages] = useState<DirectMessageRecord[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    const loadMessages = async () => {
      setLoading(true);
      const data = await fetchDirectMessagesDb(currentUserId, teacher.id);
      if (isMounted) {
        setMessages(data);
        setLoading(false);
      }
    };
    loadMessages();
    return () => {
      isMounted = false;
    };
  }, [currentUserId, teacher.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text) return;

    setInputText('');

    // Optimistic append
    const tempMsg: DirectMessageRecord = {
      id: 'dm_' + Date.now(),
      sender_id: currentUserId,
      receiver_id: teacher.id,
      message: text,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);

    await sendDirectMessageDb({
      sender_id: currentUserId,
      receiver_id: teacher.id,
      message: text,
    });
  };

  const formatMessageTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div
      id="direct-chat-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col h-[600px] max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              {teacher.avatarUrl ? (
                <img
                  src={teacher.avatarUrl}
                  alt={teacher.name}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-linear-to-tr from-blue-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                  {teacher.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
            </div>

            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {teacher.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                <School className="w-3 h-3 text-blue-500 shrink-0" />
                <span className="truncate">{teacher.schoolName || 'Government School, Sri Lanka'}</span>
              </p>
            </div>
          </div>

          <button
            id="close-chat-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Close Chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Notice */}
        <div className="px-4 py-1.5 bg-blue-50/70 dark:bg-blue-950/30 border-b border-blue-100 dark:border-blue-900/40 text-[11px] text-blue-700 dark:text-blue-300 flex items-center justify-between">
          <span>Official Educator Direct Line • Verified Sri Lankan Teacher</span>
          <span className="text-[10px] font-medium bg-blue-100 dark:bg-blue-900/60 px-1.5 py-0.5 rounded text-blue-800 dark:text-blue-200">
            {teacher.subject}
          </span>
        </div>

        {/* Chat History View */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30 dark:bg-slate-950/20">
          {loading ? (
            <div className="flex items-center justify-center h-full text-xs text-slate-400">
              Loading conversation history...
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2">
                <Send className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Start a 1-on-1 discussion with {teacher.name}
              </p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                Share pedagogical techniques, ask syllabus questions, or coordinate inter-school activities.
              </p>
            </div>
          ) : (
            messages.map(msg => {
              const isMine = msg.sender_id === currentUserId;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                      isMine
                        ? 'bg-blue-600 text-white rounded-tr-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 rounded-tl-xs'
                    }`}
                  >
                    <p className="whitespace-pre-wrap wrap-break-words">{msg.message}</p>
                    <div
                      className={`flex items-center gap-1 justify-end mt-1 text-[10px] ${
                        isMine ? 'text-blue-100' : 'text-slate-400'
                      }`}
                    >
                      <span>{formatMessageTime(msg.created_at)}</span>
                      {isMine && <CheckCheck className="w-3 h-3 text-blue-200" />}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Input Bar */}
        <form
          onSubmit={handleSendMessage}
          className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2"
        >
          <input
            id="chat-message-input"
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder={`Message ${teacher.name}...`}
            className="flex-1 px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
          <button
            id="chat-send-btn"
            type="submit"
            disabled={!inputText.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition shrink-0"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
