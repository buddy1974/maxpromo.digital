import { Nav } from "@/components/marketing/Nav";
import { Hero } from "@/components/marketing/Hero";
import { AgentBureau } from "@/components/marketing/AgentBureau";
import { SafeActionLifecycle } from "@/components/marketing/SafeActionLifecycle";
import { Integrations } from "@/components/marketing/Integrations";
import { BeforeAfter } from "@/components/marketing/BeforeAfter";
import { Pillars } from "@/components/marketing/Pillars";
import { Stats } from "@/components/marketing/Stats";
import { AuditCta } from "@/components/marketing/AuditCta";
import { Footer } from "@/components/marketing/Footer";

// BusinessFlowInfographic is intentionally not rendered here: it told the same
// observe -> prepare -> approve -> execute -> log story as SafeActionLifecycle
// one section later, just relabelled. Enterprise-polish pass (2026-08-11) cut
// the duplicate rather than let a visitor read the same idea twice. Component
// kept in the codebase in case it's wanted for a different context later.

export default function LandingPage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <AgentBureau />
        {/* Supervised operation explained right after the team. */}
        <SafeActionLifecycle />
        <Integrations />
        <BeforeAfter />
        <Pillars />
        <Stats />
        <AuditCta />
      </main>
      <Footer />
    </>
  );
}
