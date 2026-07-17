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
  participacaoCalcados: string;
  volumeMensal: string;
  historicoCompra: string;
  frequenciaCompra: string;
  momentoCompra: string;
  principalObjetivo: string;
  capacidadeProximoPedido: string;
  condicaoPagamento: string;
  demandaEspecifica: string;
  nome: string;
  cargo: string;
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

  const estruturaPontos: Record<string, [string, number][]> = {
    "Ainda não trabalhamos com calçados": [["casual", 2], ["infantil", 1], ["conforto", 1]],
    "Vendemos apenas alguns modelos": [["casual", 2], ["infantil", 1], ["conforto", 1]],
    "Os calçados ficam distribuídos em outros setores": [["casual", 1], ["conforto", 1]],
    "Já vende calçados, mas a seção ainda é pequena": [["casual", 1], ["infantil", 1]],
    "Já possui uma seção estruturada": [
      ["feminina", 1],
      ["esportiva", 1],
      ["casual", 1],
      ["infantil", 1],
      ["conforto", 1],
    ],
  };
  const estrutura = estruturaPontos[answers.participacaoCalcados];
  if (estrutura) {
    estrutura.forEach(([id, points]) => add(id, points));
  }

  const objetivoPontos: Record<string, [string, number][]> = {
    "Ampliar a variedade": [["feminina", 2], ["esportiva", 1]],
    "Incluir novas marcas": [["feminina", 1], ["esportiva", 2]],
    "Melhorar a reposição do que vende": [["casual", 2]],
    "Renovar produtos com pouca saída": [["casual", 2]],
    "Estruturar a seção de calçados": [["casual", 1], ["infantil", 1], ["conforto", 1]],
    "Criar ações em datas comerciais": [["infantil", 1], ["esportiva", 1]],
  };
  if (answers.principalObjetivo === "Entender quais produtos fazem sentido para nosso público") {
    addAll(1);
  } else {
    const objetivo = objetivoPontos[answers.principalObjetivo];
    if (objetivo) {
      objetivo.forEach(([id, points]) => add(id, points));
    }
  }

  if (["De 101 a 300 pares", "Mais de 300 pares"].includes(answers.volumeMensal)) {
    add("casual", 2);
    add("infantil", 1);
  }

  const ranked = MIX_LINHAS.filter(({ id }) => score[id] > 0).sort(
    (a, b) => score[b.id] - score[a.id]
  );

  if (ranked.length === 0) {
    return MIX_LINHAS.filter(({ id }) => ["casual", "infantil", "conforto"].includes(id));
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
          `Função de quem responde: ${answers.cargo || "Não informado"}`,
          `Situação da empresa: ${answers.situacaoEmpresa || "Não informado"}`,
          `Estrutura da seção de calçados: ${answers.participacaoCalcados || "Não informado"}`,
          `Volume mensal de vendas: ${answers.volumeMensal || "Não informado"}`,
          `Histórico de compra: ${answers.historicoCompra || "Não informado"}`,
          `Frequência de reposição: ${answers.frequenciaCompra || "Não informado"}`,
          `Momento do próximo pedido: ${answers.momentoCompra || "Não informado"}`,
          `Principal objetivo: ${answers.principalObjetivo || "Não informado"}`,
          `Capacidade do próximo pedido: ${answers.capacidadeProximoPedido || "Não informado"}`,
          `Condição de pagamento: ${answers.condicaoPagamento || "Não informado"}`,
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
    participacaoCalcados: "",
    volumeMensal: "",
    historicoCompra: "",
    frequenciaCompra: "",
    momentoCompra: "",
    principalObjetivo: "",
    capacidadeProximoPedido: "",
    condicaoPagamento: "",
    demandaEspecifica: "",
    nome: "",
    cargo: "",
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
        `Função: ${answers.cargo}\n` +
        `Empresa: ${answers.nomeEmpresa}\n` +
        `WhatsApp: ${answers.whatsapp}\n` +
        `E-mail: ${answers.email}\n` +
        `CNPJ: ${answers.cnpj}\n` +
        `Cidade: ${answers.cidade} / ${answers.estado}\n\n` +
        `Situação da empresa: ${answers.situacaoEmpresa}\n` +
        `Estrutura da seção de calçados: ${answers.participacaoCalcados}\n` +
        `Volume mensal de vendas: ${answers.volumeMensal}\n` +
        `Histórico de compra: ${answers.historicoCompra}\n` +
        `Frequência de reposição: ${answers.frequenciaCompra}\n` +
        `Momento do próximo pedido: ${answers.momentoCompra}\n` +
        `Principal objetivo: ${answers.principalObjetivo}\n` +
        `Capacidade do próximo pedido: ${answers.capacidadeProximoPedido}\n` +
        `Condição de pagamento: ${answers.condicaoPagamento}\n` +
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
              Atendimento comercial para supermercados com CNPJ
            </span>

            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground leading-tight w-full max-w-md">
              Monte um pedido de calçados pensado para{" "}
              <span className="text-primary">a realidade do seu supermercado</span>
            </h1>

            <p className="text-muted-foreground text-base md:text-lg w-full max-w-md">
              Conte como funciona sua seção de calçados, qual é o perfil dos
              consumidores, o volume de compra e o ritmo de reposição. Com
              essas informações, um consultor da Gol vai analisar sua
              operação e preparar uma sugestão personalizada de pedido para
              apresentar pelo WhatsApp.
            </p>

            <div className="w-full mt-4">
              <QuizButton onClick={next} variant="cta">
                Começar meu pedido consultivo
              </QuizButton>
              <p className="text-xs text-muted-foreground mt-2">
                Formulário de até 2 minutos. Atendimento para empresas com CNPJ.
              </p>
            </div>

            <ul className="w-full max-w-md flex flex-col gap-2 text-left">
              {[
                ["Marcas populares", "Molekinho, Vizzano, Cartago, Ipanema e outras opções do catálogo."],
                ["Mix para diferentes públicos", "Linhas femininas, masculinas, infantis, chinelos e sandálias."],
                ["Atendimento consultivo", "A recomendação considera a estrutura e o momento do supermercado."],
              ].map(([titulo, desc]) => (
                <li key={titulo} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-foreground">{titulo}</strong>{" "}
                    <span className="text-muted-foreground">— {desc}</span>
                  </span>
                </li>
              ))}
            </ul>

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
            emoji="👤"
            question="Qual é sua função no supermercado?"
            subtitle="Primeiro, precisamos saber quem está conduzindo esta solicitação"
          >
            {[
              "Sou proprietário ou sócio",
              "Sou responsável pelas compras",
              "Sou gerente",
              "Sou responsável pela seção de calçados",
              "Preciso consultar outra pessoa antes de comprar",
            ].map((opt) => (
              <OptionButton
                key={opt}
                label={opt}
                selected={answers.cargo === opt}
                onClick={() => selectAndNext("cargo", opt)}
              />
            ))}
          </QuestionScreen>
        );

      case 4:
        return (
          <QuestionScreen
            emoji="🏢"
            question="Qual é a situação atual do supermercado?"
            subtitle="Agora, algumas informações sobre a operação"
          >
            {[
              "Possui CNPJ ativo e está em operação",
              "O CNPJ está em regularização",
              "A operação ainda está em planejamento",
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

      case 5:
        return (
          <QuestionScreen
            emoji="👟"
            question="Como funciona atualmente a seção de calçados?"
            subtitle="Queremos entender como os calçados estão presentes no supermercado"
          >
            {[
              "Já possui uma seção estruturada",
              "Já vende calçados, mas a seção ainda é pequena",
              "Os calçados ficam distribuídos em outros setores",
              "Vendemos apenas alguns modelos",
              "Ainda não trabalhamos com calçados",
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
            emoji="📦"
            question="Quantos pares de calçados o supermercado vende aproximadamente por mês?"
            subtitle="Um bom pedido precisa considerar o volume real de vendas"
          >
            {[
              "Até 20 pares",
              "De 21 a 50 pares",
              "De 51 a 100 pares",
              "De 101 a 300 pares",
              "Mais de 300 pares",
              "Ainda não vendemos calçados",
            ].map((opt) => (
              <OptionButton
                key={opt}
                label={opt}
                selected={answers.volumeMensal === opt}
                onClick={() => selectAndNext("volumeMensal", opt)}
              />
            ))}
          </QuestionScreen>
        );

      case 7:
        return (
          <QuestionScreen
            emoji="💰"
            question="Qual foi aproximadamente o valor da última compra de calçados?"
            subtitle="O histórico ajuda a dimensionar a próxima sugestão"
          >
            {[
              "Até R$ 1.000",
              "De R$ 1.000 a R$ 5.000",
              "De R$ 5.000 a R$ 15.000",
              "Acima de R$ 15.000",
              "Ainda não fizemos uma compra no atacado",
            ].map((opt) => (
              <OptionButton
                key={opt}
                label={opt}
                selected={answers.historicoCompra === opt}
                onClick={() => selectAndNext("historicoCompra", opt)}
              />
            ))}
          </QuestionScreen>
        );

      case 8:
        return (
          <QuestionScreen
            emoji="🔁"
            question="Com que frequência o supermercado costuma repor calçados?"
            subtitle="Agora precisamos entender o ritmo da categoria"
          >
            {[
              "Toda semana",
              "A cada 15 dias",
              "Uma vez por mês",
              "A cada dois ou três meses",
              "Apenas em datas comerciais",
              "Ainda não temos uma frequência definida",
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

      case 9:
        return (
          <QuestionScreen
            emoji="📅"
            question="Quando o supermercado pretende fazer o próximo pedido de calçados?"
            subtitle="Em que momento sua operação está agora?"
          >
            {[
              "Nos próximos 7 dias",
              "Nos próximos 15 dias",
              "Nos próximos 30 dias",
              "Entre 30 e 90 dias",
              "Ainda estamos apenas pesquisando",
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

      case 10:
        return (
          <QuestionScreen
            emoji="🎯"
            question="Onde o supermercado mais precisa de apoio hoje?"
            subtitle="Qual é o principal objetivo da seção neste momento?"
          >
            {[
              "Ampliar a variedade",
              "Melhorar a reposição do que vende",
              "Incluir novas marcas",
              "Estruturar a seção de calçados",
              "Renovar produtos com pouca saída",
              "Criar ações em datas comerciais",
              "Entender quais produtos fazem sentido para nosso público",
            ].map((opt) => (
              <OptionButton
                key={opt}
                label={opt}
                selected={answers.principalObjetivo === opt}
                onClick={() => selectAndNext("principalObjetivo", opt)}
              />
            ))}
          </QuestionScreen>
        );

      case 11:
        return (
          <QuestionScreen
            emoji="💵"
            question="Quanto o supermercado pretende investir no próximo pedido de calçados?"
            subtitle="A sugestão precisa respeitar o momento financeiro da operação"
          >
            {[
              "De R$ 1.050 a R$ 5.000",
              "De R$ 5.000 a R$ 15.000",
              "Acima de R$ 15.000",
              "Ainda não definimos o valor",
            ].map((opt) => (
              <OptionButton
                key={opt}
                label={opt}
                selected={answers.capacidadeProximoPedido === opt}
                onClick={() => selectAndNext("capacidadeProximoPedido", opt)}
              />
            ))}
            <p className="text-xs text-muted-foreground text-center mt-1">
              O valor mínimo de compra é de R$ 1.050. A resposta não representa compromisso de compra.
            </p>
          </QuestionScreen>
        );

      case 12:
        return (
          <QuestionScreen
            emoji="💳"
            question="Caso o boleto não seja aprovado na análise de crédito, o supermercado consegue realizar o primeiro pedido por Pix ou pagamento à vista?"
            subtitle="Para finalizar, precisamos entender a condição real da compra"
          >
            {[
              "Sim",
              "Talvez, dependendo do valor",
              "Não, somente se o boleto for aprovado",
              "Ainda precisamos avaliar internamente",
            ].map((opt) => (
              <OptionButton
                key={opt}
                label={opt}
                selected={answers.condicaoPagamento === opt}
                onClick={() => selectAndNext("condicaoPagamento", opt)}
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
                  Existe algum produto, marca, modelo ou numeração que seus clientes procuram e o supermercado tem dificuldade de manter?
                </h2>
              </div>
            </div>

            <textarea
              value={answers.demandaEspecifica}
              onChange={(e) => setAnswer("demandaEspecifica", e.target.value)}
              placeholder="Exemplo: infantil, sandálias confortáveis, numerações grandes, chinelos masculinos…"
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
                Já temos as informações necessárias para entender sua seção
              </h2>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                O consultor utilizará suas respostas para analisar:
              </p>
            </div>

            <ul className="flex flex-col gap-2 max-w-sm mx-auto w-full">
              {[
                "Estrutura atual",
                "Volume de vendas",
                "Histórico de compra",
                "Ritmo de reposição",
                "Momento do próximo pedido",
                "Objetivos da categoria",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>

            <p className="text-sm font-semibold text-foreground text-center">
              Falta apenas preencher os dados da empresa para receber o atendimento
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
                Um consultor da Gol vai analisar a realidade do supermercado e entrar em contato pelo WhatsApp para apresentar as opções disponíveis e ajustar o pedido com você.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <QuizInput
                value={answers.nome}
                onChange={(v) => setAnswer("nome", v)}
                placeholder="Nome do responsável pelas compras"
              />

              <QuizInput
                value={answers.whatsapp}
                onChange={(v) => setAnswer("whatsapp", v)}
                placeholder="WhatsApp (00) 00000-0000"
                mask="phone"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <QuizInput
                  value={answers.cnpj}
                  onChange={(v) => setAnswer("cnpj", v)}
                  placeholder="CNPJ da empresa"
                  mask="cnpj"
                  error={
                    answers.cnpj.replace(/\D/g, "").length === 14 && !validarCNPJ(answers.cnpj)
                      ? "CNPJ inválido"
                      : undefined
                  }
                />
                <QuizInput
                  value={answers.nomeEmpresa}
                  onChange={(v) => setAnswer("nomeEmpresa", v)}
                  placeholder="Nome do supermercado"
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
              {isLoadingLead ? "Enviando..." : "Quero receber a sugestão para meu supermercado"}
            </QuizButton>
            <p className="text-xs text-muted-foreground text-center -mt-2">
              O envio não gera obrigação de compra. Preços, estoque, frete, prazo e crédito serão confirmados durante o atendimento. Boleto sujeito à análise.
            </p>
          </div>
        );

      case 16: {
        const firstName = answers.nome.split(" ")[0] || "";
        const mixIdeal = getMixIdeal(answers);

        return (
          <div className="flex flex-col gap-5 py-4">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7 text-emerald-600" />
              </div>
              <h2 className="text-xl md:text-2xl font-extrabold text-foreground leading-tight">
                {firstName ? `${firstName}, sua` : "Sua"} solicitação foi recebida
              </h2>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                As informações da sua empresa foram encaminhadas para a equipe comercial da Gol Distribuidora. Um consultor vai analisar suas respostas e entrar em contato pelo WhatsApp para:
              </p>
            </div>

            <div className="rounded-xl border-2 border-emerald-500 bg-gradient-to-br from-emerald-50 to-emerald-100/70 p-4 max-w-sm mx-auto w-full shadow-md shadow-emerald-500/10">
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-2">
                ✨ Com base nas suas respostas
              </p>
              <p className="text-base font-extrabold text-emerald-900 mb-2">
                O mix ideal para o seu supermercado é:
              </p>
              <ul className="flex flex-col gap-2">
                {mixIdeal.map((linha) => (
                  <li key={linha.id} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-emerald-950">
                      <strong>{linha.nome}</strong>
                      <span className="text-emerald-800/80"> — {linha.marcas}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-emerald-800/70 mt-3">
                O consultor vai ajustar essa sugestão com você, considerando estoque, numeração e condições do momento.
              </p>
            </div>

            <ul className="flex flex-col gap-2 max-w-sm mx-auto w-full">
              {[
                "Entender melhor sua necessidade",
                "Apresentar as opções disponíveis",
                "Recomendar um mix adequado ao seu supermercado",
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
                <li>As marcas que já funcionam no supermercado</li>
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
