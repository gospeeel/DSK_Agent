import React, { useState } from 'react';
import { MessageSquare, Bot } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAssistant } from '../../context/AssistantContext';
import { GeneralChatModal } from './GeneralChatModal';
import { GlobalAIAssistantModal } from './GlobalAIAssistantModal';

export const FloatingAIAssistantWidget: React.FC = () => {
  const { user } = useAuth();
  const { activeChat, applyReply } = useAssistant();
  const isStaff = user?.role === 'manager' || user?.role === 'supervisor';

  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className={`fixed right-6 z-40 ${isStaff ? 'bottom-24' : 'bottom-6'}`}>
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 px-4 h-12 bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl border-2 border-zinc-900 shadow-xl transition-all duration-200 hover:scale-105 cursor-pointer"
          title={isStaff ? 'Открыть ассистент сотрудника' : 'Задать вопрос специалисту по недвижимости'}
        >
          {isStaff ? (
            <>
              <Bot className="w-5 h-5 text-white" />
              <span className="text-xs font-extrabold hidden sm:inline">Ассистент</span>
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 rounded-full border-2 border-zinc-900 animate-pulse" />
            </>
          ) : (
            <>
              <MessageSquare className="w-5 h-5 text-white" />
              <span className="text-xs font-extrabold hidden sm:inline">Задать вопрос</span>
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-zinc-900 animate-pulse" />
            </>
          )}
        </button>
      </div>

      {isStaff ? (
        <GlobalAIAssistantModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          activeContext={activeChat}
          onApplyReply={(text, sessionId) => applyReply(text, sessionId)}
        />
      ) : (
        <GeneralChatModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
};
