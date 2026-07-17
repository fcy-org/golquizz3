import { useEffect, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  ClipboardList,
  PackageSearch,
  Headset,
  Handshake,
  ListChecks,
  CheckCircle2,
  MessageSquareText,
} from "lucide-react";
import ProgressBar from "./ProgressBar";
import OptionButton from "./OptionButton";
import QuizButton from "./QuizButton";
import QuizInput from "./QuizInput";
import WaveDecoration from "./WaveDecoration";
import BrandCarousel from "./BrandCarousel";
import BannerCarousel from "./BannerCarousel";
import logo from "../assets/logo-gol.webp";

declare function fbq(...args: unknown[]): void;

const TOTAL_STEPS = 16;
const VIDEO_ID = "5MnWu0N5LRk";
const WEBHOOK_URL = "/api/webhooks/leads/cmq0tkyiw0003dnk3jtdpcj6i";
const WHATSAPP_NUMBER = "5586999840542";

const slideVariants = {
  enter: { x: 60, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -60, opacity: 0 },
};

type Answers = {
  situacaoEmpresa: string;
  formatoOperacao: string;
  formatoOperacaoOutro: string;
  participacaoCalcados: string;
  publico: string[];
  comportamentoConsumidor: string;
  principalDesafio: string;
  faixaInvestimento: string;
  frequenciaCompra: string;
  momentoCompra: string;
  criterioFornecedor: string;
  demandaEspecifica: string;
  nome: string;
  cargo: string;
  cargoOutro: string;
  whatsapp: string;
  cnpj: string;
  nomeEmpresa: string;
  cidade: string;
  estado: string;
  email: string;
  consentimento: boolean;
};

function getUTMs() {
  const p = new URLSearchParams(window.location.search);
  return {
    utm_source: p.get("utm_source") || "",
    utm_medium: p.get("utm_medium") || "",
    utm_campaign: p.get("utm_campaign") || "",
    utm_content: p.get("utm_content") || "",
    utm_term: p.get("utm_term") || "",
  };
}

function getFbclid() {
  const p = new URLSearchParams(window.location.search);
  return p.get("fbclid") || "";
}

function getCookie(name: string): string {
  const match = document.cookie.split(";").find((c) => c.trim().startsWith(name + "="));
  return match ? match.split("=").slice(1).join("=").trim() : "";
}

function getFbc(): string {
  const cookie = getCookie("_fbc");
  if (cookie) return cookie;
  const fbclid = getFbclid();
  if (fbclid) return `fb.1.${Date.now()}.${fbclid}`;
  return "";
}

function getFbp(): string {
  return getCookie("_fbp");
}

function getTrackingParams() {
  const utms = getUTMs();
  return {
    fbc: getFbc(),
    fbp: getFbp(),
    event_id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    ...utms,
  };
}

