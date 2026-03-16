import React from 'react'

const iconPaths: Record<string, string> = {
  wrench:
    'M21.71 20.29l-1.42 1.42a1 1 0 01-1.42 0l-5.66-5.66a6.5 6.5 0 01-7.07-1.07 6.5 6.5 0 01-.84-8.2l3.54 3.53 2.12-2.12-3.54-3.54a6.5 6.5 0 018.2.84 6.5 6.5 0 011.07 7.07l5.66 5.66a1 1 0 010 1.42z',
  flame:
    'M12 2c1 4-2 6-2 10a4 4 0 008 0c0-4-3-6-2-10M10 16a2 2 0 004 0c0-2-1-3-2-4-1 1-2 2-2 4z',
  'clipboard-check':
    'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
  'shield-check':
    'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4',
  droplets:
    'M12 2.69l5.66 5.66a8 8 0 11-11.31 0z',
  smartphone:
    'M17 2H7a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V4a2 2 0 00-2-2zM12 18h.01',
  thermometer:
    'M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z',
  droplet:
    'M12 2.69l5.66 5.66a8 8 0 11-11.31 0z',
  phone:
    'M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z',
  star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  'map-pin':
    'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 13a3 3 0 100-6 3 3 0 000 6z',
  mail: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6',
  clock: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2',
  check: 'M20 6L9 17l-5-5',
  'chevron-right': 'M9 18l6-6-6-6',
  'chevron-down': 'M6 9l6 6 6-6',
  menu: 'M3 12h18M3 6h18M3 18h18',
  x: 'M18 6L6 18M6 6l12 12',
  'arrow-right': 'M5 12h14M12 5l7 7-7 7',
  facebook: 'M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z',
  twitter: 'M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5 0-.28-.03-.56-.08-.83A7.72 7.72 0 0023 3z',
  'gas-safe': 'M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z',
  settings: 'M12 15a3 3 0 100-6 3 3 0 000 6z',
}

interface IconProps {
  name: string
  size?: number
  className?: string
  style?: React.CSSProperties
}

export function Icon({ name, size = 24, className = '', style }: IconProps) {
  const path = iconPaths[name] || iconPaths.check
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  )
}
