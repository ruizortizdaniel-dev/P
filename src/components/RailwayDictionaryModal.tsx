import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  X, 
  Search, 
  BookOpen, 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  ExternalLink, 
  Copy, 
  Check, 
  ShieldAlert, 
  Train, 
  Layers, 
  ArrowRight, 
  HelpCircle,
  RefreshCw,
  Info
} from 'lucide-react';
import { ADIF_RAILWAY_DICTIONARY, DICTIONARY_CATEGORIES, RailwayTerm } from '../data/adifRailwayDictionary';

interface RailwayDictionaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { email: string; name: string; role: string } | null;
  initialQuery?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  relatedTerms?: RailwayTerm[];
  source?: string;
}

const SUGGESTED_QUESTIONS = [
  '¿Qué es un piquete de entrevías y qué peligro tiene?',
  '¿Cuál es la distancia de seguridad con la catenaria?',
  'Diferencia entre aguja, espadín y desvío',
  '¿Qué es la separación de fase en catenaria y qué peligro tiene?',
  '¿Cómo actúa el freno automático continuo en caso de avería?',
  '¿Qué precauciones tomar ante una aguja talonada?',
  '¿Qué riesgos operativos existen en una vía mango?',
  '¿Cómo funciona el sistema ASFA y el CTC de ADIF?',
  '¿Qué es un fanal y qué luces debe llevar un tren en cabeza y cola?'
];

