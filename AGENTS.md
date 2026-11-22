<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Profile settings use owner-scoped typed Cloud queries, with personal-name synchronization in a database trigger so independent section saves cannot diverge.
- Avatar records store owner-folder storage paths, not expiring links; resolve private signed URLs centrally in AuthContext for consistent account displays.
- Resolve project entitlement before fetching exact records; shared disclosure helpers whitelist teaser output for listings, detail and MCP so private data is never masked after delivery.
- Public teasers use a security-invoker view over a fixed, parameter-free security-definer whitelist; base project RLS remains owner/accepted-only and ticket sort keys are band ordinals, so anonymous listing reads never expose raw rows.

- Use saved numeric inputs for charts and qualification-entitled base-case rows for portfolio returns; never derive project figures or counterfactuals from display strings or illustrative models.

- Canonical auth pages own signup and recovery; legacy URLs are redirects that preserve destinations, and retired marketing topics redirect to their canonical public pages.
- Gate evidence uses the displayed immutable agreement row; mandate uses compatible ticket bands with ambiguous legacy bands left for member confirmation.
- Once-only mandate review is persisted in the investor profile and wraps Express interest only so listing workflows remain available; UI and scheduled decisions share the UTC working-day SLA.
- Use the stock Sidebar provider with controlled per-user collapse persistence so mobile navigation has a labelled drawer and desktop retains an icon rail.
- Use light-only Sonner for notifications; a single visual theme prevents OS-dependent toast contrast defects.
- Use React Hook Form with Zod and stock form primitives for request validation so field names, errors and focus stay associated.
- Keep the MCP SDK generated banner hyphen-only through the pinned dependency patch so strict source punctuation checks do not break generation.
- Enforce semantic colour utilities and source punctuation in the dedicated frontend hygiene CI check to prevent styling regressions.
- Scheduled access notices use a shared pure recipient builder with separate teaser and owner titles so lapse notifies both parties without disclosing identity before acceptance.
- Database investor notifications resolve titles through a private entitlement-aware helper so state and Q&A notices disclose identity only after acceptance.
- Button exposes its resolved variant as data-variant so public-only stylesheet rules can preserve variant colors and standardize secondary controls without changing workspace buttons.

- Account forms use a shared error classifier and inline alerts with an auth-specific contrast token so failed requests stay visible without changing global destructive styling.
- Resolve missing project values centrally using recorded question evidence; legacy records without evidence resolve safely without attributing nonresponse.
- Pure named financial computes return their numeric inputs with the result so readers can inspect arithmetic without platform modelling.
- Submission evidence is recorded by mounted controls with lifecycle-specific histories and explicit conditional keys, so hidden questions cannot be labelled unanswered.
- The stage wizard shares one declarative field contract across creation, editing and promotion; its transactional owner-only save retains project identity, revisions and stage events.
- Published working copies live in an owner-only submission workspace; accepted project readers receive the last published document, never unsaved edits.

- Investor information uses the qualification RPC through isQualifiedInvestor in access.ts; identity acceptance and data-room approval remain separate because neither qualification nor payment authorizes disclosure of counterparties.

- Generated PDFs use fresh qualification-protected database inputs, generic metadata and a forced banded teaser; recipient watermark and as-of dates retain forwardable-copy provenance.
- Submission previews use the database disclosure projection rather than a separate client whitelist, so consent describes precisely what qualified readers receive.
- MCP tools resolve the verified token to a real account and share interface qualification, acceptance and preview helpers; personal lists are caller-scoped and no tool joins raw project rows.
