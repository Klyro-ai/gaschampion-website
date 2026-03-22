export interface TradeType {
  id: string;
  name: string;
  defaultTheme: string;
  registrationBody?: string;
  defaultServices: Array<{
    id: string;
    name: string;
    shortDesc: string;
    icon: string;
    features: string[];
  }>;
  defaultCredentials: Array<{ name: string; number: string | null }>;
  defaultGuarantees: string[];
  sampleFaqs: Array<{ question: string; answer: string }>;
}

export const tradeCatalog: Record<string, TradeType> = {
  'gas-engineer': {
    id: 'gas-engineer',
    name: 'Gas & Heating Engineer',
    defaultTheme: 'champion-blueprint',
    registrationBody: 'Gas Safe Register',
    defaultServices: [
      { id: 'boiler-repair', name: 'Boiler Repair', shortDesc: 'Fast, reliable boiler fault diagnosis and repair', icon: 'wrench', features: ['All major brands', 'Same-day emergency callouts', 'No fix, no fee'] },
      { id: 'boiler-installation', name: 'Boiler Installation', shortDesc: 'New boiler installations and replacements', icon: 'flame', features: ['Free home survey', 'Up to 10-year warranty', 'Finance available'] },
      { id: 'boiler-servicing', name: 'Boiler Servicing', shortDesc: 'Annual boiler servicing to keep your warranty valid', icon: 'clipboard-check', features: ['Full safety inspection', 'Flue gas analysis', 'Detailed report'] },
      { id: 'gas-safety', name: 'Gas Safety Certificates', shortDesc: 'CP12 landlord certificates and homeowner inspections', icon: 'shield-check', features: ['CP12 for landlords', 'Same-day certificate', 'Multi-property discounts'] },
      { id: 'powerflush', name: 'System Powerflush', shortDesc: 'Remove sludge and restore heating efficiency', icon: 'droplets', features: ['Removes sludge', 'Restores efficiency', 'Inhibitor included'] },
      { id: 'smart-home', name: 'Smart Thermostats', shortDesc: 'Hive, Nest, Tado installation and setup', icon: 'smartphone', features: ['All major brands', 'Full setup', 'Up to 23% energy savings'] },
      { id: 'radiators', name: 'Radiator Installation', shortDesc: 'New radiators, moves, and pipework', icon: 'thermometer', features: ['New fitting', 'Relocations', 'TRV upgrades'] },
      { id: 'hot-water', name: 'Hot Water Cylinders', shortDesc: 'Vented and unvented cylinder installation and repair', icon: 'droplet', features: ['Vented and unvented', 'Emergency repairs', 'Annual maintenance'] },
    ],
    defaultCredentials: [
      { name: 'Gas Safe Registered', number: null },
      { name: 'Fully Insured', number: null },
      { name: 'DBS Checked', number: null },
    ],
    defaultGuarantees: [
      'All work guaranteed for 12 months',
      'Transparent pricing with no hidden costs',
      'Same-day emergency service available',
    ],
    sampleFaqs: [
      { question: 'How often should I service my boiler?', answer: 'Once a year by a Gas Safe registered engineer. It keeps your warranty valid and catches faults early.' },
      { question: 'Do landlords need a Gas Safety Certificate?', answer: 'Yes, it is a legal requirement. CP12 certificates must be renewed annually for rental properties.' },
      { question: 'How quickly can you attend an emergency?', answer: 'We offer same-day emergency callouts for customers without heating or hot water.' },
    ],
  },
  'plumber': {
    id: 'plumber',
    name: 'Plumber',
    defaultTheme: 'neighbourhood-hero',
    registrationBody: 'WaterSafe',
    defaultServices: [
      { id: 'leak-repair', name: 'Leak Repairs', shortDesc: 'Fast leak detection and repair', icon: 'droplet', features: ['Emergency response', 'All pipe types', 'Minimal disruption'] },
      { id: 'bathroom-fitting', name: 'Bathroom Fitting', shortDesc: 'Full bathroom installations and refurbishments', icon: 'bath', features: ['Design to completion', 'All trades managed', 'Tiling included'] },
      { id: 'tap-toilet', name: 'Taps & Toilets', shortDesc: 'Tap replacements, toilet repairs, and installations', icon: 'wrench', features: ['All brands', 'Quick turnaround', 'Parts supplied'] },
      { id: 'pipe-repairs', name: 'Pipe Repairs', shortDesc: 'Burst, frozen, and corroded pipe repairs', icon: 'tool', features: ['Emergency service', 'Copper and plastic', 'Pressure testing'] },
      { id: 'drainage', name: 'Drainage', shortDesc: 'Blocked drains, waste pipes, and drainage solutions', icon: 'filter', features: ['Jetting available', 'CCTV surveys', 'Root removal'] },
      { id: 'water-heaters', name: 'Water Heaters', shortDesc: 'Immersion heater and water heater installation', icon: 'flame', features: ['All types', 'Energy efficient', 'Same-day where possible'] },
    ],
    defaultCredentials: [
      { name: 'WaterSafe Approved', number: null },
      { name: 'Fully Insured', number: null },
      { name: 'DBS Checked', number: null },
    ],
    defaultGuarantees: [
      'All work guaranteed for 12 months',
      'No call-out fee',
      'Transparent pricing upfront',
    ],
    sampleFaqs: [
      { question: 'Do you offer emergency plumbing?', answer: 'Yes, we offer same-day emergency callouts for leaks, burst pipes, and other urgent plumbing issues.' },
      { question: 'Can you fit a new bathroom?', answer: 'Yes, we handle full bathroom installations from design through to completion, including tiling and all plumbing work.' },
      { question: 'How much does a plumber cost?', answer: 'It depends on the job. We provide free quotes with no obligation, and our pricing is always transparent with no hidden costs.' },
    ],
  },
  'electrician': {
    id: 'electrician',
    name: 'Electrician',
    defaultTheme: 'smart-home-tech',
    registrationBody: 'NICEIC',
    defaultServices: [
      { id: 'rewiring', name: 'Rewiring', shortDesc: 'Full and partial house rewiring', icon: 'zap', features: ['Full rewires', 'Partial upgrades', 'Certified to BS 7671'] },
      { id: 'fuse-board', name: 'Fuse Board Upgrades', shortDesc: 'Consumer unit replacements and upgrades', icon: 'shield-check', features: ['RCD protection', 'Part P compliant', 'Certificate issued'] },
      { id: 'lighting', name: 'Lighting', shortDesc: 'Indoor and outdoor lighting installation', icon: 'lightbulb', features: ['LED upgrades', 'Garden lighting', 'Smart lighting'] },
      { id: 'sockets-switches', name: 'Sockets & Switches', shortDesc: 'Additional sockets, USB points, and switch upgrades', icon: 'plug', features: ['USB sockets', 'Outdoor sockets', 'Smart switches'] },
      { id: 'testing', name: 'Electrical Testing', shortDesc: 'EICR testing and periodic inspections', icon: 'clipboard-check', features: ['EICR certificates', 'Landlord compliance', 'PAT testing'] },
      { id: 'ev-charging', name: 'EV Charger Installation', shortDesc: 'Electric vehicle charger installation', icon: 'battery-charging', features: ['All major brands', 'OZEV grant eligible', 'Smart charging'] },
    ],
    defaultCredentials: [
      { name: 'NICEIC Approved', number: null },
      { name: 'Part P Certified', number: null },
      { name: 'Fully Insured', number: null },
    ],
    defaultGuarantees: [
      'All work certified to BS 7671',
      'Certificates issued for all notifiable work',
      'Workmanship guaranteed for 12 months',
    ],
    sampleFaqs: [
      { question: 'Do I need an EICR?', answer: 'Landlords are legally required to have a valid EICR for rental properties. Homeowners should have one every 10 years or when buying a property.' },
      { question: 'How long does a rewire take?', answer: 'A full house rewire typically takes 5 to 10 days depending on the size of the property. We always aim to minimise disruption.' },
      { question: 'Can you install an EV charger at my home?', answer: 'Yes, we are approved installers for most major EV charger brands and can advise on the best option for your setup.' },
    ],
  },
};

export function getTradeType(id: string): TradeType | undefined {
  return tradeCatalog[id];
}

export function getAllTradeTypes(): TradeType[] {
  return Object.values(tradeCatalog);
}
