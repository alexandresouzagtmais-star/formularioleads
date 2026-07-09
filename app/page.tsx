"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const GT_GREEN = "#91D400";
const GT_DARK = "#111111";

const UTM_PARAMS = ["utm_source", "utm_medium", "utm_content", "utm_term", "utm_campaign", "gclid", "fbclid"];

interface UTMData {
  utm_source: string; utm_medium: string; utm_content: string;
  utm_term: string; utm_campaign: string; gclid: string; fbclid: string;
}

interface FormData {
  trafego: string;
  nome: string;
  faturamento: string;
  segmento: string;
  telefone: string;
  email: string;
  empresa: string;
}

// Tipos de tela: "intro" | "binary" | "text" | "social" | "select"
const SCREENS = [
  { id: "intro",     type: "intro" },
  { id: "trafego",   type: "binary",  label: "Já investe em tráfego pago?" },
  { id: "nome",      type: "text",    label: "Qual seu nome e sobrenome?",          placeholder: "Escreva seu nome" },
  { id: "social",    type: "social" },
  { id: "faturamento", type: "select", label: "Qual é o faturamento da sua empresa?",
    options: ["0 a R$50.000", "R$50.000 a R$100.000", "R$100.000 a R$300.000", "+R$300.000"] },
  { id: "segmento",  type: "select",  label: "Qual o segmento da sua empresa?",
    options: ["Franqueadora", "Franqueado", "Serviço", "Outro"] },
  { id: "telefone",  type: "text",    label: "Digite o seu melhor número",           placeholder: "(00) 00000-0000" },
  { id: "email",     type: "text",    label: "Digite o seu melhor e-mail",           placeholder: "exemplo@empresa.com.br" },
  { id: "empresa",   type: "text",    label: "Para finalizarmos, qual o nome da sua empresa?", placeholder: "Nome da empresa" },
];

// Índices que são etapas do formulário (excluindo intro e social)
const FORM_SCREENS = ["trafego", "nome", "faturamento", "segmento", "telefone", "email", "empresa"];
const TOTAL_STEPS = FORM_SCREENS.length;

