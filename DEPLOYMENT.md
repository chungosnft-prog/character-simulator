# Deployment Guide

This guide covers multiple deployment options for the Character Simulator.

## Build the Project

First, build the project for production:

```bash
npm run build
```

This creates a `dist` folder with all the production-ready files.

## Deployment Options

### Option 1: Vercel (Recommended - Easiest)

1. **Install Vercel CLI** (optional, or use web interface):
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```
   Or visit [vercel.com](https://vercel.com) and:
   - Import your Git repository
   - Vercel will auto-detect Vite and configure it
   - Deploy!

3. **Configuration**: The `vercel.json` file is already included for optimal settings.

**Pros**: Free, automatic HTTPS, CDN, easy Git integration

---

### Option 2: Netlify

1. **Install Netlify CLI** (optional):
   ```bash
   npm i -g netlify-cli
   ```

2. **Deploy**:
   ```bash
   netlify deploy --prod
   ```
   Or visit [netlify.com](https://netlify.com) and:
   - Drag and drop the `dist` folder
   - Or connect your Git repository

3. **Configuration**: The `netlify.toml` file is already included.

**Pros**: Free, easy drag-and-drop, good for static sites

---

### Option 3: GitHub Pages

1. **Install gh-pages**:
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Add deploy script** to `package.json`:
   ```json
   "scripts": {
     "deploy": "npm run build && gh-pages -d dist"
   }
   ```

3. **Deploy**:
   ```bash
   npm run deploy
   ```

4. **Enable GitHub Pages** in your repo settings:
   - Go to Settings → Pages
   - Select source: `gh-pages` branch
   - Your site will be at: `https://yourusername.github.io/character-simulator`

**Note**: Update `vite.config.ts` base to `"/character-simulator/"` if deploying to a subdirectory.

**Pros**: Free, integrated with GitHub

---

### Option 4: Cloudflare Pages

1. Visit [pages.cloudflare.com](https://pages.cloudflare.com)
2. Connect your Git repository
3. Build command: `npm run build`
4. Output directory: `dist`
5. Deploy!

**Pros**: Free, fast CDN, great performance

---

### Option 5: Traditional Web Hosting

1. Build the project:
   ```bash
   npm run build
   ```

2. Upload the entire `dist` folder contents to your web server's public directory (usually `public_html` or `www`)

3. Ensure your server supports:
   - Static file serving
   - Proper MIME types for `.js`, `.wasm`, `.glb`, etc.

**Pros**: Full control, can use existing hosting

---

## Testing the Build Locally

Before deploying, test the production build:

```bash
npm run preview
```

This serves the `dist` folder at `http://localhost:4173`

---

## Important Notes

1. **Large Assets**: The build includes large 3D models and audio files. Consider:
   - Using a CDN for assets
   - Lazy loading models
   - Compressing assets further

2. **Environment Variables**: If you need environment variables, create a `.env.production` file.

3. **Base Path**: The `vite.config.ts` has `base: "./"` which works for most deployments. For subdirectories, update it accordingly.

4. **CORS**: The restaurant model loads from an external URL. Ensure CORS is properly configured on the source server.

---

## Quick Deploy Commands

### Vercel
```bash
vercel --prod
```

### Netlify
```bash
netlify deploy --prod --dir=dist
```

### GitHub Pages
```bash
npm run deploy
```

---

## Troubleshooting

- **404 errors on refresh**: Ensure your hosting provider supports SPA routing (all routes serve `index.html`)
- **Assets not loading**: Check that `base` path in `vite.config.ts` matches your deployment path
- **CORS errors**: The external GLB model URL must allow cross-origin requests