export const RailwayDictionaryModal: React.FC<RailwayDictionaryModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  initialQuery = ''
}) => {
  const [activeTab, setActiveTab] = useState<'ai_chat' | 'glossary'>('ai_chat');

  // AI Chat state
  const [inputQuery, setInputQuery] = useState(initialQuery);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'model',
      text: `**¡Hola${currentUser?.name ? `, ${currentUser.name.split(' ')[0]}` : ''}!** Soy el **Asistente Oficial del Diccionario Ferroviario de ADIF**.\n\nPuedes preguntarme el significado de cualquier término técnico (agujas, balasto, catenaria, gálibos, enclavamientos, ASFA...), siglas reglamentarias o las precauciones de seguridad operativa que debes adoptar durante el servicio en vía.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      source: 'Diccionario Ferroviario Oficial de ADIF'
    }
  ]);

  // Glossary state
  const [glossarySearch, setGlossarySearch] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<string>('TODAS');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');

  // Available letters in dictionary
  const availableLetters = useMemo(() => {
    const letters = new Set<string>();
    ADIF_RAILWAY_DICTIONARY.forEach(t => letters.add(t.letter));
    return ['TODAS', ...Array.from(letters).sort()];
  }, []);

  // Filtered glossary terms
  const filteredTerms = useMemo(() => {
    return ADIF_RAILWAY_DICTIONARY.filter(t => {
      if (selectedLetter !== 'TODAS' && t.letter !== selectedLetter) return false;
      if (selectedCategory !== 'Todas' && t.category !== selectedCategory) return false;
      if (glossarySearch.trim()) {
        const q = glossarySearch.trim().toLowerCase();
        return (
          t.term.toLowerCase().includes(q) ||
          t.definition.toLowerCase().includes(q) ||
          (t.securityContext && t.securityContext.toLowerCase().includes(q)) ||
          (t.relatedTerms && t.relatedTerms.some(r => r.toLowerCase().includes(q)))
        );
      }
      return true;
    });
  }, [selectedLetter, selectedCategory, glossarySearch]);

  // Scroll to bottom on new AI chat message
  useEffect(() => {
    if (activeTab === 'ai_chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab, isLoadingAi]);

  // Handle asking AI a specific question
  const handleAskQuestion = async (queryText: string) => {
    const text = queryText.trim();
    if (!text || isLoadingAi) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setActiveTab('ai_chat');
    setIsLoadingAi(true);

    try {
      const historyPayload = chatMessages
        .filter(m => m.id !== 'welcome-msg')
        .slice(-6)
        .map(m => ({ role: m.role, text: m.text }));

      const res = await fetch('/api/ai/dictionary-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: text,
          history: historyPayload
        })
      });

      if (res.ok) {
        const data = await res.json();
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'model',
          text: data.answer || 'No se pudo generar respuesta.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          relatedTerms: data.relatedTerms,
          source: data.source || 'ADIF Diccionario Ferroviario'
        };
        setChatMessages(prev => [...prev, aiMsg]);
      } else {
        throw new Error('Error en la respuesta del servidor');
      }
    } catch {
      // Fallback message
      const fallbackMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        role: 'model',
        text: `No se pudo conectar con el servicio de IA en este momento. Puedes consultar el glosario completo en la pestaña **Glosario A-Z** o directamente en el portal oficial de ADIF: https://www.adif.es/comunicacion/diccionario-ferroviario#f`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'ADIF Diccionario Ferroviario'
      };
      setChatMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-xs p-2 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-5xl h-[92vh] max-h-[850px] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
      >
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center shadow-md shrink-0">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight">
                  Diccionario Ferroviario ADIF · Asistente IA
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>IA Gemini 3.8 Flash</span>
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Terminología reglamentaria y operativa oficial fundamentada en el Diccionario Oficial de ADIF
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://www.adif.es/comunicacion/diccionario-ferroviario#f"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
              title="Abrir portal oficial de ADIF Diccionario Ferroviario"
            >
              <span>Fuente Oficial ADIF</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 sm:px-6 pt-2.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('ai_chat')}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-xl text-xs font-bold transition-all border-t border-x ${
                activeTab === 'ai_chat'
                  ? 'bg-white text-slate-900 border-slate-200 border-b-white -mb-px shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Consultas IA Ferroviaria</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </button>

            <button
              onClick={() => setActiveTab('glossary')}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-xl text-xs font-bold transition-all border-t border-x ${
                activeTab === 'glossary'
                  ? 'bg-white text-slate-900 border-slate-200 border-b-white -mb-px shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/50'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
              <span>Glosario Oficial A-Z ({ADIF_RAILWAY_DICTIONARY.length} términos)</span>
            </button>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-[11px] text-slate-500 pb-1">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            <span>Respuestas reglamentadas para seguridad y operativa</span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: AI CHAT ASSISTANT GROUNDED IN ADIF DICTIONARY     */}
        {/* ========================================================= */}
        {activeTab === 'ai_chat' && (
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
            {/* Quick Suggestions Chips */}
            <div className="bg-white px-4 py-2.5 border-b border-slate-200 overflow-x-auto scrollbar-none shrink-0">
              <div className="flex items-center gap-2 min-w-max">
                <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
                  Sugerencias:
                </span>
                {SUGGESTED_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAskQuestion(q)}
                    disabled={isLoadingAi}
                    className="text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-300 border border-slate-200 px-2.5 py-1 rounded-full transition-all disabled:opacity-50"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Messages History */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {chatMessages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-3xl ${
                    msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-emerald-700 text-white'
                    }`}
                  >
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div
                      className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white font-medium rounded-tr-xs shadow-xs'
                          : 'bg-white text-slate-900 border border-slate-200 shadow-xs rounded-tl-xs'
                      }`}
                    >
                      {/* Render text with basic markdown bold / linebreaks */}
                      <div className="whitespace-pre-wrap space-y-1.5">
                        {msg.text.split('\n\n').map((paragraph, pIdx) => (
                          <p key={pIdx}>
                            {paragraph.split('\n').map((line, lIdx) => (
                              <React.Fragment key={lIdx}>
                                {line.startsWith('**') && line.endsWith('**') ? (
                                  <strong className="font-extrabold block text-slate-950 mt-1">
                                    {line.replace(/\*\*/g, '')}
                                  </strong>
                                ) : line.startsWith('- ') || line.startsWith('* ') ? (
                                  <span className="block pl-3 border-l-2 border-emerald-500 my-0.5 font-medium">
                                    {line.replace(/^[-*]\s+/, '')}
                                  </span>
                                ) : (
                                  line
                                )}
                                {lIdx < paragraph.split('\n').length - 1 && <br />}
                              </React.Fragment>
                            ))}
                          </p>
                        ))}
                      </div>

                      {/* Related Terms Pills if returned by AI */}
                      {msg.relatedTerms && msg.relatedTerms.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-bold text-slate-400">Términos relacionados:</span>
                          {msg.relatedTerms.map((term, tIdx) => (
                            <button
                              key={tIdx}
                              onClick={() => handleAskQuestion(`Explícame más sobre ${term.term}`)}
                              className="text-[10px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md transition-colors"
                            >
                              {term.term}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Metadata Footer */}
                    <div
                      className={`flex items-center gap-2 text-[10px] text-slate-400 px-1 ${
                        msg.role === 'user' ? 'justify-end' : 'justify-between'
                      }`}
                    >
                      {msg.role === 'model' && msg.source && (
                        <span className="font-semibold text-emerald-700">{msg.source}</span>
                      )}
                      <div className="flex items-center gap-2">
                        <span>{msg.timestamp}</span>
                        {msg.role === 'model' && (
                          <button
                            onClick={() => handleCopyText(msg.id, msg.text)}
                            title="Copiar respuesta"
                            className="hover:text-slate-700 p-0.5 rounded"
                          >
                            {copiedId === msg.id ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {isLoadingAi && (
                <div className="flex gap-3 max-w-xl mr-auto animate-pulse">
                  <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-white border border-slate-200 p-3.5 rounded-2xl rounded-tl-xs text-xs text-slate-600 flex items-center gap-2 shadow-xs">
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                    <span>Consultando el Diccionario Ferroviario Oficial de ADIF...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Bar */}
            <form
              onSubmit={e => {
                e.preventDefault();
                handleAskQuestion(inputQuery);
              }}
              className="p-3 sm:p-4 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0"
            >
              <input
                type="text"
                placeholder="Escribe tu consulta ferroviaria (ej: ¿Qué es una aguja talonable?, ¿Qué es la vía mango?)..."
                value={inputQuery}
                onChange={e => setInputQuery(e.target.value)}
                disabled={isLoadingAi}
                className="flex-1 text-xs sm:text-sm px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                autoFocus
              />
              <button
                type="submit"
                disabled={!inputQuery.trim() || isLoadingAi}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-xs disabled:opacity-40 flex items-center gap-1.5 shrink-0"
              >
                <span>Preguntar</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: A-Z GLOSSARY BROWSER                               */}
        {/* ========================================================= */}
        {activeTab === 'glossary' && (
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
            {/* Search & Category Filter Toolbar */}
            <div className="p-3 sm:p-4 bg-white border-b border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shrink-0">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar término, concepto o definición en el diccionario..."
                  value={glossarySearch}
                  onChange={e => setGlossarySearch(e.target.value)}
                  className="w-full text-xs font-semibold pl-9 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {glossarySearch && (
                  <button
                    onClick={() => setGlossarySearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="text-xs font-semibold py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {DICTIONARY_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>Categoría: {cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Letter Selector Pills */}
            <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 overflow-x-auto scrollbar-none shrink-0">
              <div className="flex items-center gap-1.5 min-w-max">
                {availableLetters.map(letter => (
                  <button
                    key={letter}
                    onClick={() => setSelectedLetter(letter)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                      selectedLetter === letter
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {letter}
                  </button>
                ))}
              </div>
            </div>

            {/* Term Cards Grid */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {filteredTerms.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <BookOpen className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="font-bold text-sm text-slate-700">No se encontraron términos</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Prueba buscando otra palabra o selecciona "TODAS" las letras y categorías.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredTerms.map((t, idx) => (
                    <div
                      key={idx}
                      className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between group"
                    >
                      <div className="space-y-2">
                        {/* Term Title & Category Tag */}
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-extrabold text-slate-950 text-sm group-hover:text-emerald-800 transition-colors">
                            {t.term}
                          </h3>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                            {t.category}
                          </span>
                        </div>

                        {/* Definition */}
                        <p className="text-xs text-slate-700 leading-relaxed">
                          {t.definition}
                        </p>

                        {/* Security Context box if present */}
                        {t.securityContext && (
                          <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg text-[11px] text-amber-950 flex items-start gap-2">
                            <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <strong className="font-bold text-amber-900 block text-[10px]">
                                Relevancia para la Seguridad y Patrulla:
                              </strong>
                              <span>{t.securityContext}</span>
                            </div>
                          </div>
                        )}

                        {/* Related Terms */}
                        {t.relatedTerms && t.relatedTerms.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 pt-1">
                            <span className="text-[10px] text-slate-400 font-bold">Relacionados:</span>
                            {t.relatedTerms.map((rel, rIdx) => (
                              <span
                                key={rIdx}
                                className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded"
                              >
                                {rel}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Card Action Buttons */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <button
                          onClick={() => handleAskQuestion(`¿Qué debo saber sobre "${t.term}" en el servicio de seguridad y operativa ferroviaria?`)}
                          className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 hover:underline"
                        >
                          <Sparkles className="w-3 h-3 text-emerald-600" />
                          <span>Preguntar a la IA</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>

                        <button
                          onClick={() => handleCopyText(`def-${idx}`, `${t.term}: ${t.definition}`)}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                          title="Copiar definición"
                        >
                          {copiedId === `def-${idx}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
