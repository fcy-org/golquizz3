import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Sparkles, TrendingUp } from "lucide-react";
import ProgressBar from "./ProgressBar";
import OptionButton from "./OptionButton";
import QuizButton from "./QuizButton";
import QuizInput from "./QuizInput";
import WaveDecoration from "./WaveDecoration";
import logo from "../assets/logo-garra-white.png";
import { MUNICIPIOS_PIAUI } from "@/data/municipiosPiaui";

declare function fbq(...args: unknown[]): void;

const TOTAL_STEPS = 9;
const WEBHOOK_URL = "/api/webhooks/leads/cmpy5fztd000348rojo6xn9f5";
const WHATSAPP_NUMBER = "558699870988";

const slideVariants = {
  enter: { x: 60, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -60, opacity: 0 },
};

type Answers = {
  tipoLoja: string;
  tipoLojaOutro: string;
  investimentoMercadoria: string;
  estoqueParado: string;
  areaMelhorar: string;
  faturamento: string;
  dor: string;
  desempenho: string;
  produtos: string[];
  mediaFaturamento: string;
  compraDistribuidora: string;
  estado: string;
  cidade: string;
  nomeFarmacia: string;
  nomeUsuario: string;
  usaRedes: string;
  redesSociais: string;
  nomeCompleto: string;
  email: string;
  cnpj: string;
  telefone: string;
};

function validarCNPJ(cnpj: string): boolean {
  const s = cnpj.replace(/\D/g, "");
  if (s.length !== 14) return false;
  if (/^(\d)\1+$/.test(s)) return false;

  const calc = (len: number) => {
    let sum = 0;
    let w = len - 7;
    for (let i = 0; i < len; i++) {
      sum += parseInt(s[i], 10) * w--;
      if (w < 2) w = 9;
    }
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };

  return calc(12) === parseInt(s[12], 10) && calc(13) === parseInt(s[13], 10);
}

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

async function sendWebhookLead(answers: Answers) {
  const leadName = answers.nomeCompleto || answers.nomeUsuario || "Lead";
  const normalizedPhone = answers.telefone.replace(/\D/g, "");
  const normalizedCnpj = answers.cnpj.replace(/\D/g, "");
  const fbclid = getFbclid();
  const tracking = getTrackingParams();

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: normalizedPhone,
        name: leadName,
        email: answers.email,
        document: normalizedCnpj,
        city: answers.cidade,
        state: "PI",
        pipeline_stage: "Diagnóstico Quiz Garra",
        notes: [
          `Tipo de estabelecimento: ${answers.tipoLoja || "Não informado"}`,
          `Investimento mensal em mercadoria: ${answers.investimentoMercadoria || "Não informado"}`,
          `Produto parado no estoque: ${answers.estoqueParado || "Não informado"}`,
          `Área que quer melhorar: ${answers.areaMelhorar || "Não informado"}`,
          `Categorias trabalhadas: ${answers.produtos.length > 0 ? answers.produtos.join(", ") : "Não informado"}`,
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
      quiz_name: "garra_distribuidora_diagnostico",
      step_number: step,
      step_name: `etapa-${step}`,
      step_url: `${window.location.pathname}${window.location.search}#etapa-${step}`,
    });

    fbq("trackCustom", `Quiz_Etapa_${step}`, {
      quiz_name: "garra_distribuidora_diagnostico",
      step_number: step,
    });
  } catch (error) {
    console.error("Meta Pixel step tracking error", error);
  }
}
function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

type DiagnosisInsight = {
  icon: string;
  title: string;
  text: string;
  highlight?: boolean;
};

