import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import fs from "fs";
import path from "path";

const DESTINATION_EMAIL = process.env.DESTINATION_EMAIL ?? "alexandre.souza.gtmais@gmail.com";
const LEADS_FILE = path.join(process.cwd(), "data", "leads.json");

function saveLeadToFile(lead: Record<string, string>) {
  try {
    const dir = path.dirname(LEADS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const existing = fs.existsSync(LEADS_FILE)
      ? JSON.parse(fs.readFileSync(LEADS_FILE, "utf-8"))
      : [];
    existing.push({ ...lead, createdAt: new Date().toISOString() });
    fs.writeFileSync(LEADS_FILE, JSON.stringify(existing, null, 2), "utf-8");
  } catch (err) {
    console.error("Erro ao salvar lead em arquivo:", err);
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { nome, email, telefone, empresa, faturamento, segmento } = body;

  if (!nome || !email || !telefone || !empresa || !faturamento || !segmento) {
    return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
  }

  const lead = { nome, email, telefone, empresa, faturamento, segmento };

  // Sempre salva em arquivo como backup
  saveLeadToFile(lead);

  // Envia para webhook Make
  try {
    await fetch("https://hook.us1.make.com/py82g34sduhssyt6ny4voqwmu5qjd4m6", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...lead, createdAt: new Date().toISOString() }),
    });
  } catch (err) {
    console.error("Erro ao enviar webhook:", err);
  }

  // Envia por e-mail apenas se a chave Resend estiver configurada
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey && apiKey !== "re_COLOQUE_SUA_CHAVE_AQUI") {
    const resend = new Resend(apiKey);
    const html = `
      <h2 style="color:#91D400;font-family:sans-serif">Novo Lead — GT+</h2>
      <table style="border-collapse:collapse;width:100%;max-width:500px;font-family:sans-serif">
        <tr><td style="padding:10px 14px;font-weight:bold;background:#f5f5f5;width:140px">Nome</td><td style="padding:10px 14px">${nome}</td></tr>
        <tr><td style="padding:10px 14px;font-weight:bold;background:#f5f5f5">E-mail</td><td style="padding:10px 14px">${email}</td></tr>
        <tr><td style="padding:10px 14px;font-weight:bold;background:#f5f5f5">Telefone</td><td style="padding:10px 14px">${telefone}</td></tr>
        <tr><td style="padding:10px 14px;font-weight:bold;background:#f5f5f5">Empresa</td><td style="padding:10px 14px">${empresa}</td></tr>
        <tr><td style="padding:10px 14px;font-weight:bold;background:#f5f5f5">Faturamento</td><td style="padding:10px 14px">${faturamento}</td></tr>
        <tr><td style="padding:10px 14px;font-weight:bold;background:#f5f5f5">Segmento</td><td style="padding:10px 14px">${segmento}</td></tr>
      </table>
    `;
    const { error } = await resend.emails.send({
      from: "Formulário GT+ <onboarding@resend.dev>",
      to: DESTINATION_EMAIL,
      subject: `Novo lead: ${nome} — ${empresa}`,
      html,
    });
    if (error) console.error("Resend error:", error);
  } else {
    console.log("⚠️  RESEND_API_KEY não configurada — lead salvo em data/leads.json");
  }

  return NextResponse.json({ ok: true });
}
