export interface ThemeConfig {
  id: string
  name: string
  group: 'a' | 'b'
  personality: string
  recommended?: boolean
  topPick?: boolean
  colors: {
    primary: string; primaryLight: string; primaryDark: string
    secondary: string; secondaryLight: string
    accent: string; accentLight: string
    surface: string; surfaceAlt: string
    background: string; foreground: string; foregroundMuted: string
    border: string; success: string; warning: string; error: string
    ctaBg: string; ctaText: string; ctaHover: string
    navBg: string; navText: string
    heroBg: string; heroText: string
    cardBg: string; cardBorder: string
    footerBg: string; footerText: string
  }
  fonts: { heading: string; body: string; ui: string; headingImport: string; bodyImport: string }
  radius: string; radiusLg: string; radiusFull: string
  shadow: string; shadowLg: string; shadowGlow: string
  animation: 'subtle' | 'moderate' | 'dramatic'
  heroStyle: string; iconStyle: string
}

const cleanProfessional: ThemeConfig = {
  id: 'clean-professional', name: 'Clean & Professional', group: 'a',
  personality: 'Minimal, corporate trust. Apple-meets-trade. No-nonsense authority.',
  colors: { primary: '#1B365D', primaryLight: '#2A5298', primaryDark: '#0F2340', secondary: '#4A90D9', secondaryLight: '#7DB3F0', accent: '#E8601C', accentLight: '#FF8A4C', surface: '#FFFFFF', surfaceAlt: '#F8F9FB', background: '#FFFFFF', foreground: '#1A1A2E', foregroundMuted: '#6B7280', border: '#E5E7EB', success: '#059669', warning: '#D97706', error: '#DC2626', ctaBg: '#E8601C', ctaText: '#FFFFFF', ctaHover: '#D4520F', navBg: '#FFFFFF', navText: '#1B365D', heroBg: '#F8F9FB', heroText: '#1B365D', cardBg: '#FFFFFF', cardBorder: '#E5E7EB', footerBg: '#1B365D', footerText: '#E0E7F1' },
  fonts: { heading: '"Inter", sans-serif', body: '"Inter", sans-serif', ui: '"Inter", sans-serif', headingImport: 'family=Inter:wght@400;500;600;700;800', bodyImport: 'family=Inter:wght@400;500;600' },
  radius: '8px', radiusLg: '12px', radiusFull: '9999px',
  shadow: '0 1px 3px rgba(0,0,0,0.08)', shadowLg: '0 10px 25px rgba(0,0,0,0.08)', shadowGlow: 'none',
  animation: 'subtle', heroStyle: 'Crisp split layout with strong headline and trust badges.', iconStyle: 'Outlined, minimal line icons'
}

const warmApproachable: ThemeConfig = {
  id: 'warm-approachable', name: 'Warm & Approachable', group: 'a',
  personality: 'Friendly, family-run feel. Inviting and human.',
  colors: { primary: '#B45309', primaryLight: '#D97706', primaryDark: '#92400E', secondary: '#7C3AED', secondaryLight: '#A78BFA', accent: '#059669', accentLight: '#34D399', surface: '#FFFBF5', surfaceAlt: '#FEF3E2', background: '#FFFBF5', foreground: '#44403C', foregroundMuted: '#78716C', border: '#E7DDD0', success: '#059669', warning: '#D97706', error: '#DC2626', ctaBg: '#B45309', ctaText: '#FFFFFF', ctaHover: '#92400E', navBg: '#FFFBF5', navText: '#44403C', heroBg: '#FEF3E2', heroText: '#44403C', cardBg: '#FFFFFF', cardBorder: '#E7DDD0', footerBg: '#44403C', footerText: '#E7DDD0' },
  fonts: { heading: '"Nunito", sans-serif', body: '"Nunito Sans", sans-serif', ui: '"Nunito Sans", sans-serif', headingImport: 'family=Nunito:wght@400;600;700;800', bodyImport: 'family=Nunito+Sans:wght@400;500;600' },
  radius: '16px', radiusLg: '24px', radiusFull: '9999px',
  shadow: '0 2px 8px rgba(180,83,9,0.08)', shadowLg: '0 12px 30px rgba(180,83,9,0.12)', shadowGlow: 'none',
  animation: 'moderate', heroStyle: 'Warm gradient background with friendly illustration.', iconStyle: 'Rounded, friendly filled icons'
}

