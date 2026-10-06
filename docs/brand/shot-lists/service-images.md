# Service Page Images

Place images here per service. Pages are wired to accept Next/Image components.

## Directory structure

```
services/
├── social-media/     → phone, content calendar, business desk, social preview
├── reviews/          → Google review UI scene, phone with ratings
├── customer-inquiries/ → inbox UI, WhatsApp/email/phone visual
├── workflow/         → tool dashboard, data flow diagram, office scene
└── agents/           → conversation UI, response timeline, monitoring dashboard
```

## Rules

- No hotlinks — all images must be stored here
- No robot imagery
- No generic AI stock (brain, circuits, glowing nodes)
- Real work scenes: phones, desks, operators, workflow UI, system screenshots
- Aspect ratio: 16:9 for hero images, 8:5 for cards

## How to wire a page image

In the page component, add:

```tsx
import Image from 'next/image'

<div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden' }}>
  <Image
    src="/images/services/social-media/hero.jpg"
    alt="Content calendar on a business desk"
    fill
    style={{ objectFit: 'cover' }}
    priority
  />
</div>
```
