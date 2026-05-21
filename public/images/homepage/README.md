# Homepage Images

Drop images here. Components load them automatically — no code changes needed.

## hero.jpg

**Path:** `/public/images/homepage/hero.jpg`  
**Used by:** `components/Hero.tsx` (CSS background, right-aligned)  
**Aspect:** Landscape — fills the right ~60% of the hero section  
**Dimensions:** 1600×900px minimum (2x for retina: 3200×1800px)

**Scene:** Professional at work — desk, laptop, office. Warm/neutral tone.  
**Framing:** Subject on the right. Left side dark (text overlays there).  
**Style:** Real person, real environment. No stock-photo poses. No tech clichés.  
**Overlay:** The component applies `linear-gradient(to right, dark 40%, transparent 100%)` — left side is always dark regardless of image.

**Wiring:** Already live in Hero.tsx as CSS background:
```css
url(/images/homepage/hero.jpg) center right / cover no-repeat
```

---

## pain/ — Pain card images

**Path:** `/public/images/homepage/pain/p1.jpg` through `p6.jpg`  
**Used by:** `components/homepage/PainCards.tsx`  
**Aspect:** 16:9  
**Dimensions:** 800×450px minimum (1600×900px recommended)

| File   | Pain card | Scene suggestion |
|--------|-----------|-----------------|
| p1.jpg | Customer Enquiries | Phone on desk with missed call indicator |
| p2.jpg | Invoicing | Pile of paper invoices, stressed expression |
| p3.jpg | Communications | Overflowing email inbox on screen |
| p4.jpg | Field Operations | Van/site worker without paperwork system |
| p5.jpg | Reputation | Laptop showing Google reviews page |
| p6.jpg | Systems/Tools | Multiple app screens that don't connect |

**Style rules:**
- Real scenes, not stock photography poses
- Dark or desaturated — the orange overlay handles visual weight
- No AI robot imagery
- No generic "digital transformation" clichés
- Person visible = better (creates emotional connection)

**Wiring:** Components apply dark gradient overlay on top:
```css
linear-gradient(to bottom, rgba(10,10,14,0.2) 0%, rgba(10,10,14,0.65) 100%)
```

---

## Format

- JPEG preferred (JPG is fine)
- WebP also works — update file extensions in component if used
- Compress to ≤200KB per image
- No transparency needed (JPG is correct)