const boldHighEnergy: ThemeConfig = {
  id: 'bold-high-energy', name: 'Bold & High-Energy', group: 'a',
  personality: 'Striking, confident, modern. Strong visual impact.',
  colors: { primary: '#0EA5E9', primaryLight: '#38BDF8', primaryDark: '#0284C7', secondary: '#F97316', secondaryLight: '#FB923C', accent: '#8B5CF6', accentLight: '#A78BFA', surface: '#0F172A', surfaceAlt: '#1E293B', background: '#0F172A', foreground: '#F1F5F9', foregroundMuted: '#94A3B8', border: '#334155', success: '#22C55E', warning: '#EAB308', error: '#EF4444', ctaBg: '#F97316', ctaText: '#FFFFFF', ctaHover: '#EA580C', navBg: 'rgba(15,23,42,0.85)', navText: '#F1F5F9', heroBg: '#0F172A', heroText: '#FFFFFF', cardBg: '#1E293B', cardBorder: '#334155', footerBg: '#020617', footerText: '#94A3B8' },
  fonts: { heading: '"Space Grotesk", sans-serif', body: '"DM Sans", sans-serif', ui: '"DM Sans", sans-serif', headingImport: 'family=Space+Grotesk:wght@400;500;600;700', bodyImport: 'family=DM+Sans:wght@400;500;600' },
  radius: '12px', radiusLg: '20px', radiusFull: '9999px',
  shadow: '0 4px 20px rgba(14,165,233,0.15)', shadowLg: '0 20px 50px rgba(14,165,233,0.25)', shadowGlow: '0 0 30px rgba(14,165,233,0.3)',
  animation: 'dramatic', heroStyle: 'Full-bleed dark hero with glassmorphism overlay.', iconStyle: 'Bold, filled icons with glow effects'
}

const premiumLuxurious: ThemeConfig = {
  id: 'premium-luxurious', name: 'Premium & Luxurious', group: 'a',
  personality: 'High-end positioning. Elegant, refined.',
  colors: { primary: '#C9A84C', primaryLight: '#DFC06A', primaryDark: '#A88B35', secondary: '#8B6914', secondaryLight: '#B8922E', accent: '#C9A84C', accentLight: '#E8D48B', surface: '#1A1A1A', surfaceAlt: '#242424', background: '#111111', foreground: '#F5F0E8', foregroundMuted: '#A89F8F', border: '#333333', success: '#4ADE80', warning: '#FBBF24', error: '#F87171', ctaBg: '#C9A84C', ctaText: '#111111', ctaHover: '#DFC06A', navBg: 'rgba(17,17,17,0.9)', navText: '#F5F0E8', heroBg: '#111111', heroText: '#F5F0E8', cardBg: '#1A1A1A', cardBorder: '#333333', footerBg: '#0A0A0A', footerText: '#A89F8F' },
  fonts: { heading: '"Playfair Display", serif', body: '"Lato", sans-serif', ui: '"Lato", sans-serif', headingImport: 'family=Playfair+Display:wght@400;500;600;700', bodyImport: 'family=Lato:wght@300;400;700' },
  radius: '4px', radiusLg: '8px', radiusFull: '9999px',
  shadow: '0 2px 15px rgba(201,168,76,0.1)', shadowLg: '0 15px 40px rgba(201,168,76,0.15)', shadowGlow: '0 0 40px rgba(201,168,76,0.15)',
  animation: 'moderate', heroStyle: 'Dark, cinematic hero with gold typography accents.', iconStyle: 'Thin, elegant line icons with gold accent'
}

