import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Relative base so the built assets resolve correctly regardless of the
// GitHub Pages repo name / subpath. Works whether this is a project page
// (username.github.io/repo-name/) or a user/org root page.
export default defineConfig({
  plugins: [react()],
  base: './',
})
