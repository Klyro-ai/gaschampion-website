import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from './ThemeProvider'
import { Icon } from '../../lib/icons'

const serviceOptions = [
  { label: 'Boiler Repair', icon: 'wrench' },
  { label: 'Boiler Installation', icon: 'flame' },
  { label: 'Boiler Servicing', icon: 'clipboard-check' },
  { label: 'Gas Safety Certificate', icon: 'shield-check' },
  { label: 'Powerflush', icon: 'droplets' },
  { label: 'Smart Thermostat', icon: 'smartphone' },
  { label: 'Radiator Installation', icon: 'thermometer' },
  { label: 'Hot Water Cylinder', icon: 'droplet' },
  { label: 'Gas Fire Servicing', icon: 'flame' },
  { label: 'General Plumbing', icon: 'wrench' },
  { label: 'Other', icon: 'settings' },
] as const

const urgencyOptions = [
  { label: 'Emergency', desc: 'No heating/hot water', color: '#DC2626' },
  { label: 'This week', desc: 'Soon as possible', color: '#F59E0B' },
  { label: 'No rush', desc: 'Just planning ahead', color: '#22C55E' },
] as const

const stepVariants = {
  enter: { opacity: 0, x: 40 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
}

export default function ContactForm() {
  const { theme } = useTheme()
  const c = theme.colors

  const [step, setStep] = useState(1)
  const [service, setService] = useState('')
  const [urgency, setUrgency] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [postcode, setPostcode] = useState('')
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const canGoStep2 = service && urgency
  const canGoStep3 = name.trim() && phone.trim()

  const progress = step === 1 ? 33 : step === 2 ? 66 : 100

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    // Simulate form submission
    setTimeout(() => {
      setSubmitting(false)
      setSubmitted(true)
    }, 1200)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    fontSize: 15,
    fontFamily: theme.fonts.body,
    color: c.foreground,
    backgroundColor: c.surface,
    border: `1.5px solid ${c.border}`,
    borderRadius: theme.radius,
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: c.foregroundMuted,
    marginBottom: 6,
    fontFamily: theme.fonts.ui,
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-theme-lg shadow-theme-lg"
        style={{
          padding: 40,
          textAlign: 'center',
          backgroundColor: c.surface,
          borderRadius: theme.radiusLg,
          boxShadow: theme.shadowLg,
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            backgroundColor: c.success,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          <Icon name="check" size={32} style={{ color: '#FFFFFF' }} />
        </div>
        <h3
          className="font-heading"
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: c.foreground,
            margin: '0 0 8px',
            fontFamily: theme.fonts.heading,
          }}
        >
          Quote Request Sent
        </h3>
        <p style={{ fontSize: 15, color: c.foregroundMuted, margin: 0, lineHeight: 1.6 }}>
          Thanks {name}! We&apos;ll get back to you about your {service.toLowerCase()} request
          as soon as possible. For emergencies, call us directly at{' '}
          <strong style={{ color: c.primary }}>07828 943 186</strong>.
        </p>
      </motion.div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-theme-lg shadow-theme-lg"
      style={{
        backgroundColor: c.surface,
        borderRadius: theme.radiusLg,
        boxShadow: theme.shadowLg,
        overflow: 'hidden',
        fontFamily: theme.fonts.body,
      }}
    >
      {/* Progress bar */}
      <div style={{ height: 4, backgroundColor: c.border }}>
        <motion.div
          animate={{ width: `${progress}%` }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          style={{
            height: '100%',
            backgroundColor: c.primary,
            borderRadius: '0 2px 2px 0',
          }}
        />
      </div>

      {/* Step indicator */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: '16px 20px 0',
        }}
      >
        {[1, 2, 3].map(s => (
          <React.Fragment key={s}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 700,
                backgroundColor: step >= s ? c.primary : c.surfaceAlt,
                color: step >= s ? '#FFFFFF' : c.foregroundMuted,
                transition: 'all 0.3s',
              }}
            >
              {step > s ? <Icon name="check" size={14} /> : s}
            </div>
            {s < 3 && (
              <div
                style={{
                  width: 40,
                  height: 2,
                  backgroundColor: step > s ? c.primary : c.border,
                  transition: 'background-color 0.3s',
                }}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      <div style={{ padding: '20px 24px 24px', minHeight: 340 }}>
        <AnimatePresence mode="wait">
          {/* Step 1: Service + Urgency */}
          {step === 1 && (
            <motion.div
              key="step1"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
            >
              <h3
                className="font-heading"
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: c.foreground,
                  margin: '0 0 4px',
                  fontFamily: theme.fonts.heading,
                }}
              >
                What do you need help with?
              </h3>
              <p style={{ fontSize: 14, color: c.foregroundMuted, margin: '0 0 16px' }}>
                Select a service and how urgent your request is.
              </p>

              {/* Service grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                  gap: 8,
                  marginBottom: 20,
                }}
              >
                {serviceOptions.map(opt => {
                  const selected = service === opt.label
                  return (
                    <motion.button
                      key={opt.label}
                      type="button"
                      onClick={() => setService(opt.label)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="rounded-theme"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '10px 12px',
                        fontSize: 13,
                        fontWeight: selected ? 600 : 500,
                        fontFamily: theme.fonts.ui,
                        border: `1.5px solid ${selected ? c.primary : c.border}`,
                        backgroundColor: selected ? c.surfaceAlt : c.surface,
                        color: selected ? c.primary : c.foreground,
                        borderRadius: theme.radius,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        textAlign: 'left',
                      }}
                    >
                      <Icon name={opt.icon} size={16} />
                      <span style={{ lineHeight: 1.2 }}>{opt.label}</span>
                    </motion.button>
                  )
                })}
              </div>

              {/* Urgency */}
              <label style={labelStyle}>How urgent is this?</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {urgencyOptions.map(opt => {
                  const selected = urgency === opt.label
                  return (
                    <motion.button
                      key={opt.label}
                      type="button"
                      onClick={() => setUrgency(opt.label)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="rounded-theme"
                      style={{
                        flex: 1,
                        minWidth: 100,
                        padding: '10px 12px',
                        textAlign: 'center',
                        border: `1.5px solid ${selected ? opt.color : c.border}`,
                        backgroundColor: selected ? `${opt.color}12` : c.surface,
                        borderRadius: theme.radius,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: selected ? opt.color : c.foreground,
                          fontFamily: theme.fonts.ui,
                        }}
                      >
                        {opt.label}
                      </div>
                      <div style={{ fontSize: 11, color: c.foregroundMuted, marginTop: 2 }}>
                        {opt.desc}
                      </div>
                    </motion.button>
                  )
                })}
              </div>

              {/* Next */}
              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
                <motion.button
                  type="button"
                  onClick={() => canGoStep2 && setStep(2)}
                  whileHover={canGoStep2 ? { scale: 1.02 } : {}}
                  whileTap={canGoStep2 ? { scale: 0.98 } : {}}
                  className="rounded-theme-full"
                  style={{
                    padding: '12px 28px',
                    fontSize: 15,
                    fontWeight: 600,
                    fontFamily: theme.fonts.ui,
                    backgroundColor: canGoStep2 ? c.ctaBg : c.border,
                    color: canGoStep2 ? c.ctaText : c.foregroundMuted,
                    border: 'none',
                    borderRadius: theme.radiusFull,
                    cursor: canGoStep2 ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'background-color 0.2s',
                  }}
                >
                  Next
                  <Icon name="arrow-right" size={16} />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Contact details */}
          {step === 2 && (
            <motion.div
              key="step2"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
            >
              <h3
                className="font-heading"
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: c.foreground,
                  margin: '0 0 4px',
                  fontFamily: theme.fonts.heading,
                }}
              >
                Your details
              </h3>
              <p style={{ fontSize: 14, color: c.foregroundMuted, margin: '0 0 16px' }}>
                So we can get back to you with a quote.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Your full name"
                    style={inputStyle}
                    required
                  />
                </div>
                <div>
                  <label style={labelStyle}>Phone *</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="07xxx xxx xxx"
                    style={inputStyle}
                    required
                  />
                </div>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Postcode</label>
                  <input
                    type="text"
                    value={postcode}
                    onChange={e => setPostcode(e.target.value)}
                    placeholder="CB9 8AD"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div
                style={{
                  marginTop: 24,
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{
                    padding: '12px 20px',
                    fontSize: 14,
                    fontWeight: 500,
                    fontFamily: theme.fonts.ui,
                    backgroundColor: 'transparent',
                    color: c.foregroundMuted,
                    border: `1.5px solid ${c.border}`,
                    borderRadius: theme.radiusFull,
                    cursor: 'pointer',
                  }}
                >
                  Back
                </button>
                <motion.button
                  type="button"
                  onClick={() => canGoStep3 && setStep(3)}
                  whileHover={canGoStep3 ? { scale: 1.02 } : {}}
                  whileTap={canGoStep3 ? { scale: 0.98 } : {}}
                  className="rounded-theme-full"
                  style={{
                    padding: '12px 28px',
                    fontSize: 15,
                    fontWeight: 600,
                    fontFamily: theme.fonts.ui,
                    backgroundColor: canGoStep3 ? c.ctaBg : c.border,
                    color: canGoStep3 ? c.ctaText : c.foregroundMuted,
                    border: 'none',
                    borderRadius: theme.radiusFull,
                    cursor: canGoStep3 ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'background-color 0.2s',
                  }}
                >
                  Next
                  <Icon name="arrow-right" size={16} />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Message + Summary + Submit */}
          {step === 3 && (
            <motion.div
              key="step3"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
            >
              <h3
                className="font-heading"
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: c.foreground,
                  margin: '0 0 4px',
                  fontFamily: theme.fonts.heading,
                }}
              >
                Anything else?
              </h3>
              <p style={{ fontSize: 14, color: c.foregroundMuted, margin: '0 0 16px' }}>
                Add any details that might help, then review and submit.
              </p>

              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Additional details (optional)</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="e.g. Boiler model, error code, specific issues..."
                  rows={4}
                  style={{
                    ...inputStyle,
                    resize: 'vertical',
                    minHeight: 80,
                  }}
                />
              </div>

              {/* Summary */}
              <div
                className="rounded-theme"
                style={{
                  padding: 16,
                  backgroundColor: c.surfaceAlt,
                  borderRadius: theme.radius,
                  marginBottom: 20,
                }}
              >
                <h4
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: c.foregroundMuted,
                    margin: '0 0 10px',
                  }}
                >
                  Summary
                </h4>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr',
                    gap: '6px 12px',
                    fontSize: 14,
                  }}
                >
                  <span style={{ fontWeight: 600, color: c.foregroundMuted }}>Service:</span>
                  <span style={{ color: c.foreground }}>{service}</span>
                  <span style={{ fontWeight: 600, color: c.foregroundMuted }}>Urgency:</span>
                  <span style={{ color: c.foreground }}>{urgency}</span>
                  <span style={{ fontWeight: 600, color: c.foregroundMuted }}>Name:</span>
                  <span style={{ color: c.foreground }}>{name}</span>
                  <span style={{ fontWeight: 600, color: c.foregroundMuted }}>Phone:</span>
                  <span style={{ color: c.foreground }}>{phone}</span>
                  {email && (
                    <>
                      <span style={{ fontWeight: 600, color: c.foregroundMuted }}>Email:</span>
                      <span style={{ color: c.foreground }}>{email}</span>
                    </>
                  )}
                  {postcode && (
                    <>
                      <span style={{ fontWeight: 600, color: c.foregroundMuted }}>Postcode:</span>
                      <span style={{ color: c.foreground }}>{postcode}</span>
                    </>
                  )}
                  {message && (
                    <>
                      <span style={{ fontWeight: 600, color: c.foregroundMuted }}>Details:</span>
                      <span style={{ color: c.foreground }}>{message}</span>
                    </>
                  )}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  style={{
                    padding: '12px 20px',
                    fontSize: 14,
                    fontWeight: 500,
                    fontFamily: theme.fonts.ui,
                    backgroundColor: 'transparent',
                    color: c.foregroundMuted,
                    border: `1.5px solid ${c.border}`,
                    borderRadius: theme.radiusFull,
                    cursor: 'pointer',
                  }}
                >
                  Back
                </button>
                <motion.button
                  type="submit"
                  disabled={submitting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="rounded-theme-full"
                  style={{
                    padding: '12px 32px',
                    fontSize: 15,
                    fontWeight: 700,
                    fontFamily: theme.fonts.ui,
                    backgroundColor: c.ctaBg,
                    color: c.ctaText,
                    border: 'none',
                    borderRadius: theme.radiusFull,
                    cursor: submitting ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    opacity: submitting ? 0.7 : 1,
                    transition: 'background-color 0.2s, opacity 0.2s',
                  }}
                >
                  {submitting ? (
                    <>
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                        style={{ display: 'flex' }}
                      >
                        <Icon name="clock" size={16} />
                      </motion.span>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Icon name="mail" size={16} />
                      Send Quote Request
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </form>
  )
}
