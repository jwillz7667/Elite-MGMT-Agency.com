# Elite MGMT Agency website

Static HTML, CSS and JavaScript for Elite MGMT Agency. The repository contains the homepage, service pages, creator-management landing pages, journal, company pages, legal pages, a portal contact page and a custom 404 page.

Intended public domain: [elite-mgmt-agency.com](https://elite-mgmt-agency.com). This is a configured URL in the source, not confirmation that a deployment is reachable.

## Current deployment status

On October 2, 2026, a DNS lookup for `elite-mgmt-agency.com` returned `NXDOMAIN`. GitHub repository secrets and variables, and the existing `Production` environment's secrets and variables, were empty. The Cloudflare workflow requires `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_PAGES_PROJECT`; those names were absent from the inspected scopes. Configure the owner’s hosting account and domain before expecting the production URL to work. This audit did not deploy the site or change DNS.

## How the site works

- Pages are authored directly in HTML. Styling lives in [assets/css/styles.css](./assets/css/styles.css), and browser behavior in [assets/js/app.js](./assets/js/app.js). There is no application framework or server runtime.
- Typography uses the native Apple system font on Apple devices, with self-hosted Inter and platform fallbacks elsewhere. Apple supplies SF Pro through its system font stack; no SF Pro files are redistributed. Inter's license is included in [assets/fonts/LICENSE.txt](./assets/fonts/LICENSE.txt), and its English-language subset is documented in [docs/TYPOGRAPHY.md](./docs/TYPOGRAPHY.md).
- Images use responsive sources and explicit dimensions. The image briefs and WaveSpeed generation workflow are documented in [docs/EDITORIAL_IMAGES.md](./docs/EDITORIAL_IMAGES.md). Ten distinct images were generated with the authorized WaveSpeed account using Seedream V5.0 Pro and integrated as responsive AVIF, WebP and JPEG files. The new fictional models were prompted as clearly adult age 22. Future generation needs the owner’s API key and credits. Illustrative AI imagery must not be presented as real clients or testimonial speakers.
- Application and journal forms prepare email drafts. They do not send messages, submit to an API, enroll subscribers or confirm delivery. Users review and send the draft in their email app; application text can also be copied. Form entries are not saved as browser drafts.
- The portal is a contact page with `noindex` metadata, not an implemented authenticated dashboard.
- Cookie preferences, navigation, reduced-motion handling and form validation run in the browser. See the actual [privacy](./privacy/index.html) and [cookie](./cookies/index.html) pages for user-facing details.

## Develop locally

Use Node.js 24 LTS (the version in [.nvmrc](./.nvmrc)) and npm 11 or newer, then install the locked development dependencies. The package manager metadata records npm 11.12.1, which was used to maintain this lockfile:

```sh
npm ci
npm run dev
```

Open [localhost:4173](http://localhost:4173). `dev` first validates and packages the website, then serves `site-dist/`. Restart it after source changes to rebuild the staged files. The server has no SPA fallback: missing routes remain missing routes. `npm run preview` binds the same packaged website to all network interfaces for device testing.

The website itself has no runtime npm dependencies. Node and npm are development and packaging tools.

## Check and package changes

```sh
npm run format:check
npm run lint
npm run validate
npm run build
```

`npm run check` combines formatting, linting, validation and packaging. HTML linting covers the authored page directories. The structural validator checks all source HTML pages, local routes and fragments, queried assets, responsive image candidates, canonical/social/schema URLs, sitemap membership, manifest references and the security disclosure file.

`npm run build` creates `site-dist/` using [scripts/package-site.mjs](./scripts/package-site.mjs). The packager validates the source, rebuilds the output from an explicit public-file allowlist, copies approved asset types and includes the font license. CSS and JavaScript are minified in the staged directory with pinned esbuild; authored source files and public asset paths remain unchanged. JavaScript targets ES2020, with CSS targeting Chrome/Edge/Firefox 100 and Safari 15 or newer. No source maps or unminified companion files are published. A validation or minification error stops packaging before the artifact becomes available. It rejects asset symlinks and unexpected asset types. It excludes repository documentation, source-generation prompts, credential files, dependency manifests, development scripts, audit output and the private image-generation cache. When adding a public route, update the packager's page list and the HTML lint directory list as appropriate.

Additional tools:

```sh
npm run format         # Format authored source
npm run audit:a11y     # Pa11y; requires the local server on port 4173
npm run audit:perf     # Package, then run Lighthouse CI on site-dist
npm run clean          # Remove generated site and audit/cache output
```

The [CI workflow](./.github/workflows/ci.yml) runs formatting, HTML/CSS/JS linting, structural validation, public packaging, Pa11y and Lighthouse checks. Audit targets and budgets are defined in [.pa11yci.json](./.pa11yci.json) and [.lighthouserc.json](./.lighthouserc.json). Configured budgets are targets, not measured performance claims; use the generated reports to assess a particular commit. Local static-server audits do not verify CDN headers, DNS or production email delivery. Axe results that require manual review are classified as warnings using Pa11y’s `levelCapWhenNeedsReview`; confirmed violations still fail CI, and contrast rules remain enabled. Review warning-inclusive reports and the visible text over imagery after every image or styling change. The 404 has separate Lighthouse assertions because it intentionally uses `noindex`; its accessibility and performance budgets remain enforced.

## SEO and public content

Each indexable page has its own canonical URL, title, description and structured data. [sitemap.xml](./sitemap.xml) lists the published canonical routes and image URLs; [robots.txt](./robots.txt) points to that sitemap. Directory-page canonicals use trailing slashes. The portal and 404 are excluded from indexing. Sitemap dates should reflect known significant content changes; do not add blanket dates or unsupported business claims.

The audit repairs site structure and behavior. Existing business statistics, roster identities, testimonial quotations, office details and legal assertions still require verification by the owner before publication. Adding imagery does not establish those claims. Search rankings and rich-result eligibility are not guaranteed by these files.

## Deploy the public artifact

The production [deployment workflow](./.github/workflows/deploy.yml) targets Cloudflare Pages. It follows successful `ci` runs for trusted pushes to `main`, checks that the exact commit is still current `main`, and uploads only `site-dist/`. A manual workflow dispatch also requires a successful completed main CI run for that exact commit. The separate CI gate prevents unchecked or obsolete commits from being published by this workflow.

Configure these in GitHub repository settings or the `Production` environment:

| Setting                    | Kind     | Purpose                                                       |
| -------------------------- | -------- | ------------------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`     | Secret   | Cloudflare token authorized to edit the owner's Pages project |
| `CLOUDFLARE_ACCOUNT_ID`    | Secret   | Account containing that Pages project                         |
| `CLOUDFLARE_PAGES_PROJECT` | Variable | Existing Cloudflare Pages project name                        |

The domain must also be configured in the owner's hosting account and DNS. [_headers](./_headers) and [_redirects](./_redirects) are included in the staged artifact for Cloudflare Pages. Unknown paths use the top-level `404.html`; there is no catch-all rewrite to the homepage. Stable asset filenames revalidate rather than using a year-long immutable browser cache.

If choosing Netlify or Vercel instead, configure the host to build with `npm run build` and publish `site-dist/`, applying the corresponding [Netlify](./netlify.toml) or [Vercel](./vercel.json) configuration. **Never upload or serve the repository root as the public artifact.** The local `serve` utility does not apply platform headers or redirects, so verify those on a hosting preview before promotion.

## Security and licensing

Report vulnerabilities using the contact in [SECURITY.md](./SECURITY.md) and [.well-known/security.txt](./.well-known/security.txt). Site headers restrict embedding, browser capabilities and resource origins. Inline styles and inline script permissions remain explicit CSP trade-offs; they are not a claim that an independent security audit has passed.

Keep WaveSpeed credentials in the invoking environment. Do not commit keys or place them in browser JavaScript. Generated masters and the job registry are development materials and must not be published through the static artifact.

The website is proprietary; see [LICENSE](./LICENSE). Inter retains its included open-source license. Contribution guidance lives in [CONTRIBUTING.md](./CONTRIBUTING.md).
