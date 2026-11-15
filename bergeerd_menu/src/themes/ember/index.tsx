import { useState } from "react";
import { MotionConfig } from "motion/react";
import type { ThemeProps } from "@/core/types";
import Loader from "./components/Loader";
import Page from "./Page";

/**
 * The original design: dark, cinematic and motion-heavy. The hero's entrance
 * starts as the loader's curtain lifts.
 */
const EmberTheme = ({ menu }: ThemeProps) => {
  const [introDone, setIntroDone] = useState(false);

  return (
    <MotionConfig reducedMotion="user">
      <Loader onDone={() => setIntroDone(true)} />
      <Page ready={introDone} menu={menu} />
    </MotionConfig>
  );
};

export default EmberTheme;
