
import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronDown, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldCheck, 
  TrendingUp, 
  Zap, 
  Star,
  ArrowRight,
  Plus,
  AlertTriangle,
  CreditCard,
  QrCode,
  X,
  Ticket,
  Gift,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// --- Scroll Reveal Hook ---
const useScrollReveal = () => {
  useEffect(() => {
    const reveals = document.querySelectorAll('.reveal');
    const revealCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    };
    const observer = new IntersectionObserver(revealCallback, { threshold: 0.1 });
    reveals.forEach(reveal => observer.observe(reveal));
    return () => observer.disconnect();
  }, []);
};

// --- Coupon Modal Component ---
const CouponOverlay: React.FC<{ onAccept: () => void }> = ({ onAccept }) => {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-slate-950/98 backdrop-blur-2xl"></div>
      <div className="relative bg-white w-full max-w-xs rounded-[40px] p-8 shadow-[0_0_120px_rgba(255,255,255,0.1)] text-center animate-fade-in border-4 border-slate-100">
        <div className="mb-6 inline-flex w-24 h-24 items-center justify-center bg-red-50 rounded-full text-red-600 animate-pulse-yellow shadow-xl border-4 border-red-100">
          <span className="text-6xl font-black leading-none">!</span>
        </div>
        <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tighter leading-none">CONDIÇÃO ATIVADA</h3>
        <p className="text-slate-500 mb-8 text-sm font-bold leading-tight">
          Detectamos o cupom <span className="text-emerald-600 underline font-black italic">MUDEHOJE</span>.<br/>
          Seu acesso foi liberado com <span className="text-slate-900 underline">60% de desconto.</span>
        </p>

        <button 
          onClick={onAccept}
          className="w-full py-5 bg-emerald-500 text-white font-black text-lg rounded-2xl transition-all shadow-[0_10px_40px_rgba(16,185,129,0.3)] animate-glow-green hover:scale-[1.02] flex items-center justify-center gap-2"
        >
          CONTINUAR
          <ArrowRight size={22} />
        </button>
      </div>
    </div>
  );
};

