import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from './ThemeProvider'
import { Icon } from '../../lib/icons'

const groupLabels: Record<string, string> = {
  a: 'Client Picks',
  b: 'AI Recommended',
}

function ColorSwatch({ color, label }: { color: string; label: string }) {
  return (
    <div
      title={label}
      style={{
        width: 18,
        height: 18,
        borderRadius: '50%',
        backgroundColor: color,
        border: '2px solid rgba(255,255,255,0.3)',
        flexShrink: 0,
      }}
    />
  )
}

export default function ThemeSwitcher() {
  const { theme, setTheme, themes } = useTheme()
  const [open, setOpen] = useState(false)
  const c = theme.colors

  const groupA = themes.filter(t => t.group === 'a')
  const groupB = themes.filter(t => t.group === 'b')

  return (
    <>
      {/* Gear button - fixed bottom right */}
      <motion.button
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.95 }}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9999,
          width: 52,
          height: 52,
          borderRadius: '50%',
          backgroundColor: c.primary,
          color: '#FFFFFF',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: theme.shadowLg,
        }}
        aria-label="Toggle theme switcher"
      >
        <Icon name="settings" size={24} />
      </motion.button>

      {/* Overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.4)',
              zIndex: 10000,
            }}
          />
        )}
      </AnimatePresence>

      {/* Slide-out panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              maxWidth: 380,
              zIndex: 10001,
              backgroundColor: c.surface,
              color: c.foreground,
              boxShadow: '-8px 0 30px rgba(0,0,0,0.15)',
              overflowY: 'auto',
              fontFamily: theme.fonts.body,
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '20px 20px 16px',
                borderBottom: `1px solid ${c.border}`,
              }}
            >
              <h2
                className="font-heading"
                style={{
                  margin: 0,
                  fontSize: 20,
                  fontWeight: 700,
                  color: c.foreground,
                  fontFamily: theme.fonts.heading,
                }}
              >
                Choose a Theme
              </h2>
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 4,
                  color: c.foregroundMuted,
                  display: 'flex',
                  alignItems: 'center',
                }}
                aria-label="Close theme panel"
              >
                <Icon name="x" size={22} />
              </button>
            </div>

            {/* Theme groups */}
            <div style={{ padding: '16px 20px 100px' }}>
              {[
                { label: groupLabels.a, items: groupA },
                { label: groupLabels.b, items: groupB },
              ].map(({ label, items }) => (
                <div key={label} style={{ marginBottom: 28 }}>
                  <h3
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: c.foregroundMuted,
                      margin: '0 0 12px',
                    }}
                  >
                    {label}
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {items.map(t => {
                      const isActive = theme.id === t.id
                      return (
                        <motion.button
                          key={t.id}
                          onClick={() => setTheme(t.id)}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          className="rounded-theme"
                          style={{
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 8,
                            padding: 14,
                            border: `2px solid ${isActive ? c.primary : c.border}`,
                            backgroundColor: isActive ? c.surfaceAlt : c.surface,
                            borderRadius: theme.radius,
                            cursor: 'pointer',
                            textAlign: 'left',
                            width: '100%',
                            transition: 'border-color 0.2s, background-color 0.2s',
                          }}
                        >
                          {/* Top row: name + badge */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                            }}
                          >
                            <span
                              style={{
                                fontWeight: 600,
                                fontSize: 14,
                                color: isActive ? c.primary : c.foreground,
                                fontFamily: theme.fonts.heading,
                              }}
                            >
                              {t.name}
                            </span>

                            {t.topPick && (
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.05em',
                                  padding: '2px 8px',
                                  borderRadius: 9999,
                                  backgroundColor: c.accent,
                                  color: '#FFFFFF',
                                }}
                              >
                                Top Pick
                              </span>
                            )}

                            {isActive && (
                              <span
                                style={{
                                  marginLeft: 'auto',
                                  color: c.primary,
                                  display: 'flex',
                                }}
                              >
                                <Icon name="check" size={18} />
                              </span>
                            )}
                          </div>

                          {/* Personality */}
                          <span
                            style={{
                              fontSize: 12,
                              color: c.foregroundMuted,
                              lineHeight: 1.4,
                            }}
                          >
                            {t.personality}
                          </span>

                          {/* Color swatches */}
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            <ColorSwatch color={t.colors.primary} label="Primary" />
                            <ColorSwatch color={t.colors.secondary} label="Secondary" />
                            <ColorSwatch color={t.colors.accent} label="Accent" />
                            <ColorSwatch color={t.colors.background} label="Background" />
                            <ColorSwatch color={t.colors.foreground} label="Foreground" />
                            <ColorSwatch color={t.colors.ctaBg} label="CTA" />
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
