/**
 * Shown while a branch or its design loads: the brand-red screen every
 * design's intro starts from, so the hand-over is seamless.
 */
const Splash = () => (
  <div role="status" aria-label="در حال بارگذاری" className="fixed inset-0 z-[100] bg-brand" />
);

export default Splash;
