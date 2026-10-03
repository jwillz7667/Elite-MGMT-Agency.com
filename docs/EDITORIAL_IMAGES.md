# WaveSpeed editorial image workflow

Ten distinct images were generated with the owner-authorized WaveSpeed account from the reviewed briefs in [editorial-images.json](./editorial-images.json). The API key was kept outside the repository and was never included in website JavaScript or the generated public artifact.

The workflow uses ByteDance **Seedream V5.0 Pro** on WaveSpeed. Its endpoint and parameters were checked against the [official API reference](https://wavespeed.ai/docs/docs-api/bytedance/bytedance-seedream-v5.0-pro) and [official model page](https://wavespeed.ai/models/bytedance/seedream-v5.0-pro) on October 2, 2026. Requests use `2k`, `jpeg`, `standard` prompt optimization and asynchronous URL outputs. The documented result endpoint is `GET /api/v3/predictions/{id}/result`. Completed tasks expose `data.outputs`; failed, cancelled, timeout and deleted are terminal statuses. Model pricing and commercial terms must be checked in the owner's account before submitting; this workflow does not promise a fixed price or that one model is universally best.

| Image ID                | Ratio | Intended placement                                                           |
| ----------------------- | ----- | ---------------------------------------------------------------------------- |
| `growth-story`          | 4:5   | Lifestyle campaign card                                                      |
| `glamour-story`         | 4:5   | Glamour campaign card                                                        |
| `fitness-story`         | 4:5   | Fitness campaign card                                                        |
| `application-portrait`  | 4:5   | Application panel                                                            |
| `testimonial-editorial` | 4:5   | Illustrative section image, without identifying the model as a quote speaker |
| `journal-growth`        | 4:3   | Growth article thumbnail                                                     |
| `journal-marketing`     | 4:3   | Marketing article thumbnail                                                  |
| `journal-chat`          | 4:3   | Chat-operations article thumbnail                                            |

All ten subjects are distinct fictional, clearly adult 22-year-old women. The collection uses fitted dresses, sports bras and yoga leggings, and standard swimwear, with natural curvy proportions, varied skin tones, photographic lighting, and no logos or text. These images must be described as illustrative editorial imagery, never as verified clients, employees, testimonial speakers or evidence of revenue results.

Two additional 4:5 images, `roster-glamour` and `roster-fitness`, replace duplicate or clipped portraits in the Soraya and Aleks roster cards.

## Review the exact inputs

Node.js 24 LTS or newer is required. The script uses only Node's built-in libraries; no image SDK or runtime dependency is needed.

```sh
node scripts/generate-editorial-images.mjs --plan
node scripts/generate-editorial-images.mjs --plan --ids application-portrait,journal-chat
```

The plan action prints prompts and request hashes, makes no network request and needs no credentials. Review the composition and planned cost in WaveSpeed before choosing the paid submit action. Obtain credentials from the owner's [WaveSpeed API key dashboard](https://wavespeed.ai/accesskey), then set `WAVESPEED_API_KEY` securely in the invoking environment. A key is needed only for submission and result polling. The script never prints or saves it.

## Submit once, then resume

```sh
node scripts/generate-editorial-images.mjs --submit --ids application-portrait
node scripts/generate-editorial-images.mjs --status --ids application-portrait
node scripts/generate-editorial-images.mjs --status --polls 3 --ids application-portrait
node scripts/generate-editorial-images.mjs --download --ids application-portrait --output-dir ../editorial-image-masters
```

Omitting `--ids` selects all manifest briefs. **`--submit` makes paid generation requests.** It refuses the entire selection if any selected ID already appears in `.cache/editorial-images/jobs.json`, including failed or uncertain requests. Use `--status` and `--download` to resume saved predictions without charging for another generation. To create an intentionally new version later, add a new, uniquely named manifest ID and submit only that ID after reviewing its input and cost. Do not delete the registry to reroll.

The script writes a durable checkpoint before every paid POST, persists each returned prediction ID immediately, holds a workflow lock and makes no automatic paid retries. An interruption before receiving an ID is saved as `submission_unknown` (or remains `submitting` after a crash). The provider may have accepted and charged that request: inspect WaveSpeed History before doing anything that could submit again. If the matching prediction exists, recover its ID:

```sh
node scripts/generate-editorial-images.mjs --adopt application-portrait=PREDICTION_ID_FROM_HISTORY
node scripts/generate-editorial-images.mjs --status --ids application-portrait
```

Replace `PREDICTION_ID_FROM_HISTORY` with the actual existing prediction ID after checking its prompt/model in the owner's History. Adoption stores an existing ID and makes no paid request. It cannot replace a different saved prediction. Restore the original manifest input if it was edited after an uncertain submission.

If a previous process crashed and left `.cache/editorial-images/jobs.lock`, inspect the PID recorded in that file and confirm the process is no longer running before removing **only** the stale lock. Preserve `jobs.json`. The cache contains output URLs and prompts; keep it private and excluded from commits and deployment packages.

`--status` defaults to one status sweep, allows at most five sweeps and has a 60-second overall budget. Requests have bounded timeouts; terminal tasks are never polled again. A pending task can be checked later with the same command. Provider error bodies, stack traces and signed output URLs are omitted from console errors. Status and downloads never submit new predictions.

## Review masters before publishing

Masters default to `../editorial-image-masters` relative to the repository; `--output-dir` can select another directory outside the checkout. Downloads require completed saved jobs, public HTTPS destinations, validated DNS, verified TLS, bounded file size and JPEG/PNG signatures. API credentials are never sent to image CDNs. Completed downloads include SHA-256 hashes in the registry; a repeated download verifies and reuses the saved master. Unknown or modified existing files are not overwritten.

Download performs no image conversion and does not modify website assets. Review every master at full resolution for adult appearance, skin texture, anatomy, fingers, wardrobe and logos. Reject anything unsuitable. Export responsive derivatives from the approved master at the widths appropriate to its placement, with AVIF, WebP and JPEG fallbacks; do not regenerate separately at each size. Match HTML width/height to the actual crop, use accurate illustrative alt text, update CSS/JS or image fingerprints where applicable, and verify the resulting page on desktop and mobile before publishing.

The reviewed collection is integrated as responsive AVIF, WebP and JPEG derivatives under `assets/img/editorial/`. Masters remain outside the public repository. Future paid generation requires a new manifest ID, available account credit, and a fresh review of the model and its terms. The existing job registry prevents accidental repeat charges.
