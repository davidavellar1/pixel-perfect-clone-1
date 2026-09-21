interface Props {
  title: string;
  description: string;
}

const PlaceholderPage = ({ title, description }: Props) => (
  <div className="space-y-6 max-w-4xl">
    <div>
      <h1 className="text-3xl font-display font-bold text-foreground">{title}</h1>
      <p className="text-muted-foreground mt-1">{description}</p>
    </div>
    <div className="rounded-xl border border-dashed border-border bg-card p-16 text-center">
      <p className="text-lg font-semibold text-foreground">Coming soon</p>
      <p className="text-sm text-muted-foreground mt-1">
        This area is under active development. Check back shortly.
      </p>
    </div>
  </div>
);

export default PlaceholderPage;
