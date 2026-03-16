export const business = {
  name: 'Gas Champion Ltd',
  shortName: 'Gas Champion',
  tagline: 'Expert Boiler & Heating Services',
  subtitle: 'Gas Safe Registered Engineers in Haverhill, Suffolk',
  description:
    'Gas Champion provides expert boiler repairs, installations, servicing, and heating solutions across Haverhill, Saffron Walden, Bury St Edmunds, and Sudbury. Gas Safe registered with 18+ years of experience.',
  owner: 'Lee',
  ownerBackground: 'Former British Gas technician with 11 years experience',
  phone: '07828 943 186',
  phoneLandline: '01440 575 525',
  email: 'info@gaschampion.co.uk',
  address: {
    street: '31 High Street',
    town: 'Haverhill',
    county: 'Suffolk',
    postcode: 'CB9 8AD',
    full: '31 High Street, Haverhill, Suffolk, CB9 8AD',
  },
  gasSafeNumber: '636427',
  yearsExperience: 18,
  socialMedia: {
    facebook: 'https://facebook.com/gaschampion',
    twitter: 'https://twitter.com/GasChampionLtd',
  },
  serviceAreas: [
    'Haverhill',
    'Saffron Walden',
    'Bury St Edmunds',
    'Sudbury',
    'Clare',
    'Steeple Bumpstead',
    'Kedington',
    'Great Yeldham',
    'Halstead',
    'Newmarket',
    'Cambridge (South)',
  ],
  stats: {
    reviewCount: 80,
    averageRating: 5.0,
    completedJobs: 2000,
    yearsInBusiness: 18,
    responseSla: 'Same day',
  },
  credentials: [
    { name: 'Gas Safe Registered', number: '636427' },
    { name: 'Fully Insured', number: null },
    { name: 'DBS Checked', number: null },
    { name: 'Ex-British Gas Engineer', number: null },
  ],
  guarantees: [
    'No fix, no fee guarantee',
    'All work guaranteed for 12 months',
    'Transparent pricing — no hidden costs',
    'Same-day emergency service available',
  ],
} as const