const modernPlayful: ThemeConfig = {
  id: 'modern-playful', name: 'Modern & Playful', group: 'a',
  personality: 'Fresh, contemporary. Bento grid, vibrant gradients.',
  colors: { primary: '#6366F1', primaryLight: '#818CF8', primaryDark: '#4F46E5', secondary: '#EC4899', secondaryLight: '#F472B6', accent: '#14B8A6', accentLight: '#5EEAD4', surface: '#FFFFFF', surfaceAlt: '#F5F3FF', background: '#FAFAFE', foreground: '#1E1B4B', foregroundMuted: '#6B7280', border: '#E5E7EB', success: '#10B981', warning: '#F59E0B', error: '#EF4444', ctaBg: '#6366F1', ctaText: '#FFFFFF', ctaHover: '#4F46E5', navBg: 'rgba(255,255,255,0.8)', navText: '#1E1B4B', heroBg: '#F5F3FF', heroText: '#1E1B4B', cardBg: '#FFFFFF', cardBorder: '#E5E7EB', footerBg: '#1E1B4B', footerText: '#C7D2FE' },
  fonts: { heading: '"Plus Jakarta Sans", sans-serif', body: '"Plus Jakarta Sans", sans-serif', ui: '"Plus Jakarta Sans", sans-serif', headingImport: 'family=Plus+Jakarta+Sans:wght@400;500;600;700;800', bodyImport: 'family=Plus+Jakarta+Sans:wght@400;500;600' },
  radius: '20px', radiusLg: '28px', radiusFull: '9999px',
  shadow: '0 4px 15px rgba(99,102,241,0.1)', shadowLg: '0 20px 50px rgba(99,102,241,0.15)', shadowGlow: '0 0 30px rgba(99,102,241,0.2)',
  animation: 'dramatic', heroStyle: 'Bento grid hero with animated gradient blobs.', iconStyle: 'Rounded, colourful filled icons with 3D effect'
}

const trustFortress: ThemeConfig = {
  id: 'trust-fortress', name: 'Trust Fortress', group: 'b',
  personality: 'Maximum credibility engineering. Every element screams reliability.',
  recommended: true,
  colors: { primary: '#1E40AF', primaryLight: '#3B82F6', primaryDark: '#1E3A8A', secondary: '#047857', secondaryLight: '#10B981', accent: '#DC2626', accentLight: '#F87171', surface: '#FFFFFF', surfaceAlt: '#F0F4FF', background: '#FFFFFF', foreground: '#111827', foregroundMuted: '#6B7280', border: '#D1D5DB', success: '#059669', warning: '#D97706', error: '#DC2626', ctaBg: '#DC2626', ctaText: '#FFFFFF', ctaHover: '#B91C1C', navBg: '#FFFFFF', navText: '#111827', heroBg: '#F0F4FF', heroText: '#111827', cardBg: '#FFFFFF', cardBorder: '#D1D5DB', footerBg: '#111827', footerText: '#D1D5DB' },
  fonts: { heading: '"Outfit", sans-serif', body: '"Source Sans 3", sans-serif', ui: '"Source Sans 3", sans-serif', headingImport: 'family=Outfit:wght@400;500;600;700;800', bodyImport: 'family=Source+Sans+3:wght@400;500;600' },
  radius: '10px', radiusLg: '16px', radiusFull: '9999px',
  shadow: '0 2px 8px rgba(0,0,0,0.06)', shadowLg: '0 10px 30px rgba(0,0,0,0.1)', shadowGlow: 'none',
  animation: 'subtle', heroStyle: 'Evidence-led hero: star rating, review count, Gas Safe badge above fold.', iconStyle: 'Solid, institutional-feeling icons'
}

const neighbourhoodHero: ThemeConfig = {
  id: 'neighbourhood-hero', name: 'Neighbourhood Hero', group: 'b',
  personality: "Hyper-local identity. Community's own engineer.",
  recommended: true,
  colors: { primary: '#16A34A', primaryLight: '#4ADE80', primaryDark: '#15803D', secondary: '#2563EB', secondaryLight: '#60A5FA', accent: '#F59E0B', accentLight: '#FCD34D', surface: '#FFFFFF', surfaceAlt: '#F0FDF4', background: '#FFFFFF', foreground: '#1A2E1A', foregroundMuted: '#6B7B6B', border: '#D1E7D1', success: '#16A34A', warning: '#F59E0B', error: '#DC2626', ctaBg: '#16A34A', ctaText: '#FFFFFF', ctaHover: '#15803D', navBg: '#FFFFFF', navText: '#1A2E1A', heroBg: '#F0FDF4', heroText: '#1A2E1A', cardBg: '#FFFFFF', cardBorder: '#D1E7D1', footerBg: '#1A2E1A', footerText: '#A7C4A7' },
  fonts: { heading: '"Lexend", sans-serif', body: '"Open Sans", sans-serif', ui: '"Open Sans", sans-serif', headingImport: 'family=Lexend:wght@400;500;600;700', bodyImport: 'family=Open+Sans:wght@400;500;600' },
  radius: '12px', radiusLg: '20px', radiusFull: '9999px',
  shadow: '0 2px 10px rgba(22,163,74,0.08)', shadowLg: '0 12px 35px rgba(22,163,74,0.12)', shadowGlow: 'none',
  animation: 'moderate', heroStyle: 'Map-integrated hero with community-focused headline.', iconStyle: 'Friendly rounded icons with green accents'
}

