# Blissta: static ads, SOPs and winning statics (from Google Drive)

Pulled 2026-10-14 from Google Drive (read-only). Sources: "03 STATIC ADS", "BLISSTA - WINNING ADS" (image subfolders), "WINNING-ADS-AUGUST", "WIN-BLISSTA", plus the SOP, compliance and facts docs those SOPs point to. Quotes are verbatim. Where two docs give different numbers, both are shown and the conflict is flagged. **BLISSTA_FACTS.md is the stated single source for numbers.**

**What is (and isn't) in the folders**
- **03 STATIC ADS**: 2 files, the static production SOP (.md, v2.0) and the Static Ad Designer Brief (PDF, Sep 30).
- **Blissta Static SOPs (Oct 2026)**: the folder exists (created 2026-10-08). A parentId search returns it empty, and title, fullText and date searches find nothing inside it. Either it really is empty or its files are not indexed or shared to this account. **Nothing was read from it.**
- **WINNING-ADS-AUGUST**: 28 subfolders. All of them hold video ads (.mp4) only, with no docs and no images.
- **WIN-BLISSTA**: .mp4 only (Hook 1–18, 1–14.mp4).
- **BLISSTA - WINNING ADS**: 4 product folders (NATTOKINASE, PEA PAINBLOC, MB GUMMIES, MB DROPS). Each has VIDEO (mp4 only) and IMAGE/"JULY IMAGES" subfolders. **These IMAGE folders are the only winning statics in Drive, 31 files.** I looked at all of them.
- No static primary text (post copy) is stored anywhere in these folders. The "WINNING CREATIVES" doc only lists Facebook post URLs, which were not opened.

---

## 1. Static ad SOP, step by step

Two SOPs overlap, and you need both. **(A) 03_STATIC_PRODUCTION_SOP v2.0** (owner Hemant, 14 Sep 2026) covers the daily volume job: one proven script becomes 15 concepts and 45 images. **(B) Static Ad Designer Brief** (Sep 30 2026, from the Black Friday / offer work) covers porting a competitor static: one winner becomes 5 statics.

### 1A. Daily production SOP (script → 15 concepts × 3 hooks = 45 images)
**Scope:** turn one proven script into a day of statics. It does NOT cover inventing angles, writing scripts, native ads, video, or deciding tests. "Your job is volume against a proven angle, not new ideas."

**Read before your first day (3 docs only):**
- Brand Bible: who he is, the villains, how he talks, the language bank.
- BLISSTA_FACTS.md: every number you are allowed to use.
- The avatar doc for your product.

**Access on day 1:** Slack, the script folder, the delivery folder, TrendTrack (all from Hemant), Meta Ad Library (public), and your own render tool. "If you cannot open something named above, say so on day one. Do not work around it."

**The job (daily target is 15 concepts / 45 images; the tracker's Designers sheet confirms "Daily Concept Target 15 · Daily Static Target 45"):**
1. Read the script twice.
2. Pull 15 concepts out of it.
3. Check what competitors are running.
4. Write 3 hooks per concept.
5. Build one base render per concept and overlay the text 3 times.
6. Audit against the killers.
7. Deliver.

**Step 2. The 15 concepts.** A concept is "one argument, one visual idea, one thing on screen". It is not a headline. Every script contains these 15:
1. Wrong belief (*It's my age.*)
2. Reframe (*It's your arteries.*)
3. Failed solution (*Cut the salt, cut the beer, six weeks at the gym.*)
4. Dismissal (what a doctor said)
5. The number
6. Comparison (ours vs theirs)
7. Physical proof he can check (sock line, label, lot number)
8. Villain named, in one word
9. Mechanism as one image (mesh, pipe, pencil lead)
10. Daily loss (bins in two trips, the stairs, cold hands in July)
11. Relationship beat (*She stopped asking. He goes up forty minutes after her.*)
12. Scarcity (external and true only)
13. Guarantee
14. Offer
15. The line he'd repeat to a mate in a pub

The SOP includes an LLM prompt to extract these. The prompt is to quote the script exactly and give a one-sentence visual idea per item, with no headlines yet.

**Step 3. Competitors.** Use Meta Ad Library or TrendTrack and **filter by longest running**. "Live 60 days is a winner. Live 3 days is a test."
- Pull: layout, density, background, device (a red X, a checklist, a split, a screenshot).
- Never pull: their angle, claim or words.
- "Take their layout, put our concept in it, use his words."

**Step 4. Three hooks per concept.** Lock the concept, visual and background, and change only the headline, so a winner is known to have won on the words. Use three different triggers, never three versions of one:

| Trigger | What it does |
|---|---|
| Absolution | It wasn't his fault |
| Reframe | His explanation is wrong |
| Fear/loss | What happens if he does nothing |
| Curiosity gap | Something he doesn't know yet |
| Social proof | Somebody like him did it |
| Identity | He's the kind of man who worked it out |
| Offer | Pure transaction |

**Step 5. Build.** "Write the hook first, then find the photo that proves it." The headline is the scroll stop. The visual makes the headline believable by showing the literal scene (e.g. a truck dashboard at night with rain proves an interstate story).
- Prompt structure: `[SUBJECT] [SETTING] [LIGHTING] [CAMERA] [COLOUR hex] [COMPOSITION focal point/product placement/negative space] [STYLE photoreal/3D/native phone] [NEGATIVE no text, no watermark, no hands unless specified]`.
- Be specific. "Natural window light from the left, overcast" beats "good lighting". "Shot on a phone, slightly too close, handheld" beats "candid". Give hex codes, not "cream".
- One base render per concept with three text overlays. The tool is up to you (hand-finish, AI, anything): "What we care about is that 45 arrive and they look like ours."

**The three background systems (every static uses one):**

| # | System | Hex | Use for |
|---|---|---|---|
| 1 | Clean clinical | white/near-white, black headlines, one accent | mechanism reveals, label comparisons, checklists, anything that reads as evidence |
| 2 | Cream heritage | `#F4ECDC` · `#3A2818` · `#C89D4E` | Japanese authority, testimonials, before/after, anything "old and proven" |
| 3 | Vascular oxblood | `#4A0F0F` · `#E8A82C` · cream cards | splits, cinematic premium, urgency, anything with stakes |

- Break the system only when the format depends on its own look (a Reddit screenshot must look like Reddit, an "ugly green Facebook native" must look ugly). The test: can you justify it in one sentence?
- **"No red, no blood, no gore in artery renders. Warm cream and dusty rose."**
- ⚠ The Designer Brief (Sep 30) says "We're navy, gold and white" and lists "maroon" as off-brand. That contradicts the SOP's oxblood system. Navy/gold/white matches the bottle and the offer statics. Ask Hemant which wins.

**Density and offer.**
- Levels: Minimal = hook only. Medium = hook + subline. Heavy = hook, subline, benefits, proof, offer. Test density as its own variable. ("Adding a price burst to a humour ad kills the joke. Stripping the stack from a trust ad kills the credibility.")
- Offer by temperature:
  - Cold / problem-aware: usually no offer.
  - Warm / solution-aware: the guarantee or the price per day.
  - Hot / retargeting: the full stack.
  - The offer can also be the guarantee, price per day, free gifts or value. It doesn't have to be a discount.
- Every number comes from BLISSTA_FACTS.md: "Never off an old static, never off a brief, never off memory."

**Step 6. Audit (see the killers in §4).**

**Step 7. Delivery.**
- File name: `[PRODUCT]_[CONCEPT]_H[1/2/3]_[RATIO].jpg`, e.g. `CORVAEL_TWO_LABELS_H2_4x5.jpg`.
- **4:5 default. JPG, sRGB, under 2MB.**
- One folder link per day, subfoldered by concept. No presentation, no explanation, just images. Due end of day.
- If you'll be short, say so before end of day. "Don't just send fewer."

**When stuck:** ask Hemant.
- Never guess a number, dose, price, guarantee, claim, or anything about where the product is made. If it's not in FACTS, it isn't settled, and you wait.
- Everything else: use your judgment and flag it on delivery.

### 1B. Designer Brief (port a proven competitor static → 5 statics)
Tone of the brief: "We don't want lazy work… fine doesn't sell." "You tell the AI what you want. The AI does not tell you." "Every static starts from a proven winner. Never from 'make me a Black Friday ad.'" "If the AI gets it wrong, it's the prompt's fault."

**Six steps, no skipping:**
1. Find a proven winner in TrendTrack.
   - Settings: Status = Active. Sort = Reach or scaling. Timeframe = last quarter. Media = Image (carousel/multimedia also fine). Niche/country don't matter ("we steal the concept, not the product").
   - Confirm in the brand's Ad Library sorted by impressions. Running long + high impressions = proven.
2. Break it down by answering 6 questions out loud:
   - The concept in one sentence ("Itemized receipt, the math sells.")
   - Where the eye goes 1st/2nd/3rd
   - The offer and how it's shown (starburst, strikethrough, tag, receipt)
   - What the headline is doing (calling out the offer, the avatar, or the moment)
   - What stops the scroll (motion, contrast, big number, face)
   - What stays 1:1 vs what must change
3. Write the messages and visual brief: **one 1:1 copy + 4 variants**. Send for approval. **No prompts yet.**
4. Write a detailed prompt per approved message.
5. Generate one at a time. Fix the prompt, not the image.
6. Run the checklist, then send.

Worked example from the brief: French BF ad with 4 drink sachets pouring juice → our port is 4 Longevity Box bottles pouring capsules, same cascade, same tags (new / -30% / limited stock), our real numbers.

**Variant structure.**
- 1:1 = the winner exactly, with our product and offer swapped in (same layout, colours, background).
- V2–V5 = same layout top to bottom, new headline + new background, each for a different sub-avatar.

| Sub-avatar | Background |
|---|---|
| Deal hunter who counts every dollar | Kitchen counter at dawn, coffee, pill organizer |
| Active 55+ guy | Back porch at golden hour, hills, sunset glow |
| Skeptical researcher | Dark lab bench, glassware, cool light |
| Anti-establishment insider | Dark table, one lamp, black envelope with a gold VIP card |
| Everyone (control) | Whatever the proven winner used, untouched |

**Approval packet per static:** headline, offer line, tags/badges (and their text), background + props, sub-avatar. The brief's example:
> C3: Over 50 For: the active 55+ guy Background: back porch at golden hour, weathered railing, blurred hills, low sun behind the bottles Headline: OVER 50? STOCK UP NOW. Offer: 5 bottles of Corbel for $78.39. Tag: 73% OFF

**Magnific settings, every time:** Model Google Nano Banana 2 · aspect ratio 1:1 (set in Magnific, not just the prompt) · Quality 1K, High · Thinking High · 1 image per gen.
- Upload real product shots and name them in the prompt ("Use @img1 for the Corbel bottle"). Use the right product version (capsules vs dropper).
- Don't attach the competitor ad. Describe it in words.

**Prompt rules.**
- Never write "same layout"; every prompt is complete on its own.
- Describe every element: position, size (% of canvas), hex, font style, lighting, props.
- Put all text in quotes and end with: **"Render only the text in quotes, spelled exactly"**.
- Full bleed: **"The design fills the entire canvas edge to edge. No borders, no frame, no white margins, no poster inside a poster"**.
- Labels: **"Copy each bottle exactly including every word on the label. Do not redraw, blur or invent label text"**.
- Say what not to include: no stars, no ratings, no extra logos, no watermark.

**Prompt template:**
```
[STYLE] Premium [format] Black Friday static ad for [product] by Blissta, a US supplement brand. Style: [...]
[CANVAS] fills entire canvas edge to edge. Full bleed. No borders, no frame, no white margins.
[REFERENCES] Use @img1 for [product]. Copy the bottle exactly including every word on the label...
[BACKGROUND] setting, surface, props, hex, light direction, depth of field, where it goes dark for text contrast
[HEADLINE] position, font style/weight, hex, size % of canvas. Text: "..."
[OFFER LINE] position, style, size. Text: "..."
[PRODUCT] how many, arrangement, surface, angle, which forward, reflections
[TAGS / BADGES] shape, hex, position, rotation. Text: "..."
[CTA + BOTTOM BAR] shape, gradient hex, size. Text: "..."
[LIGHTING] key, rim, highlights. Photographic, not illustrated.
[TEXT RULES] Render only the text in quotes, spelled exactly. No other words, logos, stars or watermark.
```

**Bad vs good prompt.**
- Lazy: "Black Friday ad for Corvael nattokinase, 73% off, premium, elderly couple".
- Good (one section): "5 Corbel bottles from @img1 standing in a gentle arc on a dark matte stone surface. Center bottle slightly larger and forward. Warm golden sunburst (#F2B24C fading to #C9731E) directly behind the center bottle with fine light rays. On bottles 4 and 5, a tilted gold sticker tag (#E2B24A), subtle 3D bevel, rotated 10 degrees, dark navy extra heavy italic text: "FREE""

**Slop list (don't):**
- Split layout, half stock photo / half text ("two ads glued together")
- Random AI couple in a kitchen
- Product tiny or labels cut off
- Every line the same weight
- Made-up prices or mismatched %
- A headline with no offer ("Keep Moving." is a brand ad)
- Off-brand colours (maroon)

**Good:**
- Starts from a proven winner with the pattern kept
- One clear order: **headline → offer → proof → product → button**, readable in 2 s
- Offer impossible to miss
- Real prices, real deadline
- Background talks to one sub-avatar

**Logic check:** MB is a liquid, so it can pour blue drops. Corbel, PainBloc and Aeon are capsules, so only capsules come out. "Liquid coming out of a capsule bottle is fake, and this buyer notices."

**Garbled labels:** regenerate once, then simplify the angle. Don't click generate 10 times.

**Send, in order:**
1. Winner link/screenshot + one-sentence breakdown.
2. 5 messages + visual brief. Wait for OK.
3. 5 finals named `Product_Concept_Variant` (e.g. `Corbel_BFEarly_C3`).
4. The exact prompt for each.

**The bar:** "if you saw it in your feed and you were 55 and had Corbel on your list, would you stop and click? If the answer is 'it's fine,' it's not done."

### 1C. Review / tracking (Static Production Tracker)
- "Blissta Static Production Tracker Database" is the system of record. **It holds credentials/PII (designer emails, WhatsApp numbers, a password-hash column), none of it copied here.**
- Structure only: each static task has Work/Due Date, Designer, Product, Concept #/Name, Variation #, Revision Version, Status (e.g. Completed), Output Link, Review Comment, Reviewer (e.g. Bruce), and Blocker fields.
- Notifications fire `awaiting_review` to admins on submit. Revisions are tracked as versions.
- A Creative Briefs sheet routes briefs (Static Designer, Static Variation count, Priority, Source Ad Reference).
- Example concept name on a static task: CORBEL concept 1 "THE BOTTLE WAS T…" (truncated).

Sources:
- 03_STATIC_PRODUCTION_SOP.md: https://drive.google.com/file/d/1Ma_yfi_oIYHNzs3MhfHIFLkEBOn2gD9F/view
- Blissta_Static_Ad_Designer_Brief.pdf: https://drive.google.com/file/d/1DMzgDAyzcrCE2Ibj25NEXTQngzQX9l87/view
- Blissta Static Production Tracker Database (sheet): https://docs.google.com/spreadsheets/d/1ZDyzywyOCeVG-22ciBSjIvLSkWYQKQjbYRgkZWOHUO0/edit

---

## 2. The standard: what every winner does, plus the laws

**Four things in every winner, every time** (repeated in the Static SOP, 01_WINNERS and the Concept SOP):
1. **Explicit absolution.** It wasn't him. Blame the bottle, the dose, the missing link or the measurement. "Never on him, and never on the ingredient he already believes in."
2. **Concession before the argument.** *Day one, nothing happens.* *Garlic is genuinely good for you.* "the only believable person is the one who tells you what will not happen."
3. **Something he can verify himself.** Free, immediate, no purchase (serving size, lot number, his own stairs, a sock line). Put it before the offer.
4. **The same short check set, said the same way every time,** "Until he repeats it back to his own doctor." (Corvael check set used in the natives: *Strain. Serving size. Units. Certificate.*)

**Laws (Static SOP §4):**
1. Under 10 words is the default, not the law. 3–7 words do the work in most winners. Go longer when length is the point (manifesto, confession, iPhone Notes, long comment). The test is whether he gets it in 2 seconds.
2. One message, one visual, one action.
3. Specificity beats generality. A named study with a patient count beats "studies show". *$60 → $8* beats "big discount".
4. Native beats polished (iPhone Notes screenshots, handwritten Sharpie, Reddit styling).
5. The visual amplifies and never competes. Show the actual thing: the label, the artery, the banana.
6. Lead with the benefit and brief with the problem: 3 words on the problem, the rest on the outcome.
7. One focal point. The eye locks in under 0.4 s.
8. His exact words, not yours (*So sick of them blaming everything on age.*).
9. Reframe before you sell.
10. "He will Google your claim while he's reading your ad."
11. If you're not sure, cut something.

**Worked example (SOP):** Concept = the two labels: ours at 20,000 FU vs a generic at 2,000 across three capsules. Same image, same background, three arguments:
- H1 reframe: *You weren't taking 2,000. You were taking 600.*
- H2 absolution: *It wasn't the enzyme. It was the dose.*
- H3 identity: *Turn the bottle over. Divide by three.*

**Buyer (Designer Brief):** 55+, mostly men, "skeptical as hell", has tried 100+ supplements, distrusts Big Pharma, researches on 20 sites.
- Checks every number ("One made-up price and he calls us scammers").
- Zooms in on labels.
- Loves early access / VIP.
- Hates hype.
- Does the math himself, so show prices, strikethroughs and per-bottle cost.
- "Never make him look old, sad or broken."

Sources:
- 03_STATIC_PRODUCTION_SOP.md: https://drive.google.com/file/d/1Ma_yfi_oIYHNzs3MhfHIFLkEBOn2gD9F/view
- 01_WINNERS.md: https://docs.google.com/document/d/1n_AhIW3DoOvbf4pIftM4Mip-7RGMrHut7EFQ7pvkuJg/edit
- 01_CONCEPT_AND_COPY_SOP.md: https://docs.google.com/document/d/1VYqv4ht2RVD7T_rlKGFEnHRN4vTRFTU79LFBGoxEUhE/edit
- Designer Brief PDF: https://drive.google.com/file/d/1DMzgDAyzcrCE2Ibj25NEXTQngzQX9l87/view

---

## 3. Winning statics (BLISSTA - WINNING ADS → IMAGE folders, "JULY IMAGES", uploaded Aug 12 2026)

**Read this before copying any of these:**
- **No ad in this folder has a stated reason for winning**, and the folder holds no metrics or copy. They are filed as winners, nothing more.
- Several were made before the Sep 14–30 rules and now **break current compliance**. Each one is marked ⚠.
- All images are 1:1 (526×526 px exports) except MB DROPS (4:5).
- Duplicates: NATTO 5, 10 and 18 are the same file.

Product naming on the images is **Corvael** (bottle: navy glass, black cap, gold "Corvael" serif wordmark, "THE VASCULAR PROTOCOL", "NATTOKINASE · Fibrinolytic Complex · 20,000 FU · NSK-SD", cream ingredient panel, "90 CAPS · 3 DAILY · 30-DAY SUPPLY", "EST. 2014/2024").
- Ingredient panel: Patented NSK-SD Nattokinase 20,000 FU · Berberine HCl (Glucose & Lipid Support) · Vitamin K2 (MK-7) (Arterial Calcium Clearance) · Aged Garlic Extract 600 mg · Magnesium Glycinate 200 mg.
- The newer briefs (Sep 30 →) and Oct files use **Corbel**. FACTS lists "Corvael or Corbel?" as unsettled.

### Corvael / Nattokinase (24 files)
Images 1–15 run 1.1–1.15 in order. 1.16 groups the four near-identical product-only label shots, and 1.17–1.23 continue with the later numbers.

**1.1 NATTO 1: product hero.** Bottle-only packshot with full label. Top line "CARDIOVASCULAR HEALTH SUPPLEMENT · BLISSTA". No headline. Use: label/product reference. https://drive.google.com/file/d/1EacaKveGsN2rGHjadSpUp6QBYkObh0rQ/view

**1.2 NATTO 2: fake "subscriber alert" email.**
- Layout: red top bar "⚠ CONSUMERLAB SUBSCRIBER ALERT ⚠". Huge navy condensed serif headline **"CONSUMERLAB REMOVED 3 NATTOKINASE BRANDS FROM THEIR LIST. FROM THEIR LIST."**, with red italic sub **"November 2025. Subscribers got the notice. Public still doesn't know."**
- Below that, an email-screenshot card ("From: ConsumerLab · Subject: Nattokinase Recommendation Update · November 22, 2025… removed from our approved list due to label-claim discrepancies… B-04 B-06 B-07"), with yellow highlighter on "removed from our approved list" and a red handwritten note "subscription-only · public delayed".
- Footer: "Read the full report →" · "Cardiovascular Archive · ConsumerLab cited."
- No product shown. Angle: insider / hidden-info / label fraud.
- ⚠ Fabricated third-party communication. It breaks "Never invent a study / quote", "Never fabricate a named person at a named company" and the conspiracy-word rule ("Public still doesn't know"). Reuse the device (email screenshot + highlighter) only, with true content.
- https://drive.google.com/file/d/1s_afpdwtR1uJFPpNaT7MfAjS8Vae52O9/view

**1.3 NATTO 3: two-column protocol comparison.**
- Dark green background, kicker "THE CARDIOVASCULAR ARCHIVE · MAHA PROTOCOL AUDIT". Headline **"MERCOLA vs McCULLOUGH / CARDIOVASCULAR PROTOCOLS. COMPARED."**, gold italic sub **"Two of the most-trusted MAHA voices. We audited both stacks."**
- Left column "DR. MERCOLA · CARDIO STACK" (Aged Garlic, Berberine, CoQ10, Vit K2, Fish Oil, as icon cards). Right column "DR. McCULLOUGH · CARDIO STACK" (Bromelain, Curcumin, Selenium, Nattokinase, Vit D). Bottle in the centre, callout "ALL 5 IN ONE CAPSULE", green ticks, garbled text "ALL LORENCRLODIEUM". CTA "Read the protocol audit →".
- Angle: authority comparison / stack consolidation ("all 5 in one").
- ⚠ Names real public figures as the hook. Compliance bans celebrity/public-figure names in Meta primary text and as hero, and FACTS says no persona resembling a real figure. Also has garbled AI text, which the Designer Brief says kills the ad.
- https://drive.google.com/file/d/1A6A86W_PlOMUFnaXDp2rzaukv9uZ4h_l/view

**1.4 NATTO 4: native "evidence" photo.** No text. Phone-snapshot close-up of an old man's hand (age spots, terry wristband) resting on a worn burgundy recliner arm, TV remote and crumbs beside it. Pure native image ("evidence, not illustration"), used as a background or native creative. https://drive.google.com/file/d/1zmy8OdXG4Nlq7YsTOBTmMc7NxOmbQTgj/view

**1.5 NATTO 5 (= NATTO 10 = NATTO 18): "doctor" reframe.**
- Cream heritage background. Big dark-brown serif headline **"HE BROUGHT IT TO HIS CARDIOLOGIST."**
- Bottle centred on a clipboard with handwritten notes and a fountain pen on a navy desk, warm window light. Footer strip **"CORVAEL · BRING IT TO YOUR DOCTOR"**.
- Angle: safety-as-proof / "in addition to, not instead of", in line with the compliance "take it to your prescriber" frame. Minimal density.
- Note: the rule "Never say 'talk to your doctor'" is about that exact phrase. "Bring it to your doctor" is the narrator-voice variant.
- https://drive.google.com/file/d/15JS9PPFP77cXB0gYsiNSEdnsDbjmrkmA/view

**1.6 NATTO 6: product hero** (same as 1.1, "EST. 2014"). https://drive.google.com/file/d/1MG5cVAkAcNa1X0guAhK43HbMjgCPebDI/view

**1.7 NATTO 7: product hero** (label crop, OCR only). https://drive.google.com/file/d/1Zdv3SErSAtXZuljeueG5HUedgZG5SOd3/view

**1.8 NATTO 8: before/after body split.**
- Black background, bottle large in the centre. Left: glowing blue human figure, label **"BEFORE"**, red hotspots in the vessels. Right: glowing orange/red figure, label **"SUPPORTED"**.
- No headline. Angle: mechanism / transformation.
- ⚠ Implied result visual. Keep "supported" wording only.
- https://drive.google.com/file/d/1ijWMEM5b5XjAJ7ApyPN0DmYxEsQ_xHFt/view

**1.9 NATTO 9: label forensic.**
- White background. Bold black sans headline **"THE LABEL LIED."**, sub **"Only that strong the day they made it."**
- Macro photo of fine print with the phrase **"at time of manufacture."** circled in red marker. Small bottle bottom-right, caption **"Check yours for the fine print."**
- Angle: absolution (blame the label) + self-verification. Clean clinical system. Good template.
- https://drive.google.com/file/d/1C7Axta2nwoTLwT-BkxKKUtMTBzXHdKD-/view

**1.10 NATTO 10:** duplicate of 1.5. https://drive.google.com/file/d/1ZqEWwpMv3FLUe6MPmw159J4-1SVNfI_4/view

**1.11 NATTO 11: Day 1 / Day 90 artery split.**
- Black background, bottle centred. Left: cut-away artery narrowed with yellow plaque and red cells, label **"DAY 1"**. Right: clean open artery, label **"DAY 90"**.
- ⚠ Breaks current rules: "No red, no blood, no gore in artery renders", "unclogs arteries" (hard no), and the overclaim on speed/size of result. Don't reuse as is.
- https://drive.google.com/file/d/11TOXauvA0AbtulpwsEci-raGrk8Ng68g/view

**1.12 NATTO 12: price card, 3 bottles.**
- White background, spaced caps headline **"3-MONTH SUPPLY"**. Three bottles in a row, big serif **"$79"**. Footer bar **"MADE IN USA · GMP CERTIFIED · 60-DAY MBG"**.
- Angle: offer / retargeting.
- ⚠ "MADE IN USA" is now banned (FACTS rule 3; Designer Brief "No 'Made in USA' on Corbel"). The price must be re-checked on the live page.
- https://drive.google.com/file/d/1StrWqOugNI5lbZhVTHIQy8-R3RN_56nG/view

**1.13 NATTO 13: B3G2 offer.**
- Black background with amber glow, 5 bottles fanned with the centre bottle forward, kraft hang-tag **"ENDS SUNDAY"**.
- Headline (white heavy condensed, gold numerals) **"BUY 3, GET 2 FREE. THIS WEEK ONLY."**, italic sub **"Five bottles of the vascular stack, $97.99. 61% off ends Sunday."**, gold pill CTA **"BUY 3 GET 2 FREE · 61% OFF"**.
- Angle: offer + deadline. Heavy density. Strong template for hot traffic.
- https://drive.google.com/file/d/1Odzg-MLdQIKJT8VtOyPpyUJ-0B4coVhW/view

**1.14 NATTO 14: protocol framing.**
- Dark navy/gold, 5 bottles fanned. Cream serif headline **"THE 90-DAY VASCULAR PROTOCOL."**
- Gold footer bar: **"5 FOR THE PRICE OF 3 · FREE SHIPPING · MONEY-BACK GUARANTEE"**.
- Angle: identity / premium protocol. Medium density.
- https://drive.google.com/file/d/19fXPd-OsBWA28xQ_FDRkBJKqnYXRo_PW/view

**1.15 NATTO 15: ritual / dosing.**
- Navy background. Big cream serif **"ONE CAPSULE. EVERY NIGHT."** Macro photo of a weathered palm holding one navy capsule, bottle inset top-right, footer **"CORVAEL · 3 DAILY"**.
- ⚠ Internal contradiction: the headline says one capsule, the footer and label say 3 daily, and the natives say "the serving is two capsules". Exactly the inconsistency the buyer catches.
- https://drive.google.com/file/d/1mxntNLs1Nqw84DEDAM3KTYALiojwJBiL/view

**1.16 NATTO 1 / 6 / 7 / 24:** product-only label shots, no headline. NATTO 24 is the bottle with the "90 CAPS · 3 DAILY · 30-DAY SUPPLY" label (read via OCR only). https://drive.google.com/file/d/1lLUlNSNsJX9UPR-GVjhDdufdVwcY4GVX/view

**1.17 NATTO 16: raw scan.**
- No text. Greyscale CT cross-section of a calcified vessel ring with a red arrow pointing at the calcification. Native/clinical evidence image (pairs with a K2 / calcium headline).
- ⚠ Must be a licensed/own image. Real medical imagery reads as authority.
- https://drive.google.com/file/d/1zp1x5sfRg5Ns8JEoV3MuVS37zN9BVSnL/view

**1.18 NATTO 17: price-led offer.**
- Same scene as 1.13 (5 bottles, amber glow, "ENDS SUNDAY" tag). Headline **"THIS WEEK ONLY: 5 BOTTLES, $87.99."** (price in gold), italic sub **"The 20,000 FU NSK-SD stack at $17.60 a bottle, before the sale's gone Sunday."**, gold pill **"SAVE 71% · ENDS SUNDAY"**.
- Angle: the math (per-bottle price).
- https://drive.google.com/file/d/1a-_KF0P-dii1IvRok2ojpnN8JePiisuw/view

**1.19 NATTO 18:** duplicate of 1.5. https://drive.google.com/file/d/14QflxYO3JGYNnGLVzotvg5ZTZZuYU2rC/view

**1.20 NATTO 19: "5 reasons" grid.**
- Cream heritage, dark brown serif headline **"If Your BP Won't Drop, Here Are 5 Reasons Why."**, italic sub **"All 5 in one capsule. Corvael."**
- 2×2 + 1 card grid with line icons:
  - **"Nattokinase 20,000 FU / Clears fibrin building in arteries every night."**
  - **"Berberine 500mg / Lowers LDL like a statin, without the muscle pain."**
  - **"K2 MK-7 200mcg / Routes calcium out of artery walls into your bones."**
  - **"Aged Garlic 600mg / Slows plaque progression (Kyolic 6-year data)."**
  - **"Magnesium Glycinate 200mg / Relaxes artery walls, supports healthy BP."**
- Bottle in the last cell, "All 5 in One Capsule." Footer **"5 BOTTLES FOR THE PRICE OF 3 · 60-DAY MONEY-BACK GUARANTEE."**
- Angle: failed-user ("SIX WEEKS" door) + five-link chain mechanism.
- ⚠ "Lowers LDL like a statin" is a compared-to-drug claim (Corvael hard no: "the natural statin", "lowers your cholesterol"). FACTS also says avoid condition names in static headlines. Rework the claims to "supports".
- https://drive.google.com/file/d/1hyVdgLYHVyJP17ttAYC1Y59JMEQ2uaV5/view

**1.21 NATTO 20: itemized receipt math.**
- Cream background, heavy brown serif headline **"WHAT FIVE SEPARATE BOTTLES COST YOU."**
- Left: struck-through list "Nattokinase $39 · K2 $19 · Berberine $24 · Aged Garlic $22 · Magnesium $18" = **"$122"**. Right: bottle with a gold starburst **"$97 → $49"**.
- Gold footer **"5 FOR THE PRICE OF 3 · FREE SHIPPING · MONEY-BACK GUARANTEE"**.
- Angle: stack consolidation + the math (the Designer Brief's "itemized receipt, the math sells").
- ⚠ The anchors ($39/$19/…, $97) must be real prices or they are "invented anchors".
- https://drive.google.com/file/d/1pGsClzujT-dMAuEFI23WSMUStRfEqODA/view

**1.22 NATTO 21: lab audit table.**
- Light grey/white background, kicker **"INDEPENDENT LABORATORY AUDIT · NOVEMBER 2025"**, navy headline **"Independent Lab Tested 8 Nattokinase Brands. Only 5 Passed."**
- Torn-paper "ConsumerLab" audit table (Brand Name / Potency / Pass×5 highlighted yellow, Fail×3 red), red stamp **"3 of 8 FAILED"**, handwritten "PMID 3478223 · Sumi 1987", CTA pill "Read the full audit →", bottle bottom-right.
- Bottom row of offer chips (rendered with garbage text "slap chip", "$10 OFF", "FREE SHIP", "BUNDLES", "Subscribe & Save").
- ⚠ Fabricated third-party data with a real org's branding, plus garbled chips.
- https://drive.google.com/file/d/1hdSpM2XQfa9DFYoa4ubk_xUKC4tWC7Wo/view

**1.23 NATTO 22: "exclusive investigation" table.**
- Red top bar **"EXCLUSIVE INVESTIGATION · NOVEMBER 2025"**. Huge navy serif **"INDEPENDENT LAB TESTED 8 NATTOKINASE BRANDS. 3 FAILED."**, red sub **"ConsumerLab Nov 2025. One brand delivered less than half its label."**
- Table "Brand · Labeled FU · Actual FU" with garbled AI numbers, a yellow-highlighted "Brand O · under 50%", red script **"verified by Dr. Tod Cooperman"**, bottle right.
- Red bottom bar **"✓ BUY 2 GET 1 FREE · ✓ 60-DAY MBG · ✓ MADE IN USA · ✓ GMP CERTIFIED"**.
- ⚠ Multiple hard breaks: a fabricated endorsement by a named real person at a named company, an invented study, "MADE IN USA", and garbled numbers. **Do not replicate.**
- https://drive.google.com/file/d/1CKkUZWk1Gc84ZiIyiV5Z528SxDA1XCOS/view

**1.24 NATTO 23: K2 objection + price stack** (top of the canvas is cropped; headline visible as "…BIG NUMBER, NO K2?").
- White background, maroon sub **"Clear the fibrin without routing the calcium and it walks back in."**
- Price block **"AS LOW AS ~~$39.99~~ $19.60/BOTTLE"**, small **"Buy 3, Get 2 Free · prices return to normal soon"**.
- Four maroon checklist pills: **"Five actives, one chain" / "K2 routes calcium toward bone" / "NSK-SD strain named on the label" / "60-day, we buy it back"**. Large bottle right with a drop shadow.
- Angle: comparison / kill the objection + criteria list.
- ⚠ Cropped/overflowing canvas, which breaks the full-bleed and framing rules.
- https://drive.google.com/file/d/1IKtJYPrNESH8ZxUchNjRwnv2D2TfFMCI/view

### PainBloc (PEA): 3 files
**PEA 1: "How it works" steps.**
- Cream background, heavy serif headline **"HOW PEA WORKS (AND WHY ITALIAN DOCTORS USE IT)."**
- Gold-check numbered list:
  - **"Step 1: Calms overactive immune cells at the nerve"**
  - **"Step 2: Reduces mast cell inflammation"**
  - **"Step 3: Restores natural PEA your body stopped making"**
  - **"Step 4: Nerve function returns (60 days average)"**
  - **"Step 5: Pain scores drop (75 → 52 in published study)"**
  - **"Step 6: No dependency. Stop anytime."**
- Bottle right ("BLISSTA · PAINBLOC · PEA 1200MG · Palmitoylethanolamide Micronized · WHOLE BODY COMFORT").
- Footer: **"🇮🇹 22 years of Italian clinical use · 21,000+ patients · ★★★★★ 7,400+ verified · Subscribe & Save 25% · 120-Day Guarantee"**.
- Angle: mechanism + European authority (approved framing: "Widely used by Italian pain specialists for twenty years"; 75→52 = Schweiger 2019 VAS 75.8 → 52.5).
- ⚠ Star rating (Designer Brief: no stars or ratings), "120-Day Guarantee" (FACTS: 60 days), "1200MG" (FACTS: 600 mg per serving), "21,000+ patients" (not in the approved numbers; compliance says ~6,000 patients across 30+ trials), and "Nerve function returns" (overclaim).
- https://drive.google.com/file/d/1ArPtThJtVGFVI1wNjQuMFmcTYvqk67lt/view

**PEA 2: absorption split.**
- Light background, black heavy sans headline **"MOST PEA NEVER MAKES IT THROUGH."**, italic sub **"Particles too big to cross your gut. No luteolin to reach your spine."**
- Vertical split photo: big grey rocks hitting a membrane (left) vs fine golden particles passing through (right).
- Spec row "1200mg TRIALS PEA · 120mg MICRONIZED · 120mg LUTEOLIN · 200mg … · For 3x ABSORPTION · 600+ CLINICAL" (partly garbled). Footer **"The dose the trials ran"**. Bottle bottom-right.
- Angle: absolution (blame the particle size / dose) + mechanism as one image. Good template.
- https://drive.google.com/file/d/188oAB_jyec-o19Ho0p36bWFCVorbGxZZ/view

**PEA 3:** OCR returned no text (image-only creative). Not visually inspected. https://drive.google.com/file/d/1HvTehkqHbb4mNSZtLVPufsLgq24MfZ40/view

### MB Gummies (Ultra Blue Gummies): 3 files
**GUMMIES 1: strikethrough price, gift angle.**
- Dark brown background. Giant **"~~$49.99~~ $17"** (grey strikethrough vs cream), white caps headline **"$49.99 A BAG. OR $17 WHEN YOU STOCK DAD UP."**, sub **"under a dollar a day, 120-day money back"**.
- 5 navy/gold pouches fanned. Bottom bar **"✓ Buy 5 Get 3 Free ✓ 120-day money-back"** (with a stray "Chip (bottom 8%)" prompt artifact rendered as text).
- Angle: offer + gift-buyer sub-avatar ("stock Dad up").
- ⚠ Pouch shows "Sugar Free" and "MADE IN UTAH" (banned unless lifted per batch; the MB-gummy geography lift on 27 Aug 2026 was batch-specific). The 120-day guarantee conflicts with FACTS' 60.
- https://drive.google.com/file/d/13Cbb6Kqt8NLm9kcv3YoG6WkVj5vuwrNq/view

**GUMMIES 2** (OCR only):
- Headline **"You paid for MB. You got candy."** Pouch "ULTRA BLUE GUMMIES · USP PHARMACEUTICAL GRADE · 14mg MB Per Gummy · Vitamin C · Sugar Free · 30 Daily Packs · 60 Gummies Total". Footer "BUY 3 GET 2 FREE · 120-DAY GUARANTEE · MADE IN UTAH".
- Angle: absolution / villain = weak competitor gummies.
- ⚠ "Sugar Free", "MADE IN UTAH", 120-day.
- https://drive.google.com/file/d/1pyKF0GVbyBFvbBX7_tjm-lW-qM8AhWzl/view

**GUMMIES 3** (OCR only):
- Headline **"THE 14MG GUMMY THAT FINALLY DID SOMETHING"** + callout **"everyone else is 5mg"**. Checks "✓ 14mg real MB ✓ 120-day money-back".
- Angle: comparison / dose.
- ⚠ 14 mg must be confirmed (FACTS: MB gummies per serving "CONFIRM ON LABEL").
- https://drive.google.com/file/d/1ykH9MReKETQRF_JrgmHI6b2v0CSXDtRO/view

### Methylene Blue drops: 1 file (4:5)
**MB DROPS 1.**
- Dark wood/black background, 5 amber dropper bottles stacked in a pyramid (label "Blissta · Pharmaceutical Grade · METHYLENE BLUE 1% · 10 MG / 1ML · Formaldehyde free · Alcohol free").
- Orange kicker **"THE ADDERALL ALTERNATIVE"**, huge white/orange condensed headline **"50% OFF FOR LIFE"**, icon list **"FAST SHIPPING / FREE GIFT INCLUDED / QUALITY GUARANTEED"**, white circle price badge "~~$$39.99~~ $$19.99" (doubled $ is an AI typo).
- Angle: drug-comparison + subscription offer.
- ⚠ "THE ADDERALL ALTERNATIVE" names a prescription drug and implies replacement (both banned). The price typo would get it called a scam.
- Separately, 01_WINNERS reports **"Static on MB: 0.72x vs 0.92x for video"**, so MB statics underperform.
- https://drive.google.com/file/d/1I2N7THtrebcq4vJJyKIvNVVbj29r2BMK/view

### Patterns across the winning statics (designer's read)
- **Formats that recur:**
  - Big-type headline over a product hero (navy bottle, dark or amber background)
  - 5-bottle fan with an "ENDS SUNDAY" kraft tag and gold pill CTA (offer)
  - Cream heritage with a serif headline (trust/mechanism)
  - Label forensic (circled fine print)
  - Split / before-after
  - Checklist / grid of 5 ingredients
  - Itemized receipt with strikethroughs
  - Fake-document "alert/audit" (screenshot, highlighter, handwritten note). This one is now non-compliant as made.
  - No-text native evidence photos (aged hand, CT scan)
- **Typography:** heavy condensed sans (offer ads) or heavy serif (heritage/trust), ALL CAPS, 2 lines. The italic serif subline carries the specifics (price, per-bottle, deadline). Footer bar = offer stack + guarantee.
- **Product placement:** centre-forward on offer ads, bottom-right inset on proof ads (label forensic, audit, PEA), absent on native evidence images.
- **Offer stacks used:** B3G2 ("5 FOR THE PRICE OF 3"), per-bottle price, % off, "ENDS SUNDAY", free shipping, money-back guarantee.

Sources:
- BLISSTA - WINNING ADS folder: https://drive.google.com/drive/folders/1p5usNh08TmXuQ0uMOdlyxCDMlQTlC_XZ
- NATTOKINASE/IMAGES/JULY IMAGES: https://drive.google.com/drive/folders/1SxyyqzNCZy4-7G1hly2SYeRo8ZDBD5rk
- PEA PAINBLOC/IMAGE/JULY - IMAGES: https://drive.google.com/drive/folders/1qxMB_RmpQgkeMTgpMFZa92JJQ31_7XpQ
- MB GUMMIES/IMAGE/JULY - IMAGES: https://drive.google.com/drive/folders/1sWy1FjmU0OjF8lZk3WT3oJhUAuKhM6Nz
- MB DROPS/IMAGE: https://drive.google.com/drive/folders/1OZHxdJRtSU7we-hehJ5kYBZ_V47rdmsv
- 01_WINNERS.md (MB static ROAS): https://docs.google.com/document/d/1n_AhIW3DoOvbf4pIftM4Mip-7RGMrHut7EFQ7pvkuJg/edit

---

## 4. Headline / copy / CTA patterns that won, and the killers

### Winning lines, verbatim (with source)
**From the account's proven winners (01_WINNERS, mostly video but the lines port to statics):**
- *"This one is fake." … "Chinese soybean dust. They call it nattokinase. Your wife paid forty dollars for it."* (SUMO WRESTLER, Corvael: hook 51%, hold 45%, CTR 8%, CPA $40–50, $10k/day). "Our highest performing hook contains 'Your wife paid forty dollars for it.'"
  - ⚠ The "Chinese" origin framing now collides with the geography rules and the fact that product ships from Dongguan (compliance doc).
- *"I'm a pain nurse. This is what I use instead of gabapentin."* (PAIN NURSE, PainBloc: CTR 5%, CPC $0.65).
  - ⚠ "instead of gabapentin" is now a hard no (replaces a drug).
- *"Your MB is from China. All of it."* (CHINESE CONTAMINATION, MB: $4M+ profitable spend). Why it works: names the enemy, gives a free self-test ("glass of water, blue pee at 14 hours"), and absolves ("You weren't lazy, you were sold fish tank cleaner"). "it scaled through format variations on ONE angle, not through fifty new angles."
- *"Six weeks on nattokinase and your BP didn't drop. That's the tell. It wasn't your body."* (SIX WEEKS, Corvael, "Absolutely crushing," 2 Sep 2026). Door = the failed user.
- Unbuilt winner idea: the wife version of Sumo ("the wife buys it and hands it to him").

**Static SOP examples:** *You weren't taking 2,000. You were taking 600.* / *It wasn't the enzyme. It was the dose.* / *Turn the bottle over. Divide by three.*

**Designer Brief headline angles (offer statics):**
- Call out the offer: **"BLACK FRIDAY CAME EARLY."** / **"SAVE $94.97"**
- The math: **"$15.68 A BOTTLE."** / **"4 FORMULAS. 1 BOX. $119.99."**
- Call out the avatar: **"OVER 50? STOCK UP NOW."**
- Kill the objection: **"SAME CORBEL. 73% LESS."**
- The insider: **"WE'D RATHER PAY YOU THAN FACEBOOK."**
- The stack: **"BUILD YOUR LONGEVITY STACK"** / **"YOUR WHOLE BODY. ONE BOX."**
- Urgency (real only): **"ENDS OCT 14 · MIDNIGHT"**, "Price goes back up Oct 15", "Only 77 boxes left" (only because Shopify showed 77).

**From the winning images (§3):** "THE LABEL LIED." / "Only that strong the day they made it." / "Check yours for the fine print." / "HE BROUGHT IT TO HIS CARDIOLOGIST." / "BUY 3, GET 2 FREE. THIS WEEK ONLY." / "THIS WEEK ONLY: 5 BOTTLES, $87.99." / "THE 90-DAY VASCULAR PROTOCOL." / "WHAT FIVE SEPARATE BOTTLES COST YOU." / "If Your BP Won't Drop, Here Are 5 Reasons Why." / "MOST PEA NEVER MAKES IT THROUGH." / "You paid for MB. You got candy." / "THE 14MG GUMMY THAT FINALLY DID SOMETHING" / "$49.99 A BAG. OR $17 WHEN YOU STOCK DAD UP."

### Copy rules from the Concept & Copy SOP
- New concept = "a new door into a proven angle", not a new idea.
- Owned mechanisms:
  - **Fibrin decline**
  - **The five-link chain** ("five ingredients, five jobs, break one and it stops"). "We created it… we are the first."
- Don't say **"Clogged arteries." "Thick, sluggish blood."** (the audience is hardened to them).
- Sophistication: the category is at level 3 (a mechanism), and we write at **level 4** (an unnamed mechanism, or a new way into a known one). Level 5 = identity.
- Hooks: write **6 hooks = 6 different people walking in**.
  - Never repeat a construction.
  - Every hook has a specific (number, name, date, scene). No pronoun without a referent.
  - Scenes beat statements.
  - "If a rattled 60-year-old wouldn't say it, cut it."
- Anti-repetition gate: MECHANISM / PERSONA / STORY / REGISTER. If two concepts share 2 of the 4, change one. Max 5 full concepts per session.
- Formats in rotation: talking head, street interview, AI animation, Suno song, VO + B-roll, **native iPhone Notes, comment-reply, split comparison**. "Format is chosen LAST."

### Lessons from losers that apply to statics (01_WINNERS)
- The 33-ad batch all named "NATTO-NATTO-images - Copy". One ate 70% of budget and attribution was impossible. **Name every asset by avatar and sub-avatar.**
- **Never use a BP number under 150 as "the problem."** ("140 is perfectly fine for a top number.")
- If a before number is shown, explain the absent after number on screen or it reads as hiding.
- "The audience believes natto is for arteries. Lead with fibrin, not pressure."
- The Tier List ad stated the guarantee 3 different ways (120/60/30 days) and a customer called it out. **One guarantee number everywhere.**
- Zone 1–2 soft hooks get a 17–30% hook rate.
- Practitioner voice fails in cold prospecting (warm/retargeting only).
- MB: statics 0.72x vs video 0.92x. Female 0.77x vs male 0.93x. 18–24 0.48x (exclude).

### The killers (any one and it does not ship; Static SOP §5)
1. Can't tell what it says in 2 s
2. Two focal points
3. The visual doesn't match the headline
4. Marketer language instead of his
5. A claim with no number, name or date
6. A number not in BLISSTA_FACTS.md
7. Low contrast (grey on grey, thin fonts, script fonts)
8. Three benefits instead of one message
9. It looks like an ad
10. Heavy fear with no way out
11. A background outside the 3 systems, unjustified
12. Stock photography any brand could own
13. Three hooks with the same trigger
14. A disease or medication-replacement claim
15. Country-of-origin language while that decision is open

### Designer Brief pre-send checklist
- Started from a proven winner, and the why is stated in 1 sentence
- Messages approved before generating
- Full bleed (no white bars, double background, poster-in-poster)
- Aspect ratio set in Magnific
- Every label readable and matching the real bottle
- Every price and % matches the offer table
- Biggest bundle pushed
- No Trustpilot / fake stars / "Made in USA" on Corbel
- Nothing physically fake (liquid from capsule bottles, wrong product version)
- Headline readable in 2 s on a phone
- Offer impossible to miss
- Navy, gold, white (unless the winner used otherwise)

### Offer rules and prices (Designer Brief, Sep 30, BF/VIP period; "Prices change. Confirm with me before a new batch.")

| Offer | Numbers |
|---|---|
| Longevity Box (MB, Corbel, PainBloc, Aeon) | $214.96 separately → $119.99 with BFVIP20. Save $94.97. 44% off. $30 a bottle. Only 77 left. One-time, no subscription |
| Corbel 5 bottles | Buy 3, Get 2 Free. $78.39 VIP. $15.68 a bottle. Ends Oct 14 midnight |
| Single prices | Methylene Blue $59.99 · Corbel $44.99 · PainBloc $59.99 · Aeon $49.99 |
| Site-wide VIP | Up to 73% off (5-bottle bundles with BFVIP20 + WELCOME10) |

Rules:
- Always push the biggest bundle.
- Don't put "73% off" on the box (the box math is 44%; use "Save $94.97" or "44% off").
- No Trustpilot badges or ratings until the score is fixed.
- No "Made in USA" on Corbel.
- No invented anchors (no "$249 → $78.39" unless $249 is real).
- Keep % consistent across ads.

The FACTS offer structure: tiers Starter 1 bottle/30d · Most Popular 3/90d (centre, gold badge, default) · Best Value 5–6/150d. Always show day-supply framing, daily cost and % saved. Subscription on by default, ~25% off entry tier. **Guarantee 60 days, every SKU, "Keep the bottle."**

⚠ **Number conflicts to resolve with Hemant before using any of these:**
- Guarantee: FACTS 60 days. Older statics say 120-day (PEA, Gummies). Natives say 90-day.
- PEA dose: FACTS 600 mg/serving vs static label 1200MG.
- Corvael serving: FACTS 20,000 FU per serving. Natives: serving = 2 capsules, 60 caps. Statics: "90 CAPS · 3 DAILY" and "ONE CAPSULE. EVERY NIGHT."
- Discount figures across the winning statics: 61% / 71% / 73%, and $78.39 / $87.99 / $97.99 for 5 bottles.

Sources:
- 01_WINNERS.md: https://docs.google.com/document/d/1n_AhIW3DoOvbf4pIftM4Mip-7RGMrHut7EFQ7pvkuJg/edit
- 01_CONCEPT_AND_COPY_SOP.md: https://docs.google.com/document/d/1VYqv4ht2RVD7T_rlKGFEnHRN4vTRFTU79LFBGoxEUhE/edit
- 03_STATIC_PRODUCTION_SOP.md: https://drive.google.com/file/d/1Ma_yfi_oIYHNzs3MhfHIFLkEBOn2gD9F/view
- Designer Brief PDF: https://drive.google.com/file/d/1DMzgDAyzcrCE2Ibj25NEXTQngzQX9l87/view
- 00_BLISSTA_FACTS.md: https://drive.google.com/file/d/1tOi6lgWpHPMYUWBciqZSUnSDZHfzj3Oh/view

---

## 5. Native ads (advertorial-style): rules and winning examples

**Scope note:** the Static SOP explicitly excludes natives. Natives are governed by UNIVERSAL_NATIVE_BRIEF_V4. These are long-form first-person Facebook posts that run on **persona pages, not the brand page**, with native evidence photos.

**Process (6 stages, 4 stops):**
1. Find winners (STOP 1: the operator picks)
2. Tear down (STOP 2: approve the port plan)
3. Write the 1:1
4. Write the variation (STOP 3)
5. Visuals (STOP 4)

"You are ripping the machine, not the message": their structure, pacing, beat order and devices are fair game. Their claims, mechanism and product are not.

**Finding winners:** shop view → Top 10 Active. Read days running, rank position, trend arrow, duplicate count.
- "Fresh and rising is the target." A 3-day-old ad near the top with a rising arrow = a brand pouring money in. A 100-day-old ad with a falling arrow = a finished control.
- The dollar column is EU/UK transparency data only. US ads show $0, so don't read it as budget.
- Rank is page-relative.
- Search by **landing-page domain**, not brand name, to find the persona pages.

**Facts block first.** Mechanism skeleton: something goes wrong → the body responds correctly → the response should stop → a signal should end it → the signal stops arriving → the response continues → everything given treats the symptom. State dose with its unit basis (per serving / capsule / gram). Missing numbers get bracketed and flagged, never invented.

**Teardown extracts:** voice, micro-moment, leading belief, enemy, **the dismissal** (the one sentence indicted: "She's just getting older." "That's the trade." "You are managed." "It says here you have been non-compliant."), villain, metaphor, messenger, awareness, format, beat map, and 3–5 structural moves quoted verbatim.

**Seven engines:**
1. Spreadsheet
2. Two clinicians
3. Outsider
4. Witness
5. Bereaved expert
6. Deadline
7. Professional insider, in three variants: **7a Refuser** (administers it daily, won't take it), **7b Gagged insider**, **7c Converted expert**. The credential is also the indictment.

**1:1 rules:** same beat count, order and length band (within ~20%), same devices. Never port their mechanism, claims, proof numbers, or any device needing a claim we can't make.

**Five must-haves:** ABSOLUTION · MECHANISM · GRAVEYARD (everything tried, each with why it failed) · PROOF (found by the narrator) · SAFETY (in the narrator's voice, never a disclaimer; at least twice).

**Five portable devices:**
1. Cheap version fails first
2. **Criteria list as the pivot** (the product is never introduced, it just satisfies the list)
3. **Label forensic** (turn it over, do the division)
4. Blamed ladder (blamed the glasses / the stairs / being 66… "not one of them was")
5. **Postscript ladder** (4–6 P.S., each a different proof type: guarantee, diary, others' results, scarcity/offer, and one aimed at the spouse)

**Other rules:**
- Concede against interest at least 3 times, each next to the claim it buys.
- Voice: first person, uneven sentences, **no em dashes**, no announced transitions ("here's the thing"), class-specific vocabulary.
- **Variation:** output a fork line, "PRIMARY [sub-avatar] driven by [engine] / FORK [different sub-avatar] driven by [different engine]". Same length, different life (sufferer → watcher, warned → not warned in time, etc.). Persona rotation: if 3 of the last 4 narrators hold a credential, the next does not. The strongest variation answers the 1:1 (letter → reply).

**Native visuals: 6 per concept pair, 6 different categories:** forensic macro, wide exterior, paper and time, institutional interior, empty place, domestic reveal.
- Delete on sight: anything a brand would shoot, **text on the image, the product in frame**, a face to camera (unless chosen), and anything self-explanatory.
- "It is evidence, not illustration." Examples: wear on a handrail, a bottle two-thirds full in a dusty cabinet, an unbroken run of ticks in a pocket diary.
- Hard to render: aged hands, older faces, legible handwriting, screens, exact counts. "Marks generate where words do not."
- Keep a running log of rooms, objects, body parts and categories used.
- Prompt = one paragraph: vantage point and who holds the camera, light source, specific objects/wear/age, what's not in frame, aspect ratio.

**Audit:** a separate adversarial pass using only the source ad + facts block. It checks facts, compliance, structure, voice, variation, visuals and session limits.

**When their best move breaks our rules, invert the beat rather than dropping it:**
- "doesn't interfere with your prescription" → the narrator raises the interaction unprompted.
- named farm/region → strain, assay, certificate, lab.
- "feel it in 17 minutes" → "the check moves off the body and onto the label. Four minutes. Turn it over."
- "A COMPLIANCE CONSTRAINT IS OFTEN THE BETTER CREATIVE CHOICE."

**Corvael natives written to this brief (the copy to imitate):**

**NATIVE 03 (1:1, Engine 7a Refuser, pharmacist "Sheila M., RPh").**
- Opening: **"I fill 212 blood thinner prescriptions a week. I have never filled my own. Let me tell you what is not on any shelf in my store."**
- Metaphor: the pharmacy back stock room ("Nothing on any report was ever measuring the aisle."). Line: "Fibrin is not the enemy. Fibrin is repair."
- Label forensic: Chen 2022, *Frontiers in Cardiovascular Medicine*, 1,062 people, "3,600 units a day, is ineffective"; 20,000 "per gram" = 2,000 per 100 mg capsule; 6 of 11 brands.
- 5-point criteria list:
  - strain named (NSK SD)
  - units per serving, with the serving size on the front
  - a gettable COA
  - heavy metals on the COA
  - sold direct, not on marketplaces
- Product: 20,000 units per serving = 2 capsules, 60 caps / 30 servings.
- Check set: **"Four minutes. Strain. Serving size. Units. Certificate."**
- 6 P.S.: anti-medication rebuttal, prescriber-first, wife/brother-in-law (bottle by the coffee maker), 90-day guarantee, "not on the marketplaces… up to 71 percent off… free gift worth $251", Wendell at 7:06.
- https://drive.google.com/file/d/1ljBu7sPfwSK09H0CrPyXEZTFX-b9ZvAy/view

**NATIVE 04 (variation, the bereaved widow "Carol V.", answers 03).**
- Opening: **"I requested my husband's complete medical file after he died. It came to 914 pages. I read every one of them at this table."**
- Metaphor: payroll / "no report on it". Device: Don's two-thirds-full 2,000-unit bottle.
- "I am not telling you that this would have saved my husband."
- https://drive.google.com/file/d/1dHPscpAGwvruCxIwdCHibYPTl251oTwc/view

**NATIVE 06 (variation, retired postman "Ellis T.", dismissal = "non-compliant").**
- Opening: **"A surgeon wrote to me in March. I carried other people's letters for thirty one years and that one came to my box. This is what I wrote back to him."**
- Metaphor: bins collected every other Tuesday. Proof: four pocket diaries with a tick every day.
- https://drive.google.com/file/d/1UCZM0N2ogBpnC14twnw-ZBO3zvV6MaXs/view

⚠ The natives use the named "Chen 2022" study and quote "ineffective". 00_COMPLIANCE's approved-numbers table does not list it, so confirm before using it on statics. Natives also use a 90-day guarantee and "71 percent off", which conflict with FACTS (60 days).

Native static-ad cues to borrow:
- Ugly/organic styling allowed ("An ugly green Facebook native has to look ugly", Static SOP)
- iPhone Notes / Reddit / comment-reply / handwritten Sharpie formats
- Images with no product and no text, used as the creative under a long first-person caption

Sources:
- UNIVERSAL_NATIVE_BRIEF_V4.txt: https://drive.google.com/file/d/1MNP3eEc916R5A4L2Z-AQenLV4hQrvWml/view
- CORVAEL_NATIVE_03_1to1.txt: https://drive.google.com/file/d/1ljBu7sPfwSK09H0CrPyXEZTFX-b9ZvAy/view
- CORVAEL_NATIVE_04_VARIATION.txt: https://drive.google.com/file/d/1dHPscpAGwvruCxIwdCHibYPTl251oTwc/view
- CORVAEL_NATIVE_06_VARIATION.txt: https://drive.google.com/file/d/1UCZM0N2ogBpnC14twnw-ZBO3zvV6MaXs/view
- WINNING CREATIVES (FB post links, PEA natives / WW camp / US camp "Image"): https://docs.google.com/document/d/1hdbwzvAWRvmhzZLFE-FjGFKPA0_xcFDDlqCxDw32msk/edit

---

## 6. Compliance rules for statics

**The two lines (00_COMPLIANCE v1.0, 14 Sep 2026):**
1. Never claim it cures or treats a disease.
2. Never claim it replaces a medication. "Nobody is ever told to stop, reduce or change a prescription."

"Everything else is approved. Do not ask permission on anything else. Do not invent additional caution. Do not hedge an approved claim into 'may support.'"

**Three more:**
- Never overclaim speed or size of result (no day-one transformations).
- **Never say "talk to your doctor"** (that phrasing has had pages banned). Put the safety note in the narrator's voice as a conversation with whoever prescribes.
- Never invent a number. Bracket and flag it ("11,000 bottles sold" was caught).

**Geography:** banned by default, and Hemant lifts it per batch.
- Never say: made in USA, any state, any country.
- Say instead: cGMP certified facility · NSF verified · third party tested · COA available per batch · pharmaceutical grade.
- The lift for the MB gummy batch (27 Aug 2026) was for that batch only.
- FACTS rule 3 is stricter: never name a country, state or city (not USA, not Utah).
- Background: product is made in Dongguan and US customers receive parcels from China (114 comments in one month). The geography contrast has bounced MIDs.
- COA rule (FACTS): only claim third-party testing / heavy metals for a SKU with a current COA for the exact batch shipping.

**Use / never:**

| Use | Never |
|---|---|
| Supports healthy nerve function, comfort, mobility, circulation, energy | Cures, treats, heals, reverses, prevents |
| GMP certified facility | Country-of-origin without sign-off |
| Third-party lab tested, heavy metals screened | FDA approved |
| USP grade, pharmaceutical grade | Guaranteed to fix, will eliminate |
| "Linked to / associated with" | "Causes" |
| What European doctors use, stated factually | Treats or replaces any drug |
| Studied for; the system the body already has | Natural blood thinner, prevents stroke |
| COA per batch | Vague quality claims with no named org |

**Per-product hard nos:**
- **Corvael/Corbel:** blood thinner · clot dissolver · dissolves clots · stroke prevention · unclogs arteries · lowers your calcium score · natural aspirin / aspirin alternative / replace your aspirin · get off your statin / the natural statin · lowers your cholesterol · reverses statin damage · any ED claim · spike protein as primary hook · a named celebrity as hero · a comparative purity number vs a competitor · "60% decline" · "within 24 hours" · "5,000 bottles a month" · any testimonial where someone stopped a prescription (including the 951-upvote one).
  - ⚠ The "Corvael-Ad-Concepts" video doc (Oct 13) contains an ED angle, which conflicts with this.
- **PainBloc:** treats/cures/replaces gabapentin, Lyrica or any drug · "causes dementia" about gabapentin (use linked to / associated with) · cures neuropathy, fibromyalgia or any diagnosed condition · "first-line treatment".
- **Methylene Blue:** cancer, depression, Alzheimer's, COVID or any disease · replaces any medication · "Cancer Fighting Properties" · **"Sugar Free" on gummies until the label is fixed**.
- **Aeon:** cures skin disease / hair loss / cancer · testosterone/hormone · Alzheimer's/cognitive disease · "as effective as injection" · any % bioavailability · "reverses aging" · "22x faster wound healing" · "Harvard trained" for Pickart (he was UCSF) · implying Bryan Johnson uses an oral product.
- **Gluco Gone (FACTS):** no diabetes/pre-diabetes, no lowering A1C, no replacing metformin.

**Liability frame:**
- The refusal always targets NEVER STARTING a prescription, never quitting one.
- **"Always 'in addition to.' Never 'instead of.'"** There is real bleeding risk (nattokinase swapped for Eliquis or warfarin). An uncountered story about two women who died swapping Coumadin for nattokinase is the largest live liability.
- A hard-stop safety card belongs on the PDP and pinned as the first comment on every Corvael ad.
- The caregiver of someone on medication is the highest-liability reader.

**Meta-specific (directly applies to statics):**
- Keep out of primary text: prescription drug names, celebrity/public figure names, prescription interactions. All three are fine in advertorial, email and VSL.
- **Avoid condition names in static headlines.**
- "Suppressed / banned / hidden" flag as conspiracy. Use "underused" or "overlooked".
- **No real prescription drug labels visible. No real competitor labels.**
- Never create a persona resembling a real public figure (20+ impersonation callouts in 30 days off one AI avatar).
- **Never fabricate a named person at a named company. Never invent a study. Never invent a quote.**
- Comments get pages actioned, not ads. Moderate from the minute an ad goes live.

**Approved numbers (with framing):**

| Claim | Framing |
|---|---|
| Nattokinase discovery | Dr Hiroyuki Sumi, 1980, University of Chicago, 170+ foods screened. Published 1987 |
| PAI-1 | Rises decade after decade after 50 |
| Gabapentin efficacy | ~10% for chronic neuropathic pain (Wiffen 2017, Cochrane) |
| Gabapentin and dementia | Case Western, 26,416 patients, July 2025: 6+ prescriptions associated with ~29% increased dementia risk, 85% increased MCI; under 65 more than doubles |
| PEA clinical | Schweiger 2019, 407 patients, ultramicronized PEA, VAS 75.8 → 52.5 |
| PEA evidence volume | 30+ trials, ~6,000 patients, hundreds of papers |
| European use | Widely used by Italian pain specialists for twenty years, OTC in Italian pharmacies |
| MB history | Over a century of use; WHO List of Essential Medicines |

**Do not use:** "60% decline by age X" · "1 in 100" (except precisely for 80+) · 227% more pure · same batch RFK takes · only 2 facilities in North America · 5,000 bottles a month · any customer count.

**FACTS also adds:**
- Nattokinase: 20,000 FU per serving, "NSK-SD or equivalent, K2-removed", enteric coated. "most published trials used 10,800 FU… State it per serving, never per capsule."
- PEA: 600 mg per serving.
- MB 1%: 10 mg/mL, 30 mL, Vitamin C 20 mg, USP-grade.
- Aeon: GHK-Cu 200 mcg, PEA 600 mg, HA 120 mg, Vit C 250 mg, sodium bicarbonate 400 mg.
- Gummies, capsules and Gluco Gone amounts: CONFIRM ON LABEL.

**Designer-level compliance:**
- No Trustpilot or fake stars.
- No fake timers or invented stock numbers.
- No invented anchors.
- Labels must match the real bottle (no garbled text).
- No physically impossible product shots.

**Open questions (FACTS):**
- Corvael vs Corbel name
- Guarantee: 60 vs 120/90
- Nattokinase strength: 20,000 vs old 2,000
- Gummy/capsule amounts
- Prices not locked
- Which SKUs have current COAs
- The "Sugar Free" label

Sources:
- 00_COMPLIANCE.md (Google Doc, v1.0): https://docs.google.com/document/d/1cZE55fqDhAQqrGwveJHrxxWUNM-nrT04EacMrYnMZdQ/edit
- 00_BLISSTA_FACTS.md: https://drive.google.com/file/d/1tOi6lgWpHPMYUWBciqZSUnSDZHfzj3Oh/view
- 03_STATIC_PRODUCTION_SOP.md: https://drive.google.com/file/d/1Ma_yfi_oIYHNzs3MhfHIFLkEBOn2gD9F/view
- Designer Brief PDF: https://drive.google.com/file/d/1DMzgDAyzcrCE2Ibj25NEXTQngzQX9l87/view
- 01_WINNERS.md: https://docs.google.com/document/d/1n_AhIW3DoOvbf4pIftM4Mip-7RGMrHut7EFQ7pvkuJg/edit

---

## Source index

| Title | Type | Link | What it is |
|---|---|---|---|
| 03_STATIC_PRODUCTION_SOP.md | Markdown | https://drive.google.com/file/d/1Ma_yfi_oIYHNzs3MhfHIFLkEBOn2gD9F/view | Static designer daily SOP v2.0: 15 concepts × 3 hooks = 45 images, 3 background systems, laws, killers, naming/delivery |
| Blissta_Static_Ad_Designer_Brief.pdf | PDF (8 pp) | https://drive.google.com/file/d/1DMzgDAyzcrCE2Ibj25NEXTQngzQX9l87/view | Sep 30 brief: port a TrendTrack winner into 1:1 + 4 sub-avatar variants, Magnific settings, prompt template, BF offer table, checklist |
| Blissta Static Production Tracker Database | Google Sheet | https://docs.google.com/spreadsheets/d/1ZDyzywyOCeVG-22ciBSjIvLSkWYQKQjbYRgkZWOHUO0/edit | Task/review/revision tracker for statics and video. **Contains credentials/PII, not copied**; structure only |
| 00_COMPLIANCE.md | Google Doc | https://docs.google.com/document/d/1cZE55fqDhAQqrGwveJHrxxWUNM-nrT04EacMrYnMZdQ/edit | One-page compliance: two lines, geography ban, per-product hard nos, Meta rules, approved numbers |
| 00_BLISSTA_FACTS.md | Markdown | https://drive.google.com/file/d/1tOi6lgWpHPMYUWBciqZSUnSDZHfzj3Oh/view | Single source for numbers: doses, offer tiers, 60-day guarantee, say/never-say, safety, open questions |
| 01_WINNERS.md | Google Doc | https://docs.google.com/document/d/1n_AhIW3DoOvbf4pIftM4Mip-7RGMrHut7EFQ7pvkuJg/edit | Proven winners with metrics (Sumo, Pain Nurse, Chinese MB, Tier List, Six Weeks), losers and lessons |
| 01_CONCEPT_AND_COPY_SOP.md | Google Doc | https://docs.google.com/document/d/1VYqv4ht2RVD7T_rlKGFEnHRN4vTRFTU79LFBGoxEUhE/edit | How concepts/hooks are built: owned mechanisms, sophistication level 4, 6 hooks/6 doors, anti-repetition gate |
| UNIVERSAL_NATIVE_BRIEF_V4.txt | Text | https://drive.google.com/file/d/1MNP3eEc916R5A4L2Z-AQenLV4hQrvWml/view | Competitor rip + long-form native ad brief: engines, devices, visuals, audit, rule inversions |
| CORVAEL_NATIVE_03_1to1.txt | Text | https://drive.google.com/file/d/1ljBu7sPfwSK09H0CrPyXEZTFX-b9ZvAy/view | Full native: pharmacist refuser ("212 blood thinner prescriptions a week") |
| CORVAEL_NATIVE_04_VARIATION.txt | Text | https://drive.google.com/file/d/1dHPscpAGwvruCxIwdCHibYPTl251oTwc/view | Full native variation: widow with 914-page medical file |
| CORVAEL_NATIVE_06_VARIATION.txt | Text | https://drive.google.com/file/d/1UCZM0N2ogBpnC14twnw-ZBO3zvV6MaXs/view | Full native variation: retired postman labelled "non-compliant" |
| WINNING CREATIVES | Google Doc | https://docs.google.com/document/d/1hdbwzvAWRvmhzZLFE-FjGFKPA0_xcFDDlqCxDw32msk/edit | List of FB post URLs of winning creatives (PEA natives, WW camp, US camp "Image"). Links only, not opened |
| Corvael-Ad-Concepts | Google Doc (~400k chars) | https://docs.google.com/document/d/1XxZx_dp93cioaS3A3DlOxb4ezVuzt0EwKUxwpYOOxYs/edit | Video concept scripts with editor notes (18+ tabs). Skimmed for static content (none); contains an ED angle that conflicts with compliance |
| BLISSTA - WINNING ADS / NATTOKINASE / IMAGES / JULY IMAGES (NATTO 1–24) | 24 JPGs | https://drive.google.com/drive/folders/1SxyyqzNCZy4-7G1hly2SYeRo8ZDBD5rk | Corvael winning statics. All viewed (4 via OCR only); 5/10/18 are duplicates |
| BLISSTA - WINNING ADS / PEA PAINBLOC / IMAGE / JULY - IMAGES (PEA 1–3) | 3 JPGs | https://drive.google.com/drive/folders/1qxMB_RmpQgkeMTgpMFZa92JJQ31_7XpQ | PainBloc winning statics (PEA 3 has no text and was not inspected) |
| BLISSTA - WINNING ADS / MB GUMMIES / IMAGE / JULY - IMAGES (GUMMIES 1–3) | 3 JPGs | https://drive.google.com/drive/folders/1sWy1FjmU0OjF8lZk3WT3oJhUAuKhM6Nz | Ultra Blue Gummies winning statics (2–3 via OCR) |
| BLISSTA - WINNING ADS / MB DROPS / IMAGE (MB DROPS - 1) | JPG | https://drive.google.com/drive/folders/1OZHxdJRtSU7we-hehJ5kYBZ_V47rdmsv | MB 1% drops winning static (4:5) |
| BLISSTA - WINNING ADS (VIDEO subfolders) | Folders of MP4 | https://drive.google.com/drive/folders/1p5usNh08TmXuQ0uMOdlyxCDMlQTlC_XZ | July video winners per product. Video only, not in scope |
| WINNING-ADS-AUGUST | Folder (28 subfolders, MP4 only) | https://drive.google.com/drive/folders/17d1w4U-X9Ump1jdKzp3ULwQubOE_8S3E | August winning video ads (Scorecard, Two Question, The Lock, etc.). No statics or docs |
| WIN-BLISSTA | Folder (MP4 only) | https://drive.google.com/drive/folders/1WAJsLt7RvwW28z0fG7f--whXsrC16JNp | Hook 1–18 and 1–14 video files. No statics or docs |
| Blissta Static SOPs (Oct 2026) | Folder | https://drive.google.com/drive/folders/1X73wiQYksIr9d5uNGcb4MaUqT0Q-xTra | Created 2026-10-08. Appears empty or not shared; nothing readable found |
| 03 STATIC ADS | Folder | https://drive.google.com/drive/folders/1FIarBULXBZ0VDMjRsIFgNzZIkQM6x3I2 | Holds the static SOP .md and the Designer Brief PDF only |
