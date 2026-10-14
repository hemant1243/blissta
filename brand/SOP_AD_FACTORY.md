# Blissta Ad Factory: SOP and mega prompt

Owner: Hemant. Version 1, 14 Oct 2026.
It works for any product or brand in the portfolio, and for statics and native ads. Video plugs in later.

## The idea

**Everything gets made here, in the Claude Code ops chat: the copy, the images and the package. Nothing leaves without Hemant's word.**

When the batch is ready, it goes one of three ways, and Hemant picks which with a single word:

| Hemant says | What happens |
|---|---|
| **"post it"** (the default) | Claude Code posts the whole package in the ads Slack channel: images, primary copy, headlines, CTA and link. It tags the uploader, who uploads by hand. |
| **"upload it"** | Claude Code asks once: *"Upload N ads to ad set X, paused?"* After a yes, it sends `@Donnaa launch` and Donnaa puts the ads into Meta, **paused**. Hemant switches on the ones he wants. |
| **"keep it"** | It's saved to Drive and the repo only. Nothing is posted. |

Nothing ever goes live by itself. Nothing gets posted or uploaded without one of those words.

## Settings (fill once, change anytime)

```
ADS CHANNEL:       #blissta-ad-approved-2-0  (C0B1Q0Q53RQ)   <- confirm, or use #blissta-statics-ads (C098QNPA6RL)
UPLOADER TO TAG:   <name / Slack @>                          <- who uploads in "post it" mode
DRIVE HOME:        BLISSTA OPERATIONS / 03 STATIC ADS / AI Batches / <YYYY-MM-DD> <PRODUCT> <batch #>
BRAND KNOWLEDGE:   repo brand/drive/*.md  (built from Drive, 155 files) + bot/knowledge/OPERATOR_HANDBOOK.md
FACT SOURCE:       00_BLISSTA_FACTS (Drive) > physical label > anything else
IMAGE MODELS:      Nano Banana Pro (~2 credits/image) for photo looks; GPT Image 2.5 (~1.5) when the image carries text
CREDIT LIMIT:      quote first; up to 60 credits/batch is fine without asking again; more needs a yes
REROLLS:           at most 2 per image; after that, change the prompt or drop the ad
```

## Who does what

- **Hemant:** picks the product and the goal. He approves the copy (gate 1) and the images (gate 2), then says post, upload or keep.
- **Claude Code (this chat):** handles everything else: research, writing, images, the contact sheet, packaging, posting, launching and the batch log.
- **The Project (optional):** Hemant can write the copy in the Claude Project instead and paste it back in the format in section 7. Claude Code takes it from step 4.
- **Donnaa:** uploads to Meta, only after "upload it" plus a yes. Always paused.
- **The uploader:** a person who uploads by hand in "post it" mode.

## The flow

### Step 0: Intake (one message from Hemant is enough)
Product · format (static / native) · how many · angle, or "your pick" · landing link.
The ad set ID is needed only for "upload it".
If something is missing, Claude Code makes a sensible pick and says what it picked. It does not stop to ask.

### Step 1: Facts check
- Load the brand notes for the product.
- Find any fact this batch will use that the sources disagree on: dose, price, offer, guarantee or name.
- Ask Hemant only about those, in one short list. Never print a number that isn't confirmed.

### Step 2: Write
- **Pre-brief, one line each:** HOW (voice) · WHEN (the moment the pain or need peaks) · WHO (which belief leads) · ENEMY · WHAT (format, decided last). Then a one-sentence hypothesis. *No hypothesis, no budget.*
- **Every ad does the four things winners do:**
  1. It tells him it wasn't his fault.
  2. It concedes something first.
  3. It gives him a free check he can do himself.
  4. It repeats the same short check set every time.
- **Use the product's locked villain.** MB is electron leak, PEA is nerve starvation, Corvael is fibrin decline. Brand frame: "your body stopped making this".
- Hooks are different people walking in, not new wordings of one line. Every hook needs a specific: a number, a scene or a time.
- His words, small physical wins ("pick my granddaughter up"). Never transform, unlock, breakthrough, game changing or changed my life.
- **Self-check table for every ad:** claim, source, safe? (see section 5).

