# Self-Hosting Open-Source AI Video Models on Rented Cloud GPUs (as of Oct 2026)

Context: a small agency making hundreds of fully AI-animated concepts per month and paying Kling 3.0 / Seedance through Higgsfield at about $0.05-0.10 per second of 1080p video. Research date: 2026-10-14. Data older than 2026 is labeled. Vendor pages and SEO "guide" sites are flagged where they are the only source.

## 1. Best current open video models and how they compare to Kling 3.0 / Seedance 2.x / Veo 3.1

### Takeaway
As of Oct 2026, the open-weight models you can actually download are LTX-2.5 (Lightricks, Jul/Aug 2026; has audio, fast, many LoRAs), Wan 2.2 (Jul 2025; Apache 2.0; still the best open model for photoreal humans and identity), the Wan 2.2-Animate-2 and Wan-Dancer add-ons (2026), HunyuanVideo 1.5 (Nov 2025), and MiniMax H3 (Jul 2026). H3 is the strongest, but its license excludes the US, EU, UK and South Korea, and it needs about 4 GPUs. Wan 2.5, 2.6 and 2.7 are API-only. No source I found shows an open model matching Kling 3.0 or Seedance 2.x head-to-head for character animation or lip-sync. Practitioners say open models can get there with LoRAs, seed-hunting and more labor.

