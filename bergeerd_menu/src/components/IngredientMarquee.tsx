import { Fragment } from "react";

/**
 * Two crossing "tape" bands that scroll ingredient names in opposite
 * directions — a breather between the showcase and the menu.
 */
const IngredientMarquee = ({ words }: { words: string[] }) => {
  if (words.length === 0) return null;
  return (
    <div
      aria-hidden="true"
      className="relative z-10 -my-4 overflow-hidden py-14 md:py-20"
    >
      <Band words={words} className="-rotate-2 bg-brand text-white" />
      <Band
        words={[...words].reverse()}
        reverse
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 rotate-[1.5deg] bg-cream text-ink opacity-90"
      />
    </div>
  );
};

function Band({
  words,
  className,
  reverse,
}: {
  words: string[];
  className: string;
  reverse?: boolean;
}) {
  const run = (
    <div className="flex shrink-0 items-center">
      {words.map((w, i) => (
        <Fragment key={i}>
          <span className="whitespace-nowrap px-5 font-display text-2xl md:text-4xl">
            {w}
          </span>
          <span className="text-xl opacity-60">✦</span>
        </Fragment>
      ))}
    </div>
  );
  return (
    <div className={`-mx-8 py-3 md:py-4 ${className}`}>
      <div
        dir="ltr"
        className="marquee-track flex w-max"
        style={{ animationDirection: reverse ? "reverse" : "normal" }}
      >
        {run}
        {run}
      </div>
    </div>
  );
}

export default IngredientMarquee;
