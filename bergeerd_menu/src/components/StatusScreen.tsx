import logo from "@/assets/LOGO-header.png";

interface StatusScreenProps {
  kind: "not-found" | "error";
  onRetry?: () => void;
  busy?: boolean;
}

const COPY = {
  "not-found": {
    title: "این شعبه پیدا نشد",
    text: "آدرس رو دوباره بررسی کن، یا منوی اصلی برگرد رو ببین.",
  },
  error: {
    title: "منو بارگذاری نشد",
    text: "اتصال اینترنت رو بررسی کن و دوباره امتحان کن.",
  },
};

/** Full-page message for an unknown branch or a failed load. */
const StatusScreen = ({ kind, onRetry, busy }: StatusScreenProps) => (
  <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-background px-6 text-center text-foreground">
    <img src={logo} alt="برگرد" className="h-20 w-20 rounded-full object-cover" />
    <h1 className="font-display text-3xl">{COPY[kind].title}</h1>
    <p className="max-w-xs font-body text-sm leading-7 text-muted-foreground">{COPY[kind].text}</p>
    {kind === "error" && onRetry ? (
      <button
        onClick={onRetry}
        disabled={busy}
        className="rounded-full bg-primary px-6 py-2.5 font-body text-sm text-primary-foreground transition-opacity disabled:opacity-60"
      >
        {busy ? "در حال تلاش…" : "تلاش دوباره"}
      </button>
    ) : (
      <a
        href="/"
        className="rounded-full bg-primary px-6 py-2.5 font-body text-sm text-primary-foreground"
      >
        منوی برگرد
      </a>
    )}
  </main>
);

export default StatusScreen;
