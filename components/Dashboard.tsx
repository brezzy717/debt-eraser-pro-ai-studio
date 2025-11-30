import React, { useState, useRef, useEffect } from 'react';
import { User, ChatMessage, CommunityPost, Resource, CalendarEvent, Conversation } from '../types';
import { createChatSession, sendMessageToBot } from '../services/geminiService';
import { Chat } from "@google/genai";
import { 
  MessageSquare, FileText, Video, Send, Users, LogOut, ShieldAlert, 
  Download, Lock, Calendar, MessageCircle, Info, User as UserIcon, 
  Settings, ChevronRight, Mic, Play, Menu, X
} from 'lucide-react';
import { Button } from './Button';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

// --- MOCK DATA ---
const MOCK_POSTS: CommunityPost[] = [
  { id: '1', author: 'CryptoKing', avatar: 'https://picsum.photos/50/50?random=1', title: 'Just deleted $15k in collections!', content: 'Used the Section 609 template from the vault. TransUnion folded in 15 days. Don\'t give up guys.', likes: 42, comments: 12, timeAgo: '2h ago', category: 'Wins' },
  { id: '2', author: 'Sarah_V', avatar: 'https://picsum.photos/50/50?random=2', title: 'Question about inquiry removal', content: 'Has anyone had luck challenging hard inquiries on Experian specifically? They seem tougher than Equifax.', likes: 15, comments: 8, timeAgo: '5h ago', category: 'Help' },
  { id: '3', author: 'DebtSlayer', avatar: 'https://picsum.photos/50/50?random=3', title: 'STOP PAYING ZOMBIE DEBT', content: 'If the SOL has passed, do not acknowledge the debt. See my guide in the comments.', likes: 89, comments: 34, timeAgo: '1d ago', category: 'Strategy' },
];

const MOCK_MODULES = [
  { id: 1, title: "Module 1: The Mindset Shift", duration: "45m", locked: false },
  { id: 2, title: "Module 2: Analyzing Your Report", duration: "60m", locked: false },
  { id: 3, title: "Module 3: Factual Disputing 101", duration: "90m", locked: false },
  { id: 4, title: "Module 4: Advanced FCRA Tactics", duration: "120m", locked: true },
  { id: 5, title: "Module 5: Taking Them To Court", duration: "90m", locked: true },
];

const MOCK_VAULT: Resource[] = [
  { id: '1', title: 'The Nuclear Option: Section 609 Template', type: 'PDF', description: 'The master letter to demand validation.', url: '#' },
  { id: '2', title: 'Inquiry Removal Script', type: 'PDF', description: 'Phone script to get inquiries deleted in 24 hours.', url: '#' },
  { id: '3', title: 'Medical Debt HIPAA Loophole', type: 'PDF', description: 'HIPAA violations are your best friend.', url: '#' },
  { id: '4', title: 'Cease & Desist Letter', type: 'PDF', description: 'Stop the harassment immediately.', url: '#' },
  { id: '5', title: 'Validation of Debt (VOD) 1.0', type: 'PDF', description: 'First round attack.', url: '#' },
];

const MOCK_EVENTS: CalendarEvent[] = [
  { id: '1', day: 12, title: 'Live Q&A with Debt Eraser', time: '7:00 PM EST', type: 'LIVE' },
  { id: '2', day: 25, title: 'Guest Speaker: Consumer Attorney', time: '6:00 PM EST', type: 'LIVE' },
  { id: '3', day: 5, title: 'New Doc Drop', time: '12:00 PM', type: 'DROP' },
];

const MOCK_CONVERSATIONS: Conversation[] = [
  { id: '1', user: 'Debt Eraser (Admin)', avatar: 'https://picsum.photos/50/50?random=99', lastMessage: 'Keep pushing on that dispute.', unread: 1 },
  { id: '2', user: 'Sarah_V', avatar: 'https://picsum.photos/50/50?random=2', lastMessage: 'Thanks for the tip!', unread: 0 },
];

