# AI Design Workflow for High-Quality, On-Brand Direct-Response Static Ads (2025–2026)

Research date: 2026-10-15. Each model claim is dated. Source types are labeled: **[Official]** vendor docs, **[Academic]** arXiv/peer-reviewed, **[Practitioner]** individual marketer/operator, **[Vendor blog]** tool company marketing content, **[Aggregator]** roundup sites. Vendor and aggregator claims are not independent tests.

## 1. Model strengths and weaknesses for ad statics (text, product/label fidelity, editing, aspect ratios, failure modes)

### Takeaway
As of late 2026, the frontier models for statics are OpenAI's GPT Image 2 (Apr 2026) and 2.5 (Sep 2026), Google's Nano Banana Pro (Nov 2025) and Nano Banana 2 (Feb 2026), Ideogram 4.0 (Jun 2026) for text, Recraft V4/V4.1 for brand and vector work, FLUX.2 for cheap photoreal output, and Midjourney V8.x for aesthetics. In-image text is now *usually* right for short strings. The reliable fix for exact labels is still to avoid letting the model repaint them: composite the real product pixels into the scene. No independent head-to-head text-rendering benchmark covers all of Ideogram, GPT Image, Nano Banana Pro and Recraft. Most "best for text" claims come from aggregators.

### Cited Findings
**Google Nano Banana Pro / Nano Banana 2 (official specs, guide dated Mar 6, 2026)**
- Nano Banana 2 = Gemini 3.1 Flash Image; Nano Banana Pro = Gemini 3 Pro Image. Up to **14 reference object images** per prompt. 1K/2K/4K output (NB2 also 512px). Aspect ratios for both: 1:1, 3:2, 2:3, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9. NB2 adds 1:4, 4:1, 1:8, 8:1. All outputs carry C2PA credentials + SynthID watermark — [Official] [Google Cloud prompting guide, Mar 2026](https://cloud.google.com/blog/products/ai-machine-learning/ultimate-prompting-guide-for-nano-banana)
- Text guidance: put the words in quotes and describe the font (e.g., "bold, white, sans-serif" or a named font like "Century Gothic"). Supports 10+ languages. A "text-first hack": "Gemini Image models work best if you first converse with it to generate the text concepts, and then ask for an image with that text." — [Official] [Google Cloud guide](https://cloud.google.com/blog/products/ai-machine-learning/ultimate-prompting-guide-for-nano-banana)
- The Google guide has **no dedicated section on label/packaging fidelity**. For editing it says "Be explicit about what to keep exactly the same." — [Official] [Google Cloud guide](https://cloud.google.com/blog/products/ai-machine-learning/ultimate-prompting-guide-for-nano-banana)
- Official ad example (beauty): "A high-end, glossy commercial beauty shot of a sleek, minimalist nude-colored face moisturizer jar resting on a warm studio background... render three lines of text with the following exact styling: ...'GLOW' in a flowing, elegant Brush Script font... '10% OFF' in a heavy, blocky Impact font... 'Your First Order' in a thin, minimalist Century Gothic font." The guide then localizes the text into Korean and Arabic — [Official] [Google Cloud guide](https://cloud.google.com/blog/products/ai-machine-learning/ultimate-prompting-guide-for-nano-banana)
- Nano Banana Pro released Nov 2025, $0.134/image at 1K–2K and $0.24 at 4K. Described as leading image-editing arenas and "the crowd's realism benchmark." Nano Banana 2 released Feb 2026 at $0.045–$0.151/image — [Aggregator] [BuildMVPFast, updated Sep 12, 2026](https://www.buildmvpfast.com/articles/best-llms-2026-guide/image-generation-ai)
- Third-party testers advise keeping in-image text to 3–5 words, using short all-caps sans-serif headlines, and limiting text to one or two positions. Without an explicit instruction that the product stay unchanged, "the AI may 'improve' your packaging." — [Vendor blog/aggregator, summarized via search] [Zeely](https://zeely.ai/blog/nano-banana-prompts-for-product-ads/), [Atlabs](https://www.atlabs.ai/blog/25-best-nano-banana-pro-prompts-the-only-ultimate-prompt-guide-you-will-need-for-nano-banana-pro), [nanobananaimages.com](https://www.nanobananaimages.com/blog/nano-banana-prompt-engineering-guide)

**OpenAI GPT Image 2 / 2.5**
- `gpt-image-2` launched in the API Apr 21, 2026 and shipped in ChatGPT as "ChatGPT Images 2.0" on Apr 22, 2026. Improvements include multilingual text and structured graphics (infographics, posters) — [Official-community] [OpenAI Developer Community announcement](https://community.openai.com/t/introducing-gpt-image-2-available-today-in-the-api-and-codex/1379479); [Press] [VentureBeat](https://venturebeat.com/technology/openais-chatgpt-images-2-0-is-here-and-it-does-multilingual-text-full-infographics-slides-maps-even-manga-seemingly-flawlessly)
- Claims of ">99% text accuracy" (up from 90–95%) are third-party and unverified — [Aggregator] [MindStudio](https://www.mindstudio.ai/blog/what-is-gpt-image-2), [apiyi](https://docs.apiyi.com/en/news/gpt-image-2-launch)
- The OpenAI prompting guide (model table "as of April 21, 2026") makes `gpt-image-2` the default. It claims "Reliable text rendering with crisp lettering, consistent layout, and strong contrast." Its tips: put literal text in quotes or ALL CAPS, give font style, size, colour and placement, **spell tricky brand names letter by letter**, and use `medium`/`high` quality for small or dense text — [Official] [OpenAI Cookbook image prompting guide](https://developers.openai.com/cookbook/examples/multimodal/image-gen-models-prompting-guide)
- Product/label preservation in edits: use "change only X" / "keep everything else the same" and **repeat the preserve list every iteration to reduce drift**. For product cutouts: "Preserve product geometry and label legibility exactly." Refer to multi-image inputs by index ("Image 1: product photo… Image 2: style reference…") — [Official] [OpenAI Cookbook](https://developers.openai.com/cookbook/examples/multimodal/image-gen-models-prompting-guide)
- Conflict: the guide says `input_fidelity` is disabled for gpt-image-2 ("output is already high fidelity by default"), yet several gpt-image-2 examples pass `input_fidelity="high"`. Third-party guides report the parameter errors. This needs testing — [Official] [OpenAI Cookbook](https://developers.openai.com/cookbook/examples/multimodal/image-gen-models-prompting-guide); [Third party] [WaveSpeed](https://wavespeed.ai/blog/posts/gpt-image-2-api-guide/)
- gpt-image-2 sizes: custom edges must be multiples of 16, max edge under 3840px, aspect ratio no more than 3:1. Outputs above 2560×1440 are "experimental." Transparent backgrounds are in preview (PNG/WebP). Camera specs are "interpreted loosely" — [Official] [OpenAI Cookbook](https://developers.openai.com/cookbook/examples/multimodal/image-gen-models-prompting-guide)
- Official ad-style prompts are written as a creative brief (brand, audience, tagline) and require the tagline "exactly once, clearly and legibly" or "EXACT, verbatim, no extra characters" — [Official] [OpenAI Cookbook](https://developers.openai.com/cookbook/examples/multimodal/image-gen-models-prompting-guide)
- GPT Image 2.5 released Sep 8, 2026 (sketch feature, faster). Reported #1 on Artificial Analysis text-to-image and top of the lmarena arenas for prompt adherence and text rendering — [Aggregator] [BuildMVPFast, Sep 12, 2026](https://www.buildmvpfast.com/articles/best-llms-2026-guide/image-generation-ai); [Wikipedia: GPT Image](https://en.wikipedia.org/wiki/GPT_Image) (not verified against an OpenAI primary source)

**Ideogram, Recraft, FLUX, Midjourney, others (all aggregator-sourced, Sep 2026)**
- Ideogram 4.0 (Jun 3, 2026): "~0.97 OCR," called the best readable-text rendering on the list, with open weights available. Recraft V4.1 (May 14, 2026): design taste, brand consistency, prompt-to-SVG vectors. FLUX.2 Pro (Nov 2025): photoreal, $0.03–0.07/image, recommended for product photography at scale. Midjourney V8.2 (Jul 24, 2026): aesthetic/stylized strength. Seedream 5.0 Pro (Jul 2026): **layered editable PNG output (10+ alpha layers)** and strong typography. MAI-Image-2.6 (Microsoft, Aug 2026) is #2 on the text-to-image Arena. Reve 2.1 (Jul 2026) tops prompt-based editing arenas — [Aggregator] [BuildMVPFast](https://www.buildmvpfast.com/articles/best-llms-2026-guide/image-generation-ai)
- A different 2026 guide calls Ideogram 3 "the only model that can reliably render readable text." That conflicts with the newer roundup, which puts GPT Image 2.5 on top for text — [Aggregator] [Rangy](https://rangy.ai/blog/ai-image-generators-2026-complete-guide/) vs [BuildMVPFast](https://www.buildmvpfast.com/articles/best-llms-2026-guide/image-generation-ai)
- Recraft V4 was the stable release as of Feb 17, 2026. V3 topped a crowdsourced benchmark in Oct 2024. No text-rendering scores were found — [Wikipedia: Recraft](https://en.wikipedia.org/wiki/Recraft)

**Independent / academic benchmarks**
- LongText-Bench (ERNIE-Image tech report, 2026): Nano Banana 2.0 scored 0.981 EN / 0.949 ZH, GPT Image 1 [High] 0.956 EN / 0.619 ZH. Nano Banana Pro, Ideogram and Recraft are not in that table — [Academic] [ERNIE-Image Technical Report](https://arxiv.org/pdf/2605.25347)
- A 2026 general-quality table (LLaDA-Image) ranks GPT-Image 2 first overall, then Nano-Banana 2.0 and GPT-Image 1.5, with Nano-Banana Pro close behind. This is not a text-specific score — [Academic] [LLaDA-Image](https://arxiv.org/pdf/2609.03796)

**Failure modes and label fidelity**
- Generic generators treat label text as texture. Even with a sharp source photo, the model regenerates the text region from scratch, so labels garble or warp — [Vendor blog] [Snappyit](https://snappyit.ai/blog/why-ai-gets-text-wrong-on-products)
- Recommended fix: generate or photograph an empty background, then **composite the original product cutout** on top, matching scale, contact shadow and lighting without repainting the label — [Vendor blog] [Creator Lane](https://creatorlanehq.com/blog/ai-product-images-accurate-labels). Local repair from the original photo (Photoroom Product Fixer) works better with a straight-on angle. Afterwards, check for blurred edges, new text errors and colour shifts — [Vendor blog] [Photoroom](https://www.photoroom.com/blog/how-to-fix-inaccurate-ai-product-images), [Nightjar](https://nightjar.so/blog/why-ai-product-photos-dont-match-real-product)
- Prompt for no text and add exact copy as a separate design layer, so a real font controls spelling and spacing — [Vendor blog] [Goodeye (2026)](https://goodeye.dev/guides/fix-text-in-ai-generated-images)
- A known failure mode: AI product images that "look too much like posters" (over-designed, generic) — [Vendor blog] [DropshipShot](https://dropshipshot.com/blog/what-to-do-when-ai-product-images-look-too-much-like-posters) (title only; not fetched)

### Inferences
- Suggested routing for a 2026 pipeline:
  - Photoreal lifestyle and product-in-scene work with multiple references: Nano Banana Pro (14 refs, 4K, strong editing), or GPT Image 2/2.5.
  - Cheap high-volume backgrounds and drafts: Nano Banana 2, FLUX.2 Pro or gpt-image-1-mini.
  - Text-as-art (typographic posters, big stylized headlines): Ideogram 4.0 or GPT Image 2.5.
  - Vector/brand elements (icons, badges, SVG): Recraft V4.x.
  - Mood exploration: Midjourney V8.x. It has no strong API or product-fidelity story in these sources.
- Even when the in-image text is right, **exact product labels and legal copy should not depend on generation**. Composite real packshots, then set type deterministically. The official guides cover scene merging and "keep X the same" edits but never promise label fidelity.
- Re-stating the preserve list on every edit pass (an OpenAI recommendation) should become a standing rule in any multi-turn editing agent.

### Gaps
- No independent, controlled head-to-head of text accuracy across Ideogram 4 / GPT Image 2.5 / Nano Banana Pro / Recraft V4. The leaderboard positions above are aggregator-reported, not checked on Artificial Analysis or LMArena directly.
- No quantitative independent data on label-fidelity rates with reference images for any model.
- The Ideogram and Recraft official docs were not fetched in this session. Their specifics (style references, Ideogram "Magic Prompt," Recraft brand styles) are unverified here.
- The specialized ad tools named in the brief (Magnific upscaling, Higgsfield, AdCreative.ai, Pencil, Icon, Arcads, Creatify, Omneky, Foreplay, Motion AI) were not individually researched. No quality evidence was gathered for them.

## 2. The hybrid workflow: generate the visual, set type in code or templates

### Takeaway
Practitioners widely recommend generating the image text-free and adding headlines in a separate step: Figma/Photoshop for manual work, or Bannerbear/Placid-style template APIs and HTML/CSS → headless-browser render for programmatic work. This search found little public write-up from performance marketers on code-rendered type. Its benefits (exact fonts, brand consistency, unlimited headline variants, no spelling risk) are well-argued, but evidence of them is mostly anecdotal or vendor-sourced.

### Cited Findings
- Alex Cooper (Adcrate, Mar 30, 2025, GPT-4o era) generates the image in ChatGPT without text and adds headline and feature copy in Figma or Photoshop, because "text placement, spacing, and formatting are difficult to get right in a single prompt." — [Practitioner] [Alex Cooper newsletter](https://alexcooper.beehiiv.com/p/how-to-make-static-ads-with-chatgpt-4o-plus-some-freebies)
- An HTML/CSS absolute-positioned text overlay rendered via Puppeteer (Node.js) is a documented technique. The tutorial is generic, not ad-specific — [Vendor tutorial] [CraftMyPDF](https://craftmypdf.com/blog/how-to-overlay-text-on-an-image-in-html-and-css/)
- Bannerbear renders designer-built templates via API (POST /v2/images with "modifications" that swap text, product photos and colour themes) and returns hosted assets. A Bannerbear MCP exists for Claude Code via Composio — [Third-party API listings] [Jentic: Bannerbear](https://jentic.com/apis/bannerbear.com/bannerbear.md), [Composio](https://composio.dev/toolkits/bannerbear/framework/claude-code.md)
- Placid is described as a creative-automation toolkit that generates images, PDFs and video from custom templates via API — [Third-party listing via search] [Jentic](https://jentic.com/apis/bannerbear)
- Sivi keeps every element (headline, background) on separate editable layers with HTML export: "Real text, not pixels" — [Vendor] [Sivi](https://sivi.ai/generate-ads)
- Seedream 5.0 Pro (Jul 2026) reportedly outputs layered editable PNGs (10+ alpha layers), an in-model alternative to separating type — [Aggregator] [BuildMVPFast](https://www.buildmvpfast.com/articles/best-llms-2026-guide/image-generation-ai)
- Counter-pattern: the open-source Claude Code "Static-Ads" skill (Nano Banana 2 via fal) renders **all copy inside the image model**. Headlines are in double quotes, kept "under 10 words," with the logo in a fixed spot (usually bottom right). For 9:16 output it adds a safe-zone rule keeping the top ~15% and bottom ~25% free of text and logo — [Practitioner/open source] [keith-wohnv/Static-Ads SKILL.md](https://github.com/keith-wohnv/Static-Ads/blob/master/.claude/skills/static-ads/SKILL.md)
- Mike Futia (X, 2026) shows Claude Code + Nano Banana 2 producing "40 production-ready static ads" from a brand name + URL with copy in-image. This is a self-reported, promotional claim — [Practitioner] [X post](https://x.com/mikefutia/status/2032494512774525064), [walkthrough](https://x.com/mikefutia/status/2032947645317071348?lang=en)
- General caution: final AI ads still need human checks for claims, product accuracy, brand rules and platform policy — [Vendor blog] [BrandGene static ads guide](https://brandgene.io/blog/brand-marketing/ad-creatives/static-ads-guide)

### Inferences
- Two camps exist in 2026:
  - "All-in-model": fast and visually integrated, with type that looks like it belongs to the scene. It carries spelling and label risk and makes headline A/B variants costly, since every variant is a new generation that also changes the image.
  - "Hybrid": the image model makes a text-free plate with planned negative space, and type is set in HTML/CSS or a template API. This gives exact brand fonts, pixel-identical images across headline variants, and clean A/B attribution (only the copy changes), which suits high-volume headline testing.
- A practical hybrid: (1) the LLM writes an art-direction brief that reserves a named text zone (e.g., "top 35% clean, low-detail gradient"); (2) the image model generates the plate; (3) a real product packshot is composited; (4) an HTML/CSS template with brand fonts renders headline, subhead, CTA, badges and disclaimer via Playwright/Puppeteer screenshot at 1080×1080 / 1080×1350 / 1080×1920; (5) a vision model QA pass reviews the rendered PNG.
- Satori (Vercel's JSX→SVG engine behind @vercel/og) is a lighter alternative to a headless browser. From background knowledge, not verified this session: it supports a CSS subset (flexbox, no grid), which constrains complex layouts.
- A hybrid needs a "text-safe zone" contract between the image prompt and the HTML template. Otherwise type lands on busy areas. The Static-Ads skill's 9:16 safe-zone percentages are a usable starting spec.

### Gaps
- No public, detailed practitioner case study (X/LinkedIn/Reddit) of a performance team using HTML/CSS→Puppeteer or Satori for Meta statics, with reported outcomes, was found.
- Satori, Templated.io, the Canva Connect API and Figma plugin workflows were not verified in this session.
- No data compares the performance (CTR/CPA) of in-model text vs. overlaid text.

## 3. Prompt frameworks: structure, reference-board conditioning, product references, art-director briefs

### Takeaway
The working pattern is *LLM as art director, image model as renderer*. The LLM turns brand DNA plus a winning reference ad into a long, specific brief: subject, setting, light, lens, composition, reserved text zone, exact copy, and what to preserve. Output quality depends heavily on choosing a reference whose layout fits the product. Official prompt structures from Google and OpenAI match this brief format.

### Cited Findings
- Google's formulas: Text-to-image = `[Subject] + [Action] + [Location/context] + [Composition] + [Style]`. With references = `[Reference images] + [Relationship instruction] + [New scenario]`. Start prompts with a strong verb. Use positive framing ("empty street" not "no cars"). Control the camera ("low angle"). Iterate conversationally. Creative-direction vocabulary: "three-point softbox setup," "golden hour backlighting," "shot on medium-format analog film," "cinematic color grading with muted teal tones." — [Official] [Google Cloud guide, Mar 2026](https://cloud.google.com/blog/products/ai-machine-learning/ultimate-prompting-guide-for-nano-banana)
- OpenAI: write ad prompts as a creative brief (brand, audience, tagline), index multi-image references by role, and say how the inputs interact — [Official] [OpenAI Cookbook](https://developers.openai.com/cookbook/examples/multimodal/image-gen-models-prompting-guide)
- Third-party ad-prompt checklists converge on: product, audience, goal, scene, camera, lighting, format, on-image text, brand rules, exclusions. Also: "Render exactly" the string with font, position and relative size, and label each uploaded image in the prompt — [Vendor blogs via search] [Zeely](https://zeely.ai/blog/nano-banana-prompts-for-product-ads/), [bananadesigner](https://www.bananadesigner.com/pages/models/nano-banana-pro-prompting-guide), [prompt-architects](https://prompt-architects.com/blog/172-how-to-prompt-nano-banana-pro)
- Reference-ad conditioning (Alex Cooper, Mar 2025): give Claude a reference ad and ask for a detailed recreation brief. Then push it with "this is a 4/10 in terms of graphic design detail. I need a 10/10. GO INTO EXTREME DETAIL - IMPRESS ME!" and paste the result into the image model. He calls this "way more reliable" than the generic "recreate this ad for my brand," which is "hit-and-miss." **Choose references whose layout easily fits your product**, since a good fit lets a minimal prompt work (citing a James Koshigoe example) — [Practitioner] [Alex Cooper](https://alexcooper.beehiiv.com/p/how-to-make-static-ads-with-chatgpt-4o-plus-some-freebies)
- Brand-DNA conditioning (Static-Ads Claude skill):
  - Firecrawl scrapes site images and full-page screenshots. Claude's *visual* reading of the screenshots overrides scraped CSS for colours.
  - It builds `brand-dna.md` (Brand Overview, Visual System with fonts/hex/CTA style, Photography Direction, Product Details, Ad Creative Style, Pricing & Offer, and a **50–75 word "Image Generation Prompt Modifier" prepended to every prompt**).
  - Before generation it pauses to confirm which product reference images apply to which templates.
  - It fills 50 layout templates (e.g., "Use the attached images as brand reference. Match the exact product colors, typography style, and brand tone precisely"). Some templates restrict references to "product color ONLY" or "tone ONLY."
  - It runs an ad-compliance checklist (testimonials, before/after, comparisons, health, promo terms).
  - It generates 4 images × 2 ratios per prompt.
  - The file is internally inconsistent: one section calls it pure text-to-image with "no reference images" — [Practitioner/open source] [GitHub SKILL.md](https://github.com/keith-wohnv/Static-Ads/blob/master/.claude/skills/static-ads/SKILL.md)
- An agency feeds transcripts of client and competitor top-performing ads into Claude Sonnet via API to generate new hook variants (no performance figures) — [Agency blog via search] [Gyrodile](https://gyrodile.com/insights/ai-workflows/)
- Paid prompt packs and "viral prompt" lists for Nano Banana Pro are abundant and mostly marketing. Treat them cautiously — [Vendor] [Gumroad prompt pack](https://digitechdojox.gumroad.com), [AI Ad Prompt Library](https://aitechtools.gumroad.com/l/AIAdPromptLibrary)

### Inferences
- The best-supported prompt skeleton for a static-ad plate combines both official structures:
  1. Role/verb ("Create a 4:5 direct-response ad photograph…")
  2. Indexed references ("Image 1 = product packshot: preserve geometry, colours and label exactly. Image 2 = winning-ad layout reference: borrow composition and lighting only.")
  3. Subject + action + setting
  4. Light + lens + film/grade
  5. Composition with an explicit **reserved negative-space zone for type**
  6. Mood/brand modifier (the 50–75 word brand-DNA paragraph)
  7. Exact copy in quotes (if in-model) or "no text, no logos" (if hybrid)
  8. A preserve list
- Reference ads should be tagged by *what to borrow* (layout, lighting, palette, prop style). Otherwise models copy the reference too literally or blend product details. The Static-Ads "color ONLY / tone ONLY" scoping is an example.
- The "4/10 → 10/10" escalation is a crude but documented way to get more detailed briefs from Claude. A rubric-based version (Section 4) is the more controlled equivalent.

### Gaps
- No controlled tests compare prompt structures (brief-style vs. keyword-style) on ad performance or aesthetic scores.
- Quality claims for AdCreative.ai, Pencil, Icon, Arcads, Creatify, Omneky, Foreplay and Motion AI were not researched. No independent evaluations were found.

## 4. Getting an LLM to design like a top designer: critique loops, rubrics, critic/creator agents, research

### Takeaway
2024–2026 research consistently finds that critique works best when the model **sees the rendered output** and critiques against explicit principles, ideally localized to regions. Off-the-shelf VLMs are unreliable judges of individual design principles. A useful loop is therefore render → structured, principle-by-principle VLM critique (with bounding boxes or regions) → targeted fix → re-render, with deterministic checks (OCR, contrast, safe zones) handled outside the LLM and a human for final taste and compliance.

### Cited Findings
- **Design critique with visual prompting** (Duan, Cheng, Hartmann, Li; Dec 2024, rev. May 2025): an iterative visual-prompting pipeline (Gemini-1.5-pro, GPT-4o) takes a UI screenshot plus design guidelines and outputs comments with bounding boxes, refined over several steps with step-specific few-shot examples. It closed the gap to human performance by 50% on one metric, and experts preferred its critiques to the baseline's — [Academic] [arXiv 2412.16829](https://arxiv.org/abs/2412.16829)
- **Seeing is Improving / VFLM** (CVPR 2026, Mar 2026): code-only layout methods are "blind to the rendered visual outcome." Their model iteratively refines layouts by looking at the render, trained with RL and a visually grounded reward that includes **OCR accuracy**. It outperforms advanced MLLMs and code-only baselines (no numbers on the abstract page) — [Academic] [arXiv 2603.22187](https://arxiv.org/abs/2603.22187)
- **PRISM** (CVPR 2026 Findings, May 2026): evaluates designs on readability, contrast, alignment, overlap and coherence using perturbed Crello layouts. **Qwen-2.5-VL and GPT-4o-mini are largely insensitive to targeted principle violations. GPT-4o has global awareness but does not separate individual principles well.** A multi-scale approach (lightweight scorers + instruction-tuned VLM localized feedback + prompted global reasoning) improves layouts through targeted refinement — [Academic] [arXiv 2606.00592](https://arxiv.org/abs/2606.00592)
- **PSDesigner** (CVPR 2026, Mar 2026): emulates a human designer's workflow by gathering theme assets, then using tool calls to edit layered PSD files, integrating assets and refining weaker elements. It is trained on the CreativePSD dataset of operation traces and claims to beat existing methods (no metrics on abstract page) — [Academic] [arXiv 2603.25738](https://arxiv.org/abs/2603.25738)
- **Vision-guided iterative refinement for frontend code** (Apr 2026): a VLM gives structured visual feedback on the rendered page, a secondary critic consolidates it, and the loop drives self-refinement. Automated VLM critique gives "significantly higher quality solutions than a single LLM inference pass" — [Academic] [arXiv 2604.05839](https://arxiv.org/html/2604.05839v1). This maps directly onto HTML/CSS ad templates.
- **ReLook** (Oct 2025): a generate–diagnose–refine loop where the agent invokes an MLLM critic on rendered web output — [Academic] [arXiv 2510.11498](https://arxiv.org/html/2510.11498)
- **PosterGen** (Aug 2025): a multi-agent paper-to-poster pipeline with a VLM rubric (layout balance, readability, aesthetic coherence). A review notes the rubric was not validated against expert designer ratings — [Academic] [alphaXiv 2508.17188](https://www.alphaxiv.org/abs/2508.17188)
- **COLE** (2023) breaks graphic design generation into hierarchical sub-tasks producing multi-layered, editable designs. OpenCOLE (2024) is an open reproduction — [Academic] [arXiv 2311.16974](https://arxiv.org/pdf/2311.16974)
- Other relevant titles not read in full: VASCAR (layout generation via visual-aware self-correction) [arXiv 2412.04237](https://arxiv.org/pdf/2412.04237); PosterCopilot (layout reasoning and controllable editing) [arXiv 2512.04082](https://arxiv.org/pdf/2512.04082); Uni-Layout (human-feedback layout evaluation) [arXiv 2508.02374](https://arxiv.org/pdf/2508.02374); ReContraster (regional contrast for posters) [arXiv 2604.10442](https://arxiv.org/pdf/2604.10442); LOCI: locator-critic with refinement loop [arXiv 2608.30959](https://arxiv.org/html/2608.30959v1)
- Agentic critique loops "can struggle with subjective criteria like aesthetics or may fall into infinite loops or premature convergence," so human supervision stays necessary — [Academic survey, via search summary] (cited in search results alongside [arXiv 2601.05016](https://arxiv.org/pdf/2601.05016); attribution not fully verified)
- Practitioner state of the art: the open-source Static-Ads skill has **no automated critique step**. QA is human gallery review plus a screenshot-based brand check — [Practitioner] [GitHub SKILL.md](https://github.com/keith-wohnv/Static-Ads/blob/master/.claude/skills/static-ads/SKILL.md)

### Inferences
- Design the critic around PRISM's finding: **do not ask a VLM for one holistic "rate this ad 1–10" score**. Ask separate, localized, principle-specific questions (e.g., "Is the headline the single largest, highest-contrast element? Return its bbox." "Does any text overlap the product or a busy region?" "Can the offer be read in 3 seconds at 25% scale?"). Hand the measurable checks to deterministic code: OCR string match vs. intended copy, WCAG contrast ratio of text vs. background pixels, safe-zone violations, logo presence, and label match by perceptual-hash/OCR against the reference packshot.
- A defensible multi-pass loop for an ad agent:
  - (a) **Strategy pass**: awareness level, angle and single message.
  - (b) **3+ divergent directions**, each with a written design rationale.
  - (c) Pick and refine.
  - (d) Render.
  - (e) **Critic pass on the rendered PNG** with a rubric: squint test/hierarchy, 3-second read, thumb-stop contrast, brand check, product fidelity, compliance, placement safe zones.
  - (f) Targeted fixes only.
  - (g) Max 2–3 iterations to avoid the infinite-loop/premature-convergence problem.
  - (h) Human approval.
- Critic and creator should be separate prompts or agents, and the critic should be shown winning reference ads as anchors. The research supports guideline-plus-few-shot critique (Duan et al.) over unanchored judgment.
- Because HTML/CSS templates are code, the frontend-refinement literature (render → VLM critique → code edit) transfers almost directly to the hybrid workflow in Section 2. That is a strong argument for setting type in code.

### Gaps
- No published study tests LLM self-critique specifically on *direct-response ad statics* against real performance data (CTR/CPA).
- "DesignBench" and "LayoutGPT" were not specifically retrieved in this session. Canva and Adobe research on design agents was not found.
- No evidence was found that a VLM grading outputs against a brand's past winners predicts in-market performance.

## 5. Why AI design outputs feel templated or samey, and techniques that fix it

### Takeaway
Sameness has two documented causes. LLMs mode-collapse toward "typical" outputs because of typicality bias in preference data. Template-driven pipelines also re-use the same layouts. Meta's Andromeda retrieval then penalizes look-alike ads by effectively treating them as one creative. Fixes: force divergence at the *concept/angle* level before visual variation, sample from a verbalized distribution instead of taking the modal answer, ban defaults explicitly, and vary visual style and format meaningfully, not cosmetically.

### Cited Findings
- **Verbalized Sampling** (Zhang, Yu, Chong, Sicilia, Tomz, Manning, Shi; Oct 2025; ICML 2026 poster): mode collapse stems largely from **typicality bias in preference data** (annotators favour familiar text). Asking the model to "verbalize a probability distribution over a set of responses" (e.g., 5 candidates with probabilities) raises creative-writing diversity **1.6–2.1×** over direct prompting without hurting accuracy or safety. More capable models benefit more. Code is at github.com/CHATS-lab/verbalize-sampling — [Academic] [arXiv 2510.01171](https://arxiv.org/abs/2510.01171v3), [ICML 2026](https://icml.cc/virtual/2026/poster/60489)
- Meta's Andromeda is the retrieval stage narrowing tens of millions of candidates to thousands (Meta engineering post, Dec 2, 2024, cited secondhand). Look-alike ads reportedly cluster into a single Entity ID ("50 ad variations might only get one ticket to the auction"). Meta's in-product Creative diversity metric labels ad sets High/Medium/Low and is marked "estimated/in development" — [Vendor/agency blogs] [AdsUploader](https://adsuploader.com/blog/meta-andromeda), [NovoAds](https://novoads.ai/en/blog/creative-diversity-meta-ads), [Confect](https://confect.io/tactics/meta-andromeda-2026) (secondhand; not Meta primary docs)
- Jon Loomer (Oct 20, 2025): meaningful diversification = distinctly different visual styles, formats (video/static/carousel), and persona/pain-point/angle. Text differences "should be significant, not subtle." Near-duplicate images and minor rewording add little, and aspect-ratio resizes are placement fit, not new ideas. "Unless they're distinctly different enough, any variation is unlikely to make a meaningful impact on performance." — [Independent practitioner] [Jon Loomer](https://www.jonloomer.com/meta-andromeda-creative-diversification/)
- "Fake diversity" (slight variations Andromeda treats as identical) is called a top mistake. Recommended: humans develop 5–7 distinct concepts, then AI makes 2–3 variations each (backgrounds, text alternatives, placement versions). Iteration (new hook, same concept) ≠ variation (new concept). Vary the value proposition (price vs. quality vs. speed vs. results) and the pain point — [Agency/vendor blogs via search] [Socially Aligned](https://sociallyaligned.com/meta-andromeda-algorithm-creative-strategy/), [1ClickReport](https://www.1clickreport.com/blog/andromeda-creative-ai-tools-2026-meta-ads-guide)
- Template-driven AI ad systems (50 fixed layout templates in Static-Ads, "40 ad templates" in Futia's build) generate breadth by template rotation, which reproduces the same layouts across brands — [Practitioner] [Static-Ads SKILL.md](https://github.com/keith-wohnv/Static-Ads/blob/master/.claude/skills/static-ads/SKILL.md), [Mike Futia](https://x.com/mikefutia/status/2032947645317071348?lang=en)

### Inferences
- Techniques to make the AI "design deliberately":
  1. **Strategy before pixels**: require a written rationale per ad (awareness stage, angle, the one thing the viewer must notice, why this layout serves that).
  2. **Explicit variation axes**: each batch must differ on at least two of: concept/angle, persona, visual style (photo vs. graphic vs. native/UGC-lo-fi vs. editorial), composition archetype, format.
  3. **Verbalized sampling for directions**: "list 5 design directions with estimated probability a typical designer would choose each; develop the two lowest-probability directions that still fit the brief."
  4. **Ban list of defaults**: e.g., centered product on gradient, generic smiling stock model, glossy 3D render look, purple/teal tech gradient, symmetric hero-headline-CTA stack, the same "studio softbox" lighting every time.
  5. **Concept-level human seeding**: use AI for expansion, not for originating all concepts.
  6. **Diversity check**: embed outputs and reject near-duplicates before launch, approximating Meta's creative-diversity signal.
- The "AI look" (plastic skin, over-glossy lighting, poster-like over-design) is best countered by naming a concrete photographic or vernacular style ("shot on iPhone, flash, slightly messy kitchen counter," "medium-format film grain") and by conditioning on real winning ads rather than describing "high-end commercial" looks. Google's own beauty example uses exactly that glossy commercial register, which reinforces the sameness.

### Gaps
- No controlled study shows that prompt-level anti-default techniques improve ad performance. The Andromeda clustering mechanics come from secondhand vendor and agency blogs, not Meta technical documentation.
- No independent research was found on the "plastic skin / AI look" problem in ad images specifically, or on how often audiences detect AI-generated statics and penalize them.
