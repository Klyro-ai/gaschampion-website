import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from './ThemeProvider'
import { Icon } from '../../lib/icons'

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Services', href: '/services' },
  { label: 'About', href: '/about' },
  { label: 'Reviews', href: '/reviews' },
  { label: 'Blog', href: '/blog' },
  { label: 'Areas', href: '/areas' },
  { label: 'Contact', href: '/contact' },
]

const menuVariants = {
  closed: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.2, staggerChildren: 0.03, staggerDirection: -1 },
  },
  open: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, staggerChildren: 0.06, delayChildren: 0.1 },
  },
}

const itemVariants = {
  closed: { opacity: 0, x: -16 },
  open: { opacity: 1, x: 0 },
}

export default function MobileNav() {
  const { theme } = useTheme()
  const c = theme.colors
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Hamburger button */}
      <motion.button
        onClick={() => setOpen(!open)}
        whileTap={{ scale: 0.9 }}
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 44,
          height: 44,
          padding: 0,
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: c.navText,
          position: 'relative',
          zIndex: 10002,
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex' }}
            >
              <Icon name="x" size={26} />
            </motion.span>
          ) : (
            <motion.span
              key="menu"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex' }}
            >
              <Icon name="menu" size={26} />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.4)',
              zIndex: 9998,
            }}
          />
        )}
      </AnimatePresence>

      {/* Mobile menu panel */}
      <AnimatePresence>
        {open && (
          <motion.nav
            variants={menuVariants}
            initial="closed"
            animate="open"
            exit="closed"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 9999,
              backgroundColor: c.navBg,
              boxShadow: theme.shadowLg,
              paddingTop: 72,
              paddingBottom: 24,
              fontFamily: theme.fonts.body,
            }}
          >
            <div style={{ padding: '0 24px' }}>
              {/* Nav links */}
              <ul
                style={{
                  listStyle: 'none',
                  margin: 0,
                  padding: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                {navLinks.map(link => (
                  <motion.li key={link.href} variants={itemVariants}>
                    <a
                      href={link.href}
                      onClick={() => setOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '14px 12px',
                        fontSize: 17,
                        fontWeight: 600,
                        color: c.navText,
                        textDecoration: 'none',
                        borderRadius: theme.radius,
                        transition: 'background-color 0.15s',
                        fontFamily: theme.fonts.heading,
                      }}
                      onMouseEnter={e => {
                        ;(e.currentTarget as HTMLElement).style.backgroundColor = c.surfaceAlt
                      }}
                      onMouseLeave={e => {
                        ;(e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
                      }}
                    >
                      <Icon
                        name="chevron-right"
                        size={16}
                        style={{ color: c.primary, marginRight: 10, opacity: 0.6 }}
                      />
                      {link.label}
                    </a>
                  </motion.li>
                ))}
              </ul>

              {/* Divider */}
              <div
                style={{
                  height: 1,
                  backgroundColor: c.border,
                  margin: '16px 0',
                }}
              />

              {/* Call CTA */}
              <motion.a
                variants={itemVariants}
                href="tel:07828943186"
                className="rounded-theme-full"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  padding: '16px 24px',
                  fontSize: 17,
                  fontWeight: 700,
                  fontFamily: theme.fonts.ui,
                  backgroundColor: c.ctaBg,
                  color: c.ctaText,
                  textDecoration: 'none',
                  borderRadius: theme.radiusFull,
                  boxShadow: theme.shadow,
                }}
              >
                <Icon name="phone" size={20} />
                07828 943 186
              </motion.a>

              {/* Secondary: Gas Safe badge */}
              <motion.div
                variants={itemVariants}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  marginTop: 16,
                  fontSize: 13,
                  color: c.foregroundMuted,
                  fontFamily: theme.fonts.ui,
                }}
              >
                <Icon name="gas-safe" size={18} style={{ color: c.primary }} />
                Gas Safe Registered: 636427
              </motion.div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  )
}