const CLIENTE_CARDS = [
  { src: "/clientes/cliente1.jpg", alt: "Cliente 1" },
  { src: "/clientes/cliente2.jpg", alt: "Cliente 2" },
  { src: "/clientes/cliente3.jpg", alt: "Cliente 3" },
  { src: "/clientes/cliente4.jpg", alt: "Cliente 4" },
];

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function formatPhone(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function isValidPhone(v: string) {
  return v.replace(/\D/g, "").length >= 10;
}

const STORAGE_KEY = "gtmais_lead_progress";
const UTM_STORAGE_KEY = "gtmais_utms";

export default function Home() {
  const router = useRouter();
  const [screenIndex, setScreenIndex] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    trafego: "", nome: "", faturamento: "", segmento: "", telefone: "", email: "", empresa: "",
  });
  const [utmData, setUtmData] = useState<UTMData>({
    utm_source: "", utm_medium: "", utm_content: "", utm_term: "", utm_campaign: "", gclid: "", fbclid: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [animating, setAnimating] = useState(false);
  const [maxProgress, setMaxProgress] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const captured: Partial<UTMData> = {};
    UTM_PARAMS.forEach(key => {
      const val = params.get(key);
      if (val) captured[key as keyof UTMData] = val;
    });
    if (Object.keys(captured).length > 0) {
      const merged = { utm_source: "", utm_medium: "", utm_content: "", utm_term: "", utm_campaign: "", gclid: "", fbclid: "", ...captured };
      setUtmData(merged);
      try { localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(merged)); } catch {}
    } else {
      try {
        const saved = localStorage.getItem(UTM_STORAGE_KEY);
        if (saved) setUtmData(JSON.parse(saved));
      } catch {}
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { data, idx } = JSON.parse(saved);
        setFormData(data);
        setScreenIndex(idx);
      }
    } catch {}
  }, []);

  const screen = SCREENS[screenIndex];
  const value = screen.id in formData ? formData[screen.id as keyof FormData] : "";
  const formStep = FORM_SCREENS.indexOf(screen.id);
  const rawProgress = screenIndex === 0 ? 0 : formStep >= 0
    ? Math.round(((formStep + 1) / TOTAL_STEPS) * 100)
    : Math.round(((FORM_SCREENS.indexOf("nome") + 1) / TOTAL_STEPS) * 100);
  const progress = Math.max(rawProgress, maxProgress);

  // Atualiza o máximo sempre que avança
  useEffect(() => {
    if (rawProgress > maxProgress) setMaxProgress(rawProgress);
  }, [screenIndex]); // eslint-disable-line

  function goTo(idx: number, updatedData?: FormData) {
    const data = updatedData ?? formData;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ data, idx })); } catch {}
    setFieldError("");
    setError("");
    setAnimating(true);
    setTimeout(() => { setScreenIndex(idx); setAnimating(false); }, 300);
  }

  function goNext(updatedData?: FormData) {
    goTo(screenIndex + 1, updatedData);
  }

  function goBack() {
    setFieldError("");
    setAnimating(true);
    setTimeout(() => { setScreenIndex(s => s - 1); setAnimating(false); }, 300);
  }

  function handleTextChange(val: string) {
    const formatted = screen.id === "telefone" ? formatPhone(val) : val;
    const updated = { ...formData, [screen.id]: formatted };
    setFormData(updated);
    setFieldError("");
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ data: updated, idx: screenIndex })); } catch {}
  }

  function validate() {
    if (!value.trim()) return false;
    if (screen.id === "email" && !isValidEmail(value)) {
      setFieldError("Digite um e-mail válido, ex: nome@empresa.com.br");
      return false;
    }
    if (screen.id === "telefone" && !isValidPhone(value)) {
      setFieldError("Digite um telefone válido com DDD, ex: (51) 99999-9999");
      return false;
    }
    return true;
  }

  function handleContinue() {
    if (!validate()) return;
    goNext();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleContinue();
  }

  function selectOption(opt: string) {
    const updated = { ...formData, [screen.id]: opt };
    setFormData(updated);
    goNext(updated);
  }

  function selectBinary(val: string) {
    const updated = { ...formData, trafego: val };
    setFormData(updated);
    goNext(updated);
  }

  async function handleSubmit() {
    if (!validate()) return;
    const finalData = { ...formData, empresa: value };
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...finalData, ...utmData }),
      });
      if (!res.ok) throw new Error();
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
      if (typeof window !== "undefined") {
        // @ts-expect-error dataLayer
        window.dataLayer = window.dataLayer || [];
        // @ts-expect-error dataLayer
        window.dataLayer.push({
          event: "lead_submited",
          lead_nome: finalData.nome,
          lead_email: finalData.email,
          lead_empresa: finalData.empresa,
          lead_faturamento: finalData.faturamento,
          lead_segmento: finalData.segmento,
          utm_source: utmData.utm_source || undefined,
          utm_medium: utmData.utm_medium || undefined,
          utm_campaign: utmData.utm_campaign || undefined,
        });
      }
      router.push("/obrigado");
    } catch {
      setError("Ocorreu um erro ao enviar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  const isLastScreen = screenIndex === SCREENS.length - 1;
  const showBack = screenIndex > 0;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-20" style={{ background: GT_DARK }}>
      {/* Barra de progresso */}
      <div className="fixed top-0 left-0 w-full h-1 bg-white/10">
        <div className="h-full transition-all duration-500 ease-out" style={{ width: `${progress}%`, background: GT_GREEN }} />
      </div>

      {/* Header */}
      <div className="fixed top-0 left-0 w-full flex items-center justify-between px-6 pt-4 pb-3">
        <span className="text-white font-black text-xl tracking-tight">
          GT<span style={{ color: GT_GREEN }}>+</span>
        </span>
        {showBack && (
          <button
            onClick={goBack}
            className="text-sm font-semibold transition-colors"
            style={{ color: "rgba(255,255,255,0.5)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
          >
            ← Voltar
          </button>
        )}
      </div>

      {/* Conteúdo animado */}
      <div
        className="w-full max-w-lg"
        style={{
          opacity: animating ? 0 : 1,
          transform: animating ? "translateY(20px)" : "translateY(0)",
          transition: "opacity 0.3s ease, transform 0.3s ease",
        }}
      >
        {/* ── TELA 0: INTRO ── */}
        {screen.type === "intro" && (
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: GT_GREEN }}>
              GT+ Assessoria de Marketing Digital
            </p>
            <h1 className="text-4xl font-black text-white leading-tight mb-3">
              Multiplique o faturamento da sua empresa em até 3x
            </h1>
            <p className="text-gray-400 text-base leading-relaxed mb-6">
              A estratégia certa transforma seu negócio. Descubra como.
            </p>
            {/* Imagem de destaque */}
            <div className="rounded-2xl overflow-hidden mb-6 w-full"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", minHeight: "180px" }}>
              <img
                src="/intro-image.jpg"
                alt="GT+ Resultados"
                className="w-full object-cover"
                onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-8">
              Responda algumas perguntas rápidas para realizarmos um diagnóstico do seu negócio.
            </p>
            <button
              onClick={() => goNext()}
              className="w-full py-5 rounded-full text-lg font-black transition-all duration-200 mb-4"
              style={{ background: GT_GREEN, color: GT_DARK, boxShadow: `0 4px 32px ${GT_GREEN}50` }}
            >
              Quero crescer minha empresa →
            </button>
            <p className="text-gray-500 text-sm flex items-center justify-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              Dura menos de 30 segundos
            </p>
          </div>
        )}

        {/* ── TELA 1: TRÁFEGO (BINARY) ── */}
        {screen.type === "binary" && (
          <div>
            <p className="text-xs font-black uppercase tracking-widest mb-5" style={{ color: GT_GREEN }}>
              Etapa 1 de {TOTAL_STEPS}
            </p>
            <h2 className="text-white text-3xl font-black leading-tight mb-8">{screen.label}</h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => selectBinary("Já invisto")}
                className="flex flex-col items-center justify-center py-8 rounded-2xl border-2 transition-all duration-200 gap-3"
                style={{
                  background: formData.trafego === "Já invisto" ? "rgba(145,212,0,0.15)" : "rgba(255,255,255,0.05)",
                  borderColor: formData.trafego === "Já invisto" ? GT_GREEN : "rgba(255,255,255,0.12)",
                }}
              >
                <span className="text-5xl font-black" style={{ color: GT_GREEN }}>✓</span>
                <span className="text-white font-semibold text-base">Já invisto</span>
              </button>
              <button
                onClick={() => selectBinary("Nunca investi")}
                className="flex flex-col items-center justify-center py-8 rounded-2xl border-2 transition-all duration-200 gap-3"
                style={{
                  background: formData.trafego === "Nunca investi" ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.05)",
                  borderColor: formData.trafego === "Nunca investi" ? "#ef4444" : "rgba(255,255,255,0.12)",
                }}
              >
                <span className="text-5xl font-black text-red-500">✕</span>
                <span className="text-white font-semibold text-base">Nunca investi</span>
              </button>
            </div>
          </div>
        )}

        {/* ── TELA 2: NOME ── */}
        {screen.type === "text" && screen.id === "nome" && (
          <div>
            <p className="text-xs font-black uppercase tracking-widest mb-5" style={{ color: GT_GREEN }}>
              Etapa 2 de {TOTAL_STEPS}
            </p>
            <h2 className="text-white text-3xl font-black leading-tight mb-8">{screen.label}</h2>
            <TextInput value={value} onChange={handleTextChange} onKeyDown={handleKeyDown}
              placeholder={screen.placeholder!} fieldError={fieldError} id={screen.id} />
            <ContinueButton value={value} onClick={handleContinue} />
          </div>
        )}

        {/* ── TELA 3: SOCIAL PROOF ── */}
        {screen.type === "social" && (
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-widest mb-5" style={{ color: GT_GREEN }}>
              É um prazer, {formData.nome.split(" ")[0]}! Veja o que falam sobre a GT+
            </p>
            <h2 className="text-white text-3xl font-black leading-tight mb-8">
              Veja o resultado dos nossos clientes
            </h2>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {CLIENTE_CARDS.map((card, i) => (
                <div key={i} className="rounded-xl overflow-hidden flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", height: "130px" }}>
                  <img src={card.src} alt={card.alt} className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                </div>
              ))}
            </div>
            <button
              onClick={() => goNext()}
              className="w-full py-5 rounded-full text-lg font-black transition-all duration-200"
              style={{ background: GT_GREEN, color: GT_DARK, boxShadow: `0 4px 32px ${GT_GREEN}50` }}
            >
              Continuar →
            </button>
          </div>
        )}

        {/* ── TELAS SELECT ── */}
        {screen.type === "select" && (
          <div>
            <p className="text-xs font-black uppercase tracking-widest mb-5" style={{ color: GT_GREEN }}>
              Etapa {formStep + 1} de {TOTAL_STEPS}
            </p>
            <h2 className="text-white text-3xl font-black leading-tight mb-8">{screen.label}</h2>
            <div className="flex flex-col gap-3">
              {screen.options!.map((opt) => {
                const isSelected = value === opt;
                return (
                  <button key={opt} onClick={() => selectOption(opt)}
                    disabled={loading}
                    className="text-left px-6 py-4 rounded-2xl font-semibold text-base transition-all duration-200 border-2"
                    style={{
                      background: isSelected ? GT_GREEN : "rgba(255,255,255,0.05)",
                      borderColor: isSelected ? GT_GREEN : "rgba(255,255,255,0.12)",
                      color: isSelected ? GT_DARK : "#ffffff",
                      boxShadow: isSelected ? `0 4px 20px ${GT_GREEN}40` : "none",
                    }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── TELAS TEXT (telefone, email, empresa) ── */}
        {screen.type === "text" && screen.id !== "nome" && (
          <div>
            <p className="text-xs font-black uppercase tracking-widest mb-5" style={{ color: GT_GREEN }}>
              Etapa {formStep + 1} de {TOTAL_STEPS}
            </p>
            <h2 className="text-white text-3xl font-black leading-tight mb-8">{screen.label}</h2>
            <TextInput value={value} onChange={handleTextChange} onKeyDown={handleKeyDown}
              placeholder={screen.placeholder!} fieldError={fieldError} id={screen.id} />
            {isLastScreen ? (
              <button
                onClick={handleSubmit}
                disabled={!value.trim() || loading}
                className="mt-4 w-full py-4 rounded-full text-base font-black transition-all duration-200"
                style={{
                  background: value.trim() && !loading ? GT_GREEN : "rgba(255,255,255,0.08)",
                  color: value.trim() && !loading ? GT_DARK : "rgba(255,255,255,0.3)",
                  cursor: value.trim() && !loading ? "pointer" : "not-allowed",
                  boxShadow: value.trim() ? `0 4px 24px ${GT_GREEN}50` : "none",
                }}
              >
                {loading ? "Enviando..." : "Finalizar →"}
              </button>
            ) : (
              <ContinueButton value={value} onClick={handleContinue} />
            )}
          </div>
        )}

        {error && <p className="mt-4 text-red-400 text-sm font-medium">{error}</p>}
      </div>
    </main>
  );
}

function TextInput({ value, onChange, onKeyDown, placeholder, fieldError, id }: {
  value: string; onChange: (v: string) => void; onKeyDown: (e: React.KeyboardEvent) => void;
  placeholder: string; fieldError: string; id: string;
}) {
  return (
    <>
      <input
        autoFocus
        type={id === "email" ? "email" : id === "telefone" ? "tel" : "text"}
        inputMode={id === "telefone" ? "numeric" : undefined}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className="w-full px-6 py-4 rounded-2xl text-white text-lg font-medium outline-none border-2 transition-all duration-200"
        style={{
          background: "rgba(255,255,255,0.05)",
          borderColor: fieldError ? "#f87171" : value ? "#91D400" : "rgba(255,255,255,0.12)",
          caretColor: "#91D400",
        }}
      />
      {fieldError && <p className="mt-2 text-red-400 text-sm font-medium">{fieldError}</p>}
    </>
  );
}

function ContinueButton({ value, onClick }: { value: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={!value.trim()}
      className="mt-4 w-full py-4 rounded-full text-base font-black transition-all duration-200"
      style={{
        background: value.trim() ? "#91D400" : "rgba(255,255,255,0.08)",
        color: value.trim() ? "#111111" : "rgba(255,255,255,0.3)",
        cursor: value.trim() ? "pointer" : "not-allowed",
        boxShadow: value.trim() ? "0 4px 24px #91D40050" : "none",
      }}
    >
      Continuar →
    </button>
  );
}