function validarCNPJ(cnpj: string): boolean {
  const d = cnpj.replace(/\D/g, "");
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;
  const calc = (len: number) => {
    let sum = 0;
    let w = len - 7;
    for (let i = 0; i < len; i++) {
      sum += parseInt(d[i]) * w--;
      if (w < 2) w = 9;
    }
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return calc(12) === parseInt(d[12]) && calc(13) === parseInt(d[13]);
}

function cargoFinal(answers: Answers): string {
  if (answers.cargo === "Outro" && answers.cargoOutro.trim()) {
    return answers.cargoOutro.trim();
  }
  return answers.cargo;
}

function formatoOperacaoFinal(answers: Answers): string {
  if (answers.formatoOperacao === "Outro" && answers.formatoOperacaoOutro.trim()) {
    return answers.formatoOperacaoOutro.trim();
  }
  return answers.formatoOperacao;
}

type MixLinha = { id: string; nome: string; marcas: string };

const MIX_LINHAS: MixLinha[] = [
  { id: "feminina", nome: "Linha Feminina", marcas: "Vizzano, Beira Rio e Moleca" },
  { id: "conforto", nome: "Linha Conforto", marcas: "Actvitta, Modare e Opanka" },
  { id: "esportiva", nome: "Linha Esportiva", marcas: "BR Sport, Dalponte e Penalty" },
  { id: "infantil", nome: "Linha Infantil", marcas: "Molekinha, Molekinho e Grendene" },
  { id: "casual", nome: "Linha Casual de Giro Rápido", marcas: "Rider, Grendha, Azaleia e Cartago" },
];

function getMixIdeal(answers: Answers): MixLinha[] {
  const score: Record<string, number> = {
    feminina: 0,
    conforto: 0,
    esportiva: 0,
    infantil: 0,
    casual: 0,
  };
  const add = (id: string, points: number) => {
    score[id] += points;
  };
  const addAll = (points: number) => {
    MIX_LINHAS.forEach(({ id }) => add(id, points));
  };

  const publicoPontos: Record<string, [string, number][]> = {
    Mulheres: [["feminina", 2]],
    Homens: [["esportiva", 2], ["casual", 1]],
    "Famílias": [["infantil", 1], ["casual", 1], ["feminina", 1]],
    "Pais e responsáveis comprando para crianças": [["infantil", 2]],
    "Adolescentes e jovens": [["esportiva", 1], ["feminina", 1]],
    "Público que busca conforto e uso diário": [["conforto", 2]],
    "Público que busca moda e novidades": [["feminina", 2]],
  };
  answers.publico.forEach((publico) => {
    const pontos = publicoPontos[publico];
    if (pontos) {
      pontos.forEach(([id, points]) => add(id, points));
    } else {
      addAll(1);
    }
  });

  const comportamentoPontos: Record<string, [string, number][]> = {
    "Procuram principalmente opções confortáveis": [["conforto", 2]],
    "Procuram novidades e modelos diferentes": [["feminina", 1], ["esportiva", 1]],
    "Procuram produtos acessíveis para uso diário": [["casual", 2]],
    "Perguntam por produtos infantis": [["infantil", 2]],
  };
  const comportamento = comportamentoPontos[answers.comportamentoConsumidor];
  if (comportamento) {
    comportamento.forEach(([id, points]) => add(id, points));
  }

  if (["Supermercado ou mercadinho", "Bazar ou loja de variedades"].includes(answers.formatoOperacao)) {
    add("casual", 2);
    add("infantil", 1);
  }

  const ranked = MIX_LINHAS.filter(({ id }) => score[id] > 0).sort(
    (a, b) => score[b.id] - score[a.id]
  );

  if (ranked.length === 0) {
    return MIX_LINHAS.filter(({ id }) => ["feminina", "conforto", "casual"].includes(id));
  }

  return ranked.slice(0, 3);
}

function mixIdealTexto(answers: Answers): string {
  return getMixIdeal(answers)
    .map((linha) => `${linha.nome} (${linha.marcas})`)
    .join(" + ");
}

async function sendWebhookLead(answers: Answers) {
  const leadName = answers.nome || "Lead";
  const normalizedPhone = answers.whatsapp.replace(/\D/g, "");
  const normalizedDoc = answers.cnpj.replace(/\D/g, "");
  const fbclid = getFbclid();
  const tracking = getTrackingParams();

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: normalizedPhone,
        name: leadName,
        email: answers.email || undefined,
        city: answers.cidade,
        state: answers.estado,
        document: normalizedDoc || undefined,
        pipeline_stage: "Pedido Consultivo Quiz Gol",
        notes: [
          `Empresa: ${answers.nomeEmpresa || "Não informado"}`,
          `Cargo: ${cargoFinal(answers) || "Não informado"}`,
          `Situação da empresa: ${answers.situacaoEmpresa || "Não informado"}`,
          `Formato da operação: ${formatoOperacaoFinal(answers) || "Não informado"}`,
          `Participação dos calçados no negócio: ${answers.participacaoCalcados || "Não informado"}`,
          `Público atendido: ${answers.publico.length > 0 ? answers.publico.join(", ") : "Não informado"}`,
          `Comportamento dos consumidores: ${answers.comportamentoConsumidor || "Não informado"}`,
          `Principal desafio: ${answers.principalDesafio || "Não informado"}`,
          `Faixa de investimento por pedido: ${answers.faixaInvestimento || "Não informado"}`,
          `Frequência de compra: ${answers.frequenciaCompra || "Não informado"}`,
          `Momento da próxima compra: ${answers.momentoCompra || "Não informado"}`,
          `Critério para escolher fornecedor: ${answers.criterioFornecedor || "Não informado"}`,
          `Mix ideal sugerido: ${mixIdealTexto(answers)}`,
          answers.demandaEspecifica ? `Demanda específica: ${answers.demandaEspecifica}` : "",
          answers.cnpj ? `CNPJ: ${answers.cnpj}` : "",
          fbclid ? `Fbclid: ${fbclid}` : "",
        ].filter(Boolean).join("\n"),
        fbclid,
        ...tracking,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      console.error("Webhook lead failed", { status: response.status, response: data });
    }
  } catch (error) {
    console.error("Webhook request error", error);
  }
}

