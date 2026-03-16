/**
 * Analytics & Tracking Configuration
 *
 * Clarity and Search Console are ON by default — just paste in your IDs.
 * Plausible is OFF by default — set enabled: true and add your domain to activate.
 *
 * See ANALYTICS-SETUP.md for step-by-step instructions.
 */

export const analytics = {
  /** Microsoft Clarity — free heatmaps, session recordings, rage click detection */
  clarity: {
    enabled: true,
    projectId: 'PASTE_YOUR_CLARITY_ID_HERE',
  },

  /** Google Search Console — search performance, indexing, crawl stats */
  searchConsole: {
    verificationId: 'PASTE_YOUR_SEARCH_CONSOLE_ID_HERE',
  },

  /** Plausible Analytics — privacy-friendly, lightweight analytics (OFF by default) */
  plausible: {
    enabled: false,
    domain: '',
  },
} as const

/** Check if a value is a real ID (not the placeholder text) */
export function isConfigured(value: string): boolean {
  return (
    value.length > 0 &&
    !value.startsWith('PASTE_') &&
    !value.includes('YOUR_') &&
    !value.includes('_HERE')
  )
}
