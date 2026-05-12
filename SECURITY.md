# Security Policy

**Maintained by:** Viral Ventures LLC, Maple Grove, MN
**Property:** Elite MGMT Agency web property (`elite-mgmt-agency.com`)
**Machine-readable contact:** [`/.well-known/security.txt`](./.well-known/security.txt)

We take the security of this property and the privacy of its visitors seriously.
If you believe you have found a security vulnerability, please follow the
coordinated disclosure process below.

---

## Supported Versions

This is a continuously deployed static site. We support **only the version
currently live in production** (`main` branch, deployed to
`https://elite-mgmt-agency.com`). Older revisions are not maintained.

| Version | Supported |
|---|---|
| `main` (production) | Yes |
| Pre-release tags | No |
| Forks / mirrors | No |

## Scope

### In scope

- The web property at `https://elite-mgmt-agency.com` and any subdomains.
- The source code in this repository (HTML, CSS, JS, headers, redirects).
- Misconfiguration of HTTP security headers (CSP, HSTS, Permissions-Policy, COOP/CORP).
- DNS or email authentication misconfiguration (SPF, DKIM, DMARC, MTA-STS, BIMI).
- The form-submission backend (when a vulnerability is reproducible from the live site).

### Out of scope

- Social engineering of Viral Ventures LLC staff, contractors, or applicants.
- Physical attacks against company premises or hardware.
- Denial-of-service or volumetric attacks.
- Spam, abusive content, or non-security usability bugs (use issues for those).
- Automated scanner output without a confirmed, exploitable finding.
- Reports based on outdated browsers or unsupported configurations.
- Self-XSS (issues that require pasting attacker-supplied code into your own console).
- "Missing security header X on a page that doesn't need it" — please verify the
  current production response before reporting.
- Findings already documented as accepted risk in this file.

## How to Report a Vulnerability

**Preferred:** Email **`security@viral-ventures-llc.com`** with the subject:

```
[security] <short description>
```

If the report contains sensitive details, encrypt with our PGP key
(available at `https://viral-ventures-llc.com/.well-known/pgp-key.txt`).

Please include:

1. **Description** — what the issue is.
2. **Reproduction steps** — exact URL, request, payload, browser/OS if relevant.
3. **Impact** — what an attacker can achieve.
4. **Suggested remediation** — optional, but appreciated.
5. **Disclosure preference** — your handle for credit, or anonymous.

We will:

- Acknowledge receipt within **2 business days**.
- Provide an initial assessment within **5 business days**.
- Keep you updated through remediation.
- Credit you in the [CHANGELOG](./CHANGELOG.md) (with consent) once the fix ships.

## Coordinated Disclosure

We ask that you:

- Give us **a reasonable window to remediate** before public disclosure — typically
  **90 days** from acknowledgment, shorter for actively exploited issues.
- Do **not** access, modify, or exfiltrate data that does not belong to you.
- Do **not** run intrusive automated scans that degrade service for real visitors.
- Do **not** post the issue publicly (social media, blog, GitHub issue) until we
  have agreed on a disclosure date.

Good-faith research that follows this policy will not be pursued legally by
Viral Ventures LLC.

## Safe Harbor

Viral Ventures LLC considers security research conducted under this policy to be:

- Authorized concerning any applicable anti-hacking laws.
- Authorized concerning any applicable anti-circumvention laws.
- Exempt from restrictions in our Terms of Service that would interfere with
  good-faith security research.

This safe harbor applies only to activities that comply with this policy.

## Bug Bounty

We do **not** currently operate a paid bug bounty program. Significant findings
may be acknowledged with a discretionary reward at the company's sole discretion.

## Accepted Risks

The following are known, deliberate trade-offs and are **not** considered vulnerabilities:

- `style-src 'self' 'unsafe-inline'` — required for the design system's
  per-component CSS custom properties; mitigated by `default-src 'self'` and
  the absence of user-rendered HTML on the page.
- No `Subresource-Integrity` on Google Fonts requests — Google rotates font
  binaries; SRI is incompatible with the way the fonts API serves CSS. The
  fonts host is hardened by `font-src` and `connect-src` directives.
- Static site has no server-side rate limiting — handled at the CDN edge
  (Cloudflare) and at the form-submission backend.

## Contact

| Purpose | Address |
|---|---|
| Security disclosure | `security@viral-ventures-llc.com` |
| Engineering | `engineering@viral-ventures-llc.com` |
| Legal | `legal@viral-ventures-llc.com` |
| Postal | Viral Ventures LLC, Maple Grove, MN, USA |

---

_Last reviewed: 2026-05-11. Next review: 2026-11-11._
