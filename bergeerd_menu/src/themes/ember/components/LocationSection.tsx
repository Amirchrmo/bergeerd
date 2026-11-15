import { Clock, MapPin, Navigation, Phone } from "lucide-react";
import { telHref } from "@/core/format";
import type { Branch } from "@/core/types";

/**
 * "Visit us" section: the branch's map embed and contact cards. Parts the
 * branch has no details for are left out.
 */
const LocationSection = ({ branch }: { branch: Branch }) => {
  const { address, phone, hours, mapUrl, mapEmbedUrl } = branch;
  if (!address && !phone && !hours && !mapEmbedUrl) return null;

  return (
    <section id="location" className="scroll-mt-24 py-16">
      <div className="container mx-auto px-4">
        {/* Heading */}
        <div className="reveal mb-10 text-center">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 font-persian text-xs text-primary">
            <MapPin className="h-3.5 w-3.5" />
            ما رو پیدا کن
          </span>
          <h2 className="font-persian text-4xl font-black text-foreground md:text-5xl">
            <span className="text-gradient-red">کجا هستیم؟</span>
          </h2>
        </div>

        <div className="grid items-stretch gap-6 lg:grid-cols-5">
          {/* Map */}
          {mapEmbedUrl && (
            <div className="reveal reveal-right lg:col-span-3">
              <div className="group relative h-full min-h-[320px] overflow-hidden rounded-3xl border border-white/10 shadow-card">
                <iframe
                  src={mapEmbedUrl}
                  title="موقعیت برگرد"
                  width="100%"
                  height="100%"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  style={{
                    border: 0,
                    minHeight: "320px",
                    filter: "grayscale(0.3) contrast(1.05)",
                  }}
                  allowFullScreen
                  className="absolute inset-0 h-full w-full transition-all duration-500 group-hover:grayscale-0"
                />
              </div>
            </div>
          )}

          {/* Info cards */}
          <div
            className={`reveal reveal-left flex flex-col gap-4 ${mapEmbedUrl ? "lg:col-span-2" : "lg:col-span-5"}`}
          >
            {address && (
              <InfoCard
                Icon={MapPin}
                title="آدرس"
                lines={[address]}
                href={mapUrl || undefined}
                cta="مسیریاری"
              />
            )}
            {phone && (
              <InfoCard Icon={Phone} title="تماس" lines={[phone]} href={telHref(phone)} ltr />
            )}
            {hours && <InfoCard Icon={Clock} title="ساعت کاری" lines={[hours]} />}
          </div>
        </div>
      </div>
    </section>
  );
};

interface InfoCardProps {
  Icon: typeof MapPin;
  title: string;
  lines: string[];
  href?: string;
  cta?: string;
  ltr?: boolean;
}

const InfoCard = ({ Icon, title, lines, href, cta, ltr }: InfoCardProps) => (
  <div className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40">
    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary text-white transition-transform duration-300 group-hover:scale-110">
      <Icon className="h-5 w-5" />
    </span>
    <div className="min-w-0 flex-1">
      <h4 className="font-persian text-sm text-muted-foreground">{title}</h4>
      {lines.map((l, i) => (
        <p
          key={i}
          className="font-persian text-base font-bold text-foreground"
          style={ltr ? { direction: "ltr", textAlign: "right" } : undefined}
        >
          {l}
        </p>
      ))}
    </div>
    {href && cta && (
      <a
        href={href}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 font-persian text-xs text-primary transition-colors hover:bg-primary/20"
      >
        <Navigation className="h-3.5 w-3.5" />
        {cta}
      </a>
    )}
  </div>
);

export default LocationSection;
