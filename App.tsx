
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  AgentRole, 
  SharedState, 
  AgentLog, 
  Recommendation 
} from './types';
import { AgentService } from './services/geminiService';
import { AGENT_METADATA } from './constants';

const INITIAL_STATE: SharedState = {
  userQuery: '',
  profile: '',
  researchData: '',
  draftRecommendations: [],
  criticFeedback: '',
  finalRecommendations: [],
  currentTurn: 0,
  maxTurns: 10,
  isHumanApprovalRequired: false,
  status: 'idle',
};

const App: React.FC = () => {
  const [state, setState] = useState<SharedState>(INITIAL_STATE);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [input, setInput] = useState('');
  const [showHandbook, setShowHandbook] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((role: AgentRole, thought: string) => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      role,
      thought,
      timestamp: Date.now()
    }]);
  }, []);

  const scrollToBottom = () => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  const runWorkflow = async (query: string) => {
    let currentState: SharedState = { 
      ...INITIAL_STATE, 
      userQuery: query, 
      status: 'processing',
      currentTurn: 1 
    };
    setState(currentState);
    setLogs([]);
    
    addLog(AgentRole.SUPERVISOR, `Initializing recommendation engine for: "${query}"`);

    try {
      // PROFILER STEP
      const profilerRes = await AgentService.runProfiler(currentState);
      addLog(AgentRole.PROFILER, profilerRes.log);
      currentState = { ...currentState, ...profilerRes.updatedState, currentTurn: 2 };
      setState(currentState);

      // RESEARCHER STEP
      const researchRes = await AgentService.runResearcher(currentState);
      addLog(AgentRole.RESEARCHER, researchRes.log);
      currentState = { ...currentState, ...researchRes.updatedState, currentTurn: 3 };
      setState(currentState);

      // CURATOR STEP
      const curatorRes = await AgentService.runCurator(currentState);
      addLog(AgentRole.CURATOR, curatorRes.log);
      currentState = { ...currentState, ...curatorRes.updatedState, currentTurn: 4 };
      setState(currentState);

      // CRITIC STEP
      const criticRes = await AgentService.runCritic(currentState);
      addLog(AgentRole.CRITIC, criticRes.log);
      currentState = { ...currentState, ...criticRes.updatedState, currentTurn: 5 };
      
      if (criticRes.updatedState.isHumanApprovalRequired) {
        currentState.status = 'awaiting_human';
      } else {
        currentState.status = 'completed';
        currentState.finalRecommendations = currentState.draftRecommendations;
      }
      
      setState(currentState);
    } catch (error) {
      console.error(error);
      addLog(AgentRole.SUPERVISOR, "Critical error in the grid. Rebooting sequence required.");
      setState(prev => ({ ...prev, status: 'error' }));
    }
  };

  const handleApprove = () => {
    setState(prev => ({
      ...prev,
      finalRecommendations: prev.draftRecommendations,
      status: 'completed',
      isHumanApprovalRequired: false
    }));
    addLog(AgentRole.SUPERVISOR, "Human approved! Delivery sequence finalized.");
  };

  const handleReject = () => {
    setState(INITIAL_STATE);
    setLogs([]);
    addLog(AgentRole.SUPERVISOR, "Human rejected. System reset. Give me something better!");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      runWorkflow(input);
      setInput('');
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col max-w-5xl mx-auto relative">
      {/* Handbook Modal */}
      {showHandbook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="retro-border bg-purple-900 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 relative font-sans">
            <button 
              onClick={() => setShowHandbook(false)}
              className="absolute top-2 right-2 bg-pink-500 text-white px-2 py-1 text-xs font-bold"
            >
              [X] CLOSE
            </button>
            <h2 className="retro-title text-xl text-pink-500 mb-6 uppercase">System_Handbook</h2>
            
            <div className="space-y-6">
              <section>
                <h3 className="text-cyan-400 font-bold mb-2 uppercase border-b border-cyan-900 pb-1">Quick Tutorial</h3>
                <ol className="list-decimal list-inside text-sm space-y-2 text-pink-100 italic">
                  <li>Type your favorite movies, genres, or current mood in the command line.</li>
                  <li>Hit 'ENGAGE' and watch the Agent Network (NaiWatches Grid) collaborate in the System Logs.</li>
                  <li>The Critic Agent will present a draft. Review it in the Preview window.</li>
                  <li>Click 'APPROVE' to finalize the plan or 'REJECT' to reboot the system.</li>
                </ol>
              </section>

              <section>
                <h3 className="text-cyan-400 font-bold mb-4 uppercase border-b border-cyan-900 pb-1">Agent Roles</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(AGENT_METADATA).map(([role, meta]) => (
                    <div key={role} className="border border-purple-700 p-2 bg-black/20">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{meta.icon}</span>
                        <span className="text-xs font-black text-pink-400">{meta.name}</span>
                      </div>
                      <p className="text-[10px] text-purple-300 leading-tight">
                        {role === 'SUPERVISOR' && "Boss Brain 9000: Oversees the entire pipeline and manages system state transitions."}
                        {role === 'PROFILER' && "Vibe Analyzer: Deconstructs your text into actionable cinematic metadata."}
                        {role === 'RESEARCHER' && "Web Scout: Scours the web using Google Search for real-time ratings and trends."}
                        {role === 'CURATOR' && "Mix Master: Hand-picks the final list and writes personalized rationales."}
                        {role === 'CRITIC' && "Hype Checker: Peer-reviews the draft for quality and ensures no hallucinations."}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="mb-10 text-center relative">
        <div className="absolute top-0 right-0">
          <button 
            onClick={() => setShowHandbook(true)}
            className="retro-button bg-cyan-500 text-black px-4 py-1 font-bold text-[10px] uppercase animate-pulse"
          >
            ? Help/Manual
          </button>
        </div>
        <h1 className="retro-title text-3xl md:text-5xl mb-4 italic">
          NAI_WATCHES
        </h1>
        <p className="text-pink-400 font-bold uppercase tracking-widest text-sm">
          Multi-Agent Movie Network v.1.9.95
        </p>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow">
        
        {/* Left: Agent Thought Stream */}
        <div className="lg:col-span-7 flex flex-col h-[600px]">
          <div className="retro-border bg-black/50 p-4 flex-grow overflow-y-auto mb-4 custom-scrollbar">
            <h2 className="text-xs font-bold mb-4 flex items-center gap-2 text-cyan-400 uppercase">
              <span className="animate-pulse">●</span> Grid_Output_Log
            </h2>
            
            {logs.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-purple-700 font-bold italic opacity-50">
                <p>AWAITING_INPUT_COMMAND...</p>
                <p className="text-[10px] mt-2 uppercase">NaiWatches is ready for your signal.</p>
              </div>
            )}

            <div className="space-y-4">
              {logs.map(log => (
                <div key={log.id} className="border-l-2 border-purple-500 pl-3 py-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`${AGENT_METADATA[log.role].color} text-[10px] px-1 font-bold text-white uppercase`}>
                      {AGENT_METADATA[log.role].name}
                    </span>
                    <span className="text-[10px] text-purple-500 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}
                    </span>
                  </div>
                  <p className="text-sm text-pink-100">{log.thought}</p>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="relative">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={state.status === 'processing' || state.status === 'awaiting_human'}
              className="w-full bg-purple-900 border-4 border-pink-500 p-4 pr-32 text-pink-100 focus:outline-none placeholder-purple-700 font-mono"
              placeholder="ENTER VIBES (E.G. '90S ACTION MOVIES WITH KEANU')..."
            />
            <button 
              type="submit"
              disabled={state.status === 'processing' || state.status === 'awaiting_human'}
              className="absolute right-2 top-1/2 -translate-y-1/2 retro-button bg-pink-500 text-purple-900 font-black px-6 py-2 uppercase text-xs"
            >
              ENGAGE
            </button>
          </form>
        </div>

        {/* Right: Results / Profile / Approval */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Status Monitor */}
          <div className="retro-border bg-purple-950 p-4">
            <h3 className="text-xs font-bold text-pink-500 mb-3 border-b border-pink-900 pb-1 uppercase">Monitor_V3</h3>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span>SYSTEM:</span>
                <span className="text-cyan-400">NAIWATCHES_GRID</span>
              </div>
              <div className="flex justify-between">
                <span>PHASE:</span>
                <span className="text-cyan-400">{state.status.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span>MEMORY:</span>
                <span className="text-pink-400">{state.profile ? 'LOADED' : 'EMPTY'}</span>
              </div>
            </div>
          </div>

          {/* Recommendation Cards */}
          <div className="retro-border bg-indigo-950 p-4 flex-grow overflow-y-auto">
             <h3 className="text-xs font-bold text-cyan-400 mb-4 uppercase tracking-widest">Nai_Selection</h3>
             
             {state.status === 'awaiting_human' && (
               <div className="mb-6 p-4 bg-purple-800 border-2 border-yellow-400">
                  <div className="text-yellow-400 font-black text-center text-[10px] mb-2 uppercase tracking-tighter">
                    Authorization Required
                  </div>
                  <p className="text-[10px] text-white mb-3 text-center italic">"The Critic has approved these hits. Deploy results?"</p>
                  <div className="flex gap-2">
                    <button onClick={handleApprove} className="flex-1 bg-green-500 text-black font-bold p-2 text-xs retro-button">DEPLOY</button>
                    <button onClick={handleReject} className="flex-1 bg-red-500 text-black font-bold p-2 text-xs retro-button">CANCEL</button>
                  </div>
               </div>
             )}

             <div className="space-y-4">
               {(state.status === 'completed' || state.status === 'awaiting_human') && (
                 (state.status === 'completed' ? state.finalRecommendations : state.draftRecommendations).map((rec, i) => (
                   <div key={i} className="border border-cyan-500 bg-black/40 p-3 hover:bg-cyan-900/20 transition-colors">
                     <div className="flex justify-between items-start mb-2">
                       <h4 className="text-pink-300 font-bold leading-tight uppercase tracking-tight">{rec.title}</h4>
                       <span className="text-[10px] bg-cyan-900 text-cyan-100 px-1">{rec.type === 'movie' ? 'FILM' : 'TV'}</span>
                     </div>
                     <div className="flex gap-4 text-[10px] mb-2 text-cyan-400 font-bold font-mono">
                       <span>YEAR: {rec.year}</span>
                       <span>SCORE: {rec.rating}</span>
                     </div>
                     <p className="text-[11px] text-indigo-100 leading-relaxed italic">{rec.rationale}</p>
                   </div>
                 ))
               )}

               {state.status === 'idle' && (
                 <div className="text-center py-20 opacity-20">
                    <div className="text-4xl mb-2">📼</div>
                    <p className="text-[10px] uppercase font-bold">Grid Idle...</p>
                 </div>
               )}

               {state.status === 'processing' && (
                  <div className="text-center py-20">
                    <div className="text-2xl mb-2 animate-spin inline-block">⚙️</div>
                    <p className="text-[10px] uppercase font-bold tracking-widest animate-pulse">Syncing_Nodes...</p>
                  </div>
               )}
             </div>
          </div>
        </div>

      </div>

      {/* Footer / Marquee */}
      <footer className="mt-8 overflow-hidden bg-pink-600 text-purple-900 font-bold p-1 text-[10px] uppercase whitespace-nowrap">
        <div className="animate-marquee inline-block">
          Welcome to NaiWatches // Multi-Agent Collaborative Grid Active // Real-time research grounding engaged // 90s Aesthetic, Modern Intelligence // Powered by Gemini Neural Tech // Your next watch is being calculated... 
        </div>
      </footer>
      
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #2e1065;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #ec4899;
        }
      `}</style>
    </div>
  );
};

export default App;
