import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ThemeConfig } from '../../themes/all-themes'
import { allThemes, groupAThemes, groupBThemes } from '../../themes/all-themes'
import { Icon } from '../../lib/icons'
import { faqs } from '../../data/business'
import { trackPhoneClick, trackFormSubmit } from '../../lib/tracking'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Theme Context ──────────────────────────────────────────

interface ThemeContextType {
  theme: ThemeConfig
  setTheme: (id: string) => void
}
const ThemeContext = createContext<ThemeContextType | null>(null)

function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within provider')
  return ctx
}

function applyThemeVars(theme: ThemeConfig) {
  const root = document.documentElement
  const c = theme.colors
  const vars: Record<string, string> = {
    '--color-primary': c.primary, '--color-primary-light': c.primaryLight,
    '--color-primary-dark': c.primaryDark, '--color-secondary': c.secondary,
    '--color-secondary-light': c.secondaryLight, '--color-accent': c.accent,
    '--color-accent-light': c.accentLight, '--color-surface': c.surface,
    '--color-surface-alt': c.surfaceAlt, '--color-background': c.background,
    '--color-foreground': c.foreground, '--color-foreground-muted': c.foregroundMuted,
    '--color-border': c.border, '--color-success': c.success,
    '--color-warning': c.warning, '--color-error': c.error,
    '--color-cta-bg': c.ctaBg, '--color-cta-text': c.ctaText,
    '--color-cta-hover': c.ctaHover, '--color-nav-bg': c.navBg,
    '--color-nav-text': c.navText, '--color-hero-bg': c.heroBg,
    '--color-hero-text': c.heroText, '--color-card-bg': c.cardBg,
    '--color-card-border': c.cardBorder, '--color-footer-bg': c.footerBg,
    '--color-footer-text': c.footerText, '--font-heading': theme.fonts.heading,
    '--font-body': theme.fonts.body, '--font-ui': theme.fonts.ui,
    '--radius': theme.radius, '--radius-lg': theme.radiusLg,
    '--radius-full': theme.radiusFull, '--shadow': theme.shadow,
    '--shadow-lg': theme.shadowLg, '--shadow-glow': theme.shadowGlow,
  }
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v))
  root.setAttribute('data-theme', theme.id)
}

// ─── Theme Switcher (exported) ──────────────────────────────

export function ThemeSwitcherIsland() {
  const [currentTheme, setCurrentTheme] = useState<ThemeConfig>(allThemes[0])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('gc-theme')
    if (saved) {
      const found = allThemes.find(t => t.id === saved)
      if (found) { setCurrentTheme(found); applyThemeVars(found) }
    } else {
      applyThemeVars(allThemes[0])
    }
  }, [])

  useEffect(() => {
    applyThemeVars(currentTheme)
    const existing = document.getElementById('theme-fonts')
    if (existing) existing.remove()
    const link = document.createElement('link')
    link.id = 'theme-fonts'
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?${currentTheme.fonts.headingImport}&${currentTheme.fonts.bodyImport}&display=swap`
    document.head.appendChild(link)
  }, [currentTheme])

  const switchTheme = (id: string) => {
    const found = allThemes.find(t => t.id === id)
    if (found) { setCurrentTheme(found); localStorage.setItem('gc-theme', id) }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110"
        style={{ backgroundColor: currentTheme.colors.primary, color: '#fff' }}
        aria-label="Toggle theme switcher"
      >
        <Icon name="settings" size={24} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50" onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md overflow-y-auto shadow-2xl overscroll-contain"
              style={{
                backgroundColor: currentTheme.id === 'liquid-glass' ? 'rgba(255,255,255,0.85)' : currentTheme.colors.surface,
                backdropFilter: currentTheme.id === 'liquid-glass' ? 'blur(60px) saturate(200%)' : 'none',
                WebkitBackdropFilter: currentTheme.id === 'liquid-glass' ? 'blur(60px) saturate(200%)' : 'none',
              }}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="font-heading font-bold text-xl">Theme Switcher</h2>
                    <p className="text-sm" style={{ color: currentTheme.colors.foregroundMuted }}>Compare 11 visual styles</p>
                  </div>
                  <button onClick={() => setIsOpen(false)} className="p-2 flex items-center justify-center" style={{ minWidth: '44px', minHeight: '44px' }} aria-label="Close theme switcher"><Icon name="x" size={20} /></button>
                </div>

                <div className="mb-8">
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: currentTheme.colors.foregroundMuted }}>Client Picks</h3>
                  <div className="space-y-2">
                    {groupAThemes.map(t => (
                      <ThemeBtn key={t.id} t={t} active={currentTheme.id === t.id} onClick={() => switchTheme(t.id)} />
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: currentTheme.colors.foregroundMuted }}>AI Recommended</h3>
                  <div className="space-y-2">
                    {groupBThemes.map(t => (
                      <ThemeBtn key={t.id} t={t} active={currentTheme.id === t.id} onClick={() => switchTheme(t.id)} />
                    ))}
                  </div>
                </div>

                <div className="mt-8 p-4 rounded-theme-lg border" style={{ borderColor: currentTheme.colors.cardBorder, backgroundColor: currentTheme.colors.surfaceAlt }}>
                  <h4 className="font-heading font-bold text-sm mb-1">Current: {currentTheme.name}</h4>
                  <p className="text-xs" style={{ color: currentTheme.colors.foregroundMuted }}>{currentTheme.personality}</p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

function ThemeBtn({ t, active, onClick }: { t: ThemeConfig; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 p-3 rounded-theme-lg border text-left transition-all hover:shadow-theme ${active ? 'ring-2' : ''}`}
      style={{ borderColor: active ? t.colors.primary : t.colors.border || '#e5e7eb', backgroundColor: active ? t.colors.primary + '08' : 'transparent', outlineColor: t.colors.primary }}>
      <div className="flex gap-0.5 shrink-0">
        {[t.colors.primary, t.colors.secondary, t.colors.accent, t.colors.background].map((c, i) => (
          <div key={i} className={`w-5 h-10 ${i === 0 ? 'rounded-l' : i === 3 ? 'rounded-r' : ''}`} style={{ backgroundColor: c }} />
        ))}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{t.name}</span>
          {t.topPick && <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 font-medium">Top Pick</span>}
        </div>
        <p className="text-xs truncate opacity-60">{t.personality.slice(0, 60)}...</p>
      </div>
      {active && (
        <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: t.colors.primary }}>
          <Icon name="check" size={12} className="text-white" />
        </div>
      )}
    </button>
  )
}

