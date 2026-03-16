import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ThemeConfig } from '../../themes/all-themes'
import { allThemes } from '../../themes/all-themes'

interface ThemeContextType {
  theme: ThemeConfig
  setTheme: (id: string) => void
  themes: ThemeConfig[]
}

const ThemeContext = createContext<ThemeContextType | null>(null)

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
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
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<ThemeConfig>(allThemes[0])

  useEffect(() => {
    const saved = localStorage.getItem('gc-theme')
    if (saved) {
      const found = allThemes.find(t => t.id === saved)
      if (found) setCurrentTheme(found)
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

  const setTheme = useCallback((id: string) => {
    const found = allThemes.find(t => t.id === id)
    if (found) { setCurrentTheme(found); localStorage.setItem('gc-theme', id) }
  }, [])

  return (
    <ThemeContext.Provider value={{ theme: currentTheme, setTheme, themes: allThemes }}>
      {children}
    </ThemeContext.Provider>
  )
}
