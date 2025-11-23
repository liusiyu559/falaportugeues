
/**
 * Safely retrieves the API Key from various environment configurations.
 * Prioritizes:
 * 1. Vite Environment Variables (import.meta.env) - Standard for Vercel/Vite
 * 2. Node/Webpack Process Variables (process.env) - Standard for CRA
 * 3. Window Polyfill (window.process) - Fallback for static HTML
 * 4. AI Studio Injection (window.aistudio)
 */
export const getApiKey = (): string | undefined => {
  // 1. Check for Vite (Vercel standard for React)
  // We use a try-catch or safe check because import.meta might not exist in all bundlers
  try {
    const meta = import.meta as any;
    if (meta && meta.env && meta.env.VITE_API_KEY) {
      return meta.env.VITE_API_KEY;
    }
  } catch (e) {
    // Ignore error if import.meta is not supported
  }

  // 2. Check for Process (Create React App / Webpack)
  try {
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      return process.env.API_KEY;
    }
  } catch (e) {
    // Ignore
  }

  // 3. Check for Window Polyfill (index.html script)
  try {
    const win = window as any;
    if (win.process && win.process.env && win.process.env.API_KEY) {
      return win.process.env.API_KEY;
    }
  } catch (e) {
    // Ignore
  }

  return undefined;
};