// ─── Mobile Nav (exported) ──────────────────────────────────

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/services', label: 'Services' },
  { href: '/about', label: 'About' },
  { href: '/reviews', label: 'Reviews' },
  { href: '/blog', label: 'Blog' },
  { href: '/service-areas', label: 'Areas' },
  { href: '/contact', label: 'Contact' },
]

export function MobileNavIsland() {
  const [open, setOpen] = useState(false)

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center w-11 h-11 rounded-theme"
        aria-label="Toggle menu"
      >
        <Icon name={open ? 'x' : 'menu'} size={24} />
      </button>
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/30"
              style={{ top: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
              className="absolute left-0 right-0 top-full z-50 border-t shadow-theme-lg"
              style={{
                backgroundColor: 'var(--color-nav-bg)',
                borderColor: 'var(--color-border)',
                backdropFilter: 'blur(60px) saturate(200%)',
                WebkitBackdropFilter: 'blur(60px) saturate(200%)',
              }}
            >
              <div className="px-5 py-5 space-y-1">
                {navLinks.map(link => (
                  <a key={link.href} href={link.href} onClick={() => setOpen(false)}
                    className="flex items-center px-4 py-3.5 rounded-theme text-base font-medium hover:opacity-70 transition-opacity"
                    style={{ minHeight: '48px' }}>
                    {link.label}
                  </a>
                ))}
                <div className="pt-3">
                  <a href="tel:07828943186" onClick={() => trackPhoneClick()}
                    className="flex items-center justify-center gap-2 w-full px-4 py-4 rounded-theme-full font-bold text-base"
                    style={{ backgroundColor: 'var(--color-cta-bg)', color: 'var(--color-cta-text)', minHeight: '52px' }}>
                    <Icon name="phone" size={18} />
                    07828 943 186
                  </a>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Contact Form (exported) ────────────────────────────────

const serviceOptions = ['Boiler Repair', 'Boiler Installation', 'Boiler Servicing', 'Gas Safety Certificate', 'Powerflush', 'Smart Thermostat', 'Radiator Installation', 'Hot Water Cylinder', 'Gas Fire Servicing', 'General Plumbing', 'Other']

export function ContactFormIsland() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ service: '', urgency: '', name: '', phone: '', email: '', postcode: '', message: '' })
  const update = (field: string, value: string) => setForm(p => ({ ...p, [field]: value }))

  return (
    <div className="p-4 sm:p-6 md:p-8 rounded-theme-lg border shadow-theme-lg" style={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-card-border)' }}>
      <h3 className="font-heading font-bold text-xl sm:text-2xl mb-2">Get a Free Quote</h3>
      <p className="text-sm mb-6" style={{ color: 'var(--color-foreground-muted)' }}>Fill in the form and we'll get back to you within 2 hours</p>

      <div className="flex gap-2 mb-8">
        {[1, 2, 3].map(s => (
          <div key={s} className="h-1.5 flex-1 rounded-full transition-colors" style={{ backgroundColor: s <= step ? 'var(--color-primary)' : 'var(--color-border)' }} />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <label className="block font-medium text-sm mb-2">What service do you need?</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {serviceOptions.map(opt => (
              <button key={opt} onClick={() => update('service', opt)} className="p-3 rounded-theme border text-sm text-left transition-all"
                style={{ borderColor: form.service === opt ? 'var(--color-primary)' : 'var(--color-border)', backgroundColor: form.service === opt ? 'var(--color-primary)' + '10' : 'var(--color-surface)', minHeight: '44px' }}>{opt}</button>
            ))}
          </div>
          <label className="block font-medium text-sm mt-4 mb-2">How urgent is this?</label>
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            {['Emergency', 'This week', 'No rush'].map(u => (
              <button key={u} onClick={() => update('urgency', u)} className="p-2 sm:p-3 rounded-theme border text-xs sm:text-sm transition-all text-center"
                style={{ borderColor: form.urgency === u ? 'var(--color-primary)' : 'var(--color-border)', backgroundColor: form.urgency === u ? 'var(--color-primary)' + '10' : 'var(--color-surface)', minHeight: '44px' }}>{u}</button>
            ))}
          </div>
          <button onClick={() => form.service && setStep(2)} disabled={!form.service} className="w-full mt-4 py-3 rounded-theme-full font-semibold disabled:opacity-50"
            style={{ backgroundColor: 'var(--color-cta-bg)', color: 'var(--color-cta-text)', minHeight: '48px' }}>Next Step <Icon name="arrow-right" size={16} className="inline ml-2" /></button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          {[{ label: 'Your name', field: 'name', type: 'text', placeholder: 'John Smith' },
            { label: 'Phone number', field: 'phone', type: 'tel', placeholder: '07xxx xxx xxx' },
            { label: 'Email', field: 'email', type: 'email', placeholder: 'john@example.com' },
            { label: 'Postcode', field: 'postcode', type: 'text', placeholder: 'CB9 8AD' }
          ].map(({ label, field, type, placeholder }) => (
            <div key={field}>
              <label className="block font-medium text-sm mb-1">{label}</label>
              <input type={type} value={(form as any)[field]} onChange={e => update(field, e.target.value)} className="w-full p-3 rounded-theme border text-sm"
                style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)', minHeight: '48px' }} placeholder={placeholder} />
            </div>
          ))}
          <div className="flex gap-2">
            <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-theme-full font-semibold border" style={{ borderColor: 'var(--color-border)', minHeight: '48px' }}>Back</button>
            <button onClick={() => (form.name && form.phone) && setStep(3)} disabled={!form.name || !form.phone} className="flex-1 py-3 rounded-theme-full font-semibold disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-cta-bg)', color: 'var(--color-cta-text)', minHeight: '48px' }}>Next Step</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div>
            <label className="block font-medium text-sm mb-1">Tell us more (optional)</label>
            <textarea value={form.message} onChange={e => update('message', e.target.value)} rows={4} className="w-full p-3 rounded-theme border text-sm resize-none"
              style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }} placeholder="Describe the issue..." />
          </div>
          <div className="p-4 rounded-theme text-sm space-y-1" style={{ backgroundColor: 'var(--color-surface-alt)' }}>
            <p><strong>Service:</strong> {form.service}</p>
            <p><strong>Urgency:</strong> {form.urgency || 'Not specified'}</p>
            <p><strong>Name:</strong> {form.name}</p>
            <p><strong>Phone:</strong> {form.phone}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-theme-full font-semibold border" style={{ borderColor: 'var(--color-border)', minHeight: '48px' }}>Back</button>
            <button onClick={() => trackFormSubmit(form.service)} className="flex-1 py-3 rounded-theme-full font-semibold text-sm sm:text-base" style={{ backgroundColor: 'var(--color-cta-bg)', color: 'var(--color-cta-text)', minHeight: '48px' }}>Send Quote Request</button>
          </div>
          <p className="text-xs text-center" style={{ color: 'var(--color-foreground-muted)' }}>We'll respond within 2 hours during business hours.</p>
        </div>
      )}
    </div>
  )
}

// ─── FAQ Accordion (exported) ───────────────────────────────

export function FAQIsland() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section className="py-16 md:py-24" style={{ backgroundColor: 'var(--color-surface-alt)' }}>
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
          <p style={{ color: 'var(--color-foreground-muted)' }}>Quick answers to common heating and boiler questions</p>
        </div>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="rounded-theme-lg border overflow-hidden" style={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-card-border)' }}>
              <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between p-4 sm:p-5 text-left font-medium text-sm sm:text-base" style={{ minHeight: '48px' }}>
                <span className="pr-4">{faq.question}</span>
                <Icon name="chevron-down" size={20} className={`shrink-0 transition-transform ${open === i ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                    <div className="px-5 pb-5 text-sm leading-relaxed" style={{ color: 'var(--color-foreground-muted)' }}>{faq.answer}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
