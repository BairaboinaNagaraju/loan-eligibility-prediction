import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X, Bot, User, Sparkles } from 'lucide-react';
import api from '../../lib/api';

export default function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; time: string }>>([
    { sender: 'ai', text: 'Hello! I am your Vertex AI Loan Assistant. How can I help you today? You can ask me about loan rates, eligibility guidelines, documents, or how to improve your score.', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || loading) return;

    const userMsg = message.trim();
    setMessage('');
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { sender: 'user', text: userMsg, time: timeStr }]);
    setLoading(true);

    try {
      const response = await api.post('/ai/chat', { message: userMsg });
      const aiReply = response.data.data.reply;
      setMessages(prev => [...prev, { sender: 'ai', text: aiReply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    } catch {
      setMessages(prev => [...prev, { sender: 'ai', text: 'Sorry, I am having trouble connecting to my brain right now. Please try again.', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            className="w-96 h-[500px] glass-card flex flex-col shadow-glass border border-white/20 mb-4 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-blue-600 to-violet-600 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Vertex AI Assistant</h3>
                  <span className="text-[10px] text-blue-200 flex items-center gap-1"><Sparkles className="w-2.5 h-2.5 animate-pulse" /> Online</span>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-[#090f1e]/90">
              {messages.map((m, idx) => (
                <div key={idx} className={`flex gap-3.5 max-w-[85%] ${m.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-white ${
                    m.sender === 'user' ? 'bg-violet-600' : 'bg-blue-600'
                  }`}>
                    {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-gradient-to-br from-violet-600/80 to-purple-600/70 text-white rounded-tr-none'
                        : 'bg-white/5 border border-white/10 text-slate-200 rounded-tl-none'
                    }`}>
                      <p className="whitespace-pre-line">{m.text}</p>
                    </div>
                    <span className={`text-[10px] text-slate-500 mt-1 block ${m.sender === 'user' ? 'text-right' : ''}`}>{m.time}</span>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-3.5 max-w-[85%]">
                  <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white"><Bot className="w-4 h-4" /></div>
                  <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl rounded-tl-none text-slate-200 text-sm flex gap-1 items-center">
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} className="p-3 border-t border-white/10 bg-[#0d1526] flex gap-2">
              <input
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Ask something..."
                className="flex-1 input-field py-2 text-sm bg-white/5 focus:ring-1 focus:ring-blue-500/50"
              />
              <button type="submit" disabled={!message.trim() || loading}
                className="btn-primary p-2 px-3 hover:shadow-none hover:scale-105 active:scale-95 transition-all">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-violet-600 text-white flex items-center justify-center shadow-glow shadow-blue-500/30 border border-white/10"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </motion.button>
    </div>
  );
}
