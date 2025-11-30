import React, { useState, useEffect, useRef } from 'react';
import { ViewState, User, QuizAnswer, AnalysisResult } from './types';
import { analyzeQuizResults } from './services/geminiService';
import { Dashboard } from './components/Dashboard';
import { Button } from './components/Button';
import { CheckCircle, AlertTriangle, ChevronRight, Lock, DollarSign, FileText, Menu, X, Star, Shield, Users, Video, BrainCircuit, CreditCard, ArrowDown, Key, Clock, Zap, Gavel, FileCheck } from 'lucide-react';

// EXPANDED QUESTIONS FOR DEEP DIVE
const QUESTIONS = [
  { id: 1, text: "What is your total estimated debt load?", options: ["Under $10k", "$10k - $50k", "$50k - $100k", "Over $100k (I'm drowning)"] },
  { id: 2, text: "Which debt type is your absolute worst nightmare right now?", options: ["Mortgage / Foreclosure threats", "Car Repossession / Auto Loans", "Credit Cards & Personal Loans", "Court Fines / Traffic Tickets / Admin"] },
  { id: 3, text: "Have any of these accounts been sold to 3rd party junk debt buyers?", options: ["No, still with original creditor", "Yes, getting calls daily", "Yes, they are threatening legal action", "I'm not sure"] },
  { id: 4, text: "Are there any 'Governmental' or 'Administrative' issues attached?", options: ["No", "Yes, Taxes/IRS", "Yes, Child Support/Alimony", "Yes, Court Fines/Tickets"] },
  { id: 5, text: "Are you currently facing wage garnishment or bank levies?", options: ["No", "Yes, it's active", "They are threatening it", "I'm self-employed / 1099"] },
  { id: 6, text: "What is your current credit score range?", options: ["Below 500", "500 - 599", "600 - 679", "680+ but high utilization"] },
  { id: 7, text: "How many inquiries do you have on your report?", options: ["0-2", "3-5", "6-10", "10+ (Too many to count)"] },
  { id: 8, text: "What is your primary objective?", options: ["Buy a Home / Investment Property", "Start a Business / Get Funding", "Stop the Harassment / Peace of Mind", "Total Financial Reset / Clean Slate"] }
];