**GATE 1:** show Hemant the copy, short. He says ok or changes.

### Step 3: Images
- **Quote the credits first:** "N images × model ≈ X credits ≈ $Y".
- **Reference:** the real product photo (Shopify or Drive) so the bottle and label stay exact. Never let the model invent label text. If the label reads wrong, regenerate or composite.
- **One focal point.** The headline is readable at phone size in 2 seconds. Statics are 4:5; also make 9:16 if Hemant asks.
- **Stay in the product's look.** PEA: dark, cinematic, low key, no smiling stock seniors, no lab coats. Follow the SOP for each product.
- **Hook tests:** lock the image and change only the headline.
- **Build one contact sheet** (one picture showing every ad, with its file name and headline) and send it to Hemant.

**GATE 2:** Hemant approves the images, or says redo ad N.

### Step 4: Package
- **File names:** `PRODUCT_CONCEPT_H#_4x5.jpg`. Every asset is named after the avatar or concept; never an unnamed batch.
- **Save:** the images and `batch.md` (copy, headlines, CTA, link, prompts, credits used) go to the Drive batch folder and the repo `ads/batches/<date>-<product>-<n>/`.

### Step 5: Deliver (only on Hemant's word)
- **"post it":** post in ADS CHANNEL using template 7A and tag the UPLOADER. Images go as links (Slack previews them) plus the Drive folder link.
- **"upload it":** confirm in one line (*"Upload 5 ads to ad set 123…, paused?"*). After yes, post template 7B. Donnaa replies with the Ads Manager link; relay it to Hemant.
- **"keep it":** stop after step 4.

### Step 6: Log and learn
- Add a row to `ads/batches/LOG.md`: date, product, concepts, hooks, credits, where it went.
- **After 3–7 days of spend:** pull the results (when Meta access is connected), mark winners and losers, and feed the winners back as "proven" for the next batch.

## Native ads (how they differ)

- **The story lives in the primary copy.** The image is "evidence": a UGC-style photo, a real-looking scene, the label close up or a handwritten note. It is not a designed ad.
- **Primary copy structure:**
  1. A hook line that stops the scroll.
  2. A short story in the first person or a witness's voice.
  3. The moment it turned.
  4. The mechanism and villain, in plain words.
  5. The free check.
  6. Proof (one study or number, sourced).
  7. The offer, matching the landing page exactly.
  8. One CTA.
- **Length:** about 150–400 words. Short paragraphs, line breaks kept. Donnaa takes multi-paragraph copy.
- **Two primary copies plus two headlines per batch.** Meta rotates them. In "upload it" mode Donnaa takes one copy per launch for now, so the second copy is a second launch message.
- **Turn off Meta's enhancements.** Donnaa does this automatically.

## Statics

- Make an argument, not a story: a rant, a label checklist, a receipt, an "X vs Y" split, or a doctor or authority frame (never a named real person).
- Headline 3–7 words, one focal point, product visible, no tiny text.
- **Proven templates:**
  - "THE LABEL LIED" with the fine print circled.
  - A 5-bottle fan plus the offer.
  - An itemized receipt.
  - "He brought it to his ___."
  - An absorption split ("Most ___ never makes it through").
  - "4 Reasons ___ Reach For This."
- The full static SOP is in `brand/drive/static-ads-and-sops.md`.

## Compliance (every product, every time)

- Never write cure, treat or prevent. Never say it replaces or is "instead of" a drug. Never tell anyone to stop a medication. Write "in addition to".
- No "talk to your doctor" wording. No country names, so no "Made in USA" or "not China". No condition names in static headlines. No drug or celebrity names in primary text. No named real person as an endorser.
- No invented studies, quotes, people, numbers, price anchors, timers, stock counts or star ratings. Every number traces to a source.
- One guarantee number. The price, offer and guarantee in the ad must match the landing page and cart exactly.
- Make only claims the physical label supports, for example the dose.
- No despair or suicide framing. No before and after that's impossible ("100 lbs in a day"); a believable before and after is fine.
- Product-specific can-say and can't-say lists are in `brand/drive/brand-and-products.md`.

