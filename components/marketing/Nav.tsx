import Link from "next/link";

export function Nav() {
  return (
    <header className="sticky top-0 z-50 h-28 border-b border-zinc-200 bg-white">
      <div className="mx-auto flex h-full max-w-content items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="h-2.5 w-2.5 rounded-full bg-accent" />
          <span className="font-mono text-sm font-semibold uppercase tracking-[0.2em] text-zinc-900">
            Max Agent
          </span>
        </Link>

        <nav className="hidden items-center gap-10 text-[19px] font-medium tracking-[-0.01em] text-zinc-600 md:flex">
          <a href="#bureau" className="transition-colors hover:text-zinc-900">
            Das Team
          </a>
          <a href="#ablauf" className="transition-colors hover:text-zinc-900">
            Ablauf
          </a>
          <a
            href="https://www.maxpromo.digital/de"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-zinc-900"
          >
            Maxpromo
          </a>
        </nav>

        <a href="#audit" className="btn-primary">
          Geschäfts-Check
        </a>
      </div>
    </header>
  );
}
