import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, Users, User, Circle } from 'lucide-react';

export interface ChatMessage {
  id: string;
  timestamp: string;
  senderEmail: string;
  senderName: string;
  text: string;
}

export interface OnlineUser {
  email: string;
  name: string;
  isOnline: boolean;
  lastSeen: number | null;
}

interface AdminChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onlineUsers: OnlineUser[];
  onSendMessage: (text: string) => Promise<void>;
  currentAdminEmail: string;
}

export const AdminChatDrawer: React.FC<AdminChatDrawerProps> = ({
  isOpen,
  onClose,
  messages,
  onlineUsers,
  onSendMessage,
  currentAdminEmail
}) => {
  if (!isOpen) return null;

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    setSending(true);
    try {
      await onSendMessage(input.trim());
      setInput('');
    } finally {
      setSending(false);
    }
  };

  const onlineCount = onlineUsers.filter(u => u.isOnline).length;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-300 animate-in slide-in-from-right duration-200"
        role="dialog"
      >
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-emerald-600 text-white shadow-xs">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">Chat Operativo del Servicio ADIF</h2>
              <p className="text-xs text-slate-300">Coordinación en tiempo real entre vigilantes y supervisores</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Online Staff List */}
        <div className="p-3 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
            <Users className="w-3.5 h-3.5 text-emerald-600" />
            <span>Personal Conectado ({onlineCount} en línea):</span>
          </div>

          <div className="space-y-1.5">
            {onlineUsers.map(user => {
              const isSelf = user.email.toLowerCase() === currentAdminEmail.toLowerCase();
              return (
                <div key={user.email} className="flex items-center justify-between text-xs bg-white p-1.5 rounded border border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      user.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                    }`} />
                    <span className="font-bold text-slate-900">{user.name}</span>
                    {isSelf && <span className="text-[10px] bg-blue-100 text-blue-800 px-1 rounded font-bold">Tú</span>}
                  </div>
                  <span className={`text-[10px] font-bold ${
                    user.isOnline ? 'text-emerald-700' : 'text-slate-400'
                  }`}>
                    {user.isOnline ? 'Online' : 'Desconectado'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-100/50">
          {messages.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-xs">
              No hay mensajes recientes. Escribe para iniciar la conversación.
            </div>
          ) : (
            messages.map(msg => {
              const isSelf = msg.senderEmail.toLowerCase() === currentAdminEmail.toLowerCase();
              const dateObj = new Date(msg.timestamp);
              const timeStr = dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

              return (
                <div 
                  key={msg.id} 
                  className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-0.5 px-1 font-mono">
                    <span className="font-bold text-slate-800">{msg.senderName}</span>
                    <span>·</span>
                    <span>{timeStr}</span>
                  </div>

                  <div className={`p-2.5 rounded-xl max-w-[85%] text-xs shadow-2xs leading-relaxed ${
                    isSelf 
                      ? 'bg-blue-600 text-white rounded-br-none' 
                      : 'bg-white text-slate-900 border border-slate-200 rounded-bl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Send message form */}
        <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
          <input
            type="text"
            placeholder="Escribe un mensaje para el servicio operativo..."
            value={input}
            onChange={e => setInput(e.target.value)}
            className="flex-1 text-xs border border-slate-300 rounded-lg py-2 px-3 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg transition-colors shadow-xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
