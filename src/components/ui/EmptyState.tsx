interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-dashed border-[color:var(--border)] bg-[color:var(--surface)] p-8 text-center">
      <h2 className="text-lg font-semibold text-[color:var(--text)]">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm text-[color:var(--muted)]">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </section>
  );
}
