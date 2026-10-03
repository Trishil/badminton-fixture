# 🏸 SmashFlow - Badminton Tournament Operations Engine

A tournament operations hub and real-time court scoring manager designed for **20 Teams**, **2 Courts**, and a **3-Hour Window** with sudden-death race-to-5 scoring and knockout playoffs.

Featuring a **crisp, clean white sports aesthetic** and a **mobile-first ground scoring interface** optimized for umpires and coordinators holding their smartphones courtside.

---

## 📱 Mobile Ground Web Version Features

- **Ergonomic Thumb Scoring**: Large 48px+ touch targets for `+1` (emerald) and `-1` score adjustments with zero mis-taps on court.
- **Dedicated Court Switcher**: Toggle between `Court 1`, `Court 2`, or `Both Courts` in one tap to maximize scoreboard size on small screens.
- **Screen Wake Lock API**: Keep phone screens awake indefinitely while scoring on court without the phone sleeping.
- **7-Minute Digital Timers**: Live match countdown with +1m extension, pause/play, and automatic sound buzzers.
- **On-Deck Announcement Queue**: Shows the next match queued up for each court so marshals can call teams for warm-up.
- **PWA & Add to Home Screen**: Installable as a standalone fullscreen app on iOS Safari and Android Chrome (`manifest.json` configured).
- **100% Offline & Auto-Save**: All tournament scores, fixtures, and standings save in real-time to `localStorage`. If court Wi-Fi or cellular drops, everything continues seamlessly.

---

## 🎨 White & Aesthetically Pleasing UI

- **Bright & High-Contrast**: Designed specifically for high legibility under bright badminton court lighting and outdoor daylight.
- **Court Color Coding**:
  - **Court 1**: Royal Blue accents (`#2563eb`)
  - **Court 2**: Vibrant Purple accents (`#7c3aed`)
  - **Active / Winning**: Emerald Green (`#059669`)
  - **Sudden-Death (4-4)**: Amber Warning (`#d97706`)
- **Refined Typography & Micro-interactions**: Smooth transitions, pill badges, and celebratory confetti upon tournament completion.

---

## 🚀 Running Locally & On Ground Mobile (Hotspot/Wi-Fi)

To use your phone on the ground connected to the same Wi-Fi or phone hotspot:

```bash
# Install dependencies
npm install

# Start development server accessible over the local network
npm run dev
```

Vite will output:
```
➜  Local:   http://localhost:3000/
➜  Network: http://192.168.x.x:3000/
```
Open the **Network URL** on your mobile phone's browser, tap **Share → Add to Home Screen** on iPhone or **Install app** on Android.

---

## 🌐 Hosting & Deployment Guide

The code is committed and pushed to the private GitHub repository:
👉 **`https://github.com/Trishil/badminton-fixture`**

### Option 1: Free 1-Click Hosting for Private Repos (Vercel / Cloudflare Pages)
*GitHub Pages on free personal accounts requires the repository to be public (GitHub Free returns 422 for private repos).*
To keep the repo **private** and host it with 1 click for free:
1. Go to **[vercel.com](https://vercel.com)** and log in with your GitHub account (`Trishil`).
2. Click **"Add New Project"** and select **`badminton-fixture`**.
3. Click **"Deploy"**.
4. In ~30 seconds, Vercel gives you a live HTTPS link (e.g. `badminton-fixture.vercel.app`) that anyone can open on their mobile phone!

### Option 2: Host on GitHub Pages (Requires Public Repository)
If you want to use GitHub Pages (`https://trishil.github.io/badminton-fixture/`):
1. In the GitHub repository settings (`https://github.com/Trishil/badminton-fixture/settings`), change the repository visibility to **Public**.
2. Go to **Settings → Pages**, and under **Build and deployment**, select **GitHub Actions**.
3. The `.github/workflows/deploy.yml` workflow will automatically build and publish the site!
