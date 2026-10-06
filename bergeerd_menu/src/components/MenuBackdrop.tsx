// `?url`: Vite only treats lower-case extensions as assets by default.
import eyeBg from "@/assets/eye-bg-full.JPG?url";

/**
 * Eye artwork behind the menu items.
 *
 * The original black-on-white image, only slightly transparent so it
 * blends with the page. It fills the screen; on phones (portrait) that
 * zooms in on the left eye, on wider screens it shows both eyes and
 * brows. The layer is sticky, so it stays
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
        className="h-full w-full object-cover object-[30%_50%] opacity-[0.6] [will-change:transform] md:object-center"
      />
    </div>
    <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-background to-transparent" />
    <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background to-transparent" />
  </div>
);

export default MenuBackdrop;
