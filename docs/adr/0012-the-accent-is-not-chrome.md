# ADR-0012 — The accent belongs to an action, not to the chrome

**Status:** Proposed — made under the creative authority granted for the
homepage presentation pass, pending Marcel's review.
**Date:** 2026-09-16
**Supersedes:** nothing. Narrows the accent rule stated in ADR-0005 and in
`governance/standards.md`, without contradicting it.

---

## Context

The accent has had three jobs since the design system landed: primary action
fill, active state, and at most one emphasis mark per page. Every use on this
platform was inside those three jobs. The rule was being followed and the
result was still wrong.

The reason is that the rule counts *kinds* of use and never counted *persistence*.
Two of the accent's appearances were in fixed chrome:

| Element | Job claimed | What it actually did |
|---|---|---|
| `.site-nav` CTA (`.btn-primary`) | primary action fill | Sticky. On screen at every scroll position of every page of the hub and every product domain |
| `.max-bubble` | primary action fill | `position: fixed`. On screen always, at 56px, over whatever the page was saying |

Both are defensible one at a time. Together they meant the brand accent was
never *not* on screen, which is a different thing from being used three ways.
A visitor scrolling the homepage saw lime continuously for eleven screens and
saw the page's own primary action — the thing the accent is supposed to mark —
twice. The signal was the least informative pixel on the page.

Counted on the homepage before this pass: **seven** accent-bearing elements,
of which two were fixed chrome, one was a carousel's progress dots, three were
blog tag pills and one was the page's actual call to action.

## Decision

**The accent may not appear in persistently visible chrome.** A control that is
on screen regardless of where the reader is does not get the accent, whatever
job it would otherwise qualify for.

This adds a condition to the existing three jobs rather than replacing them:

> Primary action fill, active state, or one emphasis mark — **and the element
> must belong to the content, not to the frame around it.**

Applied:

- The navigation action is `.site-nav-cta`: a white fill with black text on the
  inverted bar. On black that measures **18.9:1**, against **1.5:1** for lime on
  black, so the quieter choice is also the legible one.
- The Max launcher is a labelled pill on the inverted surface with no accent at
  all. It gained a visible name in the same change, so discoverability went up
  while its colour weight went down.
- The accent stays on the page's own primary actions, on active state, and on
  the single emphasis mark.

## Alternatives rejected

**Keep the nav CTA lime and remove the accent elsewhere.** The nav CTA is the
most persistent element on the platform; removing everything around it and
keeping the one that never leaves the screen addresses the symptom backwards.

**Tint the chrome accent down.** A second, weaker lime is a second name for a
value — the exact failure ADR-0005 exists to prevent.

**Make it a token.** There is no token change here and there should not be. The
values are unchanged; what changed is where a value may be spent. A rule about
placement does not belong in the palette.

## Consequences

**Good.** Lime now means *this is the action, here, on this page*. On the
rebuilt homepage it appears three times: the hero CTA, the closing CTA, and the
3px mark on the approval gate in the operating-model diagram. The page reads as
Maxpromo with all three removed, which is the test the brief set.

**Cost.** The always-visible conversion affordance is quieter. If enquiry volume
from the navigation CTA falls, this decision is the first place to look — and
the honest answer would be to test it rather than to restore the colour by
reflex.

**Scope.** The change is in `apps/web/app/globals.css` and `MaxBubble.tsx`, both
of which are shared chrome, so it lands on every page of the hub and — for the
Max launcher — on the product domains too. That is deliberate: chrome that
differed by route would be two implementations of one bar.

**Not enforced.** No gate can see this. "Persistently visible" is a property of
layout and scroll position, not of a stylesheet, and a check that guessed at it
would be the kind of rule ADR-0004 warns about. It is a review rule, and it is
written down here so that the next person adding an accent to a fixed element
has to argue with a document rather than with taste.
