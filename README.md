# Fourier Transform Visualizer

An interactive web application for building intuition about **Fourier transforms** through two tools: a 1D signal editor and a 2D image drawing canvas.

Users can construct or draw signals, compute their Discrete Fourier Transforms, and explore the resulting **magnitude** and **phase** spectra. The project is designed as an **educational tool** for learning signal processing and image analysis.

---

## Tools

### 1D Axis (`/axis`)

- Build a discrete signal by dragging stems directly on the plot
- Layer in synthetic signals — sine, cosine, square, and constant — each with adjustable amplitude, coefficient, and period
- Compute the DFT and view magnitude and phase stem plots side-by-side
- Configurable N (number of samples), undo/clear, and fftshift toggle
- Settings control normalization convention, magnitude scale (linear/log), and whether n=0 appears at the left edge or center

### 2D Grid (`/grid`)

- Draw grayscale images on a pixel grid (sizes 2×2 through 64×64, powers of two)
- Adjustable brush radius and shape; toggle grid overlay; undo with Ctrl+Z
- Compute the 2D FFT and view magnitude and phase canvases
- Spectrum panels are independently resizable
- Dark and light modes invert drawing colors correctly
- Settings control DC centering (fftshift), normalization, magnitude scale (linear/log), magnitude normalization, and the 2D spatial-origin convention

### Settings (`/settings`)

All settings persist in `localStorage`. Options include:
- **Theme** — light, dark, or follow OS
- **DFT normalization** — forward (1/N), inverse (1/N), unitary (1/√N on both), or none
- **Magnitude scale** — linear or log
- **Center DC** — shift spectrum so zero-frequency appears at center
- **Coordinate origins** — 1D axis (left / center); 2D canvas (center pixel, between center pixels, or top-left)

---

## Motivation

Fourier transforms are often taught abstractly, but intuition comes from interaction.

These tools let users *construct → transform → inspect*, helping answer questions like:
- What does an edge or pattern look like in the frequency domain?
- Why is phase so important for structure?
- How do specific frequencies affect a signal or image?

---

## Tech Stack

- Next.js 16 (App Router)
- React 19 + TypeScript 5
- HTML Canvas
- Web Workers (2D FFT runs off the main thread)
- Tailwind CSS v4
- Vercel for deployment

---

## Getting Started

```bash
npm install
npm run dev
```
Open http://localhost:3000 in your browser.

---

## Conventions

Mathematical and implementation conventions (image format, FFT normalization, visualization choices) are documented in:
```bash
docs/conventions.md
```