const smartHomeTech: ThemeConfig = {
  id: 'smart-home-tech', name: 'Smart Home Tech', group: 'b',
  personality: 'Tech-forward heating company. Smart thermostat USP.',
  recommended: true,
  colors: { primary: '#7C3AED', primaryLight: '#A78BFA', primaryDark: '#6D28D9', secondary: '#06B6D4', secondaryLight: '#67E8F9', accent: '#F43F5E', accentLight: '#FB7185', surface: '#FAFAFA', surfaceAlt: '#F3F0FF', background: '#FAFAFA', foreground: '#18181B', foregroundMuted: '#71717A', border: '#E4E4E7', success: '#22C55E', warning: '#EAB308', error: '#EF4444', ctaBg: '#7C3AED', ctaText: '#FFFFFF', ctaHover: '#6D28D9', navBg: 'rgba(250,250,250,0.85)', navText: '#18181B', heroBg: '#F3F0FF', heroText: '#18181B', cardBg: '#FFFFFF', cardBorder: '#E4E4E7', footerBg: '#18181B', footerText: '#A1A1AA' },
  fonts: { heading: '"Sora", sans-serif', body: '"Inter", sans-serif', ui: '"Inter", sans-serif', headingImport: 'family=Sora:wght@400;500;600;700', bodyImport: 'family=Inter:wght@400;500;600' },
  radius: '14px', radiusLg: '22px', radiusFull: '9999px',
  shadow: '0 4px 15px rgba(124,58,237,0.08)', shadowLg: '0 15px 40px rgba(124,58,237,0.12)', shadowGlow: '0 0 25px rgba(124,58,237,0.15)',
  animation: 'moderate', heroStyle: 'Gradient mesh with smart device mockup.', iconStyle: 'Modern, geometric icons with gradient fills'
}

const emergencyReady: ThemeConfig = {
  id: 'emergency-ready', name: 'Emergency Ready', group: 'b',
  personality: 'Urgency-first design. Speed to contact.',
  recommended: true,
  colors: { primary: '#DC2626', primaryLight: '#F87171', primaryDark: '#B91C1C', secondary: '#1D4ED8', secondaryLight: '#60A5FA', accent: '#F59E0B', accentLight: '#FCD34D', surface: '#FFFFFF', surfaceAlt: '#FEF2F2', background: '#FFFFFF', foreground: '#1F2937', foregroundMuted: '#6B7280', border: '#E5E7EB', success: '#16A34A', warning: '#F59E0B', error: '#DC2626', ctaBg: '#DC2626', ctaText: '#FFFFFF', ctaHover: '#B91C1C', navBg: '#FFFFFF', navText: '#1F2937', heroBg: '#1F2937', heroText: '#FFFFFF', cardBg: '#FFFFFF', cardBorder: '#E5E7EB', footerBg: '#1F2937', footerText: '#9CA3AF' },
  fonts: { heading: '"Rubik", sans-serif', body: '"Rubik", sans-serif', ui: '"Rubik", sans-serif', headingImport: 'family=Rubik:wght@400;500;600;700;800', bodyImport: 'family=Rubik:wght@400;500;600' },
  radius: '8px', radiusLg: '12px', radiusFull: '9999px',
  shadow: '0 2px 8px rgba(0,0,0,0.08)', shadowLg: '0 10px 25px rgba(0,0,0,0.12)', shadowGlow: '0 0 20px rgba(220,38,38,0.2)',
  animation: 'subtle', heroStyle: 'Dark urgent hero with pulsing phone CTA.', iconStyle: 'Bold, high-contrast icons with red accents'
}

