export interface ValidationResult {
  passed: boolean;
  warnings: string[];  // Non-blocking — shown in Telegram preview
  errors: string[];    // Blocking — prevent draft creation
  fixes: string[];     // Auto-applied fixes (logged)
}

export function validateBlogDraft(
  draft: { title: string; slug: string; content: string; description: string; tags: string[]; image_alt_text: string | null },
  originalCaption?: string,
): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const fixes: string[] = [];

  // === FIELD LENGTH CHECKS ===
  if (draft.title.length > 70) warnings.push(`Title too long (${draft.title.length} chars, max 70)`);
  if (draft.title.length < 10) errors.push('Title too short');
  if (draft.description.length > 160) warnings.push(`Description too long (${draft.description.length} chars, max 160)`);
  if (draft.description.length < 50) warnings.push('Description may be too short for SEO');
  if (draft.content.split(/\s+/).length < 300) warnings.push('Content under 300 words — may be too thin');
  if (draft.content.split(/\s+/).length > 1500) warnings.push('Content over 1500 words — may need trimming');

  // === BANNED AI PHRASES ===
  const bannedPhrases = [
    "it's important to note", "in today's world", "comprehensive solution",
    "bespoke solution", "tailored solution", "don't hesitate to contact",
    "our team of experts", "our skilled professionals", "we pride ourselves",
    "state-of-the-art", "cutting-edge", "navigate", "leverage", "delve",
    "elevate", "myriad", "seamless", "seamlessly", "game-changer",
    "in conclusion", "to sum up", "look no further", "realm", "journey",
  ];
  const contentLower = draft.content.toLowerCase();
  for (const phrase of bannedPhrases) {
    if (contentLower.includes(phrase)) {
      warnings.push(`AI phrase detected: "${phrase}"`);
    }
  }

  // === EM DASH CHECK ===
  if (draft.content.includes('—')) {
    warnings.push('Em dash detected — should use commas, hyphens, or full stops');
  }

  // === LEGAL CHECKS ===
  const legalPatterns = [
    { pattern: /\b(best|number one|#1|top rated|leading|premier|cheapest|lowest price|most affordable)\b/gi, msg: 'Superlative claim — needs evidence or removal' },
    { pattern: /\b(guaranteed|always works|never fails)\b|100%/gi, msg: 'Guarantee claim — must state terms' },
    { pattern: /\bbetter than\b|unlike other|most .* don't|competitors/gi, msg: 'Comparative claim — needs substantiation' },
  ];
  for (const { pattern, msg } of legalPatterns) {
    const matches = draft.content.match(pattern);
    if (matches) {
      warnings.push(`Legal: "${matches[0]}" — ${msg}`);
    }
  }

  // === CUSTOMER NAME/ADDRESS CHECK ===
  // Check for patterns that look like full names (Title Case pairs)
  const namePattern = /\b(?:Mr|Mrs|Miss|Ms|Dr)\s+[A-Z][a-z]+\b/g;
  const nameMatches = draft.content.match(namePattern);
  if (nameMatches) {
    errors.push(`Possible customer name detected: "${nameMatches[0]}" — GDPR violation`);
  }

  // Check for street addresses
  const addressPattern = /\b\d+\s+[A-Z][a-z]+\s+(Street|Road|Lane|Avenue|Drive|Close|Way|Crescent|Court|Place|Terrace)\b/g;
  const addressMatches = draft.content.match(addressPattern);
  if (addressMatches) {
    errors.push(`Possible address detected: "${addressMatches[0]}" — should be town level only`);
  }

  // Check for specific prices
  const pricePattern = /£\d+(?:\.\d{2})?(?!\s*\/\s*month)/g; // Allow "£X/month" for service plans
  const priceMatches = draft.content.match(pricePattern);
  if (priceMatches && !draft.content.includes('contact') && !draft.content.includes('quote')) {
    warnings.push(`Price detected: "${priceMatches[0]}" — consider using "contact for a quote"`);
  }

  // === HEADING STRUCTURE ===
  if (!draft.content.includes('## ')) {
    warnings.push('No H2 headings found — add ## headings for structure');
  }

  // === INVENTED DETAILS CHECK (if original caption provided) ===
  if (originalCaption) {
    // Check for specific numbers that appear in output but not input
    const outputNumbers = draft.content.match(/\b\d{1,2}\s*(years?|months?|weeks?|days?|hours?|minutes?)\b/gi) || [];
    const captionLower = originalCaption.toLowerCase();
    for (const num of outputNumbers) {
      if (!captionLower.includes(num.toLowerCase().replace(/\s+/g, ' '))) {
        // Check if it's a generic number like "12 months" (common for servicing advice)
        if (!num.match(/\b12\s*months?\b/i) && !num.match(/\b1\s*year\b/i)) {
          warnings.push(`Possibly invented detail: "${num}" — not found in original caption`);
        }
      }
    }
  }

  return {
    passed: errors.length === 0,
    warnings,
    errors,
    fixes,
  };
}

export function validatePhoneUK(phone: string): { valid: boolean; normalised: string; reason?: string } {
  const cleaned = phone.replace(/[\s\-()]/g, '');

  // UK mobile: 07xxx
  if (/^07\d{9}$/.test(cleaned)) {
    return { valid: true, normalised: `+44${cleaned.slice(1)}` };
  }
  // UK landline: 01xxx or 02xxx
  if (/^0[12]\d{8,9}$/.test(cleaned)) {
    return { valid: true, normalised: `+44${cleaned.slice(1)}` };
  }
  // UK non-geo: 03xxx
  if (/^03\d{9}$/.test(cleaned)) {
    return { valid: true, normalised: `+44${cleaned.slice(1)}` };
  }
  // Already +44 format
  if (/^\+44\d{10}$/.test(cleaned)) {
    return { valid: true, normalised: cleaned };
  }

  return { valid: false, normalised: cleaned, reason: 'Not a valid UK phone number format' };
}

export function validatePostcode(postcode: string): { valid: boolean; normalised: string } {
  const cleaned = postcode.replace(/\s+/g, '').toUpperCase();
  const valid = /^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$/.test(cleaned);
  const normalised = valid ? `${cleaned.slice(0, -3)} ${cleaned.slice(-3)}` : cleaned;
  return { valid, normalised };
}

export function validateEmail(email: string): { valid: boolean; reason?: string } {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, reason: 'Invalid email format' };
  }
  return { valid: true };
}
