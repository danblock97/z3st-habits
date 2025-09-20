export default function HabitsPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Habits</h1>
        <p className="text-muted-foreground">
          This is your habit cockpit. We will wire real data once Supabase tables land.
        </p>
      </div>
      <div className="rounded-xl border border-border/60 bg-card/60 p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">
          You are signed in, so this protected route is ready for habit insights.
        </p>
      </div>
    </section>
  );
}
