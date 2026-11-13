import PublicShell from "./PublicShell";
const LegalPlaceholder = ({ title }: { title: string }) => <PublicShell><section className="container max-w-3xl py-16">
  <h1 className="font-display text-3xl font-semibold">{title}</h1>
  <p className="mt-6 rounded-md border border-border bg-muted p-4 font-semibold">DRAFT - pending legal review</p>
  <p className="mt-6 text-muted-foreground">The {title.toLowerCase()} has not been finalized. This page is a placeholder, not the final legal document. Approved legal text will be published here after review.</p>
</section></PublicShell>;
export default LegalPlaceholder;
