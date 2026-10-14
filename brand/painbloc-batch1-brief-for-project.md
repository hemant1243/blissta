# PainBloc static test, batch 1: brief for the Project

Paste this whole thing into the Blissta Project. Its job is to write the ads. Claude Code (the ops chat) does everything after that.

## How the pipeline works

1. **The Project writes** 5 static ads in the exact format at the bottom.
2. **Hemant pastes the output** into the Claude Code ops chat.
3. **Claude Code makes the images** in Higgsfield, using Nano Banana Pro, or GPT Image when the image carries a lot of text. It uses the real PainBloc bottle photo as the reference so the label stays exact. It shows Hemant one contact sheet before anything goes further.
4. **Claude Code posts one `@Donnaa launch` message** in Slack. Donnaa uploads the images to Meta through the official API, into the test ad set Hemant picks. Every ad lands **PAUSED**, with Meta's standard enhancements turned off.
5. **Hemant reviews the ads** in Ads Manager and switches on the ones he likes. Nothing spends money until he does.

This batch is small on purpose. It tests the pipeline as much as the ads.

## What the Drive research says about PainBloc (use it)

- **Villain, locked:** NERVE STARVATION. "Your nerve isn't damaged. It's starving." Every PEA ad must land on nerve starvation, or it doesn't ship.
- **Mechanism:** mast cells and glial cells sit around the nerve and release histamine, TNF-alpha and tryptase. "Those chemicals are not a side effect of the pain. They are the pain." PEA is the body's own ceasefire signal. The tank empties two ways: with age (from 40–50), and through the pain-burns-PEA loop ("The longer they have hurt, the emptier they are").
- **Brand frame:** "Your body stopped making this."
- **Statics that have won:**
  - "4 Reasons Italian Doctors Reach For This", about $31 CPA. This is the best closer.
  - "STILL FIRING, four years after the surgery", the best performer.
  - Feed vs Block: "Gabapentin blocks the signal. PEA feeds the nerve." About $60 CPA.
  - Mechanism reframe statics, about $60 CPA.
- **Strongest rooms nobody has built yet:**
  - Tried PEA and felt nothing: "If you've tried PEA before and felt nothing, particle size is almost certainly the reason."
  - Bought cheap Amazon PEA.
  - Gabapentin did something to them (the money room).
  - "Your surgeon isn't wrong. He's just out of tools."
  - Two clocks: "Bone heals in weeks. Nerves heal on a completely different clock."
  - Supplement graveyard: "Turmeric did nothing. Glucosamine did nothing..."
  - "What if I could pick my granddaughter up again?"
  - Painsomnia at 3am.
- **What every winner does:**
  - Tells him it wasn't his fault: the form, dose or particle size was wrong.
  - Concedes something first.
  - Gives him a free check he can do himself (for example, read the label for "micronized").
  - Repeats the same short check set every time.
- **Static rules:**
  - Make an argument, not a story.
  - 4:5 format, headline 3–7 words, readable in 2 seconds, one focal point.
  - When testing hooks, lock the image and change only the headline.
- **PEA look:** dark, cinematic, low key. No smiling stock seniors, no beach walks, no lab coats.
- **Proof we can use:**
  - Guida sciatica trial: 636 patients, about 1 in 1.5 halved their pain at 3 weeks on 600mg/day.
  - Paladini 2016: pain at or below 3 in 81% of PEA patients vs 40.9% of controls by day 60.
  - "Hundreds of published papers, 30+ clinical trials."
  - "Widely used by Italian pain specialists for twenty years."
  - Gabapentin and dementia may only be described as "associated with", never "causes".

## Hard NOs

- No cure, treat or prevent claims, and no "replaces gabapentin/Lyrica" or any other drug. Write "in addition to", never "instead of". Never tell anyone to stop a medication.
- No "talk to your doctor" wording, no country names, no condition names in the static headline, no drug or celebrity names in the primary text.
- No invented studies, quotes, people, numbers, timers or stock counts. No star ratings.
- No "600+ studies / 21,000 patients". Use "30+ clinical trials".
- No overclaiming speed (no "in 20 minutes").
- No despair or suicide framing.
- Avoid these words: transform, unlock, breakthrough, game changing, changed my life.

## Hemant must confirm these before images are made (the docs disagree)

1. **Dose:** 600mg micronized (newest facts doc), or 1,200mg plus 120mg luteolin (Aug spec sheet)? Read the physical label. If luteolin isn't in it, drop every luteolin or "interlock" line.
2. **Price and offer on the landing page:** there are four versions live ($79→$29, $99.90→$59 for two, ...). The ad must match the page exactly.
3. **Guarantee:** 60 days? Only one number per ad.
4. **Landing page link** and **test ad set ID**.

## What to deliver: exactly this format, 5 ads

Suggested mix: 2 concepts. Concept A gets 3 hooks on the same image; concept B gets 2 hooks on the same image. Or 5 separate concepts if you think that tests better; say why.

```
BATCH: PainBloc static test 1
PRIMARY COPY 1:
<full primary text, line breaks kept>
PRIMARY COPY 2:
<second primary text option>
HEADLINE 1: <under 40 chars>
HEADLINE 2: <under 40 chars>
DESCRIPTION: <optional, short>
CTA: SHOP_NOW | LEARN_MORE | ORDER_NOW

AD 1
file name: PAINBLOC_<CONCEPT>_H1_4x5
concept: <name> | room/avatar: <who> | trigger: <absolution/reframe/fear/curiosity/proof/identity/offer>
text on image: <exact words, 3-7 word headline + any small support line>
picture: <what the image shows, setting, light, where the bottle sits, mood>
why it should work: <one line>

AD 2 ...
```

If one ad needs its own primary copy, add `own primary copy:` under it. Otherwise all 5 share the two primary copies and two headlines, which Meta rotates.
