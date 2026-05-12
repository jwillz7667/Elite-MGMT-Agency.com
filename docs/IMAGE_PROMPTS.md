# Image Generation Prompts — Nano Banana Pro

Master prompt sheet for generating every photographic asset used on
[elite-mgmt-agency.com](https://elite-mgmt-agency.com). Optimized for
**Google Nano Banana Pro** (Imagen-class model).

> **About these images.** The website is the public, brand-marketing surface
> for Elite MGMT Agency — a women-only creator management agency. The imagery
> must read as **editorial luxury** (Saint Laurent / Mugler / Vogue Italia /
> SI Swimsuit), not as explicit content. The women depicted are professional
> creators in their early-to-mid twenties, photographed the way the agency
> portrays them publicly: head-turning, confident, in body-conscious designer
> styling that showcases the figure the creator built her brand on — closer
> to a fashion-house campaign than a corporate stock site, but always
> editorial rather than explicit.

---

## Table of Contents

1. [How to use this file](#how-to-use-this-file)
2. [Global Brand DNA](#global-brand-dna)
3. [Universal prompt scaffold](#universal-prompt-scaffold)
4. [Aspect ratio reference](#aspect-ratio-reference)
5. [Image specs index](#image-specs-index)
6. **Prompts**
   - [01 · Ava L. — Lifestyle hero portrait](#01--ava-l--lifestyle-hero-portrait)
   - [02 · Noor D. — Glamour creator portrait](#02--noor-d--glamour-creator-portrait)
   - [03 · Camila R. — Fitness creator portrait](#03--camila-r--fitness-creator-portrait)
   - [04 · The Retreat — annual roster gathering](#04--the-retreat--annual-roster-gathering)
   - [05 · Open Graph card — default (1200×630)](#05--open-graph-card--default-1200630)
   - [06 · Open Graph card — square (1200×1200)](#06--open-graph-card--square-12001200)
   - [07 · Brand logomark (vector, not photo)](#07--brand-logomark-vector-not-photo)
7. [Negative direction (what to avoid)](#negative-direction-what-to-avoid)
8. [Post-generation workflow](#post-generation-workflow)

---

## How to use this file

1. **Generate one master image per subject** at the largest size listed in the
   spec. Do **not** regenerate at each width — subject identity will drift.
   Resize from the master with `sharp`, `cwebp`, `avifenc`, or an equivalent
   build pipeline. The repo already references the three formats
   (`avif`, `webp`, `jpg`/`png`) and four widths per subject.
2. **Keep the seed.** When you find a generation you like, save the seed. The
   site's three creators must remain visually consistent across the
   hero strip, the gallery, and the case-study sections.
3. **Set aspect ratio as a parameter**, not as a phrase inside the prompt.
   In Nano Banana Pro, set the aspect ratio control to the value listed in
   each spec (e.g. `4:5`, `16:9`, `1:1`).
4. **Do not include negative prompts inline** — Imagen-class models handle
   negative steering differently than Stable Diffusion. Phrase guidance
   positively (use "bias-cut silk slip dress, body-conscious editorial
   styling" rather than "no nudity").
5. **Run 4 variations** of each prompt, pick the strongest, then run another
   pass at higher guidance for the final.

---

## Global Brand DNA

Reference these every time. The strength of the site comes from the imagery
all reading as one collection.

| Token | Value |
|---|---|
| Mood | Editorial luxury, confident, after-hours, NYC SoHo |
| Era | Contemporary 2026, timeless rather than trend-driven |
| Palette (primary) | Near-black `#0A0A0A`, muted gold `#D4AF37`, deep forest green `#1B5E20` |
| Palette (skin) | Warm, natural, range of skin tones — never blown-out or filtered |
| Lighting (signature) | Single-source soft window light or a low-key three-point setup with a strong rim from the back-right; deep, controlled shadows; never harsh |
| Wardrobe direction | Slip dresses in silk satin, tailored trousers, fine knitwear, sculpted blazers, vintage gold jewelry, never logo-heavy |
| Hair | Glossy, slightly undone, no aggressive editorial sculpting |
| Makeup | Skin-finish, neutral matte lip or sheer wine, no heavy contour |
| Camera reference | Hasselblad H6D-100c, 80mm, f/2.8, ISO 200 — or Mamiya RZ67 on Portra 800 for warmer film looks |
| Output detail level | Skin texture preserved, fabric grain visible, jewelry catches light, ultra-high detail, photographic realism |
| Style references | Annie Leibovitz portraiture, Jamie Hawkesworth editorial light, Solve Sundsbo luxury, Inez & Vinoodh restraint |
| Anti-references (mood) | Influencer ring-light, beauty filter, oversaturated, hard flash, EDM glamour |

> **Casting requirement.** Subjects are adult women (clearly 21–28, sweet
> spot 22–24), conventionally striking — the kind of face and figure that
> stops a room. Self-possessed, aware of the camera, never timid. Bodies
> are real and trained: defined waist, glutes and quads earned in a gym,
> shoulders confident. Diversity across ethnicity, body type, and styling
> is intentional and load-bearing, but every subject should read as
> top-percentile in her category.

---

## Universal prompt scaffold

Every prompt follows the same six-part order. This gives Imagen the structured
signal it parses best.

```
[1 SHOT TYPE + SUBJECT]. [2 EXPRESSION + POSE].
[3 WARDROBE + GROOMING + ART DIRECTION].
[4 LOCATION + ENVIRONMENT + TIME OF DAY].
[5 LIGHTING + CAMERA + FILM/SENSOR].
[6 STYLE + MOOD + FINISHING + RESOLUTION].
```

Avoid trailing tag-style keywords. Compose grammatical sentences.

---

## Aspect ratio reference

| Use | Ratio | Output dim (master) | Final widths used on site |
|---|---|---|---|
| Hero portrait (Ava) | 5:4 portrait → `4:5` | 1280×1600 | 480 / 768 / 1200 / 1600 |
| Hero portrait (small crops) | 5:4 portrait → `4:5` | derived | 480 / 768 |
| Hero landscape crop (Ava reuse) | 4:3 → `4:3` | derived from master | 768 |
| Glamour portrait (Noor) | 6:7 portrait → `4:5` (then crop) | 1200×1400 | 480 / 768 / 1200 |
| Fitness portrait (Camila) | 16:21.93 portrait → `3:4` (then crop) | 1200×1645 | 480 / 768 / 1200 |
| Retreat landscape | 16:9 | 2400×1350 | 800 / 1200 / 1600 / 2400 |
| OG default | 1.91:1 → `16:9` (then crop) | 2400×1260 | 1200×630 final |
| OG square | 1:1 | 1600×1600 | 1200×1200 final |

Generate at the largest size in column 3, then downscale with a Lanczos
filter at format-conversion time.

---

## Image specs index

| # | Output file(s) | Final dim | Alt text in HTML |
|---|---|---|---|
| 01 | `assets/img/hero/ava-portrait-{480,768,1200,1600}.{avif,webp,jpg}` | 1200×1560 hero | "Ava — Elite MGMT roster creator on the Lifestyle track…" |
| 02 | `assets/img/creators/glamour-noor-{480,768,1200}.{avif,webp,png}` | 1200×1400 | "Noor D. — Glamour creator on the Elite MGMT roster" |
| 03 | `assets/img/creators/fitness-camila-{480,768,1200}.{avif,webp,png}` | 1200×1645 | "Camila R. — Fitness creator on the Elite MGMT roster" |
| 04 | `assets/img/hero/retreat-{800,1200,1600,2400}.{avif,webp,jpg}` | 2400×1350 | "Top creators on the annual Elite MGMT roster retreat, 2026" |
| 05 | `assets/img/social/og-default.{jpg,webp}` | 1200×630 | Social-card meta |
| 06 | `assets/img/social/og-square.jpg` | 1200×1200 | Twitter card |
| 07 | `assets/img/logo/{favicon.svg, logo-*.png, logo-*.webp}` | vector + raster | Logo / brand mark |

---

## 01 · Ava L. — Lifestyle hero portrait

**Files:** `assets/img/hero/ava-portrait-{480,768,1200,1600}.{avif,webp,jpg}`
**Aspect ratio control:** `4:5` (portrait)
**Master output:** 1280×1600 (downscale to 1600w / 1200w / 768w / 480w)
**Role on site:** Above-the-fold hero portrait, repeated as a thumbnail in
the creator strip and again as a case-study still ("0 to $48k/mo in 90 days").
Must carry the brand on first impression.

### Subject brief

"Ava" is a Lifestyle creator on the Elite MGMT roster. The portrait should
read as a high-end fashion-house campaign — magnetic confidence, knowing
restraint. Early 20s, mixed European / Latin features, glossy chestnut
hair past the shoulders, warm skin tone, full natural brows, sculpted
cheekbones, the kind of face brands sign for ten-year contracts.

### Prompt

```
A waist-up editorial portrait of a 23-year-old mixed-heritage woman with
glossy chestnut hair worn loose past her shoulders, full lips slightly
parted, a calm, level gaze held just off-camera. She stands with weight
shifted onto one hip, one hand resting lightly near a champagne coupe on
a brass-edged bar, the other settled on her waist — the line from her
shoulder to her hip a single confident curve.

She wears a bias-cut charcoal silk-satin slip dress that skims her body
from a deep cowl neckline to a thigh-high side slit, the satin clinging
through the waist and falling in liquid folds at the hip; thin spaghetti
straps, the long sculpted line of her bare shoulders and collarbones
catching the key light. A single brushed-gold pendant rests above her
neckline, no other jewelry. Skin-finish makeup with a neutral wine lip,
sculpted brow, nails the colour of dried bordeaux.

The location is a private members' lounge in SoHo, New York — herringbone
oak floor, black walnut paneling, a single oil painting blurred in the
background. It is just past nine in the evening; a hand-blown amber wall
sconce on the right edge of the frame casts warm key light, while a cool
fill from a curtained window on the left lifts the shadow side just enough
to keep her eyes alive. A faint rim from a brass downlight catches the
back of her hair.

Shot on a Hasselblad H6D-100c with an 80mm f/2.2 prime, ISO 200, shallow
depth of field with the bar furniture falling into a creamy, controlled
bokeh. Subject sharp from her brow to the slip dress strap.

Editorial luxury, Vogue cover composition, Annie Leibovitz restraint,
warm low-key lighting, deep but lifted shadows, preserved skin texture
and fabric grain, ultra-high detail, natural color, photographic realism,
4K. Aspect ratio 4:5, vertical.
```

### Variation steers (run all four)

- **A — primary cover read** (above as written).
- **B — closer crop**: change "waist-up editorial portrait" to "tight
  shoulders-up portrait" and remove the bar / coupe; keep the slip dress.
- **C — half-smile, direct gaze**: change "calm, level gaze held just
  off-camera" to "the start of a private smile, eyes meeting the lens
  directly with the confidence of someone used to being watched".
- **D — full length, colour swap**: change "waist-up editorial portrait"
  to "full-length editorial portrait" and "charcoal silk-satin slip dress"
  to "deep forest-green silk slip dress with a thigh-high slit revealing
  the long line of her leg, the dress moving with each step".
- **E — wealth context (G-Wagen arrival)**: completely reframe — "A
  three-quarter editorial portrait of Ava stepping down from the driver's
  seat of a matte-black Mercedes-Benz G-Wagen at the curb of a SoHo
  cobblestone street at dusk. One Louboutin heel just touching the
  cobblestone, the other still on the running board; one hand on the
  open door, the other holding a Louis Vuitton Capucines handbag in
  black taurillon. Same charcoal silk slip dress, same chestnut hair,
  same private smile aimed past the lens. Warm tungsten streetlight
  catches her face and the gold of the bag clasp; the polished black
  paint of the G-Wagen reflects the city behind her." Aspect ratio 4:5.
- **F — diamond stack still-life integration**: full-length seated
  portrait on a tufted black velvet banquette at a private members' bar.
  Same slip dress. Right hand resting on a champagne coupe — wrist
  stacked with a Cartier Love bracelet in yellow gold, a Cartier Juste
  un Clou bangle, and a tennis bracelet of round-brilliant diamonds.
  Diamond hoop earrings, a thin chain layered necklace. Soft warm key
  from the right, gold rim from above, deep velvet shadows.

---

## 02 · Noor D. — Glamour creator portrait

**Files:** `assets/img/creators/glamour-noor-{480,768,1200}.{avif,webp,png}`
**Aspect ratio control:** `4:5` (portrait), then crop top to 1200×1400 if needed
**Master output:** 1200×1500
**Role on site:** Glamour track of the talent gallery, also used in case-study
("Retention up 38% in 60 days") and "Recently onboarded" card.

### Subject brief

"Noor" is a Glamour creator. Early 20s, Middle Eastern or Levantine features,
deep brown almond eyes, long dark hair with a soft natural wave, full dark
brows, warm olive skin, an hourglass figure she trains for. She owns the
camera — a different energy from Ava's restraint; more direct, more aware
of her own appeal, never apologetic for it.

### Prompt

```
A three-quarter editorial portrait of a 24-year-old Levantine woman with
long dark waved hair swept slightly off her face, looking directly into
the camera with steady, knowing confidence — the unmistakable expression
of a woman who knows exactly how she lands. Chin level, lips parted just
slightly, the suggestion of amusement around the eyes.

She wears a bias-cut black satin gown that pours over her body like liquid
mercury — a plunging cowl neckline framing her collarbones and the inner
curve of her chest, a low draped back exposing her spine, the satin
clinging through the waist and across the hip before falling open at a
thigh-high front slit. Long sleeves taper to the wrist. Two vintage gold
ear cuffs and a single thin gold rope around her wrist; no rings, no
necklace — the gown is the statement. Glossy skin finish, defined matte
espresso lip, brows brushed up, lashes natural.

She stands in a darkened Manhattan penthouse interior — black-lacquered
walls, a sliver of cobalt midnight sky through a tall casement window
behind her, a hint of city lights blurred to gold pinpricks. The space
feels owned, lived-in, not staged.

A single soft key light from camera-left at her eye level, a deep gold rim
light catching the back of her shoulder and the curve of her satin neckline,
the rest of the room falling into rich controlled black. No shadow detail
loss in skin; full tonal range from specular highlights on the satin down
to true black in the wall.

Shot on a Mamiya RZ67 with 110mm lens on Kodak Portra 800, slight grain
visible, organic film tone, slightly warm white balance.

Editorial fashion photography, Document Journal aesthetic, Inez and Vinoodh
restraint, low-key luxury, deep gold rim, preserved skin texture,
true blacks, ultra-high detail, photographic realism, 4K. Aspect ratio 4:5,
vertical.
```

### Variation steers

- **A — directional gaze** (above).
- **B — profile, hand at neckline**: change "looking directly into the
  camera" to "in three-quarter profile, gaze drifting toward the window,
  one hand resting against her exposed collarbone".
- **C — gold dress**: swap "bias-cut black satin gown" to "bias-cut
  champagne-gold silk gown with the same plunging cowl and exposed back".
- **D — full length, leg-forward**: change "three-quarter editorial
  portrait" to "full-length portrait, the front-slit gown falling open as
  she steps slowly toward the camera, the long line of her bare leg
  catching the rim light".
- **E — wealth context (Mercedes SL convertible at the valet)**: completely
  reframe — "A half-body editorial portrait of Noor seated in the cream
  leather driver's seat of an open-top pearl-white Mercedes-Benz SL
  Roadster at the valet stand of a Manhattan hotel, one wrist draped
  casually over the steering wheel — wrist heavy with a Cartier Love
  bracelet and a diamond tennis bracelet. A Louis Vuitton Twist MM in
  black epi leather rests on the passenger seat beside her. Same plunging
  black satin gown, same direct gaze to camera, the chrome of the
  car catching the gold of her ear cuffs. Warm tungsten valet light from
  the right, deep night behind." Aspect ratio 4:5.
- **F — jewelry close-up integration**: tight half-body, Noor sitting
  forward at the edge of a black-lacquered desk in a private suite,
  resting her chin on the back of her hand — fingers stacked with a
  square-cut diamond ring, a Cartier Love ring, and a thin pavé band.
  Diamond drop earrings catch the key light. A Louis Vuitton monogram
  Petite Malle clutch sits on the desk in front of her, beside a glass
  of Macallan on the rocks. Same gown, same direct gaze.

---

## 03 · Camila R. — Fitness creator portrait

**Files:** `assets/img/creators/fitness-camila-{480,768,1200}.{avif,webp,png}`
**Aspect ratio control:** `3:4` (portrait), crop to taller 1200×1645 if needed
**Master output:** 1200×1645 (extra-tall, allow vertical headroom for crop)
**Role on site:** Fitness track of the talent gallery, also used in case study
("0 to top 5% in 6 months") and "Recently onboarded" card.

### Subject brief

"Camila" is a Fitness creator. Early 20s, Brazilian / Afro-Latina features,
warm bronze skin with sun-kissed natural makeup, dark coiled hair pulled
back into a sleek high pony, strong shoulders, an athlete's hourglass —
defined waist, sculpted shoulders, glutes and quads earned in a gym. The
read is **strength as sex appeal** — Sports Illustrated training feature
rather than gym-bro vlog.

### Prompt

```
A full-length editorial portrait of a 22-year-old Brazilian Afro-Latina
woman with a sleek high ponytail of dark coiled hair, mid-step on a
polished concrete floor, weight forward on the ball of her left foot.
Athlete's hourglass figure — small defined waist, sculpted shoulders,
strong glutes and quads. Head turned a quarter toward the camera, full
lips slightly parted, jaw set, focused — the precise moment between
exertion and stillness.

She wears a matte-charcoal compression sports bra and matching seamless
high-waisted bike shorts in technical second-skin fabric, both cleanly
cut without logos, the fit defined enough to read every line of her
trained core, the cut of her shoulders, and the curve of her hip. Bare
feet, a single thin gold anklet, no other jewelry, no makeup beyond skin
tint and a touched-up brow. A faint sheen of natural perspiration on her
collarbone and the small of her back catches the light.

The setting is a private training studio in a converted SoHo loft — exposed
brick on the left, full-height industrial windows on the right with morning
light flooding in, a single matte-black gymnastic ring suspended in the
deep background, a folded charcoal towel and a hammered-bronze water
bottle on a low concrete bench.

Strong soft window light from camera-right, key on her face and the front
of her left leg, cool shadow on her back, a sliver of warm bounce from the
brick wall lifting the shadow side. Cinematic contrast, deep but lifted
shadows, never crushed.

Shot on a Hasselblad X2D 100C with a 90mm f/2.5, ISO 400, fast enough
shutter to freeze the foot in transition, slight motion in the loose end
of the ponytail. Sharp from her face to the front knee.

Editorial sports portraiture in the style of Cass Bird and Pari Dukovic,
strength as subject matter, warm natural color, preserved skin and fabric
texture, ultra-high detail, photographic realism, 4K. Aspect ratio 3:4,
vertical.
```

### Variation steers

- **A — mid-step** (above).
- **B — seated power**: change "mid-step on a polished concrete floor" to
  "seated on a low bench, forearms on knees, eyes lifted to camera, the
  long line of her back curved forward".
- **C — outdoor rooftop**: change setting to "a private rooftop in early
  morning, Manhattan skyline soft in the haze behind her, no other people,
  warm rim from the rising sun catching the curve of her shoulder and hip".
- **D — back-of-shoulder crop**: change "full-length editorial portrait"
  to "three-quarter portrait from slightly behind her, looking over her
  shoulder at the camera, the sports-bra strap and the line of her back
  in sharp focus".
- **E — wealth context (post-workout, G-Wagen, LV gym bag)**: completely
  reframe — "A three-quarter editorial portrait of Camila walking away
  from a matte-charcoal Mercedes-Benz G-Wagen parked at the curb of a
  cobblestone SoHo street in early morning, a black-and-monogram Louis
  Vuitton Keepall 55 bandoulière slung over her shoulder. Same matte
  compression sports bra and bike shorts, a long cream cashmere overcoat
  worn open over the set, a thin Cartier Love bracelet on one wrist and
  a small diamond tennis bracelet on the other. AirPods Pro in hand,
  iced coffee in the other. Cool morning light, long shadows, the city
  waking behind her." Aspect ratio 3:4.
- **F — penthouse home gym, wealth signal subtle**: full-length portrait
  in a private penthouse home gym — floor-to-ceiling windows showing the
  Manhattan skyline at sunrise, polished concrete floor, a single matte
  black Peloton in the deep background. Same compression set. Diamond
  stud earrings, a thin gold anklet. A Louis Vuitton monogram water
  bottle holder on a black walnut bench beside her.

---

## 04 · The Retreat — annual roster gathering

**Files:** `assets/img/hero/retreat-{800,1200,1600,2400}.{avif,webp,jpg}`
**Aspect ratio control:** `16:9` (landscape)
**Master output:** 2400×1350
**Role on site:** Atmospheric "you belong here" image. Anchors the
roster-retreat block twice and used as the social-proof / "result" backdrop
on the case-study row.

### Subject brief

A wide, atmospheric scene of the agency's annual top-performers retreat.
Six to eight women in their early-to-mid twenties, racially diverse,
trained figures, in body-conscious resort wear at golden hour on a
clifftop terrace overlooking the Mediterranean. **Not a posed group
photo** — they are mid-conversation, mid-laugh, walking, drinking from
coupe glasses. The image must read as a **moment** rather than a portrait
— like a still pulled from a Saint Laurent campaign film.

### Prompt

```
A cinematic wide landscape photograph of seven women between roughly
twenty-one and twenty-six years old, racially diverse — Black, East
Asian, Latina, Middle Eastern, white European — standing and walking in
loose conversation on a clifftop terrace at golden hour. Every figure is
striking and trained: defined waists, sculpted shoulders, the natural
poise of women used to being photographed. None of them looks at the
camera. One throws her head back mid-laugh, one leans on a stone
balustrade with a champagne coupe, the line of her hip catching the sun;
two walk toward the edge of the frame arm-in-arm, the slit of one's
dress falling open with the step; two are in animated conversation a few
steps further back; one crouches at the edge of the terrace to slip her
heeled sandal back on, the arch of her foot catching the light.

They wear resort eveningwear in a tightly controlled palette and a
shared body-conscious cut: a bias-cut backless cream silk slip, a
liquid-oyster mini-slip with thin straps, a soft camel knit halter with
a deep V, a deep forest-green satin dress with a thigh-high front slit,
a strapless body-skimming black silk gown, a slip cut from champagne
charmeuse with a low cowl back, one with a sheer chiffon overlay above
matching slip lining. No prints, no logos, no statement bags. Loose
hair, gold jewelry, sheer warm lip, skin-finish makeup.

The terrace is at the edge of a Mediterranean cliff overlooking a calm
sea: hand-cut limestone underfoot, low stone balustrade, two olive trees
in copper planters, a long natural-linen dining table behind them set
with hand-blown amber glassware, taper candles in brass holders, low
centerpieces of fig branches. The sea below glows in the late sun;
the sky is a soft graduated wash from peach at the horizon to a deep
indigo at the top of the frame.

Sun is fifteen minutes from the horizon; long warm key light from
camera-left across the group, deep glowing rim on hair and the silk
fabrics, the cliff face beyond falling into deep cool shadow. Total
contrast is controlled — no blown highlights on skin or fabric.

Shot on a medium-format digital camera with a 50mm equivalent lens at
f/4, hand-held but stabilized, slight natural motion in the linen napkins
and a wisp of hair on the laughing subject. Depth of field shallow enough
to soften the sea, sharp on the front group.

Editorial travel photography in the style of Jamie Hawkesworth and
Gueorgui Pinkhassov, warm golden light, painterly highlights, organic
candid energy, preserved skin and fabric texture, ultra-high detail,
photographic realism, 4K. Aspect ratio 16:9, horizontal.
```

### Variation steers

- **A — terrace at golden hour** (above).
- **B — interior dinner**: change setting to "around a long candlelit
  dining table in a stone villa at night, six women in fitted bias-cut
  slips and a single strapless black silk corset top, fig and pomegranate
  centerpieces, single ceramic-shaded pendant low over the table, deep
  warm shadows, intimate".
- **C — pool morning**: change to "early morning by a stone infinity
  pool, four women in matching cream high-cut one-piece swimsuits with
  long silk robes hanging open at the shoulder, hands wrapped around
  white espresso cups, sea mist soft in the background, cool blue tone".
- **D — vineyard walk**: change to "five women walking a stone path
  through a Tuscan vineyard at midday, wide-brimmed straw hats, sheer
  cotton sundresses skimming their bodies, no destination, mid-laugh".

---

## 05 · Open Graph card — default (1200×630)

**Files:** `assets/img/social/og-default.{jpg,webp}`
**Aspect ratio control:** `16:9`, then crop to `1.91:1`
**Master output:** 2400×1260
**Role:** The image LinkedIn, Facebook, iMessage, Slack, Discord, and
search-result link previews use. Must read instantly at thumbnail size
and survive aggressive compression.

### Subject brief

Half hero portrait, half identity card. The viewer needs to know in one
glance: *this is an elite creator-management agency, by and for women*.

### Prompt

```
A clean editorial composition with a striking 23-year-old mixed-heritage
woman positioned on the right two-thirds of a wide horizontal frame,
photographed in waist-up three-quarter view, looking calmly into the
camera with the suggestion of a private smile and the unmistakable
confidence of someone used to being watched. Glossy chestnut hair worn
loose past her shoulders, a bias-cut charcoal silk-satin slip dress with
a deep cowl neckline framing her collarbones, thin spaghetti straps,
single brushed-gold pendant.

The left third of the frame is intentional negative space: a soft
graduated black backdrop, deep matte black on the left edge transitioning
to a slightly lifted charcoal toward her shoulder, giving room for
overlaid type without competing with her presence. A subtle warm gold
spotlight rims the back-right of her hair, a controlled amber kicker
visible in the deep background like a single distant lamp.

Single soft key light from camera-right at her eye level, gentle fall-off
to true black on the left, no fill, no rim from the left. Shadow detail
preserved in skin; highlights on the satin controlled.

Shot on a Hasselblad H6D-100c with an 80mm f/2.2 prime, ISO 200. Sharp on
her eyes, with the satin falling into a creamy bokeh below the
collarbone.

Editorial luxury, Vogue cover composition, low-key lighting, deep but
lifted shadows, preserved skin texture and fabric grain, ultra-high
detail, photographic realism, 4K. Aspect ratio 16:9, horizontal, with
intentional left-third negative space for overlaid title.
```

> **Layout note (post-generation).** The wordmark and tagline are
> composited in design software, not generated. The image must leave the
> left third clean. After generation, crop to **1.91:1** (1200×630).

---

## 06 · Open Graph card — square (1200×1200)

**Files:** `assets/img/social/og-square.jpg`
**Aspect ratio control:** `1:1`
**Master output:** 1600×1600
**Role:** Twitter / X large-image card, Instagram link preview, WhatsApp
preview where the platform prefers square.

### Subject brief

A square restatement of the brand: same subject and lighting as the
default OG card, but composed so she is centered with even negative space
top and bottom — leaving room for an overlaid wordmark.

### Prompt

```
A symmetrical editorial composition with a 23-year-old mixed-heritage
woman centered in a square frame, photographed in clean half-body view,
shoulders squared to camera, head straight, looking into the lens with
calm, magnetic confidence. Glossy chestnut hair past her shoulders, a
bias-cut charcoal silk-satin slip dress with a deep cowl neckline framing
her collarbones, thin spaghetti straps, single brushed-gold pendant.

Behind her, a deep graduated black backdrop — true black at the top and
bottom corners, lifting to a soft charcoal halo behind her head, like a
single distant warm gold spotlight falling on the studio cyc.

A soft key light from camera-right at eye level, mirrored gentle fill
from the left to keep the symmetry of the composition. A warm gold rim
catches the curve of her shoulder on the right. Controlled shadow,
preserved skin and fabric texture.

Shot on a Hasselblad H6D-100c with an 80mm f/2.2 prime, ISO 200. Tack
sharp from brow to satin neckline.

Editorial luxury, low-key lighting, museum-portrait composure, balanced
negative space top and bottom for overlaid wordmark, photographic realism,
ultra-high detail, 4K. Aspect ratio 1:1, square.
```

---

## 07 · Brand logomark (vector, not photo)

**Files:** `assets/img/logo/favicon.svg` + raster exports
(`logo-{32,48,64,96,128,180,192,256,384,512}.png`,
`logo-{32,64,96,128,192}.webp`)
**Type:** Vector geometric monogram — **do not generate as a photograph**.

Nano Banana Pro is photographic. Use it only to **explore** logo direction;
the final asset must be drawn in Figma / Illustrator / Affinity and exported
clean. Use this prompt to produce three rough directions to choose from,
then redraw the winner in vector.

### Prompt (exploration only)

```
A single elegant geometric monogram of the letters "E" and "M"
interlocked into a square-proportioned mark, drawn in a single uniform
stroke weight in muted gold (#D4AF37) on a flat near-black background
(#0A0A0A). The lines have softly bevelled ends, the negative space
inside the mark forms a clean geometric diamond. No serifs, no
ornament, no halo, no shadow. Centered with generous symmetric
negative space on all four sides. Flat vector look, crisp edges,
infinitely scalable, no photographic texture. Show three subtle
variations in a row: (1) "E" leading, (2) "M" leading, (3) merged
ligature where the strokes share a center spine. Aspect ratio 16:9,
horizontal triptych.
```

> **Final requirements for the production logomark:**
> - Square canvas, 1:1.
> - Single colour fill, no gradient, no inner shadow.
> - Optical correction so the mark reads centered at 32×32px on a tab.
> - SVG exported with no embedded fonts (outline all paths).
> - PNG / WebP rasters exported at 1×, 2×, 3× from the SVG.

---

## Negative direction (what to avoid)

Phrase these as positive instructions inside prompts (Imagen ignores
list-style negative prompts), but as a creative-direction checklist:

- **Editorial, not explicit.** Body-conscious designer wear is on-brand:
  bias-cut silk slips, plunging cowls, exposed backs, thigh slits,
  second-skin technical fabric, compression sportswear, sheer chiffon
  over slip lining, high-cut one-pieces in the retreat / pool variation.
  Fully nude imagery, explicit framing, or anything that would not run in
  a Saint Laurent / Mugler / SI Swimsuit campaign belongs on the
  creator's own paid channels — not on the public marketing surface.
- **Every subject is unambiguously 21+.** When in doubt, age the prompt
  up by a year or specify "in her early twenties" rather than a younger
  descriptor. Faces must read mature, not teenage.
- No ring-light eyes, no obvious beauty filter, no plastic skin smoothing
  — keep texture, freckles, fine hair, fabric grain.
- No "duck-face pout" influencer trope, no peace signs, no phone in hand,
  no laptop on lap, no obvious selfie composition.
- No corporate stock vibe — no white office, no headset, no whiteboard,
  no team high-five.
- No oversaturated colour, no Instagram orange-and-teal grade.
- No fast-fashion or sportswear logos on garments. No screen-printed
  text. **Luxury-house signatures are allowed and on-brand** —
  Louis Vuitton monogram canvas, Hermès orange box / leather grain,
  Cartier Love hardware, Van Cleef Alhambra, Bulgari Serpenti — these
  are *wealth signals*, the whole point of those frames.
- No artificial-looking jewelry, no plastic gemstones, no novelty
  accessories. Real-looking diamonds, gold, platinum only.
- No more than one strong rim light direction per image (keeps the brand
  consistent).
- No floating limbs, no warped fingers, no extra earrings, no doubled
  navel, no anatomical errors — **inspect hands, feet, ears, and the
  seamline of any bodycon garment at full resolution before approving**.

---

## Post-generation workflow

After Nano Banana Pro returns the master image:

```sh
# 1. Save the raw master to a working folder (NOT the repo)
~/work/elite-mgmt-agency/masters/{subject}-master.png

# 2. Inspect at 100% — check hands, ears, eyes, jewelry, fabric weave
# 3. Color-grade in Capture One or Lightroom; export a single graded TIFF
# 4. Drop the graded master into the build pipeline

# Resize + format conversion (example for Ava hero):
sharp -i master.tiff -o assets/img/hero/ava-portrait-1600.jpg \
  --resize 1600 --quality 82 --mozjpeg
sharp -i master.tiff -o assets/img/hero/ava-portrait-1600.webp \
  --resize 1600 --quality 78
avifenc --speed 4 --jobs all --min 24 --max 28 --minalpha 0 --maxalpha 0 \
  master.tiff assets/img/hero/ava-portrait-1600.avif

# Repeat at 1200 / 768 / 480 widths. Always downscale from the graded master,
# never up-rez from a smaller render.
```

After import, run the structural validator and Lighthouse audit to confirm
the swap didn't regress LCP:

```sh
npm run validate
npm run audit:perf
```

---

_Last reviewed: 2026-05-12. Owner: Viral Ventures LLC._
