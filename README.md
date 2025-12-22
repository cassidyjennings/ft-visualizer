# Fourier Transform Visualizer

An interactive web application for building intuition about **Fourier transforms** by drawing grayscale images and exploring their frequency-domain representations.

Users can draw images pixel-by-pixel, view the **magnitude** and **phase** of the 2D Fourier transform, and experiment with inverse transforms to see how changes in frequency affect the reconstructed image.

The project is designed as an **educational tool** for learning signal processing and image analysis.

---

## Features (Planned & In Progress)

- Draw grayscale images on a pixel grid  
  - Choose image dimensions (powers of two)
  - Click or drag to draw
  - Adjustable grayscale values
- Visualize the 2D Fourier Transform  
  - Log-scaled magnitude spectrum
  - Phase spectrum
  - Centered (fftshifted) view
- Inverse Fourier Transform  
  - Reconstruct images from magnitude and phase
  - Explore magnitude-only and phase-only reconstructions


---

## Motivation

Fourier transforms are often taught abstractly, but intuition comes from interaction.

This tool lets users *draw → transform → reconstruct*, helping answer questions like:
- What does an edge or pattern look like in the frequency domain?
- Why is phase so important for structure?
- How do specific frequencies affect an image?


---

## Tech Stack

- Next.js (App Router)
- React + TypeScript
- HTML Canvas
- Web Workers (planned)
- Tailwind CSS
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


---

## License

MIT License

