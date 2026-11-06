# Profile settings

- Add the upward-opening account menu, showing the saved avatar and first name, without adding a sidebar link.
- Add `/app/settings` for every view, with Profile, role-specific Investor/Developer sections, and Account settings. Preserve DHC fonts, tokens, spacing and controls.
- Load and save each section independently; validate inputs, display field errors, warn before leaving with unsaved edits, and support missing role-profile rows.
- Save avatar uploads, synchronize role-profile full names, show sign-in methods and accepted legal documents, and allow password changes for email accounts.
- Verify saved data through the signed-in interface, test phone/tablet/desktop widths, and check types.

## Database and storage

- Create `user_profile`, backfill names, add investor technology interests, and enforce owner-only access and input limits.
- Platform rules require `user_profile.user_id` to be a plain UUID rather than an `auth.users` foreign key. Use an auth deletion trigger for equivalent cleanup.
- Public buckets are blocked by workspace policy. Use private avatar storage with owner-only signed image links; public photos require a workspace administrator to enable public buckets.

## Technical details

- Use typed Cloud queries and existing shadcn components; no changes to sign-up or access flows.
- Keep profile display data centralized in the existing auth context, refreshed after saves.
- Add focused validation tests for the 600-character biography, 2 MB image limit, LinkedIn URLs and eight-character password minimum.