/**
 * Conversion tracking helpers.
 *
 * These fire events to Plausible when enabled.
 * If no analytics are active, they silently do nothing — no errors, no warnings.
 * Clarity automatically captures all clicks as part of session recordings.
 */

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, string> }) => void
  }
}

function fire(event: string, props?: Record<string, string>) {
  try {
    if (typeof window !== 'undefined' && window.plausible) {
      window.plausible(event, props ? { props } : undefined)
    }
  } catch {
    // silent — analytics should never break the site
  }
}

export function trackPhoneClick(number?: string) {
  fire('Phone Click', { number: number || 'unknown' })
}

export function trackFormSubmit(service?: string) {
  fire('Form Submit', { service: service || 'unknown' })
}

export function trackWhatsAppClick() {
  fire('WhatsApp Click')
}

export function trackDirectionsClick() {
  fire('Directions Click')
}