export const services = [
  {
    id: 'boiler-repair',
    name: 'Boiler Repair',
    shortDesc: 'Fast, reliable boiler fault diagnosis and repair',
    description:
      'Is your boiler playing up? Our expert engineers diagnose and fix all boiler faults quickly. With 18+ years of experience and ex-British Gas training, we can repair all major brands including Worcester, Vaillant, Baxi, Ideal, and more. Same-day emergency service available.',
    icon: 'wrench',
    features: [
      'All major brands repaired',
      'Same-day emergency callouts',
      'No fix, no fee guarantee',
      'Transparent pricing upfront',
    ],
    fromPrice: '£75',
  },
  {
    id: 'boiler-installation',
    name: 'Boiler Installation',
    shortDesc: 'New boiler installations and replacements',
    description:
      'Whether you need a complete new boiler installation or a like-for-like replacement, we provide expert fitting with manufacturers\' warranties. We\'ll help you choose the right boiler for your home and budget, with finance options available.',
    icon: 'flame',
    features: [
      'Free home survey and quote',
      'All major brands supplied and fitted',
      'Up to 10-year manufacturer warranty',
      'Finance options available',
    ],
    fromPrice: '£1,800',
  },
  {
    id: 'boiler-servicing',
    name: 'Boiler Servicing',
    shortDesc: 'Annual boiler servicing to keep your warranty valid',
    description:
      'Regular boiler servicing extends your boiler\'s life, maintains efficiency, and keeps your manufacturer warranty valid. Our thorough service includes a full safety check, flue gas analysis, and detailed report.',
    icon: 'clipboard-check',
    features: [
      'Full safety inspection',
      'Flue gas analysis',
      'Efficiency check',
      'Detailed written report',
    ],
    fromPrice: '£70',
  },
  {
    id: 'gas-safety',
    name: 'Gas Safety Certificates',
    shortDesc: 'CP12 landlord certificates and homeowner inspections',
    description:
      'Legal requirement for all landlords — we provide Gas Safety Certificates (CP12) for rental properties and safety inspections for homeowners. Quick turnaround with certificates emailed same day.',
    icon: 'shield-check',
    features: [
      'CP12 certificates for landlords',
      'Homeowner safety inspections',
      'Same-day certificate delivery',
      'Multi-property discounts',
    ],
    fromPrice: '£60',
  },
  {
    id: 'powerflush',
    name: 'System Powerflush',
    shortDesc: 'Remove sludge and restore heating efficiency',
    description:
      'Sludge buildup is responsible for 20% of boiler breakdowns. Our powerflushing service removes rust, sludge, and debris from your central heating system, restoring efficiency and preventing costly repairs.',
    icon: 'droplets',
    features: [
      'Removes sludge and debris',
      'Restores heating efficiency',
      'Prevents future breakdowns',
      'Chemical inhibitor included',
    ],
    fromPrice: '£350',
  },
  {
    id: 'smart-home',
    name: 'Smart Thermostats',
    shortDesc: 'Hive, Nest, Tado & Honeywell installation',
    description:
      'Upgrade your heating controls with a smart thermostat. Control your heating from your phone, save up to 23% on energy bills, and enjoy perfect comfort. We install and set up Hive, Nest, Tado, and Honeywell systems.',
    icon: 'smartphone',
    features: [
      'All major brands installed',
      'Full setup and tutorial',
      'Up to 23% energy savings',
      'Voice control compatible',
    ],
    fromPrice: '£180',
  },
  {
    id: 'radiators',
    name: 'Radiator Installation',
    shortDesc: 'New radiators, moves, and pipework alterations',
    description:
      'Need a new radiator, want to move an existing one, or upgrade to designer radiators? We handle all radiator installations and pipework alterations with minimal disruption to your home.',
    icon: 'thermometer',
    features: [
      'New radiator fitting',
      'Radiator relocations',
      'Pipework alterations',
      'Thermostatic valve upgrades',
    ],
    fromPrice: '£150',
  },
  {
    id: 'hot-water',
    name: 'Hot Water Cylinders',
    shortDesc: 'Vented and unvented cylinder maintenance and installation',
    description:
      'Expert installation, repair, and maintenance of vented and unvented hot water cylinders. Whether you need a new cylinder, an upgrade, or emergency repairs, we\'ve got you covered.',
    icon: 'droplet',
    features: [
      'Vented & unvented systems',
      'Emergency repairs',
      'New installations',
      'Annual maintenance',
    ],
    fromPrice: '£200',
  },
  {
    id: 'gas-fires',
    name: 'Gas Fire Servicing',
    shortDesc: 'Gas fire servicing, repairs, and safety checks',
    description:
      'Keep your gas fire safe and efficient with regular servicing. We service and repair all types of gas fires, including wall-mounted, inset, and freestanding models.',
    icon: 'flame',
    features: [
      'All types serviced',
      'Safety inspections',
      'Fault diagnosis and repair',
      'Carbon monoxide testing',
    ],
    fromPrice: '£65',
  },
  {
    id: 'plumbing',
    name: 'General Plumbing',
    shortDesc: 'Taps, toilets, pipes — general plumbing repairs',
    description:
      'From leaking taps to burst pipes, we handle all general plumbing repairs and installations. No job too small — we\'re here to help with any plumbing issue in your home.',
    icon: 'wrench',
    features: [
      'Leak repairs',
      'Tap and toilet fixes',
      'Pipe repairs and replacements',
      'No job too small',
    ],
    fromPrice: '£55',
  },
] as const

export const reviews = [
  {
    name: 'Liam',
    rating: 5,
    text: 'Would recommend to anyone... the best Gas/Boiler Technician I have ever used. Professional, punctual and extremely knowledgeable.',
    source: 'Google',
    date: '2024',
  },
  {
    name: 'Sarah M.',
    rating: 5,
    text: 'Lee was brilliant! My boiler had an issue and he arrived promptly, diagnosed the fault quickly and had it fixed within the hour. Friendly, professional and very reasonably priced.',
    source: 'Google',
    date: '2024',
  },
  {
    name: 'James R.',
    rating: 5,
    text: 'Excellent service from start to finish. Boiler serviced and a small repair carried out. Lee explained everything clearly and left the area spotless. Will definitely use again.',
    source: 'Google',
    date: '2024',
  },
  {
    name: 'Emma T.',
    rating: 5,
    text: 'Called on a Sunday with no hot water and Lee came out first thing Monday morning. Fixed the problem quickly and charged a very fair price. Couldn\'t ask for more.',
    source: 'Google',
    date: '2024',
  },
  {
    name: 'David P.',
    rating: 5,
    text: 'Had our landlord gas safety certificate done — quick, thorough, and professional. Certificate emailed over the same day. Highly recommended.',
    source: 'Google',
    date: '2023',
  },
  {
    name: 'Karen W.',
    rating: 5,
    text: 'Lee installed a Nest thermostat for us and took the time to set it all up and show us how to use it. Heating bills have already come down. Great service!',
    source: 'Google',
    date: '2024',
  },
  {
    name: 'Mark B.',
    rating: 5,
    text: 'Efficient, polite, helpful and fixed the broken boiler to restore heat instantly. Can\'t recommend Gas Champion enough — truly lives up to the name.',
    source: 'Local Heroes',
    date: '2023',
  },
  {
    name: 'Rachel H.',
    rating: 5,
    text: 'VERY knowledgeable, thorough, and reasonably priced. Lee diagnosed a fault that two other engineers had missed. Finally have reliable heating again!',
    source: 'Google',
    date: '2024',
  },
  {
    name: 'Tom C.',
    rating: 5,
    text: 'Used Gas Champion for a powerflush and the difference is incredible. Radiators that were cold at the bottom are now fully hot. Lee explained the whole process and was very tidy.',
    source: 'MyBuilder',
    date: '2024',
  },
  {
    name: 'Angela S.',
    rating: 5,
    text: 'New boiler installed — from the initial survey to the final cleanup, everything was handled professionally. Lee gave honest advice about what we actually needed rather than upselling.',
    source: 'Google',
    date: '2024',
  },
] as const