// --- Bonus Carousel Component ---
const BonusCarousel: React.FC = () => {
  const [current, setCurrent] = useState(0);
  const bonuses = [
    { title: "Acelerador de Resultados", val: "R$ 197,00", desc: "Otimize sua IA para lucrar em metade do tempo com as configurações mestre que ninguém te conta." },
    { title: "Comunidade Invisível", val: "R$ 497,00", desc: "Acesso ao grupo fechado de elite de quem já saiu da Matrix e compartilha novas brechas do sistema." },
    { title: "Planilha de Liberdade", val: "R$ 97,00", desc: "Monitore seu tempo resgatado e organize seus ganhos invisíveis de forma profissional e simples." }
  ];

  const next = () => setCurrent((prev) => (prev === bonuses.length - 1 ? 0 : prev + 1));
  const prev = () => setCurrent((prev) => (prev === 0 ? bonuses.length - 1 : prev - 1));

  useEffect(() => {
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full max-w-lg mx-auto overflow-hidden px-2 h-[320px] md:h-[350px]">
      {bonuses.map((bonus, idx) => (
        <div 
          key={idx} 
          className={`absolute inset-0 transition-all duration-700 ease-in-out flex items-center justify-center p-2 ${
            idx === current ? 'opacity-100 translate-x-0' : idx < current ? 'opacity-0 -translate-x-full' : 'opacity-0 translate-x-full'
          }`}
        >
          <div className="relative w-full p-8 md:p-12 bg-slate-950 rounded-[40px] text-white border-2 border-slate-800 shadow-2xl">
            <div className="absolute top-0 right-0 bg-blue-600 text-[10px] font-black px-5 py-3 rounded-bl-3xl uppercase tracking-tighter shadow-lg">GRÁTIS HOJE</div>
            <Gift className="text-blue-500 mb-6" size={40} />
            <h4 className="text-xl md:text-2xl font-black mb-4 uppercase tracking-tight leading-tight">{bonus.title}</h4>
            <p className="text-slate-400 text-sm md:text-base mb-8 leading-relaxed font-medium">{bonus.desc}</p>
            <p className="text-[10px] md:text-xs font-bold text-slate-500 line-through tracking-widest uppercase opacity-50">Valor Original: {bonus.val}</p>
          </div>
        </div>
      ))}
      
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3 z-20">
        {bonuses.map((_, i) => (
          <button 
            key={i} 
            onClick={() => setCurrent(i)}
            className={`w-3 h-3 rounded-full transition-all ${i === current ? 'bg-blue-600 w-8' : 'bg-slate-700'}`}
          />
        ))}
      </div>
    </div>
  );
};

// --- Testimonials Carousel Component ---
const TestimonialCarousel: React.FC = () => {
  const [current, setCurrent] = useState(0);
  const stories = [
    { name: "Ricardo S.", role: "Ex-Funcionário Padrão", text: "Eu achava que precisava de anos de estudo. O Protocolo me mostrou que eu só precisava da ferramenta certa. Hoje meu tempo é meu.", img: "https://i.pravatar.cc/150?u=1" },
    { name: "Mariana L.", role: "Mãe Solo & Empreendedora", text: "Saí da rotina de 10h fora de casa para monitorar meus ganhos do sofá. A IA realmente igualou o jogo para nós.", img: "https://i.pravatar.cc/150?u=2" },
    { name: "Felipe T.", role: "Estrategista Digital", text: "É cirúrgico. Não tem enrolação de guru. É configuração pura e lucro invisível. Melhor investimento que fiz no ano.", img: "https://i.pravatar.cc/150?u=3" }
  ];

  useEffect(() => {
    const interval = setInterval(() => setCurrent(prev => (prev === stories.length - 1 ? 0 : prev + 1)), 3500);
    return () => clearInterval(interval);
  }, [stories.length]);

  return (
    <div className="relative overflow-hidden w-full max-w-2xl mx-auto h-[380px] md:h-[280px]">
      {stories.map((s, idx) => (
        <div key={idx} className={`absolute inset-0 transition-all duration-1000 ease-in-out flex items-center justify-center px-4 ${idx === current ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}`}>
          <div className="bg-white p-8 rounded-3xl border border-blue-100 shadow-xl italic text-slate-600 relative">
             <div className="flex gap-1 text-blue-500 mb-6">
                {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
              </div>
              <p className="mb-8 leading-relaxed text-sm md:text-lg font-medium text-slate-700">"{s.text}"</p>
              <div className="flex items-center gap-4 not-italic">
                <img src={s.img} alt={s.name} className="w-12 h-12 rounded-full border-2 border-blue-50" />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{s.name}</h4>
                  <p className="text-blue-500 text-[10px] uppercase font-black tracking-widest">{s.role}</p>
                </div>
              </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// --- Checkout Modal Component ---
const CheckoutModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [method, setMethod] = useState<'card' | 'pix'>('pix');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handlePayment = async () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert("Redirecionando para o ambiente seguro de pagamento...");
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-fade-in">
        <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold">Finalizar Inscrição</h3>
            <p className="text-blue-100 text-xs uppercase tracking-widest font-bold">Protocolo Renda Invisível</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="flex gap-4">
            <button onClick={() => setMethod('pix')} className={`flex-1 py-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${method === 'pix' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-100 text-slate-400'}`}>
              <QrCode size={24} />
              <span className="font-bold text-sm">PIX</span>
            </button>
            <button onClick={() => setMethod('card')} className={`flex-1 py-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${method === 'card' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-100 text-slate-400'}`}>
              <CreditCard size={24} />
              <span className="font-bold text-sm">Cartão</span>
            </button>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl flex justify-between items-center">
            <span className="text-slate-500 font-medium text-sm">Total Especial:</span>
            <span className="text-2xl font-black text-slate-900">R$ 19,90</span>
          </div>

          <button onClick={handlePayment} disabled={loading} className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center gap-2 text-lg">
            {loading ? "PROCESSANDO..." : "CONCLUIR AGORA"}
            {!loading && <ArrowRight size={22} />}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Countdown Component ---
const StickyCountdown: React.FC<{ active: boolean }> = ({ active }) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setTimeLeft({ hours, minutes, seconds });
    }, 1000);
    return () => clearInterval(timer);
  }, [active]);

  if (!active) return null;
  const format = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className="fixed top-0 left-0 w-full z-[100] px-4 pt-2 pointer-events-none animate-pop-alert">
      <div className="max-w-max mx-auto bg-red-600 text-white px-6 md:px-8 py-2 md:py-3 rounded-b-2xl shadow-[0_10px_40px_rgba(220,38,38,0.5)] border-x border-b border-red-400 flex items-center gap-3 md:gap-4 pointer-events-auto animate-pulse-soft">
        <div className="flex items-center gap-2">
          <AlertTriangle size={18} className="text-white animate-bounce" />
          <span className="text-[10px] md:text-xs font-black uppercase tracking-tighter leading-none">
            Oferta Exclusiva <br/> Finaliza em:
          </span>
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex flex-col items-center"><span className="text-xl md:text-2xl font-black font-mono tabular-nums leading-none">{format(timeLeft.hours)}</span><span className="text-[8px] uppercase font-bold opacity-80">Hrs</span></div>
          <span className="text-xl font-black mb-2">:</span>
          <div className="flex flex-col items-center"><span className="text-xl md:text-2xl font-black font-mono tabular-nums leading-none">{format(timeLeft.minutes)}</span><span className="text-[8px] uppercase font-bold opacity-80">Min</span></div>
          <span className="text-xl font-black mb-2">:</span>
          <div className="flex flex-col items-center"><span className="text-xl md:text-2xl font-black font-mono tabular-nums leading-none text-white">{format(timeLeft.seconds)}</span><span className="text-[8px] uppercase font-bold opacity-80">Seg</span></div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [showCouponModal, setShowCouponModal] = useState(true);
  const [couponAccepted, setCouponAccepted] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [priceBroken, setPriceBroken] = useState(false);
  const pricingRef = useRef<HTMLElement>(null);
  
  useScrollReveal();

  useEffect(() => {
    if (!couponAccepted) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !priceBroken) {
          setTimeout(() => setPriceBroken(true), 800);
        }
      });
    }, { threshold: 0.5 });
    if (pricingRef.current) observer.observe(pricingRef.current);
    return () => observer.disconnect();
  }, [couponAccepted, priceBroken]);

  const scrollToCheckout = () => {
    const target = document.getElementById('offer-card');
    if (target) {
      const top = target.getBoundingClientRect().top + window.pageYOffset - (window.innerHeight / 2) + (target.offsetHeight / 2);
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-slate-950 text-slate-100 overflow-x-hidden">
      {showCouponModal && <CouponOverlay onAccept={() => { setShowCouponModal(false); setCouponAccepted(true); }} />}
      
      <StickyCountdown active={couponAccepted} />
      <CheckoutModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} />
      
      {/* 1. HERO (Abertura cinematográfica) */}
      <section className="relative h-[85vh] md:h-screen bg-slate-950 flex flex-col items-center justify-center px-4 text-center overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20">
          <img src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1920&q=80" alt="Futuro IA" className="w-full h-full object-cover grayscale brightness-50" />
          <div className="absolute inset-0 bg-gradient-to-b from-blue-950/40 via-slate-950/60 to-slate-950"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto space-y-6 md:space-y-10 mt-12 md:mt-0 reveal px-2">
          <span className="text-blue-500 font-black tracking-[0.3em] uppercase text-[10px] md:text-xs">O Protocolo da Renda Invisível</span>
          <h1 className="text-4xl md:text-8xl font-black text-white leading-[1.1] tracking-tighter">Quanto custa o seu amanhã?</h1>
          <p className="text-base md:text-3xl text-slate-400 max-w-3xl mx-auto font-light leading-relaxed">
            Hoje você está vendendo ele por um preço que <span className="text-white font-bold italic underline decoration-blue-600 underline-offset-4 decoration-4">não paga nem o seu sono.</span>
          </p>
          <div className="pt-6 md:pt-10">
            <button 
              onClick={scrollToCheckout}
              className="group relative inline-flex items-center justify-center px-10 md:px-16 py-6 md:py-8 font-black text-white transition-all duration-700 bg-blue-600 rounded-full shadow-[0_0_50px_rgba(37,99,235,0.6)] hover:bg-blue-700 hover:scale-105 active:scale-95 text-lg md:text-2xl animate-pulse-soft tracking-tight"
            >
              DAR O PRIMEIRO PASSO AGORA
            </button>
          </div>
        </div>
        
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce text-slate-700 opacity-50">
          <ChevronDown size={32} />
        </div>
      </section>

      {/* 2. CURIOSITY GAP (O Despertar) */}
      <section className="bg-slate-900 py-24 md:py-40 px-6 reveal">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-2xl md:text-5xl text-white font-black italic leading-tight uppercase tracking-tighter">
            "Enquanto a Matrix te mantém ocupado, o sistema lucra com a sua hesitação."
          </h2>
          <div className="w-20 h-1 bg-blue-600 mx-auto rounded-full"></div>
          <p className="text-slate-400 text-lg md:text-2xl leading-relaxed max-w-3xl mx-auto font-medium">
            O Protocolo da Renda Invisível não é sobre "trabalhar duro". É sobre automatizar o esforço que os outros chamam de trabalho e resgatar a sua dignidade.
          </p>
        </div>
      </section>

      {/* 3. COMPARAÇÕES (O Velho vs O Novo) */}
      <section className="py-20 md:py-32 bg-white px-4 text-slate-900 reveal">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 md:mb-24">
            <h2 className="text-3xl md:text-6xl font-black mb-4 uppercase tracking-tighter">Escolha sua Realidade</h2>
            <p className="text-slate-500 font-black italic text-sm md:text-xl uppercase tracking-widest opacity-60">Pare de vender seu tempo por migalhas.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
            <div className="bg-slate-50 p-8 md:p-12 rounded-[40px] border-2 border-slate-100 opacity-50 grayscale transition-all hover:grayscale-0">
                <div className="flex items-center gap-4 mb-8">
                  <XCircle className="text-red-500 shrink-0" size={40} />
                  <h4 className="text-base md:text-xl font-black uppercase tracking-widest text-slate-900">O Velho Jeito (Exaustão)</h4>
                </div>
                <ul className="space-y-6 font-bold text-slate-600 text-sm md:text-lg">
                  <li className="flex items-center gap-4"><span className="w-2 h-2 bg-red-400 rounded-full shrink-0"></span> 10h de trabalho físico exaustivo.</li>
                  <li className="flex items-center gap-4"><span className="w-2 h-2 bg-red-400 rounded-full shrink-0"></span> Venda de tempo por trocados.</li>
                  <li className="flex items-center gap-4"><span className="w-2 h-2 bg-red-400 rounded-full shrink-0"></span> Dependência total do sistema.</li>
                </ul>
            </div>
            
            <div className="bg-blue-600 p-8 md:p-12 rounded-[40px] text-white shadow-2xl shadow-blue-300 relative overflow-hidden group">
                <div className="flex items-center gap-4 mb-8">
                  <CheckCircle2 className="text-white shrink-0" size={40} />
                  <h4 className="text-base md:text-xl font-black uppercase tracking-widest">O Novo Jeito (Resgate)</h4>
                </div>
                <ul className="space-y-6 font-bold text-sm md:text-lg">
                  <li className="flex items-center gap-4"><span className="w-2 h-2 bg-white rounded-full shrink-0"></span> IA configurada em 20 minutos.</li>
                  <li className="flex items-center gap-4"><span className="w-2 h-2 bg-white rounded-full shrink-0"></span> Renda invisível e automática.</li>
                  <li className="flex items-center gap-4"><span className="w-2 h-2 bg-white rounded-full shrink-0"></span> Resgate total do seu amanhã.</li>
                </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 4. MÓDULOS (Arsenal Cirúrgico) */}
      <section className="py-20 md:py-32 bg-slate-50 px-4 text-slate-900 reveal">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-6xl font-black text-center mb-16 md:mb-24 uppercase tracking-tighter">O Arsenal Cirúrgico</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12">
            {[
              { title: "Módulo 01: O Despertar", desc: "Como identificar as brechas no sistema que geram dinheiro no automático sem que ninguém perceba.", icon: <Zap /> },
              { title: "Módulo 02: Ativação", desc: "Configuração passo a passo das ferramentas de IA que trabalharão por você 24 horas por dia.", icon: <TrendingUp /> },
              { title: "Módulo 03: Blindagem", desc: "Estratégias avançadas para manter seu lucro invisível e constante, protegendo seu resgate.", icon: <ShieldCheck /> }
            ].map((item, idx) => (
              <div key={idx} className="p-10 bg-white rounded-[40px] shadow-sm hover:shadow-2xl transition-all border-2 border-slate-100 reveal group">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                  {React.cloneElement(item.icon as React.ReactElement, { size: 32 })}
                </div>
                <h3 className="text-xl md:text-2xl font-black mb-4 leading-tight uppercase tracking-tight">{item.title}</h3>
                <p className="text-slate-500 leading-relaxed text-sm md:text-base font-medium">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. BÔNUS DE RESGATE (AGORA EM CARROSSEL) */}
      <section className="py-20 md:py-32 bg-slate-950 px-4 reveal">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 md:mb-16 px-4">
            <span className="text-blue-600 font-black uppercase tracking-widest text-xs md:text-sm">Exclusividade Viral</span>
            <h2 className="text-3xl md:text-6xl font-black text-white mt-4 italic uppercase tracking-tighter">Bônus de Resgate Imediato</h2>
          </div>
          <BonusCarousel />
        </div>
      </section>

      {/* 6. OFERTA E DEPOIMENTOS */}
      <section id="pricing" ref={pricingRef} className="py-24 md:py-40 bg-slate-950 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 md:mb-24 reveal px-4">
            <span className="text-blue-500 font-black uppercase tracking-[0.4em] text-xs">A Prova</span>
            <h2 className="text-3xl md:text-6xl font-black text-white mt-4 italic uppercase tracking-tighter">Quem já despertou</h2>
          </div>

          <div className="reveal mb-20 md:mb-32">
            <TestimonialCarousel />
          </div>

          <div id="offer-card" className="max-w-2xl mx-auto reveal px-2">
            <div className="relative p-10 md:p-16 rounded-[40px] md:rounded-[60px] border-4 border-blue-600 bg-white text-slate-900 shadow-[0_0_100px_rgba(37,99,235,0.3)] overflow-hidden">
               <div className="absolute top-0 right-0 bg-blue-600 text-white px-8 py-3 rounded-bl-[40px] font-black text-[10px] md:text-xs uppercase tracking-widest">
                  {couponAccepted ? "CUPOM MUDEHOJE ATIVO" : "Oferta Final"}
               </div>
               
               <div className="space-y-6 md:space-y-10 mb-10 md:mb-16 text-center min-h-[160px] md:min-h-[220px] flex flex-col justify-center">
                  <div className={`transition-all duration-700 ${priceBroken ? 'animate-break-out pointer-events-none absolute' : 'relative'}`}>
                    <p className="text-slate-400 line-through font-bold text-sm md:text-lg">De R$ 1.288,00</p>
                    <div className="space-y-2">
                      <p className="text-[10px] md:text-xs uppercase font-black text-red-600 tracking-[0.2em]">Vender o seu Tempo</p>
                      <p className="text-6xl md:text-8xl font-black tracking-tighter text-red-500">R$ 47,90</p>
                    </div>
                  </div>

                  {priceBroken && (
                    <div className="animate-slam-in relative px-4">
                      <div className="space-y-2">
                        <p className="text-[10px] md:text-sm uppercase font-black text-emerald-600 tracking-[0.3em]">Comprar a sua Liberdade</p>
                        <p className="text-7xl md:text-9xl font-black tracking-tighter text-emerald-600 leading-none">R$ 19,90</p>
                        <p className="text-slate-400 text-xs md:text-sm mt-6">Pagamento único ou em até 12x de <span className="font-black text-slate-900">R$ 1,99</span></p>
                      </div>
                    </div>
                  )}
               </div>

               <button 
                onClick={() => setIsCheckoutOpen(true)}
                className="w-full py-6 md:py-10 bg-blue-600 text-white font-black text-xl md:text-3xl rounded-3xl md:rounded-[40px] shadow-2xl hover:bg-blue-700 transition-all hover:scale-[1.03] active:scale-95 animate-pulse-soft flex items-center justify-center gap-4 tracking-tighter uppercase"
               >
                 ACESSAR PROTOCOLO AGORA
                 <ArrowRight size={28} />
               </button>
               
               <div className="mt-8 md:mt-12 flex justify-center gap-6 md:gap-10 text-[9px] md:text-[11px] font-black uppercase tracking-widest text-slate-300">
                  <span className="flex items-center gap-2"><ShieldCheck size={16} className="text-blue-600" /> 100% Seguro</span>
                  <span className="flex items-center gap-2"><Clock size={16} className="text-blue-600" /> Acesso Vitalício</span>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FAQ */}
      <section className="py-24 md:py-40 bg-white px-4 text-slate-900 reveal">
        <div className="max-w-3xl mx-auto px-2">
          <h2 className="text-3xl md:text-5xl font-black text-center mb-16 md:mb-24 underline decoration-blue-600 decoration-[12px] underline-offset-[12px] uppercase tracking-tighter">Perguntas Frequentes</h2>
          <div className="space-y-4 md:space-y-6">
            {[
              { q: "Não tenho tempo para nada.", a: "O protocolo foi desenhado para quem não tem tempo. 20 minutos por dia é tudo o que você precisa." },
              { q: "Não entendo nada de tecnologia.", a: "Se você sabe usar o WhatsApp, você sabe usar o Protocolo. É puramente copiar e colar." },
              { q: "Funciona direto no celular?", a: "Sim. 100% dos nossos alunos utilizam apenas o celular." },
              { q: "É seguro colocar meus dados?", a: "Sim. Utilizamos criptografia bancária para sua segurança total." }
            ].map((item, idx) => (
              <div key={idx} className="border-2 border-slate-100 rounded-[30px] md:rounded-[40px] p-6 md:p-8 hover:border-blue-200 transition-colors shadow-sm">
                 <h4 className="font-black text-base md:text-xl mb-3 flex items-center gap-3 leading-tight uppercase tracking-tight"><Plus size={24} className="text-blue-600 shrink-0" /> {item.q}</h4>
                 <p className="text-slate-500 text-xs md:text-base pl-9 md:pl-10 leading-relaxed font-medium">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. GARANTIAS */}
      <section className="py-20 md:py-32 bg-slate-950 px-4 reveal">
        <div className="max-w-4xl mx-auto bg-blue-600/5 border-2 border-blue-600/10 p-10 md:p-16 rounded-[60px] flex flex-col md:flex-row items-center gap-10 md:gap-16 text-center md:text-left">
           <ShieldCheck size={100} md={160} className="text-blue-600 drop-shadow-[0_0_30px_rgba(37,99,235,0.5)]" />
           <div className="space-y-4">
              <h2 className="text-3xl md:text-5xl font-black text-white italic uppercase tracking-tighter">Risco Zero Absoluto</h2>
              <p className="text-slate-400 text-sm md:text-xl leading-relaxed font-medium">
                Teste por 7 dias. Se não gostar, devolvo cada centavo. Sem perguntas. O amanhã é seu.
              </p>
           </div>
        </div>
      </section>

      {/* 9. RODAPÉ */}
      <footer className="py-20 md:py-24 bg-slate-950 border-t border-slate-900 text-slate-600 px-4">
        <div className="max-w-6xl mx-auto text-center space-y-12">
          <div className="flex flex-wrap justify-center gap-8 md:gap-12 text-[10px] md:text-xs font-black uppercase tracking-[0.3em] opacity-40">
            <a href="#">Termos</a>
            <a href="#">Privacidade</a>
            <a href="#">Suporte</a>
          </div>
          <p className="text-[10px] md:text-xs max-w-2xl mx-auto leading-relaxed opacity-30 font-bold uppercase tracking-tight">
            © 2024 Protocolo Renda Invisível • Todos os Direitos Reservados
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
