<!--
  Elite MGMT Agency · Pull Request
  Owner: Viral Ventures LLC

  Keep this template intact. Delete sections only if they truly do not apply
  (and replace them with one short sentence stating so).
-->

## Summary

<!-- 1-3 sentences. What changed and why. Reference the ticket if there is one. -->

## Type of change

<!-- Tick all that apply. -->

- [ ] feat — new feature
- [ ] fix — bug fix
- [ ] perf — performance improvement
- [ ] refactor — code change that neither fixes a bug nor adds a feature
- [ ] style — visual / brand / typography change
- [ ] docs — documentation only
- [ ] test — adding or updating tests
- [ ] build — build / tooling change
- [ ] ci — CI workflow change
- [ ] chore — repo maintenance, deps, infra
- [ ] revert — revert of a previous change

## Screenshots / Recordings

<!--
  Required for any user-visible change. Before / after pairs preferred.
  Drop images directly into the PR body, GitHub will upload them.
-->

| Before | After |
|---|---|
|  |  |

## Test plan

- [ ] `npm run check` passes locally
- [ ] Verified in Chrome (latest)
- [ ] Verified in Safari (latest)
- [ ] Verified in Firefox (latest)
- [ ] Verified on mobile width (375px) and desktop (1440px+)
- [ ] Keyboard-only navigation works for any new interactive element
- [ ] No new console warnings or errors

<!-- Add specific scenarios you exercised — golden path AND failure modes. -->

## Performance impact

<!-- For any change that touches HTML, CSS, JS, images, or fonts. -->

- HTML transferred (gzip): _baseline_ → _new_
- CSS transferred (gzip): _baseline_ → _new_
- JS transferred (gzip): _baseline_ → _new_
- Largest Contentful Paint (Lighthouse mobile): _baseline_ → _new_

## Accessibility

- [ ] All interactive elements remain keyboard-reachable
- [ ] Color contrast meets WCAG 2.2 AA (4.5:1 body, 3:1 large)
- [ ] `prefers-reduced-motion` respected for new animation
- [ ] ARIA roles / states unchanged or improved
- [ ] N/A — explain why:

## SEO / schema

- [ ] Canonical, og:url, twitter:url unchanged or updated together
- [ ] JSON-LD still validates ([Schema.org validator](https://validator.schema.org/))
- [ ] Sitemap / robots updated if new URL is exposed
- [ ] N/A — explain why:

## Security

- [ ] No new third-party JS, fonts, or analytics
- [ ] No new outbound network calls (or: justified below)
- [ ] No secrets committed (verified with `git diff --stat` and `git status`)
- [ ] HTTP security headers unchanged or strengthened
- [ ] N/A — explain why:

## Rollback plan

<!-- One line. How do we back this out if production is on fire? -->

## Checklist

- [ ] Conventional Commit title (`<type>(<scope>): <subject>`)
- [ ] CHANGELOG entry added under `[Unreleased]` (omit for trivial chores)
- [ ] CODEOWNERS reviewer requested
- [ ] Linked issue / ticket
- [ ] CI is green
