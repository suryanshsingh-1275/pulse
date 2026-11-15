import { PageHeader } from "../components/ui";

export default function ComingSoon({ title, phase }: { title: string; phase: string }) {
  return (
    <>
      <PageHeader title={title} />
      <div className="card max-w-lg text-sm text-muted">
        Planned for <span className="text-accent">{phase}</span> of the roadmap. The data model and ingestion pipeline already support extending this.
      </div>
    </>
  );
}