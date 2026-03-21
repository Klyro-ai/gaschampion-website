import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from './ThemeProvider'
import { Icon } from '../../lib/icons'

interface FAQProps {
  faqs: Array<{ question: string; answer: string }>
}

export default function FAQ({ faqs }: FAQProps) {
  const { theme } = useTheme()
  const c = theme.colors
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  function toggle(index: number) {
    setOpenIndex(prev => (prev === index ? null : index))
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        fontFamily: theme.fonts.body,
      }}
    >
      {faqs.map((faq, index) => {
        const isOpen = openIndex === index
        return (
          <div
            key={index}
            className="rounded-theme shadow-theme"
            style={{
              backgroundColor: c.cardBg,
              border: `1px solid ${isOpen ? c.primary : c.cardBorder}`,
              borderRadius: theme.radius,
              boxShadow: theme.shadow,
              overflow: 'hidden',
              transition: 'border-color 0.2s',
            }}
          >
            {/* Question button */}
            <button
              onClick={() => toggle(index)}
              aria-expanded={isOpen}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '16px 20px',
                fontSize: 15,
                fontWeight: 600,
                fontFamily: theme.fonts.heading,
                color: isOpen ? c.primary : c.foreground,
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                gap: 12,
                lineHeight: 1.4,
                transition: 'color 0.2s',
              }}
            >
              <span>{faq.question}</span>
              <motion.span
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.25 }}
                style={{
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  backgroundColor: isOpen ? c.primary : c.surfaceAlt,
                  color: isOpen ? '#FFFFFF' : c.foregroundMuted,
                  transition: 'background-color 0.2s, color 0.2s',
                }}
              >
                <Icon name="chevron-down" size={16} />
              </motion.span>
            </button>

            {/* Answer */}
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  style={{ overflow: 'hidden' }}
                >
                  <div
                    style={{
                      padding: '0 20px 18px',
                      fontSize: 14,
                      lineHeight: 1.7,
                      color: c.foregroundMuted,
                    }}
                  >
                    {faq.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
