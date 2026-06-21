"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const GT_GREEN = "#91D400";
const GT_DARK = "#111111";

const faturamentoOptions = [
  "R$0 a R$50.000",
  "R$100.000 a R$200.000",
  "R$200.000 a R$300.000",
  "Mais de R$300.000",
];

const segmentoOptions = ["Franqueadora", "Franqueada", "Serviços", "Outros"];

interface FormData {
  nome: string;
  email: string;
  telefone: string;
  empresa: string;
  faturamento: string;
  segmento: string;
}

const steps = [
  { key: "nome", label: "Qual seu nome e sobrenome?", type: "text", placeholder: "Escreva seu nome" },
  { key: "email", label: "Seu e-mail corporativo?", type: "email", placeholder: "exemplo@empresa.com.br" },
  { key: "telefone", label: "Seu telefone?", type: "tel", placeholder: "(00) 00000-0000" },
  { key: "empresa", label: "Qual o nome da sua empresa?", type: "text", placeholder: "Escreva o nome da sua empresa" },
  { key: "faturamento", label: "Qual é o faturamento da sua empresa?", type: "select", options: faturamentoOptions },
  { key: "segmento", label: "Qual seu segmento?", type: "select", options: segmentoOptions },
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

export default function Home() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    nome: "", email: "", telefone: "", empresa: "", faturamento: "", segmento: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [animating, setAnimating] = useState(false);

  // Restaura progresso salvo ao carregar
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { data, step } = JSON.parse(saved);
        setFormData(data);
        setCurrent(step);
      }
    } catch {}
  }, []);

  const step = steps[current];
  const value = formData[step.key as keyof FormData];
  const progress = (current / steps.length) * 100;

  const [fieldError, setFieldError] = useState("");

  function handleChange(val: string) {
    const formatted = step.key === "telefone" ? formatPhone(val) : val;
    const updated = { ...formData, [step.key]: formatted };
    setFormData(updated);
    setFieldError("");
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ data: updated, step: current })); } catch {}
  }

  function validate() {
    if (!value.trim()) return false;
    if (step.key === "email" && !isValidEmail(value)) {
      setFieldError("Digite um e-mail válido, ex: nome@empresa.com.br");
      return false;
    }
    if (step.key === "telefone" && !isValidPhone(value)) {
      setFieldError("Digite um telefone válido com DDD, ex: (51) 99999-9999");
      return false;
    }
    return true;
  }

  function goNext() {
    if (!validate()) return;
    setFieldError("");
    const nextStep = current + 1;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ data: formData, step: nextStep })); } catch {}
    setAnimating(true);
    setTimeout(() => { setCurrent(nextStep); setAnimating(false); }, 300);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") goNext();
  }

  function selectOption(opt: string) {
    const updated = { ...formData, [step.key]: opt };
    setFormData(updated);
    if (current < steps.length - 1) {
      const nextStep = current + 1;
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ data: updated, step: nextStep })); } catch {}
      setAnimating(true);
      setTimeout(() => { setCurrent(nextStep); setAnimating(false); }, 300);
    } else {
      submitForm(updated);
    }
  }

  async function submitForm(data: FormData) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      // Limpa progresso salvo após envio bem-sucedido
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
      router.push("/obrigado");
    } catch {
      setError("Ocorreu um erro ao enviar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16" style={{ background: GT_DARK }}>
      {/* Barra de progresso */}
      <div className="fixed top-0 left-0 w-full h-1 bg-white/10">
        <div
          className="h-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%`, background: GT_GREEN }}
        />
      </div>

      {/* Header GT+ */}
      <div className="fixed top-0 left-0 w-full flex items-center px-6 pt-4 pb-3">
        <span className="text-white font-black text-xl tracking-tight">
          GT<span style={{ color: GT_GREEN }}>+</span>
        </span>
      </div>

      <div
        className="w-full max-w-lg mt-8"
        style={{
          opacity: animating ? 0 : 1,
          transform: animating ? "translateY(20px)" : "translateY(0)",
          transition: "opacity 0.3s ease, transform 0.3s ease",
        }}
      >
        {/* Label de etapa */}
        <p
          className="text-xs font-black uppercase tracking-widest mb-5"
          style={{ color: GT_GREEN }}
        >
          Etapa {current + 1} de {steps.length}
        </p>

        {/* Pergunta */}
        <h2 className="text-white text-3xl font-black leading-tight mb-8">
          {step.label}
        </h2>

        {step.type === "select" ? (
          <div className="flex flex-col gap-3">
            {step.options!.map((opt) => {
              const isSelected = value === opt;
              return (
                <button
                  key={opt}
                  onClick={() => selectOption(opt)}
                  disabled={loading}
                  className="text-left px-6 py-4 rounded-2xl font-semibold text-base transition-all duration-200 border-2"
                  style={{
                    background: isSelected ? GT_GREEN : "rgba(255,255,255,0.05)",
                    borderColor: isSelected ? GT_GREEN : "rgba(255,255,255,0.12)",
                    color: isSelected ? GT_DARK : "#ffffff",
                    cursor: loading ? "not-allowed" : "pointer",
                    boxShadow: isSelected ? `0 4px 20px ${GT_GREEN}40` : "none",
                  }}
                >
                  {opt}
                </button>
              );
            })}
            {loading && (
              <p className="text-gray-400 text-sm mt-2 text-center">Enviando...</p>
            )}
          </div>
        ) : (
          <div>
            <input
              autoFocus
              type={step.key === "telefone" ? "tel" : step.type}
              inputMode={step.key === "telefone" ? "numeric" : undefined}
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={step.placeholder}
              className="w-full px-6 py-4 rounded-2xl text-white text-lg font-medium outline-none border-2 transition-all duration-200"
              style={{
                background: "rgba(255,255,255,0.05)",
                borderColor: fieldError ? "#f87171" : value ? GT_GREEN : "rgba(255,255,255,0.12)",
                caretColor: GT_GREEN,
              }}
            />
            {fieldError && (
              <p className="mt-2 text-red-400 text-sm font-medium">{fieldError}</p>
            )}
            <button
              onClick={goNext}
              disabled={!value.trim()}
              className="mt-4 w-full py-4 rounded-full text-base font-black transition-all duration-200"
              style={{
                background: value.trim() ? GT_GREEN : "rgba(255,255,255,0.08)",
                color: value.trim() ? GT_DARK : "rgba(255,255,255,0.3)",
                cursor: value.trim() ? "pointer" : "not-allowed",
                boxShadow: value.trim() ? `0 4px 24px ${GT_GREEN}50` : "none",
              }}
            >
              Continuar →
            </button>
          </div>
        )}

        {error && <p className="mt-4 text-red-400 text-sm font-medium">{error}</p>}
      </div>
    </main>
  );
}
