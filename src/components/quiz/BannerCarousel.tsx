import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import bannerVizzano from "../assets/banners/banner-vizzano.jpg";
import bannerEsportivo from "../assets/banners/banner-esportivo.jpg";
import bannerConforto from "../assets/banners/banner-conforto.jpg";

const banners = [
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

  useEffect(() => {
    const interval = window.setInterval(() => {
      setIndex((i) => (i + 1) % banners.length);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(interval);
  }, []);

  const image = (
    <AnimatePresence mode="wait">
      <motion.img
        key={banners[index].name}
        src={banners[index].image}
        alt={banners[index].name}
        className="absolute inset-0 w-full h-full object-cover"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      />
    </AnimatePresence>
  );

  const dots = (
    <div className="flex items-center justify-center gap-1.5">
      {banners.map((banner, i) => (
        <button
          key={banner.name}
          type="button"
          onClick={() => setIndex(i)}
          aria-label={`Ver banner ${banner.name}`}
          className={`h-1.5 rounded-full transition-all ${
            i === index ? "w-6 bg-primary" : "w-1.5 bg-border"
          }`}
        />
      ))}
    </div>
  );

  if (variant === "strip") {
    return (
      <div className="relative w-full h-20 sm:h-24 overflow-hidden bg-muted">
        {image}
        <div className="absolute bottom-1.5 left-0 right-0 flex items-center justify-center gap-1.5">
          {banners.map((banner, i) => (
            <button
              key={banner.name}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Ver banner ${banner.name}`}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-6 bg-white" : "w-1.5 bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg">
      <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden border border-border bg-muted">
        {image}
      </div>

      <div className="mt-3">{dots}</div>
    </div>
  );
};

export default BannerCarousel;
