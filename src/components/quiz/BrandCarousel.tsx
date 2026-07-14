import { motion } from "framer-motion";
import azaleia from "../assets/brands/azaleia.png";
import beiraRio from "../assets/brands/beira-rio.png";
import actvitta from "../assets/brands/actvitta.png";
import brsport from "../assets/brands/brsport.png";
import cartago from "../assets/brands/cartago.png";
import dalponte from "../assets/brands/dalponte.png";
import danper from "../assets/brands/danper.png";
import grendene from "../assets/brands/grendene.png";
import grendha from "../assets/brands/grendha.png";
import luxcel from "../assets/brands/luxcel.png";
import modare from "../assets/brands/modare.png";
import moleca from "../assets/brands/moleca.png";
import molekinha from "../assets/brands/molekinha.png";
import molekinho from "../assets/brands/molekinho.png";
import olinda from "../assets/brands/olinda.png";
import opanka from "../assets/brands/opanka.png";
import penalty from "../assets/brands/penalty.png";
import rider from "../assets/brands/rider.png";
import vizzano from "../assets/brands/vizzano.png";

// Logos com arte branca/transparente precisam de um fundo escuro para ficarem visíveis.
const brands = [
  { name: "Azaleia", logo: azaleia },
  { name: "Beira Rio", logo: beiraRio, dark: true },
  { name: "Actvitta", logo: actvitta, dark: true },
  { name: "BR Sport", logo: brsport, dark: true },
  { name: "Cartago", logo: cartago },
  { name: "Dal Ponte", logo: dalponte },
  { name: "Danper", logo: danper },
  { name: "Grendene", logo: grendene },
  { name: "Grendha", logo: grendha },
  { name: "Luxcel", logo: luxcel },
  { name: "Modare", logo: modare },
  { name: "Moleca", logo: moleca },
  { name: "Molekinha", logo: molekinha },
  { name: "Molekinho", logo: molekinho },
  { name: "Sandálias Olinda", logo: olinda },
  { name: "Opanka", logo: opanka },
  { name: "Penalty", logo: penalty },
  { name: "Rider", logo: rider },
  { name: "Vizzano", logo: vizzano },
];

const BrandCarousel = () => {
  const loop = [...brands, ...brands];

  return (
    <div className="w-full max-w-lg overflow-hidden">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
        Marcas de alto giro no nosso catálogo
      </p>

      <div
        className="relative w-full overflow-hidden"
        style={{
          maskImage:
            "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
        }}
      >
        <motion.div
          className="flex items-center gap-3 w-max"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 22, ease: "linear", repeat: Infinity }}
        >
          {loop.map((brand, i) => (
            <div
              key={`${brand.name}-${i}`}
              className={`flex items-center justify-center h-12 w-24 shrink-0 rounded-lg border p-2 ${
                brand.dark
                  ? "bg-slate-800 border-slate-800"
                  : "bg-white border-border"
              }`}
            >
              <img
                src={brand.logo}
                alt={brand.name}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default BrandCarousel;
