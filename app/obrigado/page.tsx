import Link from "next/link";

const GT_GREEN = "#91D400";
const GT_DARK = "#111111";

export default function Obrigado() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4 py-16"
      style={{ background: GT_DARK }}
    >
      {/* Header GT+ */}
      <div className="fixed top-0 left-0 w-full flex items-center px-6 pt-4 pb-3">
        <span className="text-white font-black text-xl tracking-tight">
          GT<span style={{ color: GT_GREEN }}>+</span>
        </span>
      </div>

      <div className="text-center max-w-md">
        {/* Ícone de check */}
        <div
          className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-8"
          style={{ background: GT_GREEN }}
        >
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <path
              d="M8 20l8 8 16-16"
              stroke={GT_DARK}
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Tag GT+ */}
        <p
          className="text-xs font-black uppercase tracking-widest mb-5"
          style={{ color: GT_GREEN }}
        >
          GT+ Assessoria
        </p>

        <h1 className="text-4xl font-black text-white mb-4 leading-tight">
          Obrigado pelo<br />seu contato!
        </h1>

        <p className="text-gray-400 text-lg mb-10 leading-relaxed">
          Recebemos suas informações e um especialista entrará em contato em breve.
        </p>

        <Link
          href="https://www.instagram.com/gtmaismkt/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 px-8 py-4 rounded-full font-black text-base transition-all duration-200"
          style={{
            background: GT_GREEN,
            color: GT_DARK,
            boxShadow: `0 4px 32px ${GT_GREEN}50`,
          }}
        >
          {/* Ícone Instagram */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="20" height="20" rx="5" stroke={GT_DARK} strokeWidth="2"/>
            <circle cx="12" cy="12" r="4" stroke={GT_DARK} strokeWidth="2"/>
            <circle cx="17.5" cy="6.5" r="1" fill={GT_DARK}/>
          </svg>
          Conheça a GT+
        </Link>
      </div>
    </main>
  );
}