function updateQuizHash(step: number) {
  const nextHash = `#etapa-${step}`;

  if (window.location.hash === nextHash) {
    return;
  }

  const nextUrl = `${window.location.pathname}${window.location.search}${nextHash}`;
  window.history.replaceState(null, "", nextUrl);
}

function trackQuizStep(step: number) {
  try {
    updateQuizHash(step);

    if (typeof fbq !== "function") {
      return;
    }

    fbq("trackCustom", "QuizStepView", {
      quiz_name: "gol_distribuidora_pedido_consultivo",
      step_number: step,
      step_name: `etapa-${step}`,
      step_url: `${window.location.pathname}${window.location.search}#etapa-${step}`,
    });

    fbq("trackCustom", `Quiz_Etapa_${step}`, {
      quiz_name: "gol_distribuidora_pedido_consultivo",
      step_number: step,
    });
  } catch (error) {
    console.error("Meta Pixel step tracking error", error);
  }
}

const Quiz = () => {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Answers>({
    situacaoEmpresa: "",
    formatoOperacao: "",
    formatoOperacaoOutro: "",
    participacaoCalcados: "",
    publico: [],
    comportamentoConsumidor: "",
    principalDesafio: "",
    faixaInvestimento: "",
    frequenciaCompra: "",
    momentoCompra: "",
    criterioFornecedor: "",
    demandaEspecifica: "",
    nome: "",
    cargo: "",
    cargoOutro: "",
    whatsapp: "",
    cnpj: "",
    nomeEmpresa: "",
    cidade: "",
    estado: "",
    email: "",
    consentimento: true,
  });
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [isLoadingLead, setIsLoadingLead] = useState(false);
  const [webhookSent, setWebhookSent] = useState(false);

  useEffect(() => {
    trackQuizStep(step);
  }, [step]);

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  const prev = () => setStep((s) => Math.max(s - 1, 1));

  const setAnswer = <K extends keyof Answers>(key: K, value: Answers[K]) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const togglePublico = (opt: string) => {
    setAnswers((prev) => {
      const current = prev.publico;

      if (opt === "Ainda estou conhecendo melhor meu público") {
        return {
          ...prev,
          publico: current.includes(opt) ? [] : [opt],
        };
      }

      const filtered = current.filter(
        (p) => p !== "Ainda estou conhecendo melhor meu público"
      );

      return {
        ...prev,
        publico: filtered.includes(opt)
          ? filtered.filter((p) => p !== opt)
          : [...filtered, opt],
      };
    });
  };

  const selectAndNext = (key: keyof Answers, value: string) => {
    setAnswer(key, value as Answers[keyof Answers]);
    setTimeout(next, 350);
  };

  const submitForm = async () => {
    if (isLoadingLead) {
      return;
    }

    setIsLoadingLead(true);
    await sendWebhookLead(answers);
    setWebhookSent(true);
    try {
      fbq("track", "Lead");
    } catch (_) {
      // Meta Pixel not loaded
    }
    setIsLoadingLead(false);
    next();
  };

  const redirectToSpecialist = async () => {
    if (isSubmittingLead) {
      return;
    }

    setIsSubmittingLead(true);

    if (!webhookSent) {
      await sendWebhookLead(answers);
    }

    const phone = WHATSAPP_NUMBER;
    const msg = encodeURIComponent(
      `Olá! Preenchi o diagnóstico da Gol Distribuidora e quero receber uma sugestão de pedido.\n\n` +
        `Nome: ${answers.nome}\n` +
        `Cargo: ${cargoFinal(answers)}\n` +
        `Empresa: ${answers.nomeEmpresa}\n` +
        `WhatsApp: ${answers.whatsapp}\n` +
        `E-mail: ${answers.email}\n` +
        `CNPJ: ${answers.cnpj}\n` +
        `Cidade: ${answers.cidade} / ${answers.estado}\n\n` +
        `Situação da empresa: ${answers.situacaoEmpresa}\n` +
        `Formato da operação: ${formatoOperacaoFinal(answers)}\n` +
        `Participação dos calçados: ${answers.participacaoCalcados}\n` +
        `Público atendido: ${answers.publico.join(", ")}\n` +
        `Comportamento dos consumidores: ${answers.comportamentoConsumidor}\n` +
        `Principal desafio: ${answers.principalDesafio}\n` +
        `Faixa de investimento: ${answers.faixaInvestimento}\n` +
        `Frequência de compra: ${answers.frequenciaCompra}\n` +
        `Momento da próxima compra: ${answers.momentoCompra}\n` +
        `Critério para escolher fornecedor: ${answers.criterioFornecedor}\n` +
        `Mix ideal sugerido: ${mixIdealTexto(answers)}` +
        (answers.demandaEspecifica ? `\nDemanda específica: ${answers.demandaEspecifica}` : "")
    );

    window.location.href = `https://wa.me/${phone}?text=${msg}`;
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="flex flex-col items-center text-center gap-6 py-8 w-full">
            <img src={logo} alt="Gol Distribuidora" className="h-24 w-auto" />

            <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary">
              Atendimento B2B para empresas com CNPJ
            </span>

            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground leading-tight w-full max-w-md">
              Comece a montar seu próximo{" "}
              <span className="text-primary">pedido de calçados com a Gol</span>
            </h1>

            <p className="text-muted-foreground text-base md:text-lg w-full max-w-md">
              Antes de recomendar qualquer produto, precisamos entender como sua
              loja funciona. Responda algumas perguntas sobre sua operação, seus
              clientes, seu estoque e seu momento de compra — um consultor da
              Gol vai preparar uma sugestão de pedido personalizada pelo
              WhatsApp.
            </p>

            <div className="w-full mt-4">
              <QuizButton onClick={next} variant="cta">
                Começar a montar meu pedido
              </QuizButton>
              <p className="text-xs text-muted-foreground mt-2">
                Leva poucos minutos. Tenha as informações da sua empresa em mãos.
              </p>
            </div>

            <BrandCarousel />
          </div>
        );

      case 2:
        return (
          <div className="flex flex-col items-center text-center gap-6 py-8 w-full">
            <h2 className="text-xl md:text-2xl font-extrabold text-foreground leading-tight w-full max-w-md">
              Como funciona o{" "}
              <span className="text-primary">Pedido Consultivo Gol</span>
            </h2>

            <div className="w-full max-w-md flex flex-col gap-3 text-left">
              <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <ClipboardList className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-sm text-foreground">Análise da realidade da sua loja</p>
                  <p className="text-xs text-muted-foreground">Entendemos seu público, sua operação e os desafios atuais do estoque</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <PackageSearch className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-sm text-foreground">Sugestão personalizada de pedido</p>
                  <p className="text-xs text-muted-foreground">O consultor recomenda um mix de produtos compatível com o perfil do seu negócio</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Headset className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-sm text-foreground">Atendimento comercial próximo</p>
                  <p className="text-xs text-muted-foreground">Você recebe orientação para comparar opções e ajustar o pedido antes de comprar</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Handshake className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-sm text-foreground">Parceria além da entrega</p>
                  <p className="text-xs text-muted-foreground">A Gol busca construir um relacionamento baseado em assistência, continuidade e giro</p>
                </div>
              </div>
            </div>

            <BrandCarousel rows={2} />

            <div className="w-full mt-2">
              <QuizButton onClick={next} variant="cta">
                Continuar
              </QuizButton>
            </div>
          </div>
        );

      case 3:
        return (
          <QuestionScreen
            emoji="🏢"
            question="Qual é a situação atual da sua empresa?"
            subtitle="A Gol trabalha principalmente com operações comerciais formalizadas. Essa informação ajuda nossa equipe a conduzir o atendimento corretamente."
          >
            {[
              "Possuo CNPJ ativo",
              "Sou MEI com atividade comercial",
              "Meu CNPJ está em processo de regularização",
            ].map((opt) => (
              <OptionButton
                key={opt}
                label={opt}
                selected={answers.situacaoEmpresa === opt}
                onClick={() => selectAndNext("situacaoEmpresa", opt)}
              />
            ))}
          </QuestionScreen>
        );

      case 4:
        return (
          <QuestionScreen
            emoji="🏬"
            question="Qual é o principal formato da sua operação?"
            subtitle="O formato da loja influencia diretamente a recomendação do consultor."
          >
            {[
              "Loja de calçados",
              "Supermercado ou mercadinho",
              "Loja multimarcas",
              "Bazar ou loja de variedades",
              "Loja de roupas com seção de calçados",
              "E-commerce com operação ativa",
              "Venda por WhatsApp ou redes sociais",
              "Outro",
            ].map((opt) => (
              <OptionButton
                key={opt}
                label={opt}
                selected={
                  answers.formatoOperacao === opt ||
                  (opt === "Outro" && Boolean(answers.formatoOperacaoOutro))
                }
                onClick={() => {
                  if (opt === "Outro") {
                    setAnswer("formatoOperacao", opt);
                    return;
                  }

                  setAnswers((prev) => ({
                    ...prev,
                    formatoOperacao: opt,
                    formatoOperacaoOutro: "",
                  }));
                  setTimeout(next, 350);
                }}
              />
            ))}

            {(answers.formatoOperacao === "Outro" || answers.formatoOperacaoOutro) && (
              <>
                <QuizInput
                  value={answers.formatoOperacaoOutro}
                  onChange={(v) => setAnswer("formatoOperacaoOutro", v)}
                  placeholder="Digite o formato da sua operação"
                />

                <div className="mt-2">
                  <QuizButton
                    onClick={() => {
                      setAnswer("formatoOperacaoOutro", answers.formatoOperacaoOutro.trim());
                      setTimeout(next, 150);
                    }}
                    disabled={!answers.formatoOperacaoOutro.trim()}
                  >
                    Continuar
                  </QuizButton>
                </div>
              </>
            )}
          </QuestionScreen>
        );

      case 5:
        return (
          <QuestionScreen
            emoji="👟"
            question="Como os calçados participam do seu negócio atualmente?"
            subtitle="Essa informação ajuda o consultor a identificar se sua loja precisa de um mix inicial, reposição, ampliação de variedade ou reorganização da categoria."
          >
            {[
              "São uma das principais categorias da loja",
              "São uma categoria complementar",
              "Estou começando a vender agora",
              "Pretendo começar nos próximos 30 dias",
              "Ainda estou pesquisando fornecedores",
            ].map((opt) => (
              <OptionButton
                key={opt}
                label={opt}
                selected={answers.participacaoCalcados === opt}
                onClick={() => selectAndNext("participacaoCalcados", opt)}
              />
            ))}
          </QuestionScreen>
        );

      case 6:
        return (
          <QuestionScreen
            emoji="👥"
            question="Quais públicos sua loja atende com maior frequência?"
            subtitle="Pode selecionar mais de uma opção. O consultor usará essa informação para recomendar as linhas mais adequadas."
          >
            {[
              "Mulheres",
              "Homens",
              "Famílias",
              "Pais e responsáveis comprando para crianças",
              "Adolescentes e jovens",
              "Público que busca conforto e uso diário",
              "Público que busca moda e novidades",
              "Público variado",
              "Ainda estou conhecendo melhor meu público",
            ].map((opt) => (
              <OptionButton
                key={opt}
                label={opt}
                selected={answers.publico.includes(opt)}
                onClick={() => togglePublico(opt)}
                multiSelect
              />
            ))}

            <div className="mt-2">
              <QuizButton onClick={next} disabled={answers.publico.length === 0}>
                Continuar
              </QuizButton>
            </div>
          </QuestionScreen>
        );

      case 7:
        return (
          <QuestionScreen
            emoji="💬"
            question="Qual situação acontece com mais frequência no atendimento aos seus clientes?"
            subtitle="Isso ajuda o consultor a montar uma recomendação baseada na realidade da loja — não apenas em um catálogo genérico."
          >
            {[
              "Pedem marcas ou modelos que não tenho",
              "Pedem numerações ou cores que acabam rápido",
              "Procuram principalmente opções confortáveis",
              "Procuram novidades e modelos diferentes",
              "Procuram produtos acessíveis para uso diário",
              "Perguntam por produtos infantis",
              "O público é muito variado",
              "Ainda não consigo identificar um padrão",
            ].map((opt) => (
              <OptionButton
                key={opt}
                label={opt}
                selected={answers.comportamentoConsumidor === opt}
                onClick={() => selectAndNext("comportamentoConsumidor", opt)}
              />
            ))}
          </QuestionScreen>
        );

      case 8:
        return (
          <QuestionScreen
            emoji="⚠️"
            question="Qual situação mais prejudica o resultado da sua seção de calçados hoje?"
            subtitle="O preço é apenas uma parte de uma boa compra. Para alguns lojistas, o maior problema é o estoque parado; para outros, é a falta de novidade ou assistência."
          >
            {[
              "Produtos que ficam meses sem vender",
              "Falta de variedade e novidades",
              "Dificuldade para repor o que vende bem",
              "Falta de numerações e cores",
              "Fornecedor sem assistência depois da compra",
              "Margem de lucro apertada",
              "Falta de tempo para organizar os pedidos",
              "Dificuldade para saber o que comprar",
              "Estou começando e ainda não sei",
            ].map((opt) => (
              <OptionButton
                key={opt}
                label={opt}
                selected={answers.principalDesafio === opt}
                onClick={() => selectAndNext("principalDesafio", opt)}
              />
            ))}
          </QuestionScreen>
        );

      case 9:
        return (
          <QuestionScreen
            emoji="💰"
            question="Quanto sua empresa costuma investir em cada pedido de calçados?"
            subtitle="A faixa abaixo ajuda o consultor a sugerir um pedido compatível com o tamanho e o momento da sua operação."
          >
            {[
              "Até R$ 1.000",
              "De R$ 1.000 a R$ 5.000",
              "De R$ 5.000 a R$ 15.000",
              "Acima de R$ 15.000",
              "Ainda não fiz meu primeiro pedido de calçados",
            ].map((opt) => (
              <OptionButton
                key={opt}
                label={opt}
                selected={answers.faixaInvestimento === opt}
                onClick={() => selectAndNext("faixaInvestimento", opt)}
              />
            ))}
            <p className="text-xs text-muted-foreground text-center mt-1">
              A resposta não representa obrigação ou compromisso de compra. Ela serve para orientar o atendimento.
            </p>
          </QuestionScreen>
        );

      case 10:
        return (
          <QuestionScreen
            emoji="🔁"
            question="Com que frequência sua empresa costuma comprar calçados?"
            subtitle="Lojas que compram semanalmente possuem uma necessidade diferente das que renovam o estoque mensalmente ou em períodos específicos."
          >
            {[
              "Toda semana",
              "A cada 15 dias",
              "Uma vez por mês",
              "A cada dois ou três meses",
              "Apenas em datas ou períodos específicos",
              "Ainda não tenho uma frequência definida",
            ].map((opt) => (
              <OptionButton
                key={opt}
                label={opt}
                selected={answers.frequenciaCompra === opt}
                onClick={() => selectAndNext("frequenciaCompra", opt)}
              />
            ))}
          </QuestionScreen>
        );

      case 11:
        return (
          <QuestionScreen
            emoji="📅"
            question="Quando você pretende realizar seu próximo pedido de calçados?"
            subtitle="Essa resposta ajuda a equipe comercial a organizar o atendimento de acordo com a urgência da sua loja."
          >
            {[
              "Nos próximos 7 dias",
              "Nos próximos 15 dias",
              "Nos próximos 30 dias",
              "Entre 30 e 90 dias",
              "Ainda não tenho uma data definida",
            ].map((opt) => (
              <OptionButton
                key={opt}
                label={opt}
                selected={answers.momentoCompra === opt}
                onClick={() => selectAndNext("momentoCompra", opt)}
              />
            ))}
          </QuestionScreen>
        );

      case 12:
        return (
          <QuestionScreen
            emoji="🤝"
            question="O que mais pesa na hora de escolher um fornecedor de calçados?"
            subtitle="Não existe resposta certa. Queremos entender a prioridade da sua empresa."
          >
            {[
              "Encontrar sempre o menor preço",
              "Trabalhar com marcas procuradas pelos clientes",
              "Ter variedade e novidades",
              "Receber assistência depois da compra",
              "Ter um representante que conheça minha loja",
              "Conseguir renovar produtos com baixo giro",
              "Receber apoio para ações e vendas",
              "Ter boas condições de pagamento",
              "Ter facilidade de reposição",
            ].map((opt) => (
              <OptionButton
                key={opt}
                label={opt}
                selected={answers.criterioFornecedor === opt}
                onClick={() => selectAndNext("criterioFornecedor", opt)}
              />
            ))}
          </QuestionScreen>
        );

      case 13:
        return (
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">
                <MessageSquareText className="w-6 h-6 text-primary" />
              </span>
              <div>
                <h2 className="text-lg md:text-xl font-bold text-foreground">
                  Existe alguma demanda específica que o consultor precisa conhecer?
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Qual produto, marca, modelo ou necessidade seus clientes mais pedem e você nem sempre consegue atender? (opcional)
                </p>
              </div>
            </div>

            <textarea
              value={answers.demandaEspecifica}
              onChange={(e) => setAnswer("demandaEspecifica", e.target.value)}
              placeholder="Exemplo: calçados infantis, sandálias confortáveis, numeração grande, modelos femininos, reposição de uma marca específica..."
              rows={3}
              className="w-full p-4 rounded-lg border-2 border-border bg-card text-foreground font-medium placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
            />

            <QuizButton onClick={next} variant="cta">
              Continuar
            </QuizButton>
          </div>
        );

      case 14:
        return (
          <div className="flex flex-col gap-5 py-4">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <ListChecks className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-xl md:text-2xl font-extrabold text-foreground leading-tight">
                Já temos as informações necessárias para entender sua loja
              </h2>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                Agora, suas respostas serão encaminhadas para a equipe comercial da Gol. O consultor utilizará essas informações para analisar:
              </p>
            </div>

            <ul className="flex flex-col gap-2 max-w-sm mx-auto w-full">
              {[
                "O formato da sua operação",
                "O perfil dos consumidores",
                "O estágio atual da categoria",
                "A faixa e a frequência de compra",
                "Os desafios do estoque",
                "As prioridades na escolha de um fornecedor",
                "O momento da próxima compra",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>

            <p className="text-sm font-semibold text-foreground text-center">
              Falta apenas informar seus dados para receber o atendimento
            </p>

            <QuizButton onClick={next} variant="cta">
              Continuar
            </QuizButton>
          </div>
        );

      case 15:
        return (
          <div className="flex flex-col gap-5 py-4">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <ShoppingBag className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-xl md:text-2xl font-extrabold text-foreground leading-tight">
                Finalize seus dados para receber uma sugestão personalizada de pedido
              </h2>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                Um consultor da Gol vai analisar a realidade da sua loja e entrar em contato pelo WhatsApp para apresentar marcas, produtos e opções compatíveis com sua operação.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <QuizInput
                value={answers.nome}
                onChange={(v) => setAnswer("nome", v)}
                placeholder="Nome do responsável pelas compras"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <select
                  value={answers.cargo}
                  onChange={(e) => setAnswer("cargo", e.target.value)}
                  className="w-full p-4 rounded-lg border-2 border-border bg-card text-foreground font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                >
                  <option value="" disabled>Cargo</option>
                  <option value="Proprietário">Proprietário</option>
                  <option value="Sócio">Sócio</option>
                  <option value="Comprador">Comprador</option>
                  <option value="Gerente">Gerente</option>
                  <option value="Responsável pelo setor">Responsável pelo setor</option>
                  <option value="Outro">Outro</option>
                </select>
                <QuizInput
                  value={answers.whatsapp}
                  onChange={(v) => setAnswer("whatsapp", v)}
                  placeholder="WhatsApp (00) 00000-0000"
                  mask="phone"
                />
              </div>

              {answers.cargo === "Outro" && (
                <QuizInput
                  value={answers.cargoOutro}
                  onChange={(v) => setAnswer("cargoOutro", v)}
                  placeholder="Qual o seu cargo?"
                />
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <QuizInput
                  value={answers.cnpj}
                  onChange={(v) => setAnswer("cnpj", v)}
                  placeholder="CNPJ da empresa"
                  mask="cnpj"
                />
                <QuizInput
                  value={answers.nomeEmpresa}
                  onChange={(v) => setAnswer("nomeEmpresa", v)}
                  placeholder="Nome da loja ou razão social"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <select
                  value={answers.estado}
                  onChange={(e) => setAnswer("estado", e.target.value)}
                  className="w-full p-4 rounded-lg border-2 border-border bg-card text-foreground font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                >
                  <option value="" disabled>Estado</option>
                  <option value="PI">Piauí (PI)</option>
                  <option value="MA">Maranhão (MA)</option>
                </select>
                <QuizInput
                  value={answers.cidade}
                  onChange={(v) => setAnswer("cidade", v)}
                  placeholder="Cidade da empresa"
                />
              </div>

              <QuizInput
                value={answers.email}
                onChange={(v) => setAnswer("email", v)}
                placeholder="E-mail comercial (opcional)"
              />
            </div>

            <label className="flex items-start gap-3 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={answers.consentimento}
                onChange={(e) => setAnswer("consentimento", e.target.checked)}
                className="mt-0.5 w-4 h-4 shrink-0 rounded border-2 border-border accent-primary"
              />
              Autorizo a Gol Distribuidora a entrar em contato comigo por telefone ou WhatsApp para dar continuidade à minha solicitação comercial.
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-semibold text-primary text-center">
              <span className="rounded-lg bg-primary/10 px-3 py-2">Boleto a prazo</span>
              <span className="rounded-lg bg-primary/10 px-3 py-2">Frete grátis acima de R$300</span>
              <span className="rounded-lg bg-primary/10 px-3 py-2">Mix de Calçados e Sapatos</span>
            </div>

            <QuizButton
              onClick={submitForm}
              disabled={
                !answers.nome.trim() ||
                !answers.cargo ||
                answers.whatsapp.length < 14 ||
                !validarCNPJ(answers.cnpj) ||
                !answers.nomeEmpresa.trim() ||
                !answers.estado ||
                !answers.cidade.trim() ||
                !answers.consentimento
              }
              variant="cta"
            >
              {isLoadingLead ? "Enviando..." : "Quero que um consultor monte meu pedido"}
            </QuizButton>
            <p className="text-xs text-muted-foreground text-center -mt-2">
              O envio não gera obrigação de compra. Preços, disponibilidade, crédito, prazo, frete e demais condições serão confirmados durante o atendimento.
            </p>
          </div>
        );

      case 16: {
        const firstName = answers.nome.split(" ")[0] || "";
        const mixIdeal = getMixIdeal(answers);

        return (
          <div className="flex flex-col gap-5 py-4">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-secondary/20 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7 text-secondary" />
              </div>
              <h2 className="text-xl md:text-2xl font-extrabold text-foreground leading-tight">
                {firstName ? `${firstName}, sua` : "Sua"} solicitação foi recebida
              </h2>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                As informações da sua empresa foram encaminhadas para a equipe comercial da Gol Distribuidora. Um consultor vai analisar suas respostas e entrar em contato pelo WhatsApp para:
              </p>
            </div>

            <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 max-w-sm mx-auto w-full">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">
                Com base nas suas respostas
              </p>
              <p className="text-sm font-bold text-foreground mb-2">
                O mix ideal para a sua loja é:
              </p>
              <ul className="flex flex-col gap-2">
                {mixIdeal.map((linha) => (
                  <li key={linha.id} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span className="text-foreground">
                      <strong>{linha.nome}</strong>
                      <span className="text-muted-foreground"> — {linha.marcas}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground mt-3">
                O consultor vai ajustar essa sugestão com você, considerando estoque, numeração e condições do momento.
              </p>
            </div>

            <ul className="flex flex-col gap-2 max-w-sm mx-auto w-full">
              {[
                "Entender melhor sua necessidade",
                "Apresentar as opções disponíveis",
                "Recomendar um mix adequado à sua loja",
                "Ajustar a sugestão de pedido com você",
                "Explicar as condições comerciais aplicáveis",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>

            <div className="rounded-xl border border-border bg-card p-4 max-w-sm mx-auto w-full">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                Para agilizar a conversa, tenha em mente
              </p>
              <ul className="flex flex-col gap-1 text-sm text-muted-foreground list-disc pl-4">
                <li>Os produtos que seus clientes mais pedem</li>
                <li>As marcas que já funcionam na loja</li>
                <li>As numerações com maior saída</li>
                <li>Os produtos que estão parados</li>
                <li>O valor que pretende investir na próxima compra</li>
              </ul>
            </div>

            <div className="w-full rounded-xl overflow-hidden border border-border aspect-video">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${VIDEO_ID}?autoplay=1&mute=1&controls=0&playsinline=1&rel=0`}
                title="Gol Distribuidora"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>

            <QuizButton onClick={redirectToSpecialist} variant="cta" disabled={isSubmittingLead}>
              {isSubmittingLead ? "Abrindo WhatsApp..." : "Falar com a Gol pelo WhatsApp"}
            </QuizButton>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-x-hidden">
      <WaveDecoration />

      {step > 1 && (
        <div className="w-full bg-white border-b border-border px-6 flex items-center justify-between relative shadow-sm" style={{ height: "72px" }}>
          <div className="w-[60px] flex justify-start">
            {step > 1 && step < 14 && (
              <button
                onClick={prev}
                className="text-primary text-sm font-medium"
                type="button"
              >
                ← Voltar
              </button>
            )}
          </div>

          <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center h-full">
            <img src={logo} alt="Gol Distribuidora" className="h-12 w-auto py-1" />
          </div>

          <div className="w-[60px]" />
        </div>
      )}

      {step >= 3 && step <= 14 && <BannerCarousel variant="strip" />}

      {step > 1 && step < TOTAL_STEPS && (
        <ProgressBar current={step - 1} total={TOTAL_STEPS - 1} />
      )}
      <div className="flex-1 flex items-start justify-center px-4 py-6">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const QuestionScreen = ({
  emoji,
  question,
  subtitle,
  children,
}: {
  emoji: string;
  question: string;
  subtitle?: string;
  children: ReactNode;
}) => (
  <div className="flex flex-col gap-4">
    <div className="flex items-start gap-3">
      <span className="text-2xl">{emoji}</span>

      <div>
        <h2 className="text-lg md:text-xl font-bold text-foreground">
          {question}
        </h2>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
    </div>

    <div className="flex flex-col gap-3 mt-2">{children}</div>
  </div>
);

export default Quiz;
