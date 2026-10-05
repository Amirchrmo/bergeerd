import { useEffect, useState } from "react";
import { animate, motion, useMotionValue } from "motion/react";
import BurgerStack from "@/components/burger/BurgerStack";
import { DEFAULT_RECIPE } from "@/lib/burgerLayers";

interface LoaderProps {
  /** Called once the curtain has started lifting. */
  onDone: () => void;
}

/**
 * Branded intro: the burger's layers fall together into a stack, then the
 * red curtain lifts to reveal the hero. Kept to roughly the same length as
 * the previous loader.
 */
const Loader = ({ onDone }: LoaderProps) => {
  const [lifting, setLifting] = useState(false);
  const [gone, setGone] = useState(false);
  const progress = useMotionValue(1);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const assemble = animate(progress, 0, {
      duration: reduced ? 0 : 0.95,
      ease: [0.65, 0, 0.35, 1],
      delay: 0.15,
    });
    const lift = setTimeout(
      () => {
        setLifting(true);
        onDone();
      },
      reduced ? 200 : 1350,
    );
    const hide = setTimeout(() => setGone(true), reduced ? 300 : 2200);
    return () => {
      assemble.stop();
      clearTimeout(lift);
      clearTimeout(hide);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (gone) return null;

  return (
    <motion.div
      role="status"
      aria-label="در حال بارگذاری"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-brand"
      initial={{ y: 0 }}
      animate={{ y: lifting ? "-100%" : 0 }}
      transition={{ duration: 0.85, ease: [0.76, 0, 0.24, 1] }}
      style={{
        borderBottomLeftRadius: lifting ? "50% 12vh" : 0,
        borderBottomRightRadius: lifting ? "50% 12vh" : 0,
        transition: "border-radius 0.6s ease",
      }}
    >
      <motion.div
        animate={{ opacity: lifting ? 0 : 1, y: lifting ? -40 : 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center"
      >
        <BurgerStack
          recipe={DEFAULT_RECIPE}
          progress={progress}
          viewHeight={300}
          maxGap={30}
          labels="none"
          className="h-44 drop-shadow-[0_20px_30px_rgba(60,0,0,0.5)]"
        />
        <p className="mt-6 font-display text-2xl text-white">
          برگرد، یه گرد خوشمزه
        </p>
        <div className="mt-4 h-0.5 w-40 overflow-hidden rounded-full bg-white/20">
          <motion.div
            className="h-full origin-right bg-white"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.2, ease: [0.65, 0, 0.35, 1] }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Loader;
