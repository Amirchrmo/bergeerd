// `?url`: Vite only treats lower-case extensions as assets by default.
import eyeBg from "@/assets/eye-bg.JPG?url";

/**
 * Eye artwork behind the menu items.
 *
 * The image is black ink on white; inverted, at low opacity, only the strokes
 * show as a light tint over the dark page. The layer is sticky, so it stays
 * in view for the whole menu while the cards scroll over it. Gradient
 * overlays (cheaper than masking the whole tall section) fade its top and
 * bottom edges into the surrounding page.
 */
const MenuBackdrop = () => (
  <div
    aria-hidden="true"
    className="pointer-events-none absolute inset-0 [overflow:clip]"
  >
    <div className="sticky top-0 h-[100svh] w-full">
      <img
        src={eyeBg}
        alt=""
        decoding="async"
        className="h-full w-full object-cover object-[18%_38%] opacity-[0.16] [filter:invert(1)] [will-change:transform] md:object-[50%_32%] md:opacity-[0.15]"
      />
    </div>
    <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-background to-transparent" />
    <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background to-transparent" />
  </div>
);

export default MenuBackdrop;
