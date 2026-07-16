import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import bannerVizzano from "../assets/banners/banner-vizzano.jpg";
import bannerEsportivo from "../assets/banners/banner-esportivo.jpg";
import bannerConforto from "../assets/banners/banner-conforto.jpg";
import bannerInfantil from "../assets/banners/bannerinfantil.jpg";

const banners = [
  { name: "Infantil", image: bannerInfantil },
  { name: "Vizzano", image: bannerVizzano },
  { name: "Linha esportiva", image: bannerEsportivo },
  { name: "Conforto", image: bannerConforto },
];

const AUTOPLAY_MS = 4000;

interface BannerCarouselProps {
  variant?: "card" | "strip";
}

const BannerCarousel = ({ variant = "card" }: BannerCarouselProps) => {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    banners.forEach(({ image }) => {
      const preload = new Image();
      preload.src = image;
    });
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => setIsPageVisible(!document.hidden);

    handleVisibilityChange();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (isPaused || !isPageVisible || shouldReduceMotion) return;

    const timeout = window.setTimeout(() => {
      setIndex((current) => (current + 1) % banners.length);
    }, AUTOPLAY_MS);

    return () => window.clearTimeout(timeout);
  }, [index, isPageVisible, isPaused, shouldReduceMotion]);

  const showPrevious = () => {
    setIndex((current) => (current - 1 + banners.length) % banners.length);
  };

  const showNext = () => {
    setIndex((current) => (current + 1) % banners.length);
  };

  const slide = (
    <AnimatePresence initial={false}>
      <motion.div
        key={banners[index].name}
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.45, ease: "easeOut" }}
      >
        <img
          src={banners[index].image}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full scale-105 object-cover blur-xl opacity-25"
        />
        <div className="absolute inset-0 bg-background/35" aria-hidden="true" />
        <img
          src={banners[index].image}
          alt={`${banners[index].name} — banner ${index + 1} de ${banners.length}`}
          className="absolute inset-0 h-full w-full object-contain"
        />
      </motion.div>
    </AnimatePresence>
  );

  const controls = (
    <div
      className="flex h-11 items-center justify-center gap-1 bg-background"
      role="group"
      aria-label="Controles dos banners"
    >
      <button
        type="button"
        onClick={showPrevious}
        aria-label="Banner anterior"
        className="flex h-11 w-11 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
      </button>

      {banners.map((banner, bannerIndex) => (
        <button
          key={banner.name}
          type="button"
          onClick={() => setIndex(bannerIndex)}
          aria-label={`Ver banner ${banner.name}`}
          aria-current={bannerIndex === index ? "true" : undefined}
          className="flex h-11 w-11 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <span
            className={`h-1.5 rounded-full transition-all ${
              bannerIndex === index ? "w-6 bg-primary" : "w-1.5 bg-primary/30"
            }`}
            aria-hidden="true"
          />
        </button>
      ))}

      <button
        type="button"
        onClick={showNext}
        aria-label="Próximo banner"
        className="flex h-11 w-11 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <ChevronRight className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  );

  const pauseHandlers = {
    onMouseEnter: () => setIsPaused(true),
    onMouseLeave: () => setIsPaused(false),
    onFocusCapture: () => setIsPaused(true),
    onBlurCapture: () => setIsPaused(false),
  };

  if (variant === "strip") {
    return (
      <section
        className="w-full border-y border-border/70 bg-muted shadow-sm"
        aria-label="Banners promocionais"
        aria-roledescription="carrossel"
        {...pauseHandlers}
      >
        <div className="relative h-[clamp(8.25rem,34.5vw,20rem)] w-full overflow-hidden">
          {slide}
        </div>
        {controls}
      </section>
    );
  }

  return (
    <section
      className="w-full max-w-lg"
      aria-label="Banners promocionais"
      aria-roledescription="carrossel"
      {...pauseHandlers}
    >
      <div className="relative w-full aspect-[2.9/1] overflow-hidden rounded-xl border border-border bg-muted">
        {slide}
      </div>
      <div className="mt-1 overflow-hidden rounded-lg border border-border/70">{controls}</div>
    </section>
  );
};

export default BannerCarousel;