export const servicePlans = [
  {
    name: 'Silver',
    price: '£8.99',
    period: '/month',
    features: [
      'Annual boiler service',
      'Gas safety check',
      'Priority booking',
      '10% off repairs',
      'Annual reminder',
    ],
    popular: false,
  },
  {
    name: 'Gold',
    price: '£14.99',
    period: '/month',
    features: [
      'Annual boiler service',
      'Gas safety check',
      'Priority booking',
      '20% off repairs',
      'Annual reminder',
      'System health check',
      'Radiator bleed and balance',
      'Emergency callout priority',
    ],
    popular: true,
  },
] as const

export const faqs = [
  {
    question: 'How often should I service my boiler?',
    answer:
      'Your boiler should be serviced annually by a Gas Safe registered engineer. Regular servicing keeps your boiler running efficiently, extends its lifespan, and is usually required to maintain your manufacturer\'s warranty.',
  },
  {
    question: 'Do landlords need a Gas Safety Certificate?',
    answer:
      'Yes — it\'s a legal requirement for all landlords to have a valid Gas Safety Certificate (CP12) for rental properties. This must be renewed annually and a copy given to tenants within 28 days.',
  },
  {
    question: 'How quickly can you attend an emergency?',
    answer:
      'We offer same-day emergency callouts for customers without heating or hot water. We aim to attend within a few hours during working days, and prioritise our service plan customers.',
  },
  {
    question: 'What areas do you cover?',
    answer:
      'We cover Haverhill, Saffron Walden, Bury St Edmunds, Sudbury, and surrounding villages across the Suffolk, Essex, and Cambridgeshire borders. If you\'re unsure, give us a call.',
  },
  {
    question: 'What brands of boiler do you work on?',
    answer:
      'We repair and service all major boiler brands including Worcester Bosch, Vaillant, Baxi, Ideal, Glow-worm, Potterton, and more. For installations, we can supply and fit most leading brands.',
  },
  {
    question: 'Is a powerflush worth it?',
    answer:
      'If your radiators have cold spots, your boiler is making noise, or your heating is slow to warm up, a powerflush can make a huge difference. Sludge buildup causes 20% of boiler breakdowns, so it\'s also a great preventative measure.',
  },
  {
    question: 'Do you offer finance for new boilers?',
    answer:
      'Yes, we offer finance options for new boiler installations so you can spread the cost. We\'ll discuss all options during your free home survey.',
  },
  {
    question: 'Can you install smart thermostats?',
    answer:
      'Absolutely! We install and set up Hive, Nest, Tado, and Honeywell smart thermostats. We\'ll show you how to use it and help you get the most from your new smart heating controls. Customers save up to 23% on energy bills.',
  },
] as const

export const blogPosts = [
  {
    slug: 'how-to-bleed-radiators',
    title: 'How to Bleed Your Radiators: A Step-by-Step Guide',
    excerpt:
      'Cold spots on your radiators? Learn how to bleed them yourself with our easy guide, and when to call a professional.',
    date: '2024-11-15',
    category: 'Tips',
  },
  {
    slug: 'boiler-servicing-why-it-matters',
    title: 'Why Annual Boiler Servicing Saves You Money',
    excerpt:
      'An unserviced boiler costs you more in energy bills and risks expensive breakdowns. Here\'s why annual servicing is worth every penny.',
    date: '2024-10-20',
    category: 'Maintenance',
  },
  {
    slug: 'smart-thermostat-guide',
    title: 'Smart Thermostats: Which One Is Right for Your Home?',
    excerpt:
      'Hive, Nest, Tado, or Honeywell? We compare the top smart thermostats to help you choose the best one for your needs.',
    date: '2024-09-10',
    category: 'Smart Home',
  },
  {
    slug: 'landlord-gas-safety-guide',
    title: 'Landlord Gas Safety Certificates: Everything You Need to Know',
    excerpt:
      'A complete guide to CP12 certificates — what they are, when you need one, and what happens during an inspection.',
    date: '2024-08-05',
    category: 'Legal',
  },
] as const
