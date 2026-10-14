# AI video/image/music per-unit pricing across platforms (researched 2026-10-14)

Conventions: all USD. "$/s" = cost per second of finished output. Higgsfield $/credit used for conversions:
- **Ultra monthly**: $129 / 3,000 credits = **$0.043/credit** (user-supplied plan figure; corroborated by [Scopeful, Aug 2026](https://www.scopeful.org/blog/higgsfield-pricing-2026) and [Higgsfield blog, Sep 2026](https://higgsfield.ai/blog/annual-unlimited-ai-video-plans))
- **Ultra annual**: $99/mo / 3,000 = **$0.033/credit** (first-year promo per Scopeful)
- **Auto-refill**: 20 credits/$ = **$0.050/credit**; one-time packs **$0.0526–$0.0588/credit** (live account data, see Q2)

Source-quality legend: [OFFICIAL] = vendor's own page/data; [RESELLER-SELF] = reseller describing its own price; [COMPETITOR-MKT] = page published by a company that sells a competing product (treat comparisons with suspicion); [3P-BLOG] = independent/affiliate blog.

---

## Q1. For each model, the cheapest reliable per-second (video) or per-image price, and where

### Takeaway
No single platform wins everything. Google's own Gemini API is cheapest for Nano Banana (batch mode halves it) and Veo 3.1 Lite/Fast. kie.ai is cheapest-published for Kling 3.0 among API resellers ($0.07–0.135/s). BytePlus official / Replicate / OpenRouter (all $0.1028/s 480p, $0.2312/s 720p) are cheapest for Seedance 2.5 up to 720p. Several Seedance 2.0 resellers cluster at about $0.19–0.21/s at 720p. Higgsfield's subscription credits are price-competitive with, and often cheaper than, the API resellers for Kling 3.0, Seedance 2.0, Veo 3.1 and Nano Banana Pro (see Q3).

### Cited Findings

#### Master price table (cheapest reliable route is bolded per row)

| Model / config | Higgsfield (Ultra $0.043/cr) | kie.ai | fal.ai | Official API | Other resellers |
|---|---|---|---|---|---|
| Kling 3.0 std, no audio | n/a observed | **$0.07/s** (14 cr/s) | ~$0.084/s (per kie's "Official/Fal" column) | ~$0.084/s (0.6 units/s × $0.14/unit) | EvoLink $0.075/s (720p); PiAPI $0.08; AIReiter $0.095 |
| Kling 3.0 std + audio | **$0.043/s** (observed 8 cr / 8s) | $0.10/s (20 cr/s) | ~$0.112/s (kie column) | ~$0.112/s (kie column) | — |
| Kling 3.0 pro (1080p), no audio | n/a | **$0.09/s** (18 cr/s) | ~$0.112–0.12/s | ~$0.112–0.16/s (conflict) | EvoLink $0.106; PiAPI $0.12; AIReiter $0.127 |
| Kling 3.0 pro + audio | **$0.086/s** (observed 12 cr / 6s) | $0.135/s (27 cr/s) | ~$0.14–0.15/s; V3 Pro + voice control $0.392/s | ~$0.14/s (kie column); O3 Pro audio ~$0.40/s (AIReiter) | EvoLink ~$0.112; PiAPI ~$0.15; AIReiter $0.191 |
| Kling 3.0 4K | n/a | **$0.335/s** (67 cr/s, audio same price) | ~$0.42/s (kie column) | ~$0.42–0.48/s | AIReiter $0.477 |
| Seedance 2.0 480p | n/a | $0.095/s (also $0.034–0.059/s on kie's own page, see conflict) | $0.141/s | — | Segmind $0.07; Apiframe $0.08; APIMODELS $0.092; EvoLink $0.092–0.093; WaveSpeed $0.12 |
| Seedance 2.0 720p (audio) | $0.189/s (22 cr / 5s) | $0.205/s | $0.303/s | ~$0.15/s (BytePlus, unverified) | Atlas $0.112 (resolution not stated); **Segmind $0.151**; Apiframe $0.19; APIMODELS $0.197; EvoLink $0.199; WaveSpeed $0.24 |
| Seedance 2.0 1080p | $0.387/s (45 cr / 5s, 3P-reported) | $0.51/s | $0.682/s | ~$0.37/s (BytePlus 5s example $1.87, unverified) | **Segmind $0.34**; Apiframe $0.43; APIMODELS $0.492; EvoLink $0.496–0.497; WaveSpeed $0.60 |
| Seedance 2.0 Fast 720p | — | — | $0.242/s | — | APIMODELS $0.137–0.153; Atlas Fast $0.09 |
| Seedance 2.0 Mini 720p | — | — | $0.155/s | BytePlus list $0.080/s (480p $0.040) | APIMODELS Dreamina line $0.048 |
| Seedance 2.5 480p | $0.129/s (3 cr/s, 3P-reported) | $0.14/s | $0.2205/s | **BytePlus ModelArk $0.1028/s** | Replicate $0.1028; OpenRouter $0.1028; reAPI $0.1186; APIMODELS $0.120; EvoLink $0.136–0.138; Atlas $0.14; WaveSpeed Std $0.18 |
| Seedance 2.5 720p | $0.28/s (6.5 cr/s, 3P-reported) | $0.315/s | $0.473/s | **BytePlus $0.2312/s** (LAS managed $0.4621) | Replicate $0.2312; OpenRouter $0.23112; WaveSpeed Turbo $0.20 (Turbo is a different variant); reAPI $0.2668; APIMODELS $0.270; EvoLink $0.293–0.296; Atlas $0.30; WaveSpeed Std $0.36 |
| Seedance 2.5 1080p | $0.30–0.56/s for 105 cr/clip (depends on clip length, see Q2) | $0.79/s (or "Ask") | ~$1.14–1.164/s | Not offered on ModelArk per CellCog; ~$0.57/s implied by a token rate (inference) | **WaveSpeed Turbo $0.21** (variant); Atlas ~$0.59; EvoLink $0.739 (Oct) / $0.528 (Aug promo, ended) |
| Veo 3.1 Standard (audio) | $0.31/s (29 cr / 4s, 3P-reported) | ~$0.16/s (Quality 1080p $1.275/video, assumes 8s) | — | Google $0.40/s 720p/1080p, $0.60/s 4K | — |
| Veo 3.1 Fast (audio) | ~16 cr/clip (3P, duration unknown) | **~$0.04/s** (1080p $0.325/video, assumes 8s) | — | Google $0.10/s 720p, $0.12 1080p, $0.30 4K | — |
| Veo 3.1 Lite | listed model, cost unknown | — | — | **Google $0.05/s 720p, $0.08/s 1080p** | — |
| Nano Banana Pro (image) | $0.086 (2 cr) | $0.09 (1K/2K), $0.12 (4K) | — | Google $0.134 (1K/2K), $0.24 (4K); **batch $0.067 / $0.12** | — |
| Nano Banana 2 (image) | unknown | — | — | Google $0.045 (0.5K), $0.067 (1K), $0.101 (2K), $0.151 (4K); **batch $0.022 / $0.034 / $0.050 / $0.076** | — |
| GPT Image 2 / 2.5 (image) | $0.065 (GPT Image 2.5 = 1.5 cr, observed) | **GPT Image 2: $0.03 (1K), $0.05 (2K), $0.08 (4K); GPT Image 2.5: $0.03 (1K), $0.05 (2K)** | — | OpenAI gpt-image-2 1024² ≈ $0.006 low / $0.053 med / $0.211 high (token-metered, not confirmed on OpenAI page) | Atlas flat $0.008/image (gpt-image-2); APIYI announced a price cut (Oct 2026) |
| Suno (music) | unknown | not found | not listed | **No official API** (Suno sells only subscriptions: Pro $8, Premier $24/mo) | **Apiframe $0.11/gen (2 tracks ≈ $0.055/track)**; EvoLink $0.111–0.118/gen; Atlas from $0.132/gen |

#### Supporting citations, by model
- **Kling 3.0 on kie.ai** [RESELLER-SELF]: std $0.07/s no audio, $0.10/s with audio. Pro $0.09/s no audio, $0.135/s with audio. 4K $0.335/s with or without audio. 3–15s clips. kie says this is "approximately 80% of the official provider price" and high-tier top-ups give +10% credits. — [kie.ai Kling 3.0](https://kie.ai/kling-3-0)
- **Kling 3.0 Omni on kie.ai pricing page** [RESELLER-SELF]: 720p no audio $0.07 (vs "Official/Fal" $0.084). 720p native audio $0.09 (vs $0.112). 1080p no audio $0.09 (vs $0.112). 1080p audio $0.115 (vs $0.14). 1080p with video input $0.135 (vs $0.168). 4K $0.335 (vs $0.42). Implies 200 credits = $1. — [kie.ai pricing](https://kie.ai/pricing)
- **Official Kling API** [COMPETITOR-MKT, unverified against klingai.com]: units are prepaid. Trial $9.80/100 units ($0.098/unit). $700/5,000 and $2,100/15,000 ($0.14/unit). $5,670/45,000 and $7,560/60,000 (~$0.126/unit). V3/V3-Omni 720p text-to-video with no audio = 0.6 units/s ≈ $0.084/s. Video input = 0.9 units/s. — [Atlas Cloud Kling API pricing](https://www.atlascloud.ai/blog/guides/kling-ai-api-pricing)
- **Official Kling API (conflicting version)** [COMPETITOR-MKT, AIReiter sells Kling access, verified June 2026]: V3 Standard 720p ~$0.10/s (5 credits/s). V3 Pro 1080p ~$0.16/s (8 credits/s). O3 Standard 720p + audio ~$0.24/s (12 credits/s). O3 Pro 1080p + audio ~$0.40/s (20 credits/s). 4K ~$0.48/s. Packages: $9.80 trial (~500 credits, 30 days), Starter $98, Standard $980, Enterprise $4,200. — [AIReiter Kling 3 API pricing](https://aireiter.com/blog/kling-3-api-pricing-guide-2026)
- **Kling 3.0 on resellers (June 2026, AIReiter table)**. EvoLink: $0.075 (720p), $0.106 (1080p), ~$0.112 (1080p + audio). fal.ai: ~$0.08, ~$0.12, ~$0.15. PiAPI: $0.08, $0.12, ~$0.15. AIReiter: $0.095, $0.127, $0.191, 4K $0.477. — [AIReiter](https://aireiter.com/blog/kling-3-api-pricing-guide-2026)
- **fal.ai Kling 3** [OFFICIAL, via search summary]: pay-per-second, no minimums. Text-to-video ranges from $0.168/s (Standard, audio off) to $0.392/s (V3 Pro with voice control). A 5s O3 Standard clip with audio is $1.12 ($0.224/s). This **conflicts** with AIReiter's ~$0.08/s and kie's "$0.084 Official/Fal" figure, possibly because they describe different endpoints (V3 vs O3/Omni). — [fal.ai Kling 3](https://fal.ai/kling-3)
- **Seedance 2.0 provider table, checked 2026-08-20** [COMPETITOR-MKT: Apiframe]. Apiframe: $0.08 / $0.19 / $0.43 (480p/720p/1080p). fal: — / $0.303 / $0.682. WaveSpeed: $0.12 / $0.24 / $0.60. EvoLink: $0.092 / $0.199 / $0.496. Segmind: $0.07 / $0.151 / $0.34 (token-based estimate). Atlas: $0.112 at 720p only. — [Apiframe Seedance 2.0 pricing](https://apiframe.ai/models/seedance-2.0/pricing)
- **Seedance 2.0 / 2.5 / Fast / Mini, checked 2026-09-30** [COMPETITOR-MKT: APIMODELS]. 2.0 at 480p/720p/1080p: APIMODELS $0.092/$0.197/$0.492, EvoLink $0.093/$0.199/$0.497, kie $0.095/$0.205/$0.510, fal $0.141/$0.303/$0.682. 2.5 at the same resolutions: APIMODELS $0.120/$0.270/—, EvoLink $0.138/$0.296/$0.739, kie $0.140/$0.315/$0.790, fal $0.221/$0.473/$1.164. BytePlus token formula: tokens = (input s + output s) × W × H × 24 / 1024, which is ≈9,607 tok/s at 480p, 21,600 at 720p and 48,600 at 1080p. BytePlus Mini list price: $0.040/s 480p, $0.080/s 720p. — [APIMODELS Seedance pricing](https://apimodels.app/access/seedance-api-pricing)
- **Seedance 2.0 on kie's own page** [RESELLER-SELF] **conflicts** with the third-party figures above. It lists 480p at 6.8 cr/s ($0.034/s) with video input or 11.7 cr/s ($0.059/s) without, and 720p at 15 cr/s ($0.075/s) with video input or 24.8 cr/s ($0.124/s) without. It is marked "Prices are currently in beta". — [kie.ai Seedance 2.0](https://kie.ai/seedance-2-0) (via search summary). Kinovi lists kie Seedance 2.0 at $0.095 / $0.205 / $0.51 / $1.04 (480p/720p/1080p/4K). It also notes that the Fast/Mini promo ended Oct 7. — [Kinovi](https://kinovi.ai/blogs/kie-ai-alternatives)
- **Seedance 2.0 official BytePlus**: ModelArk bills by tokens (`usage.completion_tokens` of the successful task), not by the second. A July 2026 comparison gives 5s no-video-input estimates of ~$0.35 (480p), $0.76 (720p), $1.87 (1080p) and $3.89 (4K). Picasso IA puts 720p at ~$0.15/s. OpenRouter lists $0.06726/s (480p) and $0.1512/s (720p). Atlas lists Seedance 2.0 at $0.112/s and Fast at $0.09/s. All are unverified against byteplus.com. — [laozhang comparison](https://blog.laozhang.ai/es/posts/seedance-2-api-providers-comparison.md); [Picasso IA](https://blog.picassoia.com/seedance-api-pricing-key-byteplus-access-and-docs); [Atlas Cloud](https://www.atlascloud.ai/blog/seedance-2.0-pricing-full-cost-breakdown-2026)
- **Seedance 2.5 table, Aug 22 and re-checked Oct 6, 2026** [COMPETITOR-MKT: CellCog sells a Seedance-based agent, but gives no per-second rate of its own]. BytePlus ModelArk official: $0.1028 (480p), $0.2312 (720p), 1080p not offered, audio included. BytePlus LAS managed: $0.2056 / $0.4621. Replicate: $0.1028 / $0.2312. fal: $0.2205 / $0.4730 / ~$1.164. kie: $0.14 / $0.315 / Ask. WaveSpeed Standard: $0.18 / $0.36. WaveSpeed Turbo: 720p $0.20, 1080p $0.21. Atlas: $0.14 / $0.30 / ~$0.59. EvoLink: $0.138 / $0.296 / $0.739. reAPI: $0.1186 / $0.2668. OpenRouter: from $0.1028 / $0.23112. No provider charges an audio surcharge. Reference-video jobs bill input plus output seconds. The Atlas and EvoLink 1080p promos ended Sep 17, 2026. — [CellCog Seedance 2.5 pricing](https://cellcog.ai/blog/seedance-2-5-pricing/)
- OpenRouter's Seedance 2.5 page: $0.1028/s (480p) and $0.23112/s (720p) with no video input. — [OpenRouter](https://openrouter.ai/bytedance/seedance-2.5) (via search summary)
- **Veo 3.1 / Nano Banana official** [OFFICIAL]. Veo 3.1 Standard (with audio): $0.40/s at 720p and 1080p, $0.60/s at 4K. Veo 3.1 Fast: $0.10 / $0.12 / $0.30. Veo 3.1 Lite: $0.05 (720p), $0.08 (1080p), no 4K. No-audio and Veo batch prices are not listed. Nano Banana Pro (gemini-3-pro-image): $0.134 (1K/2K), $0.24 (4K); batch $0.067 / $0.12. Nano Banana 2 (gemini-3.1-flash-image): $0.045 (0.5K), $0.067 (1K), $0.101 (2K), $0.151 (4K); batch $0.022 / $0.034 / $0.050 / $0.076. Batch API = 50% off. — [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing). Vertex AI pricing page was not fetched; it is assumed similar but unverified.
- **kie.ai image/Veo** [RESELLER-SELF]. Nano Banana Pro: 18 cr ($0.09) at 1K/2K, 24 cr ($0.12) at 4K. GPT Image 2: ~$0.03 / $0.05 / $0.08 (1K/2K/4K). GPT Image 2.5: ~$0.03 / $0.05 (1K/2K). Veo 3.1 Fast 1080p $0.325/video. Veo 3.1 Quality 1080p $1.275/video. Veo 3.1 Quality image-to-video 4K $1.85/video. — [kie.ai homepage](https://kie.ai/); [kie.ai Nano Banana Pro](https://kie.ai/nano-banana-pro) (via search summary). Veo per-video prices are converted to $/s assuming the default 8s clip; that assumption is unverified.
- **GPT Image 2, OpenAI official**: token-metered at $30/M image output tokens. 1024×1024 ≈ $0.006 (low), $0.053 (medium), $0.211 (high). One aggregator lists high at $0.422. Not confirmed on openai.com. — [AIReiter GPT Image 2 pricing](https://aireiter.com/blog/gpt-image-2-api-pricing); [LLM Reference](https://www.llmreference.com/model/gpt-image-2/openai-api). Atlas resells at a flat $0.008/image. — [Atlas Cloud GPT Image 2](https://www.atlascloud.ai/blog/gpt-image-2-api-guide). APIYI posted a "gpt-image-2-all price cut" notice in Oct 2026; the amount was not fetched. — [APIYI docs](https://docs.apiyi.com/en/live/2026-10/gpt-image-2-all-price-cut)
- **Suno**: Suno has no official API; consumer plans are Free, Pro $8/mo and Premier $24/mo. Apiframe charges $0.11 per generation (2 tracks), checked 2026-08-20 [COMPETITOR-MKT]. EvoLink charges 8 credits ≈ $0.111–0.118 per generation (2 tracks) [RESELLER-SELF, Mar 2026]. Atlas charges from $0.132. Extend, cover, add-vocals and stems are each billed as a separate generation. CostBench figures ($0.10–0.25/song) conflict. — [Apiframe Suno pricing](https://apiframe.ai/models/suno/pricing); [EvoLink Suno API pricing](https://evolink.ai/blog/suno-api-pricing); [CostBench](https://costbench.com/software/ai-music-apis/suno-api/)

#### Billing terms: expiry, failed jobs, concurrency
- **kie.ai**: $0.005/credit (200 cr = $1), starting around $5. Credits reportedly never expire, and failed generations are not charged [3P-BLOG]. — [Bitdoze kie.ai review](https://www.bitdoze.com/kie-ai-review/) (via search summary). kie's Kling page does not address refunds, concurrency or expiry. — [kie.ai Kling 3.0](https://kie.ai/kling-3-0)
- **Official Kling API**: failed API tasks are not charged, and there is a $9.80 trial package valid 30 days. Larger packages last 90 days. — [AIReiter](https://aireiter.com/blog/kling-3-api-pricing-guide-2026). This **conflicts** with Atlas, which says standard packages last 180 days with 20 concurrent tasks (trial: 30 days, 5 concurrent). Units don't roll over, and API units are separate from web-subscription credits. — [Atlas Cloud](https://www.atlascloud.ai/blog/guides/kling-ai-api-pricing)
- **EvoLink**: prepaid credits with no expiry. **fal / PiAPI / AIReiter**: pay-as-you-go with no minimum and no expiry. — [AIReiter](https://aireiter.com/blog/kling-3-api-pricing-guide-2026)
- **Higgsfield**: subscription credits expire at the end of each billing cycle with no rollover. Top-ups expire after 90 days and need an active subscription. Refunds are only available within 7 days with zero credits used. — [Scopeful](https://www.scopeful.org/blog/higgsfield-pricing-2026). The 90-day top-up expiry is confirmed by live account data (`topup_expire_days: 90`).

### Inferences
- Cheapest reliable routes by model:
  - **Kling 3.0**: kie.ai among APIs. Higgsfield Ultra credits are cheaper still for std/pro with audio.
  - **Seedance 2.5 ≤720p**: BytePlus / Replicate / OpenRouter at the official $0.1028 / $0.2312 per second.
  - **Seedance 2.5 1080p**: no official route. The cheapest published price is the WaveSpeed Turbo variant at $0.21/s, but it is a different, likely distilled, variant. The cheapest standard 1080p is Atlas at ~$0.59/s.
  - **Seedance 2.0**: Segmind and the cluster of Apiframe, APIMODELS and EvoLink, at about $0.15–0.20/s for 720p.
  - **Veo 3.1**: Lite on Google at $0.05–0.08/s, or Fast via kie at about $0.04/s if the 8s assumption holds.
  - **Nano Banana Pro/2**: Google batch API.
  - **GPT Image**: kie.ai or Atlas.
  - **Suno**: Apiframe or EvoLink at about $0.055 per track.
- Reseller prices undercutting official list prices (kie's Veo at ~10% of Google's, Atlas GPT Image at $0.008) imply subsidized, promotional, or grey-market capacity. Treat them as less reliable for production SLAs.
- Watch Seedance 2.5 billing: reference-video and video-edit jobs count input seconds too, so finished-second cost can be roughly 2x the headline rate.

### Gaps
- Could not load klingai.com/dev/pricing, byteplus.com ModelArk pricing, or console.volcengine.com directly. The official Kling and BytePlus numbers above come via resellers or competitors.
- No Replicate prices found for Kling 3.0, Veo, Nano Banana or Seedance 2.0 (only Seedance 2.5).
- No WaveSpeed Kling 3.0 or Veo prices found.
- No PiAPI Seedance prices found. No useapi.net prices for any model. APIYI's actual price-cut figures were not retrieved.
- Vertex AI (vs Gemini API) Veo/Nano Banana pricing not fetched. Veo no-audio pricing is not on the Gemini page.
- kie.ai Suno and Nano Banana 2 per-generation prices not found.
- fal.ai Kling 3.0 per-endpoint rates conflict ($0.08 vs $0.168/s for std no-audio). Confirm on each endpoint's playground page.

---

## Q2. Higgsfield per-model credit costs: confirm/extend and compute $/second

### Takeaway
The user's observed costs are internally consistent at 1 credit/s for Kling 3.0 std + audio and 2 credits/s for pro + audio. On Ultra monthly ($0.043/credit) that is $0.043/s and $0.086/s, the cheapest Kling 3.0 pricing found anywhere. Third-party blogs (Aug–Oct 2026) add Seedance 2.0 at about 4.4 cr/s (720p) and 9 cr/s (1080p), Seedance 2.5 at 3 cr/s (480p) and 6.5 cr/s (720p), Veo 3.1 at about 7.25 cr/s, and Nano Banana Pro at 2 credits (confirmed). Higgsfield exposes no per-model credit prices through its MCP model catalog, and its pricing page body did not render.

### Cited Findings
- **Live account data (Higgsfield MCP `show_plans_and_credits`, 2026-10-14)** [OFFICIAL]: the account is on **Ultra**.
  - One-time top-up packs:
    - 500 cr for $29.41 ($0.0588/cr)
    - 1,000 cr for $55.56 ($0.0556/cr)
    - 2,000 cr for $105.26 ($0.0526/cr)
    - 4,000 cr for $210.53 ($0.0526/cr)
  - Those prices are shown as 31–38% off "original" prices of $42.50–$340, i.e. $0.085/cr list.
  - Auto-refill: 20 credits/$ ($0.05/cr), in options of $20, $40, $90, $150 or $300, with a 300-credit threshold.
  - `topup_expire_days: 90`.
  - — [Higgsfield credits page](https://higgsfield.ai/mcp-credits)
- **Higgsfield model catalog (MCP `models_explore`)** [OFFICIAL]. Kling 3.0 (`kling3_0`) has modes std/pro/4k, sound on/off ("off for silent video and lower credits"), 3–15s, and is flagged `supports_unlim`. Seedance 2.5 (`seedance_2_5`) runs 4–30s at 480p/720p/1080p with audio on by default. It has a `draft` option: a 480p draft that can be finalized at 1080p within 7 days. It also has t2v, omni_reference, video_edit (billed by the reference video's duration) and video_extension modes. Seedance 2.0, Kling 3.0 Motion Control, Wan 2.7 and Gemini Omni are also `supports_unlim`. The catalog also lists Kling 3.0 Turbo, Kling 3.0 Omni, Veo 3.1, Veo 3.1 Lite and Veo 3. No credit prices are returned. — [Higgsfield](https://higgsfield.ai/)
- **Scopeful (Aug 7, 2026)** [3P-BLOG]:
  - Kling 3.0 720p 5s = 7 cr
  - Seedance 2.0 720p 5s = 22 cr
  - Veo 3.1 4s = 29 cr
  - Veo 3 8s = 58 cr
  - Nano Banana = 1 cr; Nano Banana Pro = 2 cr
  - Soul 2.0 = 0.12 cr; FLUX.2 Max = 4 cr
  - DoP Lite 720p 3s = 3 cr; DoP Standard = 7 cr
  - Plans: Starter $19/270 cr, Plus $59 monthly or $47 annual/1,200 cr, Ultra $129 or $99 annual/3,000 cr
  - — [Scopeful](https://www.scopeful.org/blog/higgsfield-pricing-2026)
- **Wireflow / Kive** [3P-BLOG]: Kling 3.0 ~8 cr at 1080p. Seedance 2.0 ~45 cr for 1080p 5s. Veo 3.1 ~40 cr and Veo 3.1 Fast ~16 cr (durations unclear). Kling 3.0 8s ≈ 14 cr. Nano Banana Pro 2 cr (consistent across sources). — [Wireflow](https://www.wireflow.ai/blog/higgsfield-ai-pricing); [Kive](https://kive.ai/learn/is-higgsfield-worth-it) (via search summary)
- **CellCog (Aug/Oct 2026)** [COMPETITOR-MKT]: Higgsfield Seedance 2.5 costs 3 cr/s at 480p and 6.5 cr/s at 720p (8s 720p = 52 cr ≈ $2.55). It said this required the $49 Plus plan (1,000 cr), was MCP/CLI-only at the time, and had no 1080p rate stated. — [CellCog](https://cellcog.ai/blog/seedance-2-5-pricing/)
- Plan price **conflict**. Higgsfield's own blog (Sep 11, 2026) lists Starter $15, Plus $49 and Ultra $129 (or $99 annual) — [Higgsfield blog](https://higgsfield.ai/blog/annual-unlimited-ai-video-plans). Scopeful lists Starter $19 and Plus $59 / $47 annual. Krea [COMPETITOR-MKT] lists Plus at $59 monthly or $47 annual. — [Krea](https://www.krea.ai/blog/higgsfield-pricing-explained-2026-unlimited-credits-and-real-monthly-costs)

#### Computed Higgsfield $/second (computations are mine, from the credit figures above)

| Model / config | Credits | cr/s | $/s @ Ultra monthly ($0.043) | @ Ultra annual ($0.033) | @ auto-refill ($0.050) | @ 4k pack ($0.0526) |
|---|---|---|---|---|---|---|
| Kling 3.0 std + audio, 8s (observed) | 8 | 1.0 | **$0.043** | $0.033 | $0.050 | $0.053 |
| Kling 3.0 pro + audio, 6s (observed) | 12 | 2.0 | **$0.086** | $0.066 | $0.100 | $0.105 |
| Kling 3.0 720p 5s (Scopeful) | 7 | 1.4 | $0.060 | $0.046 | $0.070 | $0.074 |
| Seedance 2.0 720p 5s | 22 | 4.4 | $0.189 | $0.145 | $0.220 | $0.232 |
| Seedance 2.0 1080p 5s | 45 | 9.0 | $0.387 | $0.297 | $0.450 | $0.474 |
| Seedance 2.5 480p (CellCog) | 3/s | 3.0 | $0.129 | $0.099 | $0.150 | $0.158 |
| Seedance 2.5 720p (CellCog) | 6.5/s | 6.5 | $0.280 | $0.215 | $0.325 | $0.342 |
| Seedance 2.5, 105 cr/clip (observed), if 8s | 105 | 13.1 | $0.564 | $0.433 | $0.656 | $0.690 |
| Same, if 10s | 105 | 10.5 | $0.452 | $0.347 | $0.525 | $0.552 |
| Same, if 15s | 105 | 7.0 | $0.301 | $0.231 | $0.350 | $0.368 |
| Veo 3.1, 4s (Scopeful/Kive) | 29 | 7.25 | $0.312 | $0.239 | $0.363 | $0.381 |
| Nano Banana Pro (per image) | 2 | — | $0.086 | $0.066 | $0.100 | $0.105 |
| GPT Image 2.5 (per image, observed) | 1.5 | — | $0.065 | $0.050 | $0.075 | $0.079 |

### Inferences
- The observed Kling figures fit a linear per-second rate (std + audio = 1 cr/s, pro + audio = 2 cr/s). The Scopeful "7 cr / 5s at 720p" (1.4 cr/s) is probably an older rate or a different variant (e.g. Kling 3.0 Turbo or 2.6). The team's observed rates should be treated as current.
- The 105-credit Seedance 2.5 clip is consistent with 1080p at ~8s (13.1 cr/s ≈ 2× the 720p rate, mirroring the 2.0 ratio of 4.4 → 9). It is also consistent with 720p at ~16s (6.5 cr/s). The team should record duration and resolution per job to pin this down. If it is 1080p 8s, Higgsfield's ~$0.56/s beats fal ($1.16), kie ($0.79) and EvoLink ($0.74), and is on par with Atlas ($0.59).
- Top-up credits ($0.05–0.059) are 16–37% more expensive per credit than Ultra monthly plan credits ($0.043). Using plan credits first and auto-refill (cheapest top-up at $0.05) over one-time packs is optimal. Higgsfield's "38% off" top-up framing is relative to an $0.085/cr list price.

### Gaps
- Higgsfield's pricing page did not render, and the MCP catalog has no per-model credit prices. As a result, Kling 3.0 no-audio, Kling 4K, Seedance 2.5 1080p, Veo 3.1 Fast/Lite, Nano Banana 2 and any music model credit costs on Higgsfield remain unconfirmed.
- Ultra plan contents (3,000 cr / $129) come from the brief and third-party blogs. The live MCP call did not return plan cards because the account is already subscribed.
- Whether Higgsfield refunds credits for failed or moderated generations: not found.

---

## Q3. Which platform wins for each model, and by how much, vs Higgsfield

### Takeaway
At Ultra-plan credit value, Higgsfield beats every API reseller found for **Kling 3.0** (by 37–57%), **Seedance 2.0** (by ~8–25% vs the median reseller), **Veo 3.1 Standard** (22% under Google list) and **Nano Banana Pro** (vs Google standard and kie). It loses on **Seedance 2.5 ≤720p** (official/Replicate is ~17–20% cheaper), **Nano Banana via Google batch** (22% cheaper), **GPT Image** (kie is ~54% cheaper) and **Veo 3.1 Fast/Lite**. At top-up rates ($0.05–0.053), Higgsfield's lead on Kling shrinks but persists. Its other leads mostly disappear.

### Cited Findings
- Higgsfield credit values are from the live account data and the user brief (Q2). All competitor prices are as cited in Q1: [kie.ai Kling 3.0](https://kie.ai/kling-3-0), [CellCog](https://cellcog.ai/blog/seedance-2-5-pricing/), [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing), [APIMODELS](https://apimodels.app/access/seedance-api-pricing), [Apiframe](https://apiframe.ai/models/seedance-2.0/pricing), [kie.ai](https://kie.ai/).

#### Head-to-head (Higgsfield @ Ultra $0.043/cr vs best alternative)

| Model / config | Higgsfield $/unit | Best alternative | Alt $/unit | Winner and margin |
|---|---|---|---|---|
| Kling 3.0 std + audio | $0.043/s | kie.ai | $0.10/s | **Higgsfield, 57% cheaper** (at $0.053/cr top-up: still 47% cheaper) |
| Kling 3.0 pro + audio | $0.086/s | EvoLink ~$0.112 / kie $0.135 | $0.112/s | **Higgsfield, 23% cheaper than EvoLink, 36% cheaper than kie** (at top-up $0.105: ~equal to EvoLink) |
| Seedance 2.0 720p | $0.189/s | Segmind $0.151 / Atlas $0.112 | $0.112–0.151/s | **Atlas/Segmind, 20–41% cheaper**; Higgsfield beats kie ($0.205), EvoLink ($0.199), fal ($0.303) |
| Seedance 2.0 1080p | $0.387/s | Segmind | $0.34/s | **Segmind 12% cheaper**; Higgsfield beats Apiframe ($0.43), EvoLink ($0.496), kie ($0.51), fal ($0.682) |
| Seedance 2.5 480p | $0.129/s | BytePlus / Replicate / OpenRouter | $0.1028/s | **Official, 20% cheaper** |
| Seedance 2.5 720p | $0.280/s | BytePlus / Replicate / OpenRouter | $0.2312/s | **Official, 17% cheaper**; Higgsfield beats kie ($0.315), EvoLink ($0.296), fal ($0.473) |
| Seedance 2.5 1080p (105 cr, assumed 8s) | ~$0.56/s | Atlas ~$0.59; EvoLink $0.739; kie $0.79; fal $1.16 | — | **Higgsfield cheapest standard 1080p** (if the 8s assumption holds); WaveSpeed Turbo $0.21 is a different variant |
| Veo 3.1 Standard | $0.312/s | Google $0.40/s; kie ~$0.16/s (8s assumption) | — | Higgsfield 22% below Google list; kie reportedly ~50% below Higgsfield (unverified unit) |
| Veo 3.1 Fast | unknown (~16 cr/clip) | kie ~$0.04/s; Google $0.10–0.12/s | — | Likely kie / Google |
| Nano Banana Pro | $0.086 | Google batch $0.067 | $0.067 | **Google batch, 22% cheaper** (non-realtime); Higgsfield beats kie ($0.09) and Google standard ($0.134) |
| Nano Banana 2 | unknown | Google batch $0.034 (1K) | — | Google batch |
| GPT Image 2.5 | $0.065 | kie $0.03 (1K) | $0.03 | **kie, 54% cheaper**; Atlas GPT Image 2 at $0.008 |
| Suno | unknown | Apiframe / EvoLink | ~$0.055/track | Resellers (no Higgsfield data) |

### Inferences
- For a Kling-heavy pipeline, Higgsfield Ultra (or annual at $0.033/cr) is the cheapest route found by a wide margin. The tradeoffs:
  - Higgsfield is a consumer platform with plan-credit expiry.
  - It has MCP/CLI access but no documented API SLA or concurrency.
  - Top-ups must be bought to scale beyond 3,000 cr/month.
- For a Seedance 2.5 pipeline at ≤720p, the official BytePlus ModelArk API or Replicate is cheaper and more "official". A mixed stack is cost-optimal: Kling on Higgsfield, Seedance 2.5 ≤720p on BytePlus/Replicate, and images on Google batch or kie.
- Example finished-video math (1 clip = 8s, Kling 3.0 pro + audio): Higgsfield Ultra $0.69, kie $1.08, fal ~$1.12–1.20, official ~$1.12–1.28.

### Gaps
- Margins depend on unverified third-party Higgsfield credit figures for Seedance 2.0 and Veo 3.1, and on the unknown duration and resolution of the observed 105-credit Seedance 2.5 clip.
- Quality and resolution parity across platforms (e.g. whether Higgsfield "pro" = 1080p, whether resellers serve the identical model version) was not verified.
- Retry/failure rates per platform (which affect real cost per usable second) were not found.

---

## Q4. "Unlimited" plans and their real fair-use limits

### Takeaway
Higgsfield's "unlimited" is time-boxed and web-UI-only. Plus/Ultra get a 365-day unlimited set of older image models. Ultra adds 7-day unlimited windows on Nano Banana Pro, Nano Banana 2 and Kling 3.0 (annual billing). It runs one video or two images at a time in a standard (non-priority) queue, and MCP/CLI/API usage still burns credits. Kling, Runway, Luma, Google and Grok offer no unlimited generation on current plans. Runway stopped selling Unlimited on June 1, 2026.

### Cited Findings
- Per Higgsfield's own blog (Sep 11, 2026) [OFFICIAL but self-promotional]:
  - Plus ($49/mo) gets a 365-day unlimited set of six image models: Seedream 5.0 Lite, Flux.2 Pro 1K, Seedream 4.5, Nano Banana, Kling O1 Image and GPT Image. The set is activated once and lasts 365 days while subscribed.
  - Ultra ($129/mo or $99 annual) adds 7-day unlimited windows on Nano Banana Pro, Nano Banana 2 and Kling 3.0 (annual billing).
  - Newer flagships come as 7-day windows or as 1-, 3- or 7-day Marketplace passes, from $7/model. A 7-day all-models pass is $1,035.
  - The "All Unlimited" catalog has 20+ models (incl. Seedream 5.0 Pro, Kling 3.0 Motion Control, Soul 2.0, Wan 2.7).
  - **Restrictions**: unlimited runs only on higgsfield.ai, in a standard queue with **1 video or 2 images at a time** and no priority queue. **MCP, CLI, Canvas, Supercomputer and Marketing Studio use credits.** Cancelling pauses the set.
  - — [Higgsfield blog](https://higgsfield.ai/blog/annual-unlimited-ai-video-plans)
- The same source lists Kling's own plans as credit-only with no unlimited mode: Standard $79.20/yr (660 cr/mo), Pro $293.04/yr (3,000 cr/mo), Premier $728.64/yr (8,000 cr/mo), Ultra $1,429.99/yr (26,000 cr/mo). Annual is 34% below list, and unused credits expire each cycle. It also says Runway ended new Unlimited sales on June 1, 2026 (legacy users keep it until Nov 30, 2026). Runway's current tiers are Standard $12 (625 cr), Pro $28 (2,250) and Max $76 (9,500). Luma, Google and Grok have no unlimited plans. Adobe Firefly has first-year unlimited on select models. — [Higgsfield blog](https://higgsfield.ai/blog/annual-unlimited-ai-video-plans) [COMPETITOR-MKT for the competitor claims]
- Krea [COMPETITOR-MKT] says Plus includes 7 days of Unlimited Kling 3.0 and that the newest flagships get shorter access windows. — [Krea](https://www.krea.ai/blog/higgsfield-pricing-explained-2026-unlimited-credits-and-real-monthly-costs) (via search summary)
- Live account data shows `unlim.available: false` on the Ultra account for Kling 3.0 and Seedance 2.5 via MCP, which is consistent with MCP being credit-billed. Seedance 2.0, Kling 3.0, Kling 3.0 Motion Control, Wan 2.7 and Gemini Omni carry `supports_unlim: true` in the catalog. — Higgsfield MCP `models_explore`, 2026-10-14

### Inferences
- For automated, at-scale production (MCP/CLI/API), Higgsfield "unlimited" provides **no** benefit, because credits are charged. It only helps human operators generating serially in the web UI: one video at a time, standard queue, 7-day windows.
- Rough ceiling for manual use: at ~2–5 min per Kling clip in a single-concurrency queue, a 7-day Kling window yields hundreds to low thousands of clips per operator. This is an inference; no published throughput or daily caps were found.

### Gaps
- No published numeric fair-use or daily cap for Higgsfield unlimited, and no Reddit threads documenting throttling were found in the search.
- Whether the 7-day Kling 3.0 unlimited covers pro/4K/audio modes or std only is not stated.
- No information found on Kling consumer "unlimited" (the vendor-sourced claim is that none exists) or on other aggregators' unlimited tiers.