const heritageCraft: ThemeConfig = {
  id: 'heritage-craft', name: 'Heritage Craft', group: 'b',
  personality: 'Artisan positioning. Editorial, magazine-quality feel.',
  recommended: true,
  colors: { primary: '#292524', primaryLight: '#57534E', primaryDark: '#1C1917', secondary: '#B45309', secondaryLight: '#D97706', accent: '#B45309', accentLight: '#F59E0B', surface: '#FAF9F6', surfaceAlt: '#F5F0EB', background: '#FAF9F6', foreground: '#1C1917', foregroundMuted: '#78716C', border: '#D6D3D1', success: '#059669', warning: '#D97706', error: '#DC2626', ctaBg: '#292524', ctaText: '#FAF9F6', ctaHover: '#1C1917', navBg: '#FAF9F6', navText: '#1C1917', heroBg: '#FAF9F6', heroText: '#1C1917', cardBg: '#FFFFFF', cardBorder: '#D6D3D1', footerBg: '#1C1917', footerText: '#A8A29E' },
  fonts: { heading: '"Fraunces", serif', body: '"Work Sans", sans-serif', ui: '"Work Sans", sans-serif', headingImport: 'family=Fraunces:wght@400;500;600;700&opsz=9..144', bodyImport: 'family=Work+Sans:wght@400;500;600' },
  radius: '4px', radiusLg: '8px', radiusFull: '9999px',
  shadow: '0 1px 3px rgba(0,0,0,0.06)', shadowLg: '0 8px 25px rgba(0,0,0,0.08)', shadowGlow: 'none',
  animation: 'subtle', heroStyle: 'Editorial-style hero with large serif headline.', iconStyle: 'Fine line icons with hand-drawn quality'
}

const liquidGlass: ThemeConfig = {
  id: 'liquid-glass', name: 'Liquid Glass', group: 'b',
  personality: 'Apple-inspired translucency and depth. iOS Liquid Glass aesthetic — frosted panels, luminous accents, and that unmistakable premium feel.',
  recommended: true,
  colors: {
    primary: '#007AFF',
    primaryLight: '#409CFF',
    primaryDark: '#0055D4',
    secondary: '#5856D6',
    secondaryLight: '#7A79E0',
    accent: '#FF9F0A',
    accentLight: '#FFB340',
    surface: 'rgba(255,255,255,0.72)',
    surfaceAlt: 'rgba(245,245,247,0.8)',
    background: '#F2F2F7',
    foreground: '#1C1C1E',
    foregroundMuted: '#8E8E93',
    border: 'rgba(0,0,0,0.08)',
    success: '#30D158',
    warning: '#FF9F0A',
    error: '#FF3B30',
    ctaBg: '#007AFF',
    ctaText: '#FFFFFF',
    ctaHover: '#0055D4',
    navBg: 'rgba(255,255,255,0.72)',
    navText: '#1C1C1E',
    heroBg: '#F2F2F7',
    heroText: '#1C1C1E',
    cardBg: 'rgba(255,255,255,0.6)',
    cardBorder: 'rgba(0,0,0,0.06)',
    footerBg: '#1C1C1E',
    footerText: '#AEAEB2',
  },
  fonts: {
    heading: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
    body: '"SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
    ui: '"SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
    headingImport: 'family=Inter:wght@400;500;600;700;800',
    bodyImport: 'family=Inter:wght@400;500;600',
  },
  radius: '16px',
  radiusLg: '22px',
  radiusFull: '9999px',
  shadow: '0 2px 12px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.03)',
  shadowLg: '0 8px 32px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)',
  shadowGlow: '0 0 0 4px rgba(0,122,255,0.15)',
  animation: 'moderate',
  heroStyle: 'Frosted glass panels floating over subtle gradient mesh. Luminous blue accents.',
  iconStyle: 'SF Symbols-style thin stroke icons with rounded caps',
}

