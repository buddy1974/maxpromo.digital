import { LivesInOs } from "@/components/dashboard/LivesInOs";

// Business records live in Maxpromo OS (ADR-0021); this route links there instead of showing mock data.
export default async function TasksPage() {
  return <LivesInOs section="tasks" />;
}
