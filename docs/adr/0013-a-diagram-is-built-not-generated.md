# ADR-0013 — A diagram is built from the design system, not generated

**Status:** Proposed — made under the creative authority granted for the
public presentation pass, pending Marcel's review.
**Date:** 2026-09-16 (component superseded the same day, see "The instance")
**Supersedes:** nothing.

---

## Context

The homepage carried four pictures. None of them told a reader what the company
does.

Three were generated article images in the "Latest insights" band: neon
palettes, glowing screens, a collage of interfaces that are not this platform's
interfaces. They were the last generated artwork on the site, and they sat two
screens above the closing call to action, which is where a visitor decides
whether this is a serious company.

The fourth was worse, because it was trying. The Agent Bureau section had a
radial "orbit" diagram: a central node with six capability nodes arranged on a
circle by trigonometry, positioned as percentages of a wrapper sized by
`aspect-ratio: 1 / 1`. In production that wrapper computed to **0×0**, so all
six nodes stacked on top of the centre and the labels rendered on top of one
another. It had shipped that way, and no gate could see it: the markup was
correct, the CSS was valid, the accessibility audit found its `aria-label`, and
the only symptom was visual.

Both failures have the same root. The platform had no way to draw a picture, so
pictures were either bought from a generator or improvised per component.

## Decision

**A picture on a Maxpromo surface is built from the design system, in markup,
or it is not used.** No generator, no stock photography, no screenshot of a
tool that is not ours, no artwork that needs a caption to mean anything.

Three rules follow from the orbit failure, and they are the whole of the
technical content:

1. **Geometry may not depend on a box having an intrinsic size.** The orbit
   placed children at percentages of a parent whose width came from nothing.
   Where a diagram needs coordinates, they come from a stretched `viewBox` with
   `preserveAspectRatio="none"`, which has a defined size at every width.

2. **Where a connector must meet a box, the layout must put that box at a
   fraction the connector can name.** The operating flow's seven stages are a
   hairline grid with a **1px gap rather than a gutter**, so the centre of
   column n falls at (2n−1)/14 of the width. The return path is a `viewBox`
   fourteen units wide and draws its verticals at x=13 and x=5, which are stage
   seven and stage three exactly. Measured in the browser on a 1216px track:
   stage centres at 87 / 261 / 434 / 608 / 782 / 955 / 1129, and width×5/14 =
   434, width×13/14 = 1129.

   A gutter would have broken this. With any gap other than a hairline the
   column centres stop being clean fractions of the whole, and a connector
   tuned at one width drifts off the boxes at every other width.

3. **A stretched stroke is a bug.** Any path in a non-uniformly scaled `viewBox`
   carries `vector-effect="non-scaling-stroke"`, or the hairline thickens on one
   axis.

**A diagram carries its content twice.** The drawing is `aria-hidden`; the same
information is an ordered list for assistive technology. A sequence summarised
into one `aria-label` loses the sequence, and in a process diagram the sequence
*is* the content.

**Colour.** Greyscale lines. The accent marks at most one element, and it marks
the one that carries the argument — in the operating model, the approval gate,
because "the system prepares the decision and a person still makes it" is the
claim the page rests on.

## The instance

`apps/web/components/ui/OperatingFlow.tsx` — the route work takes through a
business: customer, intake, decisions, workflows, teams, business record,
oversight, and the return from oversight back to decisions.

It is the signature visual of the public site and it appears on more than one
page, which is the point: it is a motif rather than a one-off, and the same
construction can carry a product's own flow on a product domain.

> **Superseded within this programme.** The first version of this component was
> `OperatingModel.tsx`, a five-stage figure written for the homepage-only pass.
> When the work widened to the whole public site the model itself was agreed at
> seven stages, and a five-stage and a seven-stage diagram of the same thing
> are two implementations of one idea. The five-stage file was deleted rather
> than kept beside its successor. The construction rules below are unchanged
> and were carried across intact.

It joins `OperationsCenter.tsx`, which already worked this way — the hero's
interface panel is markup, not a screenshot, for the same reasons.

## Alternatives rejected

**Commission or generate better images.** The objection is not quality. A
picture that does not carry information is decoration however well it is made,
and a generated one carries the visual signature of every other site that
generated one.

**A charting or diagram library.** All of them ship a runtime to draw something
static, and none of them resolve this platform's custom properties. The budget
gate exists because a 110 KB animation runtime was once shipped to fade three
numbers in.

**Screenshots of the real product.** Reasonable later, and genuinely better
evidence. It needs a product surface worth photographing and a policy on what
client data may appear in one. Not this pass.

## Consequences

**Good.** Every picture on the public site is now something the company owns, in
the company's own colours, with an accessible text equivalent, at no image
weight. The failure mode that hid the orbit bug — valid markup, valid CSS,
invisible breakage — is addressed by construction rather than by a gate.

**Cost.** Drawing takes longer than prompting, and a diagram is a design
decision each time. Complex or data-driven visuals are out of reach without
revisiting the library question.

**Not enforced.** No check verifies that a diagram's geometry is sound; the
orbit proves a broken one can pass every gate this repository has. The
mitigation is that a diagram is now reviewed in a browser at three widths
before it is believed — which is how the 0×0 wrapper was found, four sprints
after it shipped.