/**
 * CHAMPION BLUEPRINT — The #1 recommended theme.
 *
 * Engineered specifically around Gas Champion's logo colours using
 * proven colour psychology for maximum trust + conversion:
 *
 * - PRIMARY: Logo blue (#1B4B8A) — trust, safety, reliability
 *   Research: Blue is #1 for perceived trustworthiness (ResearchGate 2019)
 *   Used for: headings, nav, badges, authority elements
 *
 * - CTA: Logo red (#C41E2A) — urgency, energy, action
 *   Research: Red CTAs convert 21-34% better than alternatives (HubSpot, CXL)
 *   Used for: ALL call-to-action buttons — maximum contrast on white/blue backgrounds
 *
 * - SUCCESS GREEN (#059669) — verification, safety, "all clear"
 *   Used for: Gas Safe badges, checkmarks, "Available Today", trust signals
 *
 * - WHITE backgrounds — clean, professional, maximises readability + trust
 *   Research: 70% of high-converting pages use minimalist layouts (Hook Agency)
 *
 * The key insight: your logo's red and blue are ALREADY the optimal
 * conversion pair. This theme just deploys them strategically —
 * blue dominates (trust), red interrupts (action), green confirms (safety).
 */
const championBlueprint: ThemeConfig = {
  id: 'champion-blueprint', name: 'Champion Blueprint', group: 'b',
  personality: 'Engineered from your logo colours. Blue trust + red urgency + green safety. Every colour choice backed by conversion research.',
  recommended: true, topPick: true,
  colors: {
    // Logo blue — extracted from the shield's mid-tone
    primary: '#1B4B8A',
    primaryLight: '#2E6FBB',
    primaryDark: '#13365F',
    // Logo blue secondary — the lighter shield gradient
    secondary: '#2E8BC0',
    secondaryLight: '#5BA8D9',
    // Logo red — the flame, used ONLY for CTAs (maximum contrast = maximum clicks)
    accent: '#C41E2A',
    accentLight: '#E8434D',
    // Clean white surfaces — trust, professionalism, readability
    surface: '#FFFFFF',
    surfaceAlt: '#F5F7FA',
    background: '#FFFFFF',
    // Near-black text — maximum readability
    foreground: '#111827',
    foregroundMuted: '#5B6577',
    // Subtle borders
    border: '#E2E6ED',
    // Semantic: green for safety/trust, amber for warning, red for error
    success: '#059669',
    warning: '#D97706',
    error: '#DC2626',
    // CTA = LOGO RED — the single most important conversion element
    // Red CTAs outperform by 21-34% in A/B tests (HubSpot, CXL research)
    ctaBg: '#C41E2A',
    ctaText: '#FFFFFF',
    ctaHover: '#A8131D',
    // Nav: white, clean, professional
    navBg: '#FFFFFF',
    navText: '#111827',
    // Hero: very subtle blue tint (reinforces brand without overwhelming)
    heroBg: '#F0F4FA',
    heroText: '#111827',
    // Cards: white, clean
    cardBg: '#FFFFFF',
    cardBorder: '#E2E6ED',
    // Footer: deep logo navy — authoritative, consistent
    footerBg: '#13365F',
    footerText: '#B8C9DE',
  },
  fonts: {
    // Inter — the most readable sans-serif on screens, used by Stripe/Linear/Vercel
    heading: '"Inter", system-ui, sans-serif',
    body: '"Inter", system-ui, sans-serif',
    ui: '"Inter", system-ui, sans-serif',
    headingImport: 'family=Inter:wght@400;500;600;700;800',
    bodyImport: 'family=Inter:wght@400;500;600',
  },
  // Slightly rounded — modern but not playful, professional but not corporate
  radius: '10px',
  radiusLg: '14px',
  radiusFull: '9999px',
  // Subtle shadows — depth without distraction
  shadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  shadowLg: '0 10px 25px rgba(27,75,138,0.08), 0 4px 10px rgba(0,0,0,0.04)',
  shadowGlow: 'none',
  animation: 'subtle',
  heroStyle: 'Clean white hero, blue trust badge, red CTA buttons that pop. Logo colours throughout.',
  iconStyle: 'Clean line icons with blue fill accents',
}

export const allThemes: ThemeConfig[] = [
  cleanProfessional, warmApproachable, boldHighEnergy, premiumLuxurious, modernPlayful,
  championBlueprint, trustFortress, neighbourhoodHero, smartHomeTech, emergencyReady, heritageCraft, liquidGlass,
]
export const groupAThemes = allThemes.filter(t => t.group === 'a')
export const groupBThemes = allThemes.filter(t => t.group === 'b')