// --- MAIN COMPONENT ---
export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'community' | 'classroom' | 'calendar' | 'vault' | 'messenger' | 'about'>('community');
  const [activeModule, setActiveModule] = useState<number | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // AI State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: 'intro', role: 'model', text: "I am the War Room AI. I have full access to the FDCPA, FCRA, and the Debt Eraser Knowledge Base. What is your situation?", timestamp: new Date() }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize AI when tab switches to classroom (where AI lives)
    if (activeTab === 'classroom' && !chatSessionRef.current) {
      chatSessionRef.current = createChatSession();
    }
  }, [activeTab]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, activeTab]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !chatSessionRef.current) return;

    const newUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputMessage,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, newUserMsg]);
    setInputMessage('');
    setIsTyping(true);

    const responseText = await sendMessageToBot(chatSessionRef.current, newUserMsg.text);

    const newBotMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: responseText,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, newBotMsg]);
    setIsTyping(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row font-sans text-slate-200 overflow-hidden relative">
      
      {/* Background Ambience */}
      <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-emerald-900/5 rounded-full blur-[120px] pointer-events-none"></div>
      
      {/* --- SIDEBAR --- */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900/80 backdrop-blur-2xl border-r border-white/5 flex flex-col transition-transform duration-300 transform md:relative md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <h1 className="text-xl font-bold text-white tracking-tighter uppercase flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center rounded text-white font-oswald shadow-lg shadow-emerald-900/50">D</div>
            DEBT ERASER PRO
          </h1>
          <button onClick={() => setMobileMenuOpen(false)} className="md:hidden text-slate-400">
            <X size={20} />
          </button>
        </div>
        
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {[
            { id: 'community', icon: Users, label: 'Fusion Community' },
            { id: 'classroom', icon: Video, label: 'Classroom' },
            { id: 'calendar', icon: Calendar, label: 'Calendar' },
            { id: 'vault', icon: FileText, label: 'Document Vault' },
            { id: 'messenger', icon: MessageCircle, label: 'Messenger' },
            { id: 'about', icon: Info, label: 'About' },
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => { setActiveTab(item.id as any); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${
                activeTab === item.id 
                  ? 'bg-white/5 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)] border border-emerald-500/20' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* User Profile Section */}
        <div className="p-4 border-t border-white/5 relative">
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-white/5 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 overflow-hidden border border-white/10">
              <img src="https://picsum.photos/200" alt="User" />
            </div>
            <div className="text-left flex-1 overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{user.name || user.email}</p>
              <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Fusion Member</p>
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute bottom-20 left-4 w-56 glass-panel rounded-xl shadow-2xl z-50 overflow-hidden">
              <button className="w-full text-left px-4 py-3 text-slate-300 hover:bg-white/10 text-sm flex items-center gap-2">
                <Settings size={16} /> Account Settings
              </button>
              <button className="w-full text-left px-4 py-3 text-slate-300 hover:bg-white/10 text-sm flex items-center gap-2">
                <UserIcon size={16} /> 1-on-1 Consults
              </button>
              <div className="border-t border-white/5"></div>
              <button onClick={onLogout} className="w-full text-left px-4 py-3 text-red-400 hover:bg-red-500/10 text-sm flex items-center gap-2">
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 overflow-hidden flex flex-col relative z-0">
        
        {/* Mobile Header */}
        <header className="md:hidden p-4 border-b border-white/5 flex justify-between items-center bg-slate-900/50 backdrop-blur-md sticky top-0 z-30">
           <button onClick={() => setMobileMenuOpen(true)} className="text-slate-200">
             <Menu />
           </button>
           <span className="font-bold text-emerald-500">DEBT ERASER PRO</span>
           <div className="w-8"></div> {/* Spacer */}
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          
          {/* --- TAB 1: COMMUNITY --- */}
          {activeTab === 'community' && (
            <div className="max-w-4xl mx-auto animate-fade-in-up">
              <div className="glass-panel p-8 rounded-3xl mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[60px] pointer-events-none"></div>
                <h2 className="text-3xl font-oswald font-bold text-white mb-2 relative z-10">Welcome back, {user.name || 'Member'}.</h2>
                <p className="text-slate-400 relative z-10">Share your latest win or ask for backup. The community is watching.</p>
              </div>

              <div className="glass-panel p-6 rounded-2xl mb-8 border border-white/10">
                <textarea 
                  placeholder="Write something to the community..." 
                  className="w-full bg-slate-950/40 border border-white/10 rounded-xl p-4 text-slate-200 focus:outline-none focus:border-emerald-500/50 min-h-[100px] placeholder:text-slate-600 transition-all"
                />
                <div className="flex justify-between items-center mt-4">
                  <div className="flex gap-2">
                    <button className="p-2 text-slate-500 hover:text-emerald-500 transition-colors"><Video size={20} /></button>
                    <button className="p-2 text-slate-500 hover:text-emerald-500 transition-colors"><FileText size={20} /></button>
                  </div>
                  <Button variant="primary" className="py-2 px-6 text-sm !rounded-lg !bg-emerald-600 hover:!bg-emerald-500 shadow-lg">POST UPDATE</Button>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-4 font-bold tracking-wider uppercase">
                  <span>Latest Intel</span>
                  <div className="flex gap-4">
                    <span className="text-emerald-500 cursor-pointer border-b border-emerald-500">All</span>
                    <span className="cursor-pointer hover:text-white transition-colors">Wins</span>
                    <span className="cursor-pointer hover:text-white transition-colors">Strategy</span>
                  </div>
                </div>

                {MOCK_POSTS.map(post => (
                  <div key={post.id} className="glass-panel rounded-2xl p-6 hover:border-emerald-500/30 transition-all cursor-pointer group">
                    <div className="flex items-center gap-3 mb-4">
                      <img src={post.avatar} alt={post.author} className="w-10 h-10 rounded-full border border-white/10" />
                      <div>
                        <h3 className="font-bold text-slate-200 text-sm group-hover:text-emerald-400 transition-colors">{post.author}</h3>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">{post.timeAgo} • <span className="text-emerald-500">{post.category}</span></p>
                      </div>
                    </div>
                    <h4 className="text-lg font-bold text-white mb-2">{post.title}</h4>
                    <p className="text-slate-400 leading-relaxed mb-4 text-sm">{post.content}</p>
                    <div className="flex items-center gap-6 text-xs text-slate-500 border-t border-white/5 pt-4 font-bold uppercase tracking-wider">
                      <button className="flex items-center gap-2 hover:text-emerald-400 transition-colors">
                        <span>{post.likes}</span> Likes
                      </button>
                      <button className="flex items-center gap-2 hover:text-emerald-400 transition-colors">
                        <span>{post.comments}</span> Replies
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* --- TAB 2: CLASSROOM (COURSE + AI) --- */}
          {activeTab === 'classroom' && (
            <div className="h-full flex flex-col max-w-7xl mx-auto animate-fade-in-up">
              <div className="flex gap-4 mb-6">
                <button 
                  onClick={() => setActiveModule(null)}
                  className={`px-6 py-2 rounded-full font-bold uppercase tracking-wider text-xs transition-all border ${activeModule === null ? 'bg-emerald-600 text-white border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-transparent text-slate-400 border-white/10 hover:border-white/30'}`}
                >
                  Video Modules
                </button>
                <button 
                  onClick={() => setActiveModule(999)} // 999 is AI ID
                  className={`px-6 py-2 rounded-full font-bold uppercase tracking-wider text-xs flex items-center gap-2 transition-all border ${activeModule === 999 ? 'bg-emerald-600 text-white border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-transparent text-slate-400 border-white/10 hover:border-white/30'}`}
                >
                  <MessageSquare size={14} /> War Room AI
                </button>
              </div>

              {activeModule === 999 ? (
                /* AI INTERFACE */
                <div className="flex-1 flex flex-col glass-panel rounded-2xl overflow-hidden relative shadow-2xl h-[600px] border border-white/10">
                   <div className="bg-white/5 p-4 border-b border-white/10 flex justify-between items-center backdrop-blur z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981] animate-pulse"></div>
                      <div>
                        <h3 className="font-bold text-white uppercase tracking-widest text-xs">War Room AI</h3>
                        <p className="text-[10px] text-emerald-500/80 font-mono">ENCRYPTED CHANNEL ACTIVE</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-950/20 relative z-10 scroll-smooth">
                    {chatMessages.map(msg => (
                      <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-4 shadow-lg text-sm leading-relaxed backdrop-blur-md ${
                          msg.role === 'user' 
                            ? 'bg-emerald-600/90 text-white rounded-br-none shadow-[0_4px_20px_rgba(16,185,129,0.2)] border border-emerald-500/30' 
                            : 'bg-slate-800/60 border border-white/10 text-slate-200 rounded-bl-none'
                        }`}>
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                        </div>
                      </div>
                    ))}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-slate-800/60 p-4 rounded-2xl rounded-bl-none flex gap-1 items-center border border-white/10">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></span>
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce delay-75"></span>
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce delay-150"></span>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  <div className="p-4 bg-white/5 border-t border-white/10 z-10 backdrop-blur">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={inputMessage}
                          onChange={(e) => setInputMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                          placeholder="Ask specifically about laws, loopholes, or document strategies..."
                          className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-4 pl-4 pr-12 text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-slate-600 text-sm"
                        />
                         <button className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-emerald-500 transition-colors">
                           <Mic size={18} />
                         </button>
                      </div>
                      <button 
                        onClick={handleSendMessage}
                        disabled={!inputMessage.trim() || isTyping}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-xl disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                      >
                        <Send size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* VIDEO MODULES */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {MOCK_MODULES.map(module => (
                    <div key={module.id} className={`glass-card rounded-2xl overflow-hidden group transition-all hover:-translate-y-1 ${module.locked ? 'opacity-70 grayscale' : ''}`}>
                      <div className="aspect-video bg-black/50 relative flex items-center justify-center group-hover:bg-black/40 transition-colors">
                        {module.locked ? (
                          <Lock className="text-slate-500 w-10 h-10" />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform cursor-pointer backdrop-blur-sm border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                             <Play className="text-emerald-500 w-6 h-6 ml-1" fill="currentColor" />
                          </div>
                        )}
                        <div className="absolute bottom-3 right-3 bg-black/80 text-white text-[10px] font-bold px-2 py-1 rounded backdrop-blur-md border border-white/10">{module.duration}</div>
                      </div>
                      <div className="p-6">
                        <h3 className="font-bold text-white text-lg mb-2 leading-tight">{module.title}</h3>
                        {module.locked ? (
                          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest flex items-center gap-1"><Lock size={10}/> Locked</span>
                        ) : (
                          <button className="text-emerald-400 text-xs font-bold uppercase tracking-wider hover:text-emerald-300 flex items-center gap-1 transition-colors">Start Lesson <ChevronRight size={12}/></button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* --- TAB 3: CALENDAR --- */}
          {activeTab === 'calendar' && (
            <div className="max-w-6xl mx-auto animate-fade-in-up">
               <div className="flex items-end justify-between mb-8">
                 <h2 className="text-3xl font-oswald font-bold text-white uppercase">Mission Timeline</h2>
                 <div className="flex gap-2">
                   <div className="flex items-center gap-2 text-xs text-slate-400 font-bold uppercase"><div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></div> Live Call</div>
                   <div className="flex items-center gap-2 text-xs text-slate-400 font-bold uppercase"><div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]"></div> Drop</div>
                 </div>
               </div>
               
               <div className="glass-panel rounded-3xl p-8 border border-white/10">
                  <div className="grid grid-cols-7 gap-1 mb-6 text-center text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
                  </div>
                  <div className="grid grid-cols-7 gap-3">
                    {Array.from({ length: 30 }).map((_, i) => {
                      const day = i + 1;
                      const event = MOCK_EVENTS.find(e => e.day === day);
                      return (
                        <div key={i} className={`min-h-[120px] border border-white/5 rounded-2xl p-3 transition-all hover:bg-white/5 ${event ? 'bg-white/5' : 'bg-transparent'}`}>
                          <span className="text-slate-600 text-xs font-bold">{day}</span>
                          {event && (
                            <div className={`mt-2 p-3 rounded-xl text-[10px] font-bold cursor-pointer hover:scale-105 transition-transform backdrop-blur-md border shadow-lg ${event.type === 'LIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-blue-500/10 text-blue-400 border-blue-500/30'}`}>
                              <div className="truncate opacity-80 mb-1">{event.time}</div>
                              <div className="truncate leading-tight">{event.title}</div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
               </div>
            </div>
          )}

          {/* --- TAB 4: VAULT --- */}
          {activeTab === 'vault' && (
            <div className="max-w-7xl mx-auto animate-fade-in-up">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h2 className="text-3xl font-oswald font-bold text-white uppercase">The Arsenal</h2>
                  <p className="text-slate-400 text-sm mt-1">Battle-tested documentation. Download, edit, send.</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-1 flex">
                   <button className="px-4 py-1.5 bg-white/10 rounded text-xs text-white font-bold transition-all shadow-inner">ALL</button>
                   <button className="px-4 py-1.5 hover:bg-white/5 rounded text-xs text-slate-400 hover:text-white font-bold transition-all">LETTERS</button>
                   <button className="px-4 py-1.5 hover:bg-white/5 rounded text-xs text-slate-400 hover:text-white font-bold transition-all">SCRIPTS</button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {MOCK_VAULT.map(res => (
                  <div key={res.id} className="glass-card p-6 rounded-2xl group relative overflow-hidden border border-white/10 hover:border-emerald-500/30 transition-all hover:-translate-y-1">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <FileText size={120} />
                    </div>
                    
                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center shadow-lg">
                        <FileText size={24} />
                      </div>
                      <div className="flex gap-2">
                        <span className="text-[10px] bg-white/10 text-slate-300 px-2 py-1 rounded uppercase font-bold tracking-wider border border-white/5">PDF</span>
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors relative z-10">{res.title}</h3>
                    <p className="text-slate-400 text-xs mb-6 min-h-[40px] leading-relaxed relative z-10">{res.description}</p>
                    
                    <button className="w-full py-3 bg-white/5 border border-white/10 text-slate-300 font-bold uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-500/20 hover:text-emerald-400 hover:border-emerald-500/50 transition-all rounded-xl relative z-10">
                      Download File <Download size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* --- TAB 5: MESSENGER --- */}
          {activeTab === 'messenger' && (
            <div className="max-w-7xl mx-auto h-[650px] glass-panel rounded-3xl flex overflow-hidden animate-fade-in-up border border-white/10 shadow-2xl">
               {/* Contact List */}
               <div className="w-1/3 border-r border-white/5 bg-slate-950/20 flex flex-col backdrop-blur-xl">
                  <div className="p-6 border-b border-white/5">
                    <h3 className="font-bold text-white uppercase tracking-widest text-xs">Encrypted Messages</h3>
                  </div>
                  <div className="overflow-y-auto flex-1">
                    {MOCK_CONVERSATIONS.map(conv => (
                       <div key={conv.id} className="flex items-center gap-4 p-5 hover:bg-white/5 cursor-pointer border-b border-white/5 transition-colors group">
                         <div className="relative">
                            <img src={conv.avatar} className="w-12 h-12 rounded-full border border-white/10 group-hover:border-emerald-500/50 transition-colors" />
                            {conv.unread > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold shadow-lg border border-slate-900">{conv.unread}</span>}
                         </div>
                         <div className="overflow-hidden">
                           <h4 className="font-bold text-slate-200 text-sm truncate group-hover:text-emerald-400 transition-colors">{conv.user}</h4>
                           <p className="text-xs text-slate-500 truncate">{conv.lastMessage}</p>
                         </div>
                       </div>
                    ))}
                  </div>
               </div>
               
               {/* Chat Area */}
               <div className="flex-1 flex flex-col bg-slate-900/40 relative">
                  <div className="absolute inset-0 pointer-events-none bg-emerald-900/5 blur-[100px]"></div>
                  
                  <div className="p-5 border-b border-white/5 flex justify-between items-center backdrop-blur-md relative z-10">
                    <span className="font-bold text-white">Debt Eraser (Admin)</span>
                    <span className="text-[10px] text-emerald-500 flex items-center gap-1.5 font-bold uppercase tracking-wider"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></span> Online</span>
                  </div>
                  <div className="flex-1 p-6 flex flex-col justify-end space-y-4 overflow-y-auto relative z-10">
                    <div className="flex justify-start">
                      <div className="glass-panel p-5 rounded-2xl rounded-bl-none max-w-sm border border-white/10 bg-slate-800/50">
                        <p className="text-sm text-slate-300 leading-relaxed">Welcome to the inner circle. Let me know if you hit any roadblocks with the templates.</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-5 bg-slate-950/20 border-t border-white/5 relative z-10 backdrop-blur">
                    <div className="flex gap-3">
                       <input className="flex-1 bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-emerald-500/50 placeholder:text-slate-600 transition-all" placeholder="Type a secure message..." />
                       <button className="bg-emerald-600 text-white p-4 rounded-xl hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-900/20"><Send size={18} /></button>
                    </div>
                  </div>
               </div>
            </div>
          )}

          {/* --- TAB 6: ABOUT --- */}
          {activeTab === 'about' && (
            <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
               <div className="glass-panel p-12 rounded-3xl relative overflow-hidden border border-white/10">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none"></div>
                  <h2 className="text-5xl font-oswald font-bold text-white mb-8 uppercase">OUR MISSION</h2>
                  <p className="text-slate-300 leading-relaxed text-lg mb-8 font-light">
                    The modern credit system is designed to keep you in a perpetual state of servitude. Our mission is to provide you with the <span className="text-emerald-400 font-bold">tactical knowledge</span>, <span className="text-emerald-400 font-bold">legal templates</span>, and <span className="text-emerald-400 font-bold">community support</span> required to break those chains legally and permanently.
                  </p>
                  <p className="text-slate-300 leading-relaxed text-lg font-light">
                    We believe every individual has the right to a fair and accurate credit report, and that no corporation has the right to intimidate you into paying debts you do not owe or that cannot be validated.
                  </p>
               </div>

               <div className="border border-white/10 p-8 rounded-2xl text-slate-500 text-xs bg-black/20 backdrop-blur-sm">
                  <h3 className="font-bold text-slate-400 mb-3 uppercase tracking-widest flex items-center gap-2"><ShieldAlert size={16}/> Legal Disclaimer</h3>
                  <p className="mb-4 leading-relaxed">
                    Debt Eraser Pro is an educational platform. We are NOT attorneys and we do not provide legal advice. All content, documents, and communications are for educational and informational purposes only.
                  </p>
                  <p className="leading-relaxed">
                    Consumer protection laws (FCRA, FDCPA) vary by jurisdiction. You are responsible for your own financial decisions and legal actions. If you require legal representation, please consult a bar-certified attorney in your state.
                  </p>
               </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};