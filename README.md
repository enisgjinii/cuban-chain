# Cuban Chain Customizer

A premium interactive 3D Cuban link chain customizer built with **Next.js**, **React**, **TypeScript**, **Three.js**, and **React Three Fiber**.

The project presents a full-screen WebGL product experience where users can inspect a 3D Cuban chain, adjust chain length, customize individual links and surfaces, switch materials, apply surface treatments, and export product visuals directly from the browser.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=nextdotjs)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-3D-black?style=for-the-badge&logo=threedotjs)](https://threejs.org/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/)

---

## Overview

**Cuban Chain Customizer** is a browser-based jewelry product configurator. It renders a GLB model in real time and provides a polished customization interface for product preview, presentation, and export workflows.

It is suitable for:

- Jewelry product configurators
- Interactive e-commerce demos
- Luxury product visualization
- WebGL and Three.js portfolio work
- Client-facing product personalization prototypes

---

## Features

### 3D Viewer

- Real-time GLB rendering
- Orbit camera controls
- Auto-fit model framing
- Preset camera views
- Desktop and mobile responsive canvas

### Product Customization

- Dynamic chain length control
- Per-link configuration
- Surface-level editing for top and side areas
- Material options: silver, grey, black, white, and gold
- Surface options: gemstones, moissanites, enamel, and engraving patterns

### Export Tools

- Screenshot capture
- PNG, JPG, and WebP export
- Video recording workflow
- GIF export workflow
- Fullscreen preview mode

### Interface

- Glass-style floating controls
- Right-side camera/export toolbar
- Bottom customization dock
- Toast feedback for user actions
- Mobile-aware UI behavior

---

## Tech Stack

| Area | Technology |
| --- | --- |
| Framework | Next.js 16 |
| UI | React 19, Material UI, Radix UI |
| Language | TypeScript |
| 3D | Three.js, React Three Fiber, Drei |
| Styling | Tailwind CSS, MUI styling utilities |
| Forms / Validation | React Hook Form, Zod |
| Hosting | Vercel |
| Package Manager | pnpm |

---

## Getting Started

### Requirements

- Node.js 20 or newer recommended
- pnpm

Install pnpm if needed:

```bash
npm install -g pnpm
```

### Install

```bash
git clone https://github.com/enisgjinii/cuban-chain.git
cd cuban-chain
pnpm install
```

### Run Locally

```bash
pnpm dev
```

Open:

```bash
http://localhost:3004
```

### Build

```bash
pnpm build
```

### Start Production Server

```bash
pnpm start
```

### Lint

```bash
pnpm lint
```

---

## Project Structure

```txt
cuban-chain/
├── app/
│   └── page.tsx
├── components/
│   ├── model-viewer.tsx
│   ├── simple-customizer-dock.tsx
│   └── screenshot-modal.tsx
├── lib/
│   ├── chain-config-types.ts
│   ├── chain-helpers.ts
│   ├── chain-geometry.ts
│   └── gif-encoder.ts
├── public/
│   └── models/
│       └── EntireChain.glb
├── package.json
└── pnpm-lock.yaml
```

---

## Customization Model

The app uses a structured chain configuration model. Each chain link can define its own material and surface setup.

Core configuration areas:

- Chain length
- Link material
- Top surfaces
- Side surfaces
- Gemstone colors
- Enamel colors
- Engraving design

This structure makes the app easier to extend later with pricing, SKU generation, quote requests, Shopify, or WooCommerce integration.

---

## Deployment

The project is ready for Vercel deployment.

Recommended Vercel settings:

```bash
Install Command: pnpm install
Build Command: pnpm build
Output: Next.js default
```

After deployment, test:

- 3D model loading
- Mobile performance
- Export tools
- Fullscreen mode
- Camera presets

---

## Production Checklist

- [ ] Confirm final 3D model scale
- [ ] Optimize GLB model size
- [ ] Add final branding and SEO metadata
- [ ] Test on Safari, Chrome, and mobile browsers
- [ ] Connect pricing or quote flow if used commercially
- [ ] Add product/SKU mapping if connected to e-commerce
- [ ] Validate all export formats

---

## Roadmap

Possible next improvements:

- Pricing engine
- Save/share configuration links
- Shopify or WooCommerce integration
- Quote request form
- Admin-managed material options
- More stone and metal presets
- Real-time engraving text preview
- AR/mobile preview support

---

## Owner

Built and maintained by **Enis Gjini**.

GitHub: [@enisgjinii](https://github.com/enisgjinii)
