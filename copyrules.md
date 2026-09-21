# Copy Rules

Style rules for all user-facing text in EvidPhonics: activity instructions, sentences, page copy, UI labels, tooltips. Adapted from [anti-ai-slop-writing](https://github.com/jalaalrd/anti-ai-slop-writing), with an app-specific rule on top.

## Hard rules (zero tolerance)

- **No em dashes, anywhere.** Not one. Rewrite with a comma, a period, parentheses, or "and"/"but". This is the strictest rule in this file — a single em dash anywhere in shipped copy is a bug.
- **No exclamation marks unless the moment earns it.** The text-to-speech engine reads `!` as shouting. An instruction line like "Tap the letter that makes the sound!" gets read back at kids at a volume and pitch that's frightening, not encouraging. Default to a period. Reserve `!` for genuine celebration copy (e.g. "You did it!" on a completion screen) — never for instructions, hints, or routine feedback.

## Banned vocabulary

Never use: delve/delving, tapestry, landscape (figurative), testament ("a testament to"), vibrant, pivotal, crucial, intricate/intricacies, meticulous/meticulously, bolster, garner, underscore (verb), interplay, multifaceted, nuanced (as filler), foster/fostering, leverage (verb), utilize (say "use"), commence (say "start"), facilitate, encompass, paramount, groundbreaking, cutting-edge, game-changing, transformative, revolutionize, seamless/seamlessly, robust (outside engineering), comprehensive (describing our own output), endeavour, aforementioned, harnessing, spearheading, navigating (figurative), showcasing, highlighting, emphasizing, enhancing, unprecedented, remarkable, stunning, profound, epic (non-literal), "in essence", thought leader/thought leadership, synergy, pain points, value add, moving forward, touch base/circle back, rest assured, "it goes without saying".

## Banned phrases

- "In today's [adjective] [noun]..."
- "It's worth noting that..." / "It's important to note that..."
- "Let's dive in" / "Let's dive deeper" / "Let's delve into"
- "At its core..." / "In the realm of..." / "When it comes to..."
- "A testament to..."
- "Not just X, but Y" / "It's not just about X — it's about Y"
- "This is where X comes in"
- "Whether you're a [X] or a [Y]..."
- "From X to Y" (range opener)
- "At the end of the day..." / "The bottom line is..."
- "Here's the thing..." / "Here's the deal..."
- "Without further ado..." / "In a nutshell..." / "Buckle up"
- "Unlock the power of..." / "Empower/empowering" / "Elevate your..." / "Streamline your..." / "Supercharge your..."
- "Bridge the gap" / "Move the needle"
- "In conclusion" / "Overall," (paragraph starter) / "Firstly... Secondly... Thirdly..."
- "I hope this helps" / "I hope this finds you well" / "As per my last email" / "Please don't hesitate to reach out"

## Banned openers

"Certainly," "Absolutely," "Sure," "Great question!", "That's a great point!", "I'd be happy to...", "However, it's important to...", "Moreover,", "Furthermore,", "Additionally,", "Interestingly,", "Notably,", "Importantly,", "Indeed,".

## Structural rules

- **Vary sentence length.** No three consecutive sentences of matching length.
- **Avoid rule-of-three.** Don't default every list or grouping to exactly three items.
- **No hedging seesaw.** Take a clear position; acknowledge a counterpoint in one sentence, max.
- **No corporate cheerleading tone.** Especially in instructions and hints — talk to a child or a teacher plainly, not like a pitch deck.
- **Active voice.** Avoid "is being done" / "was found to be" constructions.
- **Semicolons and colons are fine used naturally** — don't avoid them reflexively.
- **Ellipses**: only for genuine trailing-off, and rare.

## Pre-ship checklist for any new or edited copy

1. Zero em dashes.
2. Every `!` is doing real celebratory work, not decorating an instruction.
3. No banned words, phrases, or openers from the lists above.
4. No three same-length sentences in a row.
5. Reads like it was written for a child or their teacher, not generated for a pitch deck.
