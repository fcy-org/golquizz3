import { useEffect, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Sparkles, Truck, CreditCard, Tag } from "lucide-react";
import ProgressBar from "./ProgressBar";
import OptionButton from "./OptionButton";
import QuizButton from "./QuizButton";
import QuizInput from "./QuizInput";
import WaveDecoration from "./WaveDecoration";
import BrandCarousel from "./BrandCarousel";
import BannerCarousel from "./BannerCarousel";
import logo from "../assets/logo-gol.webp";

declare function fbq(...args: unknown[]): void;

const TOTAL_STEPS = 10;
const VIDEO_ID = "5MnWu0N5LRk";
const WEBHOOK_URL = "/api/webhooks/leads/cmq0tkyiw0003dnk3jtdpcj6i";
const WHATSAPP_NUMBER = "5586999840542";

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
  produtos: string[];
  estado: string;
  cidade: string;
  nomeUsuario: string;
  nomeCompleto: string;
  email: string;
  telefone: string;
  documento: string;
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

async function sendWebhookLead(answers: Answers) {
  const leadName = answers.nomeCompleto || answers.nomeUsuario || "Lead";
  const normalizedPhone = answers.telefone.replace(/\D/g, "");
  const normalizedDoc = answers.documento.replace(/\D/g, "");
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
        pipeline_stage: "Diagnóstico Quiz Gol",
        notes: [
          `Tipo de loja: ${answers.tipoLoja || "Não informado"}`,
          `Investimento mensal em mercadoria: ${answers.investimentoMercadoria || "Não informado"}`,
          `Produto parado no estoque: ${answers.estoqueParado || "Não informado"}`,
          `Área que quer melhorar: ${answers.areaMelhorar || "Não informado"}`,
          `Categorias trabalhadas: ${answers.produtos.length > 0 ? answers.produtos.join(", ") : "Não informado"}`,
          answers.documento ? `CNPJ: ${answers.documento}` : "",
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
      quiz_name: "gol_distribuidora_diagnostico",
      step_number: step,
      step_name: `etapa-${step}`,
      step_url: `${window.location.pathname}${window.location.search}#etapa-${step}`,
    });

    fbq("trackCustom", `Quiz_Etapa_${step}`, {
      quiz_name: "gol_distribuidora_diagnostico",
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
      title: "Estoque parado travando margem",
      text: `${name}, sua ${loja.toLowerCase()} pode estar com capital preso em modelos de baixo giro. Revisar o mix com foco em marcas de alto giro ajuda a liberar caixa e abrir espaço para pares que vendem mais rápido.`,
      highlight: true,
    });
  } else if (answers.estoqueParado === "Um pouco") {
    insights.push({
      icon: "📦",
      title: "Oportunidade de margem no estoque",
      text: `${name}, há sinal de estoque parado, mas ainda dá para corrigir rápido. Ajustar o mix para categorias com maior giro regional pode melhorar a rentabilidade sem precisar aumentar volume de compras.`,
      highlight: true,
    });
  } else {
    insights.push({
      icon: "📈",
      title: "Base sólida para crescer",
      text: `${name}, com pouco produto parado, o próximo passo é usar esse capital de giro para fortalecer as categorias que aumentam o ticket médio por par vendido.`,
      highlight: true,
    });
  }

  // Insight 2: categoria de maior oportunidade
  const catMsg: Record<string, { title: string; text: string }> = {
    "Feminino": {
      title: "Feminino: maior volume e fidelização",
      text: "A categoria feminina concentra o maior volume de vendas em lojas de calçados do Nordeste. Um mix variado com marcas de alto giro e boa aceitação regional garante recompra frequente.",
    },
    "Masculino": {
      title: "Masculino: conforto que vende sozinho",
      text: "Calçados masculinos com foco em conforto e praticidade têm alta aceitação no varejo regional. Posicionar bem essa categoria reduz negociação de preço com o cliente.",
    },
    "Infantil": {
      title: "Infantil: venda recorrente que fideliza a família",
      text: "A linha infantil tem recompra garantida — criança cresce e o cliente volta. Uma família fidelizada na categoria infantil tende a comprar em outras categorias da mesma loja.",
    },
    "Baby": {
      title: "Baby: margem diferenciada e público especial",
      text: "Calçados baby têm percepção de valor mais alta e margem diferenciada. É uma categoria de presente frequente, com compra emocional e menor resistência a preço.",
    },
    "Licenciados": {
      title: "Licenciados: o cliente já quer antes de ver o preço",
      text: "Personagens licenciados eliminam a comparação de preço — o cliente quer aquele produto específico. Isso aumenta a margem e reduz o esforço de venda.",
    },
  };

  const destaque = answers.produtos.find((p) => catMsg[p]);
  if (destaque) {
    insights.push({ icon: "👟", ...catMsg[destaque] });
  }

  const areaMsg: Record<string, { title: string; text: string }> = {
    "Giro de produtos": {
      title: "Pares que deveriam girar mais",
      text: "A prioridade é identificar quais categorias têm maior saída na sua região e reduzir compras de modelos que ficam parados na prateleira consumindo capital.",
    },
    "Ticket médio": {
      title: "Ticket médio com o mix certo",
      text: "Combinar categorias como licenciados, feminino e infantil pode elevar o valor médio de cada venda sem depender de desconto para fechar o pedido.",
    },
    "Mix de categorias": {
      title: "Mix mais rentável por metro de prateleira",
      text: "Um mix equilibrado de marcas de alto giro evita excesso de modelos parecidos e fortalece as categorias com maior margem e recompra na sua região.",
    },
    "Margem de lucro": {
      title: "Mais margem por par vendido",
      text: "Trabalhar com distribuição exclusiva reduz a concorrência direta e permite sustentar uma margem maior sem perder vendas para o mesmo produto no concorrente.",
    },
  };

  if (answers.areaMelhorar && areaMsg[answers.areaMelhorar]) {
    insights.push({ icon: "💰", ...areaMsg[answers.areaMelhorar] });
  }

  const investMsg: Record<string, { title: string; text: string }> = {
    "Até R$1.000": {
      title: "Primeiro pedido: comece pelo mix de alto giro",
      text: `${name}, com um investimento inicial menor, o segredo é concentrar a compra em categorias de giro comprovado antes de diversificar — isso reduz o risco de capital parado logo no início.`,
    },
    "R$1.000 – R$5.000": {
      title: "Espaço para negociar melhores condições",
      text: `${name}, nesse volume de compra mensal já dá para negociar condições diferenciadas de atacado e testar mais de uma categoria sem comprometer o caixa.`,
    },
    "R$5.000 – R$15.000": {
      title: "Volume que justifica distribuição direta",
      text: `${name}, com esse volume mensal, comprar direto do distribuidor (sem intermediários) tende a aumentar sua margem de forma significativa em relação a fornecedores menores.`,
    },
    "Acima de R$15.000": {
      title: "Perfil para condições exclusivas de atacado",
      text: `${name}, com esse volume, sua loja se qualifica para condições comerciais exclusivas e prioridade de atendimento — o ideal é alinhar isso direto com um consultor.`,
    },
  };

  if (answers.investimentoMercadoria && investMsg[answers.investimentoMercadoria]) {
    insights.push({ icon: "📊", ...investMsg[answers.investimentoMercadoria] });
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
    produtos: [],
    estado: "",
    cidade: "",
    nomeUsuario: "",
    nomeCompleto: "",
    email: "",
    telefone: "",
    documento: "",
  });
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [isLoadingLead, setIsLoadingLead] = useState(false);
  const [webhookSent, setWebhookSent] = useState(false);
  const [diagnosisProgress, setDiagnosisProgress] = useState(0);
  const [diagnosisText, setDiagnosisText] = useState(
    "Preparando seu diagnóstico..."
  );

  useEffect(() => {
    trackQuizStep(step);
  }, [step]);

  useEffect(() => {
    if (step !== 8) {
      return;
    }

    const textSteps = [
      "Analisando seu perfil de loja...",
      "Comparando com padrões de lojas da sua região...",
      "Identificando oportunidades de margem no seu mix...",
      "Finalizando seu diagnóstico de rentabilidade...",
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
      `Olá! Fiz o diagnóstico no site e gostaria de falar com um consultor.\n\n` +
        `Nome: ${leadName}\n` +
        `Telefone: ${answers.telefone}\n` +
        `E-mail: ${answers.email}\n` +
        `CNPJ: ${answers.documento}\n` +
        `Tipo de loja: ${answers.tipoLoja}\n` +
        `Cidade: ${answers.cidade} / ${answers.estado}\n` +
        `Investimento mensal: ${answers.investimentoMercadoria}\n` +
        `Estoque parado: ${answers.estoqueParado}\n` +
        `Área que quer melhorar: ${answers.areaMelhorar}`
    );

    window.location.href = `https://wa.me/${phone}?text=${msg}`;
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="flex flex-col items-center text-center gap-6 py-8 w-full">
            <img src={logo} alt="Gol Distribuidora" className="h-24 w-auto" />

            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground leading-tight w-full max-w-md">
              Sua loja tem o perfil para ser{" "}
              <span className="text-primary">parceira Gol Distribuidora?</span>
            </h1>

            <p className="text-muted-foreground text-base md:text-lg w-full max-w-md">
              Cadastro rápido e simples. Um consultor exclusivo vai te chamar
              no WhatsApp com o catálogo completo e os valores de atacado das
              principais marcas.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-semibold text-primary text-center w-full max-w-md">
              <span className="rounded-lg bg-primary/10 px-3 py-2">💳 Boleto a prazo</span>
              <span className="rounded-lg bg-primary/10 px-3 py-2">🚚 Frete grátis acima de R$300</span>
              <span className="rounded-lg bg-primary/10 px-3 py-2">🏷️ Preço de atacado</span>
            </div>

            <div className="w-full mt-4">
              <QuizButton onClick={next} variant="cta">
                Começar Agora
              </QuizButton>
            </div>

            <BrandCarousel />
          </div>
        );

      case 2:
        return (
          <div className="flex flex-col items-center text-center gap-6 py-8 w-full">
            <h2 className="text-xl md:text-2xl font-extrabold text-foreground leading-tight w-full max-w-md">
              Vantagens de ser parceiro{" "}
              <span className="text-primary">Gol Distribuidora</span>
            </h2>

            <div className="w-full max-w-md flex flex-col gap-3 text-left">
              <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Truck className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-sm text-foreground">Pedido mínimo de R$300</p>
                  <p className="text-xs text-muted-foreground">Compre a partir de R$300 e ganhe frete grátis</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Tag className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-sm text-foreground">Preço de atacado</p>
                  <p className="text-xs text-muted-foreground">Condições exclusivas para revendedores</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-sm text-foreground">Pagamento facilitado</p>
                  <p className="text-xs text-muted-foreground">Boleto a prazo para sua loja comprar sem apertar o caixa</p>
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
            emoji="🏪"
            question="Qual tipo de loja você tem?"
          >
            {[
              "Loja de calçados",
              "Bazar / Loja de variedades",
              "Mercadinho / Mercearia",
              "Loja multimarcas",
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

      case 4:
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

      case 5:
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

      case 6:
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

      case 7:
        return (
          <QuestionScreen
            emoji="👟"
            question="Quais categorias de calçados você mais trabalha?"
            subtitle="(Pode selecionar mais de uma opção)"
          >
            {[
              "Feminino",
              "Masculino",
              "Infantil",
              "Baby",
              "Licenciados",
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

      case 8:
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
                  Preencha seu cadastro para ter acesso ao catálogo
                  completo e ao seu diagnóstico personalizado.
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

      case 9:
        return (
          <div className="flex flex-col gap-5 py-4">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <ShoppingBag className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-xl md:text-2xl font-extrabold text-foreground leading-tight">
                Falta pouco para virar parceiro Gol Distribuidora
              </h2>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                Complete seu cadastro para ter acesso ao catálogo completo e
                às condições exclusivas de atacado.
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
                onChange={(v) => setAnswer("email", v)}
                placeholder="E-mail"
              />
              <QuizInput
                value={answers.documento}
                onChange={(v) => setAnswer("documento", v)}
                placeholder="CNPJ"
                mask="cnpj"
              />
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
                  placeholder="Cidade"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-semibold text-primary text-center">
              <span className="rounded-lg bg-primary/10 px-3 py-2">Boleto a prazo</span>
              <span className="rounded-lg bg-primary/10 px-3 py-2">Frete grátis acima de R$300</span>
              <span className="rounded-lg bg-primary/10 px-3 py-2">Mix de Calçados e Sapatos</span>
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
                !answers.nomeCompleto.trim() ||
                answers.telefone.length < 14 ||
                !validarCNPJ(answers.documento) ||
                !answers.estado ||
                !answers.cidade.trim()
              }
              variant="cta"
            >
              {isLoadingLead ? "Cadastrando..." : "Cadastrar Agora"}
            </QuizButton>
          </div>
        );

      case 10: {
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
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground text-center">
                Antes de falar com o consultor
              </p>

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
            </div>

            <QuizButton onClick={redirectToSpecialist} variant="cta" disabled={isSubmittingLead}>
              {isSubmittingLead ? "Abrindo WhatsApp..." : "Comprar Agora"}
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
            {step > 1 && step < 8 && (
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

      {step >= 3 && step <= 8 && <BannerCarousel variant="strip" />}

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