function getDiagnosisInsights(answers: Answers, name: string): DiagnosisInsight[] {
  const insights: DiagnosisInsight[] = [];
  const loja = answers.tipoLoja || "loja";

  if (answers.estoqueParado === "Muito") {
    insights.push({
      icon: "⚠️",
      title: "Estoque parado travando lucro",
      text: `${name}, seu ${loja.toLowerCase()} pode estar com capital preso em produtos de baixo giro. Reorganizar o mix de doces, snacks e produtos de impulso ajuda a liberar caixa e abrir espaço para itens que vendem todos os dias.`,
      highlight: true,
    });
  } else if (answers.estoqueParado === "Um pouco") {
    insights.push({
      icon: "📦",
      title: "Oportunidade escondida no estoque",
      text: `${name}, existe sinal de estoque parado, mas ainda há espaço para corrigir rápido. O diagnóstico aponta onde ajustar as compras para melhorar giro, ticket e margem no seu estabelecimento.`,
      highlight: true,
    });
  } else {
    insights.push({
      icon: "📈",
      title: "Base saudável para crescer",
      text: `${name}, se quase não há produto parado, o próximo passo é fortalecer as categorias de impulso que aumentam o ticket médio sem pesar o estoque.`,
      highlight: true,
    });
  }

  // Insight 2: categoria de maior oportunidade
  const catMsg: Record<string, { title: string; text: string }> = {
    "Balas e chicletes": {
      title: "Balas e chicletes: o maior giro do checkout",
      text: "Balas e chicletes têm alta taxa de recompra e saída diária. Um mix bem abastecido no checkout evita ruptura e garante venda sem esforço de exposição.",
    },
    "Pirulitos e mastigáveis": {
      title: "Pirulitos e mastigáveis: impulso garantido",
      text: "Produtos mastigáveis têm forte apelo infantil e de impulso. Posicioná-los bem perto do caixa pode aumentar o ticket médio em cada compra.",
    },
    "Chocolates e snacks": {
      title: "Chocolates e snacks: margem acima da média",
      text: "Chocolates e snacks têm margem superior à maioria das categorias de impulso. Uma boa variedade de marcas Dori pode elevar o faturamento sem aumentar o volume de pedidos.",
    },
    "Produtos infantis Dori": {
      title: "Produtos infantis: fidelização pelo público certo",
      text: "A linha infantil Dori tem alta fidelização — crianças pedem pelo produto e adultos repetem a compra. Manter o mix atualizado transforma essa categoria em receita recorrente.",
    },
  };

  const destaque = answers.produtos.find((p) => catMsg[p]);
  if (destaque) {
    insights.push({ icon: "🍬", ...catMsg[destaque] });
  }

  const areaMsg: Record<string, { title: string; text: string }> = {
    "Giro de produtos": {
      title: "Produtos que deveriam girar mais",
      text: "A prioridade é identificar quais doces e snacks vendem mais rápido na sua região e reduzir compras que deixam dinheiro parado na prateleira.",
    },
    "Ticket médio": {
      title: "Ticket médio com produtos de impulso",
      text: "Doces, snacks e itens de impulso Dori podem elevar o valor de cada compra sem depender de promoções agressivas.",
    },
    "Mix de categorias": {
      title: "Mix mais inteligente por categoria",
      text: "Um mix equilibrado de balas, chocolates e snacks evita excesso de produtos parecidos e fortalece as categorias com maior recompra e margem.",
    },
    "Margem de lucro": {
      title: "Margem com compra mais estratégica",
      text: "Ajustar o mix de impulso ajuda seu estabelecimento a vender produtos com melhor retorno, não apenas itens que ocupam espaço no estoque.",
    },
  };

  if (answers.areaMelhorar && areaMsg[answers.areaMelhorar]) {
    insights.push({ icon: "💰", ...areaMsg[answers.areaMelhorar] });
  }

  return insights;
}