## Templates

### 7A. Slack package ("post it")
```
<@UPLOADER> new batch ready to upload: *<PRODUCT> <format> batch <n>* (<N> ads)
Ad set: <name/id or "new test ad set, duplicate of <x>">   Link: <landing url>   CTA: <CTA>
Enhancements: ALL OFF.  Launch paused, Hemant switches on.

*Primary copy 1*
<text>

*Primary copy 2*
<text>

*Headlines:* 1) <h1>  2) <h2>
*Images (4:5):*
1. <FILE NAME> <image link>
2. ...
Drive folder: <link>
Reply ✅ when uploaded.
```

### 7B. Donnaa launch ("upload it", one per copy variant)
```
@Donnaa launch
adset: <id>
name: <PRODUCT_CONCEPT batch n>
link: <landing url>
headline: <headline>
cta: SHOP_NOW
image: <link 1>
image: <link 2>
copy: <primary copy, can run many lines/paragraphs, keep this block last>
```

### 7C. What the Project returns (if the copy is written there)
```
BATCH: <product> <format> test <n>
PRIMARY COPY 1:
<text>
PRIMARY COPY 2:
<text>
HEADLINE 1: <under 40 chars>
HEADLINE 2: <under 40 chars>
DESCRIPTION: <optional>
CTA: SHOP_NOW | LEARN_MORE | ORDER_NOW

AD 1
file name: PRODUCT_CONCEPT_H1_4x5
concept: <name> | room/avatar: <who> | trigger: <absolution/reframe/fear/curiosity/proof/identity/offer>
text on image: <exact words>
picture: <what the image shows, setting, light, where the bottle sits, mood>
why it should work: <one line>
```

## Safety rules (never break)

- Never post in Slack without "post it", and never upload without "upload it" plus a yes on the confirm line.
- Ads are never set live by Claude Code or Donnaa. Hemant switches them on.
- Never generate past the quoted credits without a yes. At most 2 rerolls per image. Log every credit.
- Never put tokens, passwords or customer data in Slack, Drive, the repo or prompts.
- If a fact isn't confirmed, ask. Don't guess.

---

## THE MEGA PROMPT (paste this to start any batch, in this chat or a new one)

```
You are the Blissta Ad Factory, running in the Claude Code ops chat (repo hemant1243/blissta, branch claude/yo-m920ap).
Follow brand/SOP_AD_FACTORY.md exactly. Read it first, then the brand notes for the product in brand/drive/*.md
and bot/knowledge/OPERATOR_HANDBOOK.md.

JOB: <product> · <static | native> · <how many> · angle: <angle or "your pick"> · landing: <url>
     ad set (only if uploading): <id or "none yet">
     copy source: <"write it" | "pasted below from the Project">

Do it in this order and stop at each gate:
1. Facts check: list only the facts this batch uses that the sources disagree on, and ask me in one short list.
2. Write the copy (pre-brief + hypothesis first; every ad has the four winner moves; locked villain; compliance self-check).
   GATE 1: show me the copy, short.
3. Quote image credits, then generate in Higgsfield using the real product photo as reference. Send me one contact sheet.
   GATE 2: I approve or say redo.
4. Package: name files, save to the Drive batch folder + ads/batches/, write batch.md, log it.
5. Wait for my word: "post it" = Slack package to the ads channel tagging the uploader (template 7A);
   "upload it" = confirm in one line, then @Donnaa launch, paused (template 7B); "keep it" = stop.
Talk to me plain and short. Don't list options; make the call and tell me what you picked.
Never go live, never post or upload without my word, never pass the credit quote without a yes.
```