const App: React.FC = () => {
  // State
  const [view, setView] = useState<ViewState>(ViewState.LANDING);
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswer[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLeadCaptured, setIsLeadCaptured] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'community' | 'consult' | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState({ hours: 11, minutes: 45, seconds: 0 });

  const offerSectionRef = useRef<HTMLDivElement>(null);

  // Countdown Timer Effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        return { hours: prev.hours, minutes: 59, seconds: 59 }; // Loop roughly
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Check for existing session
  useEffect(() => {
    const storedUser = localStorage.getItem('dep_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setView(ViewState.DASHBOARD);
    } else {
      const leadEmail = localStorage.getItem('dep_lead_email');
      if (leadEmail) {
        setEmailInput(leadEmail);
        setIsLeadCaptured(true);
      }
    }
  }, []);

  // Handlers
  const startQuiz = () => {
    setQuizAnswers([]);
    setCurrentQuestionIndex(0);
    setView(ViewState.QUIZ);
  };

  const handleAnswer = (answer: string) => {
    const newAnswers = [...quizAnswers, { questionId: QUESTIONS[currentQuestionIndex].id, answer }];
    setQuizAnswers(newAnswers);

    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setView(ViewState.ANALYZING);
      processQuiz(newAnswers);
    }
  };

  const processQuiz = async (answers: QuizAnswer[]) => {
    const formattedAnswers = answers.map(a => ({
      question: QUESTIONS.find(q => q.id === a.questionId)?.text || '',
      answer: a.answer
    }));
    
    const result = await analyzeQuizResults(formattedAnswers);
    setAnalysis(result);
    // Artificially wait to show "Processing" animation
    setTimeout(() => {
      setView(ViewState.RESULTS);
    }, 2500);
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.includes('@')) return;
    
    localStorage.setItem('dep_lead_email', emailInput);
    setIsLeadCaptured(true);
    
    setTimeout(() => {
      offerSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 300);
  };

  const openPaymentModal = (plan: 'community' | 'consult') => {
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessingPayment(true);

    setTimeout(() => {
      const email = emailInput || user?.email || localStorage.getItem('dep_lead_email') || 'user@example.com';
      const payingUser: User = { email, hasAccessToCommunity: true, name: email.split('@')[0] };
      
      localStorage.setItem('dep_user', JSON.stringify(payingUser));
      setUser(payingUser);
      setIsProcessingPayment(false);
      setShowPaymentModal(false);
      setView(ViewState.DASHBOARD);
    }, 2000);
  };

  const logout = () => {
    localStorage.removeItem('dep_user');
    setUser(null);
    setView(ViewState.LANDING);
    setQuizAnswers([]);
    setCurrentQuestionIndex(0);
  };

  // --- Render ---

  if (view === ViewState.DASHBOARD && user) {
    return <Dashboard user={user} onLogout={logout} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-emerald-500 selection:text-white overflow-x-hidden relative">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-emerald-900/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[100px]"></div>
      </div>

      {/* LIVE BANNER (Sticky Top) */}
      {!user && view !== ViewState.DASHBOARD && (
        <div className="sticky top-0 z-[60] bg-emerald-900/80 backdrop-blur-md border-b border-emerald-500/20 text-center py-2 px-4 shadow-lg flex justify-center items-center gap-4">
           <div className="flex items-center gap-2 text-xs md:text-sm font-bold text-white tracking-widest uppercase">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_#ef4444]"></span>
            <span>Live Enrollment Closing In:</span>
            <span className="font-mono text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded bg-black/30">
              {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
            </span>
           </div>
           <button onClick={startQuiz} className="hidden md:block text-[10px] font-bold bg-emerald-600 px-3 py-1 rounded hover:bg-emerald-500 transition-colors uppercase">
             Start Now
           </button>
        </div>
      )}

      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${view === ViewState.LANDING ? 'bg-transparent mt-8' : 'bg-slate-950/80 backdrop-blur-md border-b border-white/5 top-10'} pt-4 pb-4`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView(ViewState.LANDING)}>
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded flex items-center justify-center shadow-lg shadow-emerald-500/20 border border-emerald-400/20">
                <span className="font-oswald font-bold text-white text-xl">D</span>
              </div>
              <span className="font-oswald font-bold text-2xl tracking-tighter text-white">DEBT <span className="text-emerald-500">ERASER</span> PRO</span>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <Button onClick={startQuiz} variant="primary" className="py-2 px-8 text-xs !bg-emerald-700 hover:!bg-emerald-600 !rounded-full shadow-[0_0_20px_rgba(16,185,129,0.2)] border border-emerald-400/20">Start Free Analysis</Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-24 relative z-10">
        
        {/* LANDING PAGE */}
        {view === ViewState.LANDING && (
          <>
            <section className="relative py-24 lg:py-32 overflow-hidden flex flex-col items-center text-center">
              <div className="max-w-5xl mx-auto px-4 relative z-10">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 border border-emerald-500/30 rounded-full bg-emerald-500/10 backdrop-blur-md text-emerald-400 font-bold uppercase tracking-widest text-[10px] animate-fade-in shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                  <Shield size={12} /> Federal Loophole Strategy Detected
                </div>
                
                <h1 className="text-5xl md:text-7xl lg:text-9xl font-oswald font-bold text-white leading-[1] mb-8 drop-shadow-2xl tracking-tighter">
                  DELETE YOUR <span className="text-emerald-500">PAST.</span><br/>
                  OWN YOUR <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-500">FUTURE.</span>
                </h1>
                
                <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-300 mb-12 leading-relaxed font-light">
                  I know your credit is f*cked up right now. You're owing third-party collectors and everyone under the sun. 
                  Let's get your sh*t wiped clean. Credit sweeps, challenging debt, the whole nine yards.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                  <Button onClick={startQuiz} className="text-lg px-12 py-5 shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_50px_rgba(16,185,129,0.4)] !bg-emerald-600 hover:!bg-emerald-500 !rounded-full transition-all duration-300 transform hover:scale-105 border border-emerald-400/30">
                    START FREE ANALYSIS
                  </Button>
                </div>
              </div>
            </section>
            
            <div className="border-y border-white/5 bg-white/5 backdrop-blur-sm py-12">
              <div className="max-w-7xl mx-auto px-4 flex flex-wrap justify-center gap-12 md:gap-24 opacity-30 hover:opacity-100 transition-all duration-700 grayscale hover:grayscale-0">
                 {['TRANSUNION', 'EXPERIAN', 'EQUIFAX'].map((b) => (
                   <h3 key={b} className="text-3xl md:text-4xl font-bold text-slate-300 tracking-[0.2em] line-through decoration-emerald-500 decoration-4">{b}</h3>
                 ))}
              </div>
            </div>
          </>
        )}

        {/* QUIZ VIEW (EXPANDED TO 8 QUESTIONS) */}
        {view === ViewState.QUIZ && (
          <div className="min-h-[80vh] flex items-center justify-center p-4">
            <div className="w-full max-w-2xl glass-card rounded-3xl p-8 md:p-12 relative overflow-hidden animate-fade-in-up">
              {/* Progress Bar */}
              <div className="absolute top-0 left-0 h-1.5 bg-slate-800 w-full">
                 <div className="h-full bg-emerald-500 transition-all duration-500 ease-out shadow-[0_0_10px_#10b981]" style={{ width: `${((currentQuestionIndex + 1) / QUESTIONS.length) * 100}%` }}></div>
              </div>
              
              <div className="mb-10 mt-4">
                <span className="text-emerald-400 font-bold tracking-widest text-xs uppercase bg-emerald-900/30 px-3 py-1 rounded-full border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                  Diagnostic {currentQuestionIndex + 1} / {QUESTIONS.length}
                </span>
                <h2 className="text-2xl md:text-4xl font-oswald font-bold text-white mt-6 leading-tight">{QUESTIONS[currentQuestionIndex].text}</h2>
              </div>

              <div className="space-y-4">
                {QUESTIONS[currentQuestionIndex].options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(option)}
                    className="w-full text-left p-5 rounded-xl border border-white/10 bg-white/5 hover:bg-emerald-600/10 hover:border-emerald-500/50 transition-all group flex items-center justify-between backdrop-blur-sm"
                  >
                    <span className="font-semibold text-slate-300 group-hover:text-white text-lg transition-colors">{option}</span>
                    <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-emerald-500 group-hover:border-emerald-500 transition-all">
                      <ChevronRight size={16} className="text-slate-400 group-hover:text-white" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ANALYZING VIEW */}
        {view === ViewState.ANALYZING && (
          <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 text-center">
            <div className="relative w-40 h-40 mb-10">
              <div className="absolute inset-0 border-t-2 border-emerald-500 rounded-full animate-spin shadow-[0_0_20px_rgba(16,185,129,0.2)]"></div>
              <div className="absolute inset-4 border-r-2 border-slate-600 rounded-full animate-spin-slow"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                 <BrainCircuit className="text-emerald-500 opacity-80 animate-pulse" size={48} />
              </div>
            </div>
            <h2 className="text-4xl font-oswald font-bold text-white animate-pulse mb-6 tracking-widest">ANALYZING MAINFRAME...</h2>
            <div className="space-y-3 text-emerald-500/80 font-mono text-xs uppercase tracking-widest">
              <p className="animate-fade-in-up" style={{animationDelay: '0.2s'}}>Decrypting Trade Lines...</p>
              <p className="animate-fade-in-up" style={{animationDelay: '1s'}}>Scanning for FCRA Violations...</p>
              <p className="animate-fade-in-up" style={{animationDelay: '1.8s'}}>Identifying Metro 2 Errors...</p>
              <p className="animate-fade-in-up" style={{animationDelay: '2.5s'}}>Compiling Battle Plan...</p>
            </div>
          </div>
        )}

        {/* RESULTS VIEW */}
        {view === ViewState.RESULTS && analysis && (
          <div className="max-w-7xl mx-auto px-4 py-12">
            
            {/* Header */}
            <div className="text-center mb-16 animate-fade-in-up">
              <div className="inline-block bg-red-500/10 border border-red-500/50 px-6 py-2 rounded-full text-red-400 text-xs font-bold uppercase tracking-widest mb-6 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                 <AlertTriangle size={12} className="inline mr-2 mb-0.5" /> Action Required Immediately
              </div>
              <h1 className="text-4xl md:text-6xl font-oswald font-bold text-white mb-4">
                ARCHETYPE: <span className="text-emerald-500 border-b-4 border-emerald-500/50 pb-1">{analysis.archetype}</span>
              </h1>
              <p className="text-xl text-slate-400 max-w-2xl mx-auto font-light">
                Analysis complete. We have identified multiple leverage points in your credit profile.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 mb-32 items-stretch">
              {/* Left: The Plan */}
              <div className="glass-panel p-8 md:p-12 rounded-3xl relative overflow-hidden group border-l-4 border-l-emerald-500">
                 <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Shield size={200} />
                 </div>
                 
                 <div className="mb-8">
                   <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                     <span className="w-8 h-8 rounded bg-emerald-500/20 flex items-center justify-center text-emerald-400"><Zap size={18}/></span>
                     Strategic Overview
                   </h3>
                   <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                     <div className="h-full w-1/3 bg-emerald-500"></div>
                   </div>
                 </div>

                 <p className="text-slate-300 leading-relaxed text-lg mb-10 font-light">{analysis.plan}</p>
                 
                 <div className="p-6 bg-slate-950/50 border border-emerald-500/30 rounded-xl relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                   <p className="text-emerald-400 font-bold text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                     <FileCheck size={14} /> Recommended Protocol
                   </p>
                   <p className="text-white font-oswald text-2xl md:text-3xl uppercase">{analysis.pdfStack}</p>
                   <p className="text-slate-500 text-xs mt-2">Specifically tailored for your {quizAnswers[1]?.answer.split(' ')[0]} situation.</p>
                 </div>
              </div>

              {/* Right: Lead Capture */}
              <div className="glass-card p-8 md:p-12 rounded-3xl flex flex-col justify-center relative shadow-[0_0_50px_rgba(16,185,129,0.05)] border-t border-white/10">
                {!isLeadCaptured ? (
                  <div className="text-center">
                    <div className="mb-8">
                      <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                        <Lock className="text-emerald-400" size={36} />
                      </div>
                      <h3 className="text-3xl font-bold text-white mb-4">Unlock Protocol</h3>
                      <p className="text-slate-400">Enter your email to receive the <span className="text-emerald-400 font-bold">{analysis.pdfStack}</span> and your full battle plan.</p>
                    </div>
                    <form onSubmit={handleEmailSubmit} className="space-y-4">
                      <div className="relative group">
                        <input 
                          type="email" 
                          required
                          placeholder="Enter your primary email address..." 
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          className="w-full bg-slate-950/50 border border-slate-700 rounded-xl p-5 text-white focus:border-emerald-500 focus:outline-none transition-all placeholder:text-slate-600 group-hover:border-slate-600"
                        />
                      </div>
                      <Button type="submit" fullWidth className="!bg-emerald-600 hover:!bg-emerald-500 !py-5 text-lg !rounded-xl shadow-lg shadow-emerald-900/50 uppercase tracking-widest">
                        SEND MY DOCUMENTS
                      </Button>
                      <p className="text-[10px] text-slate-600 uppercase tracking-widest mt-4 flex justify-center gap-2">
                        <Lock size={10} /> Encrypted 256-bit Connection
                      </p>
                    </form>
                  </div>
                ) : (
                  <div className="text-center animate-fade-in flex flex-col items-center justify-center h-full">
                    <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(16,185,129,0.4)] animate-bounce-slow">
                      <CheckCircle size={48} className="text-white" />
                    </div>
                    <h3 className="text-4xl font-bold text-white mb-3">Transmission Complete</h3>
                    <p className="text-emerald-400 font-mono text-sm mb-12 border border-emerald-500/20 px-4 py-2 rounded bg-emerald-900/10">CHECK YOUR INBOX IN 5 MINUTES</p>
                    <div className="animate-bounce">
                      <ArrowDown className="mx-auto text-slate-500" size={32} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* THE BRIDGE / SALES LETTER */}
            {isLeadCaptured && (
            <div ref={offerSectionRef} className="animate-fade-in-up transition-all duration-1000">
              
              {/* Sales Copy Container */}
              <div className="glass-panel max-w-5xl mx-auto rounded-3xl p-8 md:p-20 mb-24 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-800 via-emerald-500 to-emerald-800"></div>
                
                <h2 className="text-4xl md:text-6xl font-oswald font-bold text-center text-white mb-16 uppercase leading-tight">
                  The <span className="text-emerald-500">Hard Truth</span> About Your Debt
                </h2>

                <div className="space-y-10 text-lg md:text-xl text-slate-300 leading-relaxed font-light max-w-4xl mx-auto">
                  <p className="first-letter:text-4xl first-letter:font-bold first-letter:text-emerald-500">
                    Hey, thank you so much for starting your journey. You're going to do fantastic. We provide as much support as we can.
                  </p>
                  
                  <p>
                    And although we are not able to provide you with legal advice, we will be there every step of the way should you need our assistance with regards to any of the documents that we maintain, create, and have absolutely utilized to wipe our slates clean.
                  </p>
                  
                  <div className="bg-slate-950/40 border-l-4 border-emerald-500 p-8 md:p-10 rounded-r-2xl italic text-white font-medium shadow-inner my-12">
                    "Understand that you're going to face challenges. These people have been doing this for so long that letting go of that reign is entirely foreign to them. <span className="text-emerald-400">They will fight you tooth and nail.</span> So make sure that you don't mess around. Know who you are, what you stand on, and stay on it. Don't move off your square."
                  </div>

                  <p>
                    It's imperative, especially with the state of this country at the moment, that we take not only our financial status and standing seriously, but the legacy that we're leaving behind for our children. We were never meant to be debt slaves here. We were meant to thrive, meant to prosper, and abundance.
                  </p>

                  <div className="text-center py-16 border-y border-white/5 my-12">
                     <h3 className="text-3xl md:text-5xl font-oswald font-bold text-white uppercase leading-tight mb-6">
                      Step out of that debt mindset and switch on the <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Creditor Flip</span>.
                    </h3>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                      Because that's what you are. Your signature creates credit that backs the entire f*cking economy.
                    </p>
                  </div>

                  <p className="text-center text-xl">
                    There are so many gems inside of our community that we drop on the daily that you'll be leaving that b*tch with a treasure chest.
                  </p>
                </div>

                {/* GLASSMORPHIC FEATURE GRID (CAROUSEL STYLE) */}
                <div className="grid md:grid-cols-3 gap-6 mt-20 mb-16">
                   {/* Feature 1 */}
                   <div className="glass-card p-8 rounded-2xl group hover:-translate-y-2 transition-transform duration-300 border-t border-white/10">
                      <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors border border-emerald-500/20">
                        <FileText size={32} />
                      </div>
                      <h4 className="font-bold text-white text-xl mb-3 uppercase text-center">The Vault</h4>
                      <p className="text-sm text-slate-400 text-center leading-relaxed">Download the exact legal templates, affidavits, and letters I personally used to wipe my slate clean.</p>
                   </div>
                   
                   {/* Feature 2 */}
                   <div className="glass-card p-8 rounded-2xl group hover:-translate-y-2 transition-transform duration-300 border-t border-white/10">
                      <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors border border-emerald-500/20">
                        <BrainCircuit size={32} />
                      </div>
                      <h4 className="font-bold text-white text-xl mb-3 uppercase text-center">War Room AI</h4>
                      <p className="text-sm text-slate-400 text-center leading-relaxed">24/7 Expert Bot trained on the FCRA & FDCPA. It writes your letters and answers complex questions instantly.</p>
                   </div>
                   
                   {/* Feature 3 */}
                   <div className="glass-card p-8 rounded-2xl group hover:-translate-y-2 transition-transform duration-300 border-t border-white/10">
                      <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors border border-emerald-500/20">
                        <Users size={32} />
                      </div>
                      <h4 className="font-bold text-white text-xl mb-3 uppercase text-center">The Tribe</h4>
                      <p className="text-sm text-slate-400 text-center leading-relaxed">Join a syndicate of like-minded individuals. Share wins, get backup, and stop fighting alone.</p>
                   </div>
                </div>

                <div className="text-center">
                  <p className="text-emerald-500 font-bold uppercase tracking-[0.3em] text-xs mb-4">Don't do this alone</p>
                  <h3 className="text-3xl md:text-4xl font-bold text-white">Join the Army that's already winning.</h3>
                </div>
              </div>

              {/* IDENTICAL PRICING CARDS */}
              <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto pb-32 px-4">
                
                {/* Fusion Community */}
                <div className="glass-card p-8 md:p-12 rounded-3xl border border-emerald-500/40 hover:border-emerald-400 transition-all duration-300 relative group flex flex-col shadow-[0_0_40px_rgba(16,185,129,0.05)] hover:shadow-[0_0_60px_rgba(16,185,129,0.1)]">
                  <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 rounded-t-3xl"></div>
                  
                  <div className="flex justify-between items-start mb-8">
                    <h3 className="text-2xl font-bold text-white uppercase tracking-wider">Fusion Community</h3>
                    <div className="bg-emerald-500/10 text-emerald-400 px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider border border-emerald-500/20">Monthly Access</div>
                  </div>
                  
                  <div className="text-6xl font-oswald font-bold text-white mb-2">$97<span className="text-lg font-sans font-medium text-slate-500">/mo</span></div>
                  <p className="text-slate-400 text-sm mb-10">Full access to the ecosystem. Cancel anytime.</p>
                  
                  <ul className="space-y-6 mb-12 flex-1">
                    <li className="flex gap-4 items-center text-slate-200"><CheckCircle className="text-emerald-500 shrink-0" size={24} /> <span className="font-medium text-lg">Instant Access to "The Vault"</span></li>
                    <li className="flex gap-4 items-center text-slate-200"><CheckCircle className="text-emerald-500 shrink-0" size={24} /> <span className="font-medium text-lg">24/7 War Room AI Assistant</span></li>
                    <li className="flex gap-4 items-center text-slate-200"><CheckCircle className="text-emerald-500 shrink-0" size={24} /> <span className="font-medium text-lg">Community Chat & DM Access</span></li>
                    <li className="flex gap-4 items-center text-slate-200"><CheckCircle className="text-emerald-500 shrink-0" size={24} /> <span className="font-medium text-lg">Weekly Strategy Video Drops</span></li>
                  </ul>
                  
                  <Button onClick={() => openPaymentModal('community')} fullWidth className="!bg-emerald-600 hover:!bg-emerald-500 !py-6 text-xl !rounded-2xl shadow-xl shadow-emerald-900/40 uppercase tracking-widest font-bold">
                    JOIN THE COMMUNITY
                  </Button>
                </div>

                {/* 1-on-1 Consultation */}
                <div className="glass-card p-8 md:p-12 rounded-3xl border border-emerald-500/40 hover:border-emerald-400 transition-all duration-300 relative group flex flex-col shadow-[0_0_40px_rgba(16,185,129,0.05)] hover:shadow-[0_0_60px_rgba(16,185,129,0.1)]">
                  <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 rounded-t-3xl"></div>
                  
                  <div className="flex justify-between items-start mb-8">
                    <h3 className="text-2xl font-bold text-white uppercase tracking-wider">1-on-1 Strategy</h3>
                    <div className="bg-emerald-500/10 text-emerald-400 px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider border border-emerald-500/20">Single Session</div>
                  </div>
                  
                  <div className="text-6xl font-oswald font-bold text-white mb-2">$297<span className="text-lg font-sans font-medium text-slate-500">/call</span></div>
                  <p className="text-slate-400 text-sm mb-10">Direct line to the source. Custom tailored.</p>
                  
                  <ul className="space-y-6 mb-12 flex-1">
                    <li className="flex gap-4 items-center text-slate-200"><Star className="text-yellow-500 shrink-0" size={24} /> <span className="font-medium text-lg">60 Minute Zoom Strategy Call</span></li>
                    <li className="flex gap-4 items-center text-slate-200"><CheckCircle className="text-emerald-500 shrink-0" size={24} /> <span className="font-medium text-lg">Live Document Review</span></li>
                    <li className="flex gap-4 items-center text-slate-200"><CheckCircle className="text-emerald-500 shrink-0" size={24} /> <span className="font-medium text-lg">Custom "Battle Plan" PDF</span></li>
                    <li className="flex gap-4 items-center text-slate-200"><CheckCircle className="text-emerald-500 shrink-0" size={24} /> <span className="font-medium text-lg">Includes <b>1 Month Community Access</b></span></li>
                  </ul>
                  
                  <Button onClick={() => openPaymentModal('consult')} fullWidth className="!bg-emerald-600 hover:!bg-emerald-500 !py-6 text-xl !rounded-2xl shadow-xl shadow-emerald-900/40 uppercase tracking-widest font-bold">
                    BOOK CONSULTATION
                  </Button>
                </div>

              </div>
            </div>
            )}

            {/* PAYMENT MODAL (WITH AUTH) */}
            {showPaymentModal && (
              <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
                <div className="glass-card w-full max-w-md rounded-2xl p-6 relative border border-white/10">
                  <button onClick={() => setShowPaymentModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
                    <X size={24} />
                  </button>
                  
                  <h2 className="text-2xl font-oswald font-bold text-white mb-6 flex items-center gap-2">
                    <Lock className="text-emerald-500" size={24} /> SECURE CHECKOUT
                  </h2>

                  <div className="bg-white/5 p-4 rounded-xl mb-6 flex justify-between items-center border border-white/10">
                    <div>
                      <p className="text-xs text-slate-400 uppercase font-bold mb-1">Item</p>
                      <p className="text-white font-bold text-sm">{selectedPlan === 'community' ? 'Fusion Community Membership' : '1-on-1 Strategy Session'}</p>
                    </div>
                    <div className="text-emerald-400 font-bold text-xl font-oswald">
                      ${selectedPlan === 'community' ? '97.00' : '297.00'}
                    </div>
                  </div>

                  <form onSubmit={handlePayment} className="space-y-4">
                    {/* AUTH SIMULATION */}
                    <div className="p-4 bg-slate-950/50 border border-emerald-500/20 rounded-xl space-y-3">
                      <div className="flex items-center gap-2 mb-2">
                         <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                         <label className="text-xs uppercase font-bold text-emerald-400">Create Secure Account</label>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="relative opacity-60">
                           <Users className="absolute left-3 top-3 text-slate-500" size={16} />
                           <input type="email" value={emailInput} readOnly className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 pl-10 text-slate-300 text-sm cursor-not-allowed" />
                        </div>
                        <div className="relative">
                          <Key className="absolute left-3 top-3 text-slate-400" size={16} />
                          <input type="password" required placeholder="Create Master Password" className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 pl-10 text-white focus:border-emerald-500 outline-none text-sm placeholder:text-slate-600" />
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-white/10 my-2"></div>

                    {/* PAYMENT FORM */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Card Number</label>
                        <div className="relative">
                          <CreditCard className="absolute left-3 top-3.5 text-slate-400" size={18} />
                          <input type="text" placeholder="0000 0000 0000 0000" className="w-full bg-slate-900/80 border border-slate-700 rounded-lg p-3 pl-10 text-white focus:border-emerald-500 outline-none font-mono text-sm" />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Expiry</label>
                          <input type="text" placeholder="MM/YY" className="w-full bg-slate-900/80 border border-slate-700 rounded-lg p-3 text-white focus:border-emerald-500 outline-none font-mono text-sm" />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">CVC</label>
                          <input type="text" placeholder="123" className="w-full bg-slate-900/80 border border-slate-700 rounded-lg p-3 text-white focus:border-emerald-500 outline-none font-mono text-sm" />
                        </div>
                      </div>
                    </div>

                    <Button type="submit" fullWidth disabled={isProcessingPayment} className="!bg-emerald-600 hover:!bg-emerald-500 !rounded-xl !py-4 shadow-lg shadow-emerald-900/50 mt-4 uppercase font-bold tracking-wider">
                      {isProcessingPayment ? 'PROCESSING...' : `PAY $${selectedPlan === 'community' ? '97.00' : '297.00'} & JOIN`}
                    </Button>
                    <p className="text-[10px] text-center text-slate-500 mt-2 flex items-center justify-center gap-1">
                       <Lock size={10} /> 256-BIT SSL ENCRYPTED PAYMENT
                    </p>
                  </form>
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-black/40 border-t border-white/5 py-12 text-center text-slate-600 text-sm backdrop-blur-sm relative z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-4 flex justify-center gap-4">
            <span className="font-oswald font-bold text-white text-lg tracking-wider">DEBT ERASER PRO</span>
          </div>
          <p className="mb-6">&copy; 2024 Debt Eraser Pro. All rights reserved.</p>
          <p className="max-w-3xl mx-auto text-xs leading-relaxed opacity-60">
            Disclaimer: I am not a lawyer. This is not legal advice. I am a consumer advocate sharing strategies based on the FCRA and FDCPA. 
            Results are not guaranteed. The materials provided are for educational and informational purposes only. 
            Consult with a qualified attorney for legal advice regarding your specific situation.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;