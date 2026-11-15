import type { ReactNode } from "react";
import { Clock, Instagram, MapPin, Phone } from "lucide-react";
import { instagramUrl, telHref } from "@/core/format";
import type { Branch } from "@/core/types";

/** Address, phone, hours and map; whatever the branch has filled in. */
const VisitSection = ({ branch }: { branch: Branch }) => {
  const { address, phone, hours, mapUrl, mapEmbedUrl, instagram } = branch;
  if (!address && !phone && !hours && !mapEmbedUrl && !instagram) return null;

  return (
    <section id="visit" className="mx-auto max-w-5xl px-5 py-14">
      <h2 className="paper-display text-4xl">سر بزن</h2>
      <p className="mt-2 text-sm text-muted-foreground">شعبه {branch.name} برگرد منتظرته.</p>

      <div className="mt-6 grid gap-4 md:grid-cols-5">
        <div
          className={`grid content-start gap-3 ${mapEmbedUrl ? "md:col-span-2" : "md:col-span-5 md:grid-cols-2"}`}
        >
          {address && (
            <Card icon={<MapPin className="h-5 w-5" />} label="آدرس" href={mapUrl || undefined}>
              {address}
            </Card>
          )}
          {phone && (
            <Card icon={<Phone className="h-5 w-5" />} label="تماس" href={telHref(phone)}>
              <span dir="ltr">{phone}</span>
            </Card>
          )}
          {hours && (
            <Card icon={<Clock className="h-5 w-5" />} label="ساعت کاری">
              {hours}
            </Card>
          )}
          {instagram && (
            <Card icon={<Instagram className="h-5 w-5" />} label="اینستاگرام" href={instagramUrl(instagram)}>
              <span dir="ltr">@{instagram}</span>
            </Card>
          )}
        </div>

        {mapEmbedUrl && (
          <div className="overflow-hidden rounded-3xl border-2 border-foreground md:col-span-3">
            <iframe
              src={mapEmbedUrl}
              title={`موقعیت برگرد ${branch.name}`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
              className="block h-72 w-full border-0 md:h-full md:min-h-80"
            />
          </div>
        )}
      </div>
    </section>
  );
};

interface CardProps {
  icon: ReactNode;
  label: string;
  href?: string;
  children: ReactNode;
}

const Card = ({ icon, label, href, children }: CardProps) => {
  const body = (
    <>
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-xs text-muted-foreground">{label}</span>
        <span className="block font-bold">{children}</span>
      </span>
    </>
  );
  const cls = "flex items-center gap-4 rounded-2xl bg-card p-4 ring-1 ring-border";
  return href ? (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel="noopener noreferrer"
      className={`${cls} transition-transform active:scale-[0.98]`}
    >
      {body}
    </a>
  ) : (
    <div className={cls}>{body}</div>
  );
};

export default VisitSection;