const Quiz = () => {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Answers>({
    tipoLoja: "",
    tipoLojaOutro: "",
    investimentoMercadoria: "",
    estoqueParado: "",
    areaMelhorar: "",
    faturamento: "",
    dor: "",
    desempenho: "",
    produtos: [],
    mediaFaturamento: "",
    compraDistribuidora: "",
    estado: "",
    cidade: "",
    nomeFarmacia: "",
    nomeUsuario: "",
    usaRedes: "",
    redesSociais: "",
    nomeCompleto: "",
    email: "",
    cnpj: "",
    telefone: "",
  });
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [isLoadingLead, setIsLoadingLead] = useState(false);
  const [webhookSent, setWebhookSent] = useState(false);
  const [diagnosisProgress, setDiagnosisProgress] = useState(0);
  const [redirectProgress, setRedirectProgress] = useState(0);
  const [redirectSeconds, setRedirectSeconds] = useState(3);
  const redirectStartedRef = useRef(false);
  const [diagnosisText, setDiagnosisText] = useState(
    "Preparando seu diagnóstico..."
  );

  useEffect(() => {
    trackQuizStep(step);
  }, [step]);

  useEffect(() => {
    if (step !== 7) {
      return;
    }

    const textSteps = [
      "Analisando seu perfil de compra...",
      "Comparando com padrões de mercados da sua região...",
      "Identificando oportunidades escondidas no seu mix...",
      "Finalizando seu diagnóstico de giro inteligente...",
    ];

    setDiagnosisProgress(0);
    setDiagnosisText(textSteps[0]);

    let progress = 0;

    const interval = window.setInterval(() => {
      progress += 1;
      setDiagnosisProgress(progress);

      if (progress < 25) setDiagnosisText(textSteps[0]);
      else if (progress < 50) setDiagnosisText(textSteps[1]);
      else if (progress < 75) setDiagnosisText(textSteps[2]);
      else setDiagnosisText(textSteps[3]);

      if (progress >= 100) {
        window.clearInterval(interval);
      }
    }, 50);

    return () => {
      window.clearInterval(interval);
    };
  }, [step]);

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  const prev = () => setStep((s) => Math.max(s - 1, 1));

  const setAnswer = <K extends keyof Answers>(key: K, value: Answers[K]) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const displayName = answers.nomeUsuario || "amigo";

  const toggleProduct = (product: string) => {
    setAnswers((prev) => {
      const current = prev.produtos;

      if (product === "Não trabalho muito esses produtos") {
        return {
          ...prev,
          produtos: current.includes(product) ? [] : [product],
        };
      }

      const filtered = current.filter(
        (p) => p !== "Não trabalho muito esses produtos"
      );

      return {
        ...prev,
        produtos: filtered.includes(product)
          ? filtered.filter((p) => p !== product)
          : [...filtered, product],
      };
    });
  };

  const selectAndNext = (key: keyof Answers, value: string) => {
    setAnswer(key, value as Answers[keyof Answers]);
    setTimeout(next, 350);
  };

  const getLeadName = () => {
    return answers.nomeCompleto || answers.nomeUsuario || displayName;
  };

  const redirectToSpecialist = async () => {
    if (isSubmittingLead) {
      return;
    }

    setIsSubmittingLead(true);

    if (!webhookSent) {
      await sendWebhookLead(answers);
    }

    const leadName = getLeadName();
    const phone = WHATSAPP_NUMBER;
    const msg = encodeURIComponent(
      `Olá! Fiz o diagnóstico no site e gostaria de falar com um especialista.\n\n` +
        `Nome: ${leadName}\n` +
        `Telefone: ${answers.telefone}\n` +
        `CNPJ: ${answers.cnpj}\n` +
        `Tipo de estabelecimento: ${answers.tipoLoja}\n` +
        `Cidade: ${answers.cidade} / PI\n` +
        `Investimento mensal: ${answers.investimentoMercadoria}\n` +
        `Estoque parado: ${answers.estoqueParado}\n` +
        `Área que quer melhorar: ${answers.areaMelhorar}`
    );

    window.location.href = `https://wa.me/${phone}?text=${msg}`;
  };

  useEffect(() => {
    if (step !== 9 || redirectStartedRef.current) {
      return;
    }

    redirectStartedRef.current = true;
    setRedirectProgress(0);
    setRedirectSeconds(3);

    const progressInterval = window.setInterval(() => {
      setRedirectProgress((current) => Math.min(current + 100 / 60, 100));
    }, 50);

    const secondsInterval = window.setInterval(() => {
      setRedirectSeconds((current) => Math.max(current - 1, 0));
    }, 1000);

    const redirectTimeout = window.setTimeout(() => {
      window.clearInterval(progressInterval);
      window.clearInterval(secondsInterval);
      setRedirectProgress(100);
      setRedirectSeconds(0);
      void redirectToSpecialist();
    }, 3000);

    return () => {
      window.clearInterval(progressInterval);
      window.clearInterval(secondsInterval);
      window.clearTimeout(redirectTimeout);
    };
  }, [step]);

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="flex flex-col items-center text-center gap-6 py-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground leading-tight">
              Seu estoque pode estar travando{" "}
              <span className="text-primary">o lucro da sua loja</span>
            </h1>

            <p className="text-muted-foreground text-base md:text-lg max-w-md">
              Descubra em 2 minutos quais doces, snacks e produtos de impulso
              podem destravar o giro do seu estabelecimento.
            </p>

            <p className="text-primary font-semibold text-sm md:text-base max-w-md">
              +120 estabelecimentos no Piauí já aplicaram esse diagnóstico.
              Frete grátis para o Piauí.
            </p>

            <div className="w-full mt-4">
              <QuizButton onClick={next} variant="cta">
                👉 Fazer diagnóstico gratuito
              </QuizButton>
            </div>
          </div>
        );

      case 2:
        return (
          <QuestionScreen
            emoji="🏪"
            question="Qual tipo de estabelecimento você tem?"
          >
            {[
              "Mercado / Mercadinho",
              "Supermercado",
              "Conveniência",
              "Padaria",
              "Outro",
            ].map((opt) => (
              <OptionButton
                key={opt}
                label={opt}
                selected={
                  answers.tipoLoja === opt ||
                  (opt === "Outro" && Boolean(answers.tipoLojaOutro))
                }
                onClick={() => {
                  if (opt === "Outro") {
                    setAnswer("tipoLoja", opt);
                    return;
                  }

                  setAnswers((prev) => ({
                    ...prev,
                    tipoLoja: opt,
                    tipoLojaOutro: "",
                  }));
                  setTimeout(next, 350);
                }}
              />
            ))}

            {(answers.tipoLoja === "Outro" || answers.tipoLojaOutro) && (
              <>
                <QuizInput
                  value={answers.tipoLojaOutro}
                  onChange={(v) => setAnswer("tipoLojaOutro", v)}
                  placeholder="Digite o tipo de loja"
                />

                <div className="mt-2">
                  <QuizButton
                    onClick={() => {
                      setAnswer("tipoLoja", answers.tipoLojaOutro.trim());
                      setTimeout(next, 150);
                    }}
                    disabled={!answers.tipoLojaOutro.trim()}
                  >
                    Continuar
                  </QuizButton>
                </div>
              </>
            )}
          </QuestionScreen>
        );

      case 3:
        return (
          <QuestionScreen
            emoji="💳"
            question="Quanto você investe por mês em mercadoria?"
          >
            {[
              "Até R$1.000",
              "R$1.000 – R$5.000",
              "R$5.000 – R$15.000",
              "Acima de R$15.000",
            ].map((opt) => (
              <OptionButton
                key={opt}
                label={opt}
                selected={answers.investimentoMercadoria === opt}
                onClick={() => selectAndNext("investimentoMercadoria", opt)}
              />
            ))}
          </QuestionScreen>
        );

      case 4:
        return (
          <QuestionScreen
            emoji="📦"
            question="Hoje, você sente que tem produto parado no estoque?"
          >
            {[
              "Muito",
              "Um pouco",
              "Quase nada",
            ].map((opt) => (
              <OptionButton
                key={opt}
                label={opt}
                selected={answers.estoqueParado === opt}
                onClick={() => selectAndNext("estoqueParado", opt)}
              />
            ))}
          </QuestionScreen>
        );

      case 5:
        return (
          <QuestionScreen
            emoji="💡"
            question="Qual dessas áreas você mais quer melhorar?"
          >
            {[
              "Giro de produtos",
              "Ticket médio",
              "Mix de categorias",
              "Margem de lucro",
            ].map((opt) => (
              <OptionButton
                key={opt}
                label={opt}
                selected={answers.areaMelhorar === opt}
                onClick={() => selectAndNext("areaMelhorar", opt)}
              />
            ))}
          </QuestionScreen>
        );

      case 6:
        return (
          <QuestionScreen
            emoji="🍬"
            question="Quais categorias de doces, snacks e bomboniere você mais trabalha?"
            subtitle="(Pode selecionar mais de uma opção)"
          >
            {[
              "Balas e chicletes",
              "Pirulitos e mastigáveis",
              "Chocolates e snacks",
              "Produtos infantis Dori",
            ].map((opt) => (
              <OptionButton
                key={opt}
                label={opt}
                selected={answers.produtos.includes(opt)}
                onClick={() => toggleProduct(opt)}
                multiSelect
              />
            ))}

            <div className="mt-2">
              <QuizButton onClick={next} disabled={answers.produtos.length === 0}>
                Continuar
              </QuizButton>
            </div>
          </QuestionScreen>
        );

      case 7:
        return (
          <div className="flex flex-col items-center text-center gap-5 py-8">
            <div className="w-16 h-16 rounded-2xl bg-secondary/20 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-secondary" />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl md:text-3xl font-extrabold text-foreground leading-tight">
                Estamos analisando seu perfil
              </h2>
              <p className="text-primary font-semibold text-base">
                e comparando com padrões da sua região
              </p>
            </div>

            <p className="text-muted-foreground text-sm max-w-sm">
              Identificando oportunidades escondidas de faturamento no seu
              estoque.
            </p>

            <div className="w-full max-w-md space-y-2">
              <div className="flex items-center justify-between px-0.5">
                <p className="text-sm text-muted-foreground">{diagnosisText}</p>
                <span className="text-base font-bold text-primary tabular-nums">
                  {diagnosisProgress}%
                </span>
              </div>

              <div className="w-full h-3 rounded-full bg-border overflow-hidden relative">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-secondary relative overflow-hidden"
                  initial={{ width: "0%" }}
                  animate={{ width: `${diagnosisProgress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  {diagnosisProgress < 100 && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                      animate={{ x: ["-100%", "200%"] }}
                      transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
                    />
                  )}
                </motion.div>
              </div>
            </div>

            {diagnosisProgress === 100 && (
              <motion.div
                className="w-full max-w-md text-left space-y-2 pt-1"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <p className="text-foreground font-bold text-lg">
                  ✅ Diagnóstico concluído!
                </p>
                <p className="text-muted-foreground text-sm">
                  Preencha o formulário com seus dados para ter acesso ao
                  resultado completo.
                </p>
                <div className="pt-2">
                  <QuizButton onClick={next} variant="cta">
                    Continuar
                  </QuizButton>
                </div>
              </motion.div>
            )}
          </div>
        );

      case 8:
        return (
          <div className="flex flex-col gap-5 py-4">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <ShoppingBag className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-xl md:text-2xl font-extrabold text-foreground leading-tight">
                Seu diagnóstico está pronto (faltam 10 segundos)
              </h2>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                Preencha para liberar suas oportunidades de lucro.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <QuizInput
                value={answers.nomeCompleto}
                onChange={(v) => setAnswer("nomeCompleto", v)}
                placeholder="Nome completo"
              />
              <QuizInput
                value={answers.telefone}
                onChange={(v) => setAnswer("telefone", v)}
                placeholder="WhatsApp (00) 00000-0000"
                mask="phone"
              />
              <QuizInput
                value={answers.email}
                onChange={(v) => setAnswer("email", v.trim().toLowerCase())}
                placeholder="E-mail"
                type="email"
              />
              {answers.email && !isValidEmail(answers.email) && (
                <p className="text-sm text-destructive -mt-1">
                  Informe um e-mail válido.
                </p>
              )}
              <select
                value={answers.cidade}
                onChange={(e) => setAnswer("cidade", e.target.value)}
                className="w-full p-4 rounded-lg border-2 border-border bg-card text-foreground font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              >
                <option value="" disabled>Cidade (Piauí)</option>
                {MUNICIPIOS_PIAUI.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <QuizInput
                value={answers.cnpj}
                onChange={(v) => setAnswer("cnpj", v)}
                placeholder="CNPJ 00.000.000/0000-00"
                mask="cnpj"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-semibold text-primary text-center">
              <span className="rounded-lg bg-primary/10 px-3 py-2">Frete grátis no PI</span>
              <span className="rounded-lg bg-primary/10 px-3 py-2">Atendimento especialista</span>
              <span className="rounded-lg bg-primary/10 px-3 py-2">Sugestão personalizada</span>
            </div>

            <QuizButton
              onClick={async () => {
                if (isLoadingLead) {
                  return;
                }

                setIsLoadingLead(true);
                await sendWebhookLead(answers);
                setWebhookSent(true);
                try {
                  fbq("track", "Lead");
                } catch (_) {}
                setIsLoadingLead(false);
                next();
              }}
              disabled={
                answers.telefone.length < 14 ||
                !isValidEmail(answers.email) ||
                !validarCNPJ(answers.cnpj) ||
                !answers.cidade
              }
              variant="cta"
            >
              {isLoadingLead ? "Enviando dados..." : "Liberar meu diagnóstico"}
            </QuizButton>
          </div>
        );

      case 9: {
        const leadName = getLeadName();
        const firstName = leadName.split(" ")[0] || displayName;
        const insights = getDiagnosisInsights(answers, firstName);

        return (
          <div className="flex flex-col gap-5 py-4">
            {/* Cabeçalho */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-secondary/20 flex items-center justify-center mx-auto">
                <Sparkles className="w-7 h-7 text-secondary" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Diagnóstico personalizado
              </p>
              <h2 className="text-xl md:text-2xl font-extrabold text-foreground leading-tight">
                {firstName}, identificamos{" "}
                <span className="text-primary">
                  {insights.length} oportunidade{insights.length !== 1 ? "s" : ""}
                </span>{" "}
                na sua loja
              </h2>
            </div>

            {/* Cards de insights */}
            <div className="flex flex-col gap-3">
              {insights.map((insight, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-xl border-l-4 bg-card ${
                    insight.highlight ? "border-l-primary" : "border-l-secondary"
                  }`}
                >
                  <p className="font-bold text-sm text-foreground flex items-center gap-2">
                    <span>{insight.icon}</span>
                    {insight.title}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    {insight.text}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3 pt-1">
              <p className="text-sm text-muted-foreground text-center">
                Veja produtos que você deveria parar de comprar, categorias que
                podem dobrar seu giro e uma estimativa de ganho mensal com uma
                sugestão personalizada.
              </p>

              <div className="w-full rounded-xl border border-border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-foreground">
                    Estamos te redirecionando em {redirectSeconds} segundo
                    {redirectSeconds === 1 ? "" : "s"}
                  </p>
                  <span className="text-sm font-bold text-primary tabular-nums">
                    {Math.round(redirectProgress)}%
                  </span>
                </div>

                <div className="h-3 w-full rounded-full bg-border overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                    initial={{ width: "0%" }}
                    animate={{ width: `${redirectProgress}%` }}
                    transition={{ duration: 0.15, ease: "linear" }}
                  />
                </div>
              </div>
          </div>
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

      <div className="w-full bg-primary px-6 flex items-center justify-between relative shadow-md" style={{ height: "96px" }}>
        <div className="w-[60px] flex justify-start">
          {step > 1 && step < 7 && (
            <button
              onClick={prev}
              className="text-primary-foreground text-sm font-medium"
              type="button"
            >
              ← Voltar
            </button>
          )}
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center h-full">
          <img src={logo} alt="GARRA Distribuidora" className="h-full w-auto py-2" />
        </div>

        <div className="w-[60px]" />
      </div>

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