### Cited Findings
**What is actually downloadable (checked directly on the Hugging Face API, 2026-10-14):**
- Wan-AI's newest Hugging Face repos are Wan2.2-Animate-2-14B (2026-07-14; Diffusers and Distilled versions 2026-08-06) and Wan-Dancer-14B (2026-07-10). The base T2V/I2V models are still Wan2.2-T2V-A14B, I2V-A14B and TI2V-5B (July 2025). There are no Wan 2.5, 2.6, 2.7 or 3.0 weights. — [HF API: Wan-AI models](https://huggingface.co/api/models?author=Wan-AI&sort=createdAt&direction=-1)
- Sources conflict on Wan 2.7. One guide says "The weights are on Hugging Face under Apache 2.0", released April 22, 2026 ([runaihome](https://runaihome.com/blog/wan-video-local-ai-gpu-guide-2026/)). Another analysis says the official GitHub, Hugging Face and ModelScope orgs list no Wan 2.7 weights, and that Wan 2.5 and 2.6 never shipped weights ([howaiworks.ai](https://howaiworks.ai/blog/alibaba-wan-open-weights-stopped-at-2-2)). My direct Hugging Face check supports the second source. A Reddit commenter (Jul 2026) also says: "Wan2.6 is not local, they only released Wan2.2 models" ([r/comfyui](https://www.reddit.com/r/comfyui/comments/1uywza4/comment/oy75ccq/)).
- **LTX-2.5** (Lightricks): Hugging Face repo created 2026-07-23. Public release Aug 11, 2026. It is a 22B model with synced audio generation. A distilled checkpoint runs a fixed 8-step schedule at CFG=1, with int8 (ComfyUI) and NVFP4 (Blackwell) builds. The license is free for commercial and production use under $10M annual revenue; above that a paid license is needed. — [LTX-2.5 model card](https://huggingface.co/Lightricks/LTX-2.5); [Fuser](https://fuser.studio/articles/best-open-source-video-models) (release date)
- Lightricks shipped many official LTX-2.5 LoRAs in Sep 2026: Ingredients (reference conditioning), Restore, Refine-Details, Deblur, SDR-to-HDR, Slow-Motion-Control, Cinemagraph, Clean-Plate and Layout-To-Render. — [HF API: Lightricks models](https://huggingface.co/api/models?author=Lightricks&sort=createdAt&direction=-1)
- **MiniMax H3** (weights on Hugging Face 2026-07-28): 33B dense transformer. Native 32 kHz stereo audio and dialogue in 11 languages. 4-15 s clips at 768p by default; 2K needs a "Regenerate-2K" stage. Reference mode takes up to 9 images, 3 videos and 3 audio clips. The reference deployment uses `--num-gpus 4`. The "H3-Context-IR" prompt-processing module, which MiniMax calls "critical to the quality of the final output", is not open-sourced and is offered only by API. The license excludes the US, EU, UK and South Korea unless you apply, needs authorisation above $20M revenue, and requires attribution. — [MiniMax-H3 model card](https://huggingface.co/MiniMaxAI/MiniMax-H3); [Fuser](https://fuser.studio/articles/best-open-source-video-models)
- **HunyuanVideo 1.5** (Nov 2025, older): 8.3B parameters, minimum 14 GB VRAM with offload. It includes 720p and 1080p super-resolution step-distilled models. A 480p I2V step-distilled model (8-12 steps) "can generate videos within 75 seconds" on one RTX 4090. The license is the Tencent Hunyuan Community license, not Apache. Tencent had no newer HunyuanVideo repo on Hugging Face as of Oct 2026. — [HunyuanVideo-1.5 model card](https://huggingface.co/tencent/HunyuanVideo-1.5); [HF API: tencent](https://huggingface.co/api/models?search=HunyuanVideo&author=tencent)
- Mochi and CogVideoX: none of the 2026 sources I reviewed list them among the leaders. Treat them as superseded (inference from their absence in rankings).

**Quality versus closed models:**
- A Wikipedia summary (seen only via a search snippet) says LTX-2 ranked third for image-to-video in the Artificial Analysis benchmark, behind Kling 3.5 and Veo 3.1. I could not fetch the leaderboard itself. — [Wikipedia: LTX](https://en.wikipedia.org/wiki/LTX_(text-to-video_model)) (unverified)
- In Fuser's Sep 2026 tests (Fuser hosts these models): Wan 2.2 A14B "had the most convincing clay surface but its camera barely moved across three runs". For camera direction, the article recommends LTX-2.5, MiniMax H3 or Kling 3.0 instead. LTX-2.5 made the strongest dolly-in and best kept the source image's look in I2V. H3 relit the scene and added music nobody asked for. — [Fuser](https://fuser.studio/articles/best-open-source-video-models)
- In a community comparison, Wan "still produces more photorealistic humans (faces, skin, hair)" than LTX-2.5. LTX-2.5 is claimed to be 3-4x faster than Wan 2.2 and HunyuanVideo, and Hunyuan is called stronger on physics-heavy motion. These are secondary community claims, not the author's own tests. — [runaihome LTX-2.5 guide, Aug 2026](https://runaihome.com/blog/ltx-2-5-local-ai-video-hardware-guide-2026/)
- Practitioners disagree in r/comfyui (Jul 2026):
  - One says "Wan 2.2 is almost pointless now with all the LTX Lora's. It's much slower than LTX" ([RKAScope](https://www.reddit.com/r/comfyui/comments/1uywza4/comment/oy2sg6m/)).
  - Another replies "I've never managed to get LTX looking as good as wan" ([dr_lm](https://www.reddit.com/r/comfyui/comments/1uywza4/comment/oy3pvdd/)).
  - A third went back to Wan 2.2 because of "identity drift" in LTX 2.3 and says Wan is "more consistent not only in preserving identity but also in just cleaner motion" ([Brad12d3](https://www.reddit.com/r/comfyui/comments/1uywza4/comment/oy33qtb/)).
  - Another warns that LTX 2.3 clips over about 6 s show "clothing and faces funk" ([tostane](https://www.reddit.com/r/comfyui/comments/1uywza4/comment/oy6os58/)).
- On lip-sync and multi-character work, one user says LTX 2.3 "does great lipsync out of the box". With the Ingredients LoRA they had 5 characters in a clip (one singing lip-synced) and "it kept track of everyone correctly. That is more than I can say for Veo or any of the other API models". This is a single anecdote. — [Alchemist42, r/comfyui](https://www.reddit.com/r/comfyui/comments/1uywza4/comment/oy3eupg/)
- For hands touching objects in close-up (the agency's "product shot" case), practitioners say it comes down to seed-hunting ("rolling different seeds... most of my job at this point"). They do not name any open model as reliably good at it. — [DaLyon92x](https://www.reddit.com/r/comfyui/comments/1uywza4/comment/oy2ongn/)
- Native output limits: Wan 2.2 A14B is 480p/720p at 16 fps with 81 frames (about 5 s) and no audio. LTX-2.5 hosted goes up to 1080p (and 4K for 10 s) with audio. — [Fuser](https://fuser.studio/articles/best-open-source-video-models); [Brad12d3](https://www.reddit.com/r/comfyui/comments/1uywza4/comment/oy33qtb/)

### Inferences
- The realistic open stack in Oct 2026 has three parts: LTX-2.5 (speed, audio and lip-sync, LoRA ecosystem), Wan 2.2 plus Wan-Animate-2 (photoreal people, identity, motion transfer), and an upscaler. MiniMax H3 is probably closest to closed-model quality, but a US/EU/UK agency cannot use it without applying for a license, and it needs multi-GPU hardware and a substitute for the unreleased prompt module.
- For a client-facing agency, expect open models to be roughly one tier below Kling 3.0 and Seedance 2.x on first-try quality, especially for complex character action, hands and object interaction, and long clips. Much of the gap can be closed with more rerolls, character LoRAs and post-processing, but that shifts cost from dollars to labor and hit rate.
- LTX's under-$10M free license and Wan's Apache 2.0 license both fit a small agency.

### Gaps
- I found no rigorous, independent, same-prompt comparison of LTX-2.5 or Wan 2.2 against Kling 3.0 or Seedance 2.x on character animation, lip-sync or product shots. The Artificial Analysis arena pages did not load (404 and an empty page), so I have no Elo numbers.
- I found no reliable info on Seedance 2.x versus open models specifically.
- LTX-2.5 "Pro" versus open-checkpoint quality differences are unclear.

## 2. Measured generation time per 5 s clip and resulting $/second of video

### Takeaway
On rented GPUs, raw compute for open models comes to roughly $0.001-0.01 per second of finished 720p-1080p video with fast models or distilled setups (LTX, Wan with step-distill LoRAs), and about $0.02-0.05/s for full-step Wan 14B on an H100. That is 10-50x below the $0.05-0.10/s paid now. Hosted open-model APIs are not cheap: fal charges $0.08/s for Wan 2.2 at 720p, about the same as Kling through Higgsfield. The savings only appear if you run the GPUs yourself.

### Cited Findings
**Measured or reported generation times:**
- LTX 2.3 on an owned RTX 5090: "5s, 720p gens on the default comfyUI workflow take about 20-25s after the model is warm. About 35-40s for an 8s video" (Jul 2026, practitioner). — [RKAScope, r/comfyui](https://www.reddit.com/r/comfyui/comments/1uywza4/comment/oy2sg6m/)
- RTX Pro 5000 72GB (model not stated, context suggests LTX 2.3): "a 5s 1920x1080 gen takes about a minute. 5s 1280x720 about 30 seconds". The same user says to budget about 5 minutes of setup per RunPod session with an off-the-shelf Comfy image. They also say the full 46GB model "is better than the 29GB FP8. Not night and day". — [TaterCreekStudios, r/comfyui](https://www.reddit.com/r/comfyui/comments/1uywza4/comment/oy6dvnr/)
- LTX-2.5 on RTX 5090 (NVIDIA guide, vendor-reported): about 25 s for a 4 s 720p clip, and about 3 minutes for 8 s once it spills into weight streaming. On an RTX 3090 with distilled int8: about 2.5 minutes per 5 s clip. Full bf16 needs about 42 GB, int8 about 21.5 GB. 10 s clips can stall at VAE decode on 24 GB cards. — [runaihome LTX-2.5, Aug 2026](https://runaihome.com/blog/ltx-2-5-local-ai-video-hardware-guide-2026/)
- Wan 2.1 14B, full precision, official script (SaladCloud benchmark, 2025, older):
  - H100: 85 s at 480p, 284 s at 720p
  - A100: 170 s at 480p, 523 s at 720p
  - RTX 4090: 281 s at 480p; out of memory at 720p
  - runaihome labels this a 5-second clip, but another search summary describes the same benchmark as 33 frames (about 2 s) at 30 steps. The clip length is unresolved.
  - — [runaihome Wan guide](https://runaihome.com/blog/wan-video-local-ai-gpu-guide-2026/); [InstaSD](https://www.instasd.com/post/wan2-1-performance-testing-across-gpus)
- Wan 2.2 on RTX 4090: 3-5 minutes per 720p 5 s clip with FP8 (tier guide, Jun 2026). Wan 2.2-Animate on RTX 3090: about 9-10 minutes per 81-frame 640x480 clip, about 24 minutes at 720p. — [runaihome Wan guide](https://runaihome.com/blog/wan-video-local-ai-gpu-guide-2026/)
- One practitioner reports a 3-minute average on an RTX 4080 Super (model unstated, likely Wan). — [Dirtsurgeon1](https://www.reddit.com/r/comfyui/comments/1uywza4/comment/oy3xhz9/)
- The LightX2V distilled Wan 2.2 models use 4 steps with no CFG. The vendor claims a "x20 speed-up". — [lightx2v/Wan2.2-Distill-Models](https://huggingface.co/lightx2v/Wan2.2-Distill-Models)
- A vendor claim for Wan 2.2 says 20-25 minutes for 720p on a single H100, with no settings given. This conflicts with the figures above; treat it as an outlier. — [Ori](https://www.ori.co/blog/how-to-run-wan-2.2)
- HunyuanVideo 1.5 step-distilled 480p I2V: about 75 s on an RTX 4090 (Tencent, Dec 2025). — [model card](https://huggingface.co/tencent/HunyuanVideo-1.5)

**GPU prices (Oct 2026):**
- RunPod on-demand Pods (page updated Oct 8, 2026; Community/Secure):
  - H100 SXM $2.69/$3.49 per hour
  - H100 PCIe $1.99/$2.89
  - A100 $1.19-1.59
  - L40S $0.79/$1.09
  - RTX 4090 $0.34/$0.74
  - RTX 5090 $0.69/$0.99
  - RTX PRO 6000 $1.69/$2.09
  - The headline prices shown differ slightly from these.
  - — [RunPod pricing](https://www.runpod.io/pricing)
- RunPod Serverless per hour: 4090 $1.10, 5090 $1.58, L40S $1.75, RTX PRO 6000 $3.49, H100 $4.79, B200 $8.64. Flex workers are discounted. — [RunPod pricing](https://www.runpod.io/pricing)
- Modal (per second, converted to per hour): H100 $3.95, A100-80GB $2.50, L40S $1.95, RTX PRO 6000 $3.03, B200 $6.25. Starter plan includes $30/month free credits. — [Modal pricing](https://modal.com/pricing)
- Vast.ai (marketplace, Mar-Jul 2026 aggregators): H100 about $0.90-1.87/hr (verified datacenter hosts $1.50-1.87), RTX 4090 about $0.29-0.50/hr. Less reliable than RunPod Secure Cloud. — [Spheron](https://www.spheron.network/blog/runpod-vs-vastai-2026/); [deploybase](https://deploybase.ai/articles/cheapest-gpu-cloud-in-2026-provider-pricing-ranked)
- A practitioner running 10-20 Meta creatives per week on an RTX 6000 Pro at "around $1.7 an hour" says "cost per produced creative is negligible... local gen scales much better" than fal. — [DaLyon92x](https://www.reddit.com/r/comfyui/comments/1uywza4/comment/oy2ongn/)

**Hosted open-model API prices for comparison:**
- fal Wan 2.2 A14B I2V: $0.08/s at 720p, $0.06/s at 580p, $0.04/s at 480p, all at 16 fps. — [fal model page](https://fal.ai/models/fal-ai/wan/v2.2-a14b/image-to-video)
- Aggregator figures for fal: Kling 3 Pro about $0.224/s with audio off, Veo 3.1 Fast from $0.10/s. — via search summary of [costbench](https://www.costbench.com/software/ai-media-apis/fal-ai/) (not verified on fal)

### Inferences
These are my own calculations: GPU time multiplied by hourly price, compute only, warm GPU, no rerolls.

| Setup | Time per 5 s clip | Price | $/clip | $/s of video |
|---|---|---|---|---|
| LTX 2.x, 720p, RTX 5090 | ~25 s | RunPod Community $0.69/hr | ~$0.005 | ~$0.001 |
| Same, RunPod Serverless | ~25 s | $1.58/hr | ~$0.011 | ~$0.002 |
| LTX 1080p, RTX Pro 5000/6000-class | ~60 s | ~$1.7-2.1/hr | ~$0.03-0.035 | ~$0.007 |
| Wan 2.2 14B FP8, 720p, RTX 4090, full steps | 3-5 min | $0.34-0.74/hr | ~$0.02-0.06 | ~$0.004-0.012 |
| Wan 14B, 720p, H100, full steps | ~284 s | $2.69/hr | ~$0.21 | ~$0.04 |

- With 4-step LightX2V distillation, Wan 14B costs should fall several-fold below the full-step figures (vendor claim; not measured here).
- Even with 3-5 rerolls per approved clip plus upscaling, self-hosted compute probably stays under about $0.02 per second of approved video. API spend at $0.05-0.10/s with rerolls is likely 2-5x the list rate per approved second.
- fal's open-model endpoints cost about the same as the closed models through Higgsfield. A managed API for open models therefore gives little saving. Savings need raw GPU rental.

### Gaps
- I found no rigorous measured benchmark of LTX-2.5 at 1080p or on an H100, and none for Wan 2.2 with LightX2V 4-step on H100/L40S. Figures mix model versions (LTX 2.3 vs 2.5, Wan 2.1 vs 2.2).
- The clip length in the SaladCloud H100 benchmark is disputed (2 s vs 5 s).
- I did not verify the fal LTX-2.5 endpoint price.

## 3. ComfyUI production workflows at scale, and serverless options

### Takeaway
Production practitioners use ComfyUI on rented pods (RunPod or Vast) with a scripted setup. They render low-res multi-seed previews, finish only the winners at full resolution, use LoRAs for consistency, and do frame interpolation and upscaling in Comfy. Serverless (RunPod Serverless, Modal) removes idle cost but charges about 1.5-2.5x the pod hourly rate and adds cold starts.

### Cited Findings
- **Seed-hunting with multiple rolls:** A practitioner recommends the "LTX 2.3 seed hunter multiroll workflow" on Civitai. It lets you "quickly see 4 low res seeds, then finish the one you want at full res", and runs in overnight batches. They also say "pre-installed templates are bad". — [DaLyon92x](https://www.reddit.com/r/comfyui/comments/1uywza4/comment/oy2zw8w/); [workflow](https://civitai.com/models/2676452/ltx-23-seed-hunter-multiroll-workflow)
- "generate in 1k, later upscale only the winners" — [jc2046](https://www.reddit.com/r/comfyui/comments/1uywza4/comment/oy34rxd/). "Native 4k generations are rough. Generating at a lower res and upscaling will both reduce your costs and drastically shorten your process" — [candylandmine](https://www.reddit.com/r/comfyui/comments/1uywza4/comment/oy7jlpo/)
- **Automation:** One user generates stills locally on a Mac and runs I2V on a Vast.ai 5090 or RTX 6000. They "built an automation system that imports my models, workflows and updates ComfyUI". — [candylandmine](https://www.reddit.com/r/comfyui/comments/1uywza4/comment/oy7jlpo/)
- **Workflow choice for Wan:** kijai's Wan 2.2 wrapper with block swap is reported faster and better than Comfy's native dynamic-VRAM workflow. Wan's 16 fps output is converted to 24 fps by interpolation. — [Brad12d3](https://www.reddit.com/r/comfyui/comments/1uywza4/comment/oy33qtb/)
- **Free interpolation:** The `comfyui-frame-interpolation` extension (RIFE, FILM, IFUNet) is described as doing "as good a job as you can get with Topaz. But for free". — [Alchemist42](https://www.reddit.com/r/comfyui/comments/1uywza4/comment/oy3vf5a/)
- **Character consistency:**
  - LTX "Ingredients" IC-LoRA (Sep 2026) conditions on a reference image of characters, objects and backgrounds ([HF](https://huggingface.co/api/models?author=Lightricks&sort=createdAt&direction=-1); [Alchemist42](https://www.reddit.com/r/comfyui/comments/1uywza4/comment/oy3eupg/)).
  - Identity LoRAs for Wan 2.2 are trained on RunPod with AI Toolkit, per a popular Oct 2025 (older) r/StableDiffusion post ([Reddit](https://www.reddit.com/r/StableDiffusion/comments/1odk8hv/trained_an_identity_lora_from_a_consented_dataset/)).
  - fal offers a hosted Wan 2.2 LoRA trainer ([fal](https://fal.ai/models/fal-ai/wan-22-trainer/t2v-a14b)).
- **Audio for silent Wan clips:** LTX can add audio to an existing video. One user also uses a separate tool, "Woosh". — [Brad12d3](https://www.reddit.com/r/comfyui/comments/1uywza4/comment/oy33qtb/)
- **Serverless pricing:** RunPod Serverless 5090 is $1.58/hr versus $0.69-0.99 for a Pod, and H100 is $4.79/hr versus $2.69-3.49 ([RunPod](https://www.runpod.io/pricing)). Modal bills per second ([Modal](https://modal.com/pricing)). RunPod publishes a Wan 2.2 ComfyUI guide ([RunPod](https://www.runpod.io/articles/guides/comfyui-wan-2-2)).
- MiniMax H3 ships official ComfyUI templates (T2V, R2V) and SGLang/vLLM serving recipes. — [model card](https://huggingface.co/MiniMaxAI/MiniMax-H3)
- New self-hosted front-ends aim to make rented GPUs usable by non-technical team members, for example PotionUI ("rent a GPU, point PotionUI..."), released Sep 2026 and still alpha. — [Reddit](https://www.reddit.com/r/StableDiffusion/comments/1w5i6eo/potionui_003_a_selfhosted_presetdriven_studio_for/)

### Inferences
- For a team of a few people making hundreds of concepts, the most efficient setup is probably either:
  1. A persistent RunPod/Vast pod (5090 or RTX PRO 6000) during working hours, with a network volume holding models and LoRAs, plus overnight batch queues.
  2. Serverless ComfyUI endpoints called by a script or front-end.
  - Option 1 is cheaper per GPU-hour. Option 2 avoids idle time and suits bursty work.

### Gaps
- I did not gather current pricing or specifics for ComfyDeploy, ComfyICU, Comfy Cloud or ThinkDiffusion.
- I found no published, measured agency case study with throughput numbers (clips per GPU-hour, failure rates) for serverless ComfyUI video.

## 4. Hidden costs: setup and engineering time, failures, storage, needing a technical person

### Takeaway
GPU time is the smallest cost. The real costs are a technical operator, model and workflow setup, cold starts and downloads, rerolls caused by lower hit rates, and keeping up with fast model churn. Practitioners say plainly that open models suit teams willing to invest in workflow skill. Otherwise, keep paying the APIs.

### Cited Findings
- "Cost per clip is not how local models are used or developed. They are specifically not commodity products that you just add a prompt to. If you're not looking to go through an extensive LOE [level of effort], you should probably just keep shelling out cash to a commercial provider. Alternately, find an expert you are willing to pay and offer them $4-5 per purchased clip." — [activematrix99, r/comfyui](https://www.reddit.com/r/comfyui/comments/1uywza4/comment/oy3wa9p/)
- Framework: "cost per approved shot = (compute + persistent storage + transfer) / clips accepted". The same commenter says "Model downloads, environment setup, prompt iteration and discarded generations can dominate". In their view, an API is often best for bursty work, and a persistent GPU environment pays off when the same models, LoRAs and workflows are reused across projects. (The commenter discloses they run a GPU provider.) — [SunForceAI](https://www.reddit.com/r/comfyui/comments/1uywza4/comment/p19kkfi/)
- Budget about 5 minutes of setup per RunPod session, then double generation time for prompt editing and rework. Estimate: 20 gens is about 20-30 minutes of GPU time, so "1 hour of cloud = $2-6". — [TaterCreekStudios](https://www.reddit.com/r/comfyui/comments/1uywza4/comment/oy6dvnr/)
- "All it takes is some willpower to figure out the best workflows... it's probably going to take some seed hunting... (most of my job at this point)." — [DaLyon92x](https://www.reddit.com/r/comfyui/comments/1uywza4/comment/oy2ongn/)
- Disk and storage: the LTX-2.5 ComfyUI file set is 35 GB+, including a Gemma 12B text encoder. 32 GB system RAM is the floor when offloading. — [runaihome LTX-2.5](https://runaihome.com/blog/ltx-2-5-local-ai-video-hardware-guide-2026/). RunPod network storage costs $0.07/GB/month (under 1 TB), or $0.14 for high-performance. — [RunPod](https://www.runpod.io/pricing)
- Idle billing: a guide warns to "always stop your pod when not generating". Serverless avoids idle cost. — [impekable](https://www.impekable.com/blog/how-to-run-wan-2.2-on-runpod-the-complete-visual-guide-(2026))
- Confusion is common for beginners. One new RunPod user was unsure whether both ComfyUI and RunPod charge for a generation. — [r/comfyui](https://www.reddit.com/r/comfyui/comments/1pslx60/does_comfy_ui_runpod_both_charge_you_for_video/)
- Apple Silicon is not practical for production video ("forget the Macs"). One report: 30-40 minutes per 8 s LTX clip on an M5 Pro, versus 20-25 s on a 5090. — [r/comfyui thread](https://www.reddit.com/r/comfyui/comments/1uywza4/video_generation_costs_on_higgsfield_adding_up/)
- License limits are a hidden constraint:
  - MiniMax H3 is restricted in the US, EU, UK and South Korea.
  - LTX needs a paid license above $10M revenue, and moving fine-tunes to others may need one too.
  - Wan 2.2 is Apache 2.0 with no limits.
  - — [Fuser](https://fuser.studio/articles/best-open-source-video-models); [LTX-2.5 card](https://huggingface.co/Lightricks/LTX-2.5)

### Inferences
- Rough break-even (my estimate):
  - Suppose 300 concepts/month × ~20-30 s of final video × ~3 generations per keeper. That is about 18,000-27,000 generated seconds.
  - At $0.05-0.10/s, that costs about $900-2,700/month in API fees.
  - Self-hosting the same volume would likely cost under $100-300/month in GPU and storage.
  - The saving of roughly $600-2,400/month only pays if a technical person (in-house or a part-time contractor) can spend a few days on setup and a few hours a week on upkeep. It is also lost if lower hit rates or quality cost client approvals.
  - At under about $500/month of API spend, self-hosting is rarely worth it.
- Model churn (LTX 2.3 to 2.5 within months, plus new LoRAs every week) means ongoing maintenance, not a one-time setup.

### Gaps
- I found no hard data on hit-rate differences (approved per generated) between open models and Kling or Seedance.
- I found no published hourly rates for ComfyUI freelancers or contractors beyond the "$4-5 per purchased clip" suggestion.

## 5. Hybrid patterns: draft cheap, finish premium; open-model upscaling

### Takeaway
The most practical approach for this agency is hybrid. Use self-hosted LTX or Wan at 480-720p for concept exploration, animatics and the many rough concepts. Send only approved hero shots to Kling 3.0 or Seedance (or finish them in open models). Upscale open-model output with SeedVR2 and interpolate with RIFE/FILM in ComfyUI instead of paying for native 1080p or 4K generation.

### Cited Findings
- Practitioners keep repeating "generate low, upscale only winners" (see Section 3). — [jc2046](https://www.reddit.com/r/comfyui/comments/1uywza4/comment/oy34rxd/); [candylandmine](https://www.reddit.com/r/comfyui/comments/1uywza4/comment/oy7jlpo/)
- **SeedVR2** (ByteDance, Apache 2.0) is natively supported in ComfyUI, with a 3B INT8 template.
  - H100 benchmarks (mid-2025, older), 7B model upscaling 512x768 to 1080x1620: 75 frames in about 45 s; 243 frames in about 106 s; 453 frames in about 187 s (FP8).
  - 3B FP8 upscaling 480p to 1080p: 149 frames in about 361 s.
  - Larger batches need over 24 GB VRAM. Batch size of at least 5 is needed for temporal consistency.
  - — [ComfyUI docs](https://docs.comfy.org/tutorials/utility/seedvr2.md); [numz SeedVR2 README mirror](https://cnb.cool/itgay/SeedVR2_comfyUI); [HF RedbeardNZ](https://huggingface.co/RedbeardNZ/SeedVR2_comfyUI)
  - Inference: at H100 $2.69/hr, about 45-110 s per 5 s clip costs about $0.03-0.08 per clip, or roughly $0.01/s of video. That is still well below paying for 1080p generation.
- HunyuanVideo 1.5 ships its own step-distilled 720p and 1080p super-resolution models. — [model card](https://huggingface.co/tencent/HunyuanVideo-1.5)
- Lightricks' official LTX-2.5 restoration IC-LoRAs (Restore, Refine-Details, Deblur, SDR-to-HDR, Decompression) are also post-processing options. — [HF API: Lightricks](https://huggingface.co/api/models?author=Lightricks&sort=createdAt&direction=-1)
- Free frame interpolation in ComfyUI (RIFE/FILM) is considered comparable to Topaz. — [Alchemist42](https://www.reddit.com/r/comfyui/comments/1uywza4/comment/oy3vf5a/)
- Better source frames help hand detail: "Upscaling your still through Magnific before animating gives it more real detail to hold onto, which cuts down the finger glitching." The same commenter says going direct to Kling or Seedance APIs "cuts the aggregator margin". — [snideswitchhitter](https://www.reddit.com/r/comfyui/comments/1uywza4/comment/p1lxvd4/)
- An existing practitioner pattern: generate stills in GPT-image or Nano Banana, then animate in LTX with 2-3 gens per scene and mix the best parts. — [RKAScope](https://www.reddit.com/r/comfyui/comments/1uywza4/comment/oy2sg6m/)

### Inferences
- Lower-risk hybrid options:
  - Keep Higgsfield or Kling/Seedance for final client deliverables that involve complex character action, hands or premium lip-sync.
  - Move exploration, pitch concepts, B-roll, product turntables and simple motion to self-hosted LTX-2.5 or Wan 2.2 plus SeedVR2.
  - A separate, simpler saving: buy Kling or Seedance directly through their APIs or fal instead of an aggregator, which removes the aggregator margin without any self-hosting.
- An I2V-first pipeline (lock the look with high-quality stills, then animate) makes up for much of the open models' gap. It also keeps the look consistent if drafts and finals use different video models.

### Gaps
- I found no documented case study measuring savings from a draft-open, final-closed agency pipeline.
- I found no 2026 benchmark comparing SeedVR2 against Topaz Video AI or closed upscalers (for example Higgsfield's upscale) on AI-generated footage.
