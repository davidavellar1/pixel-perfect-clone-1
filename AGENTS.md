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
