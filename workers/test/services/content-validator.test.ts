import { describe, it, expect } from 'vitest';
import {
  validateBlogDraft,
  validatePhoneUK,
  validatePostcode,
  validateEmail,
} from '../../src/services/content-validator';

// Helpers to build a minimal valid draft
const LONG_CONTENT = ('## Section\n' + 'This is a sentence with several words in it. '.repeat(30) + '\n\n').repeat(4);

function makeDraft(overrides: Partial<Parameters<typeof validateBlogDraft>[0]> = {}): Parameters<typeof validateBlogDraft>[0] {
  return {
    title: 'Boiler Repair in Haverhill — What to Expect',
    slug: 'boiler-repair-haverhill',
    content: LONG_CONTENT,
    description: 'A detailed guide to boiler repair in Haverhill covering common faults and what our engineer does on the day.',
    tags: ['boiler', 'haverhill', 'suffolk'],
    image_alt_text: 'Engineer checking a boiler',
    ...overrides,
  };
}

// ─── validateBlogDraft ────────────────────────────────────────────────────────

describe('validateBlogDraft — field length checks', () => {
  it('passes a clean valid draft', () => {
    const result = validateBlogDraft(makeDraft());
    expect(result.passed).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('warns when title exceeds 70 chars', () => {
    const draft = makeDraft({ title: 'A'.repeat(71) });
    const result = validateBlogDraft(draft);
    expect(result.warnings.some(w => w.includes('Title too long'))).toBe(true);
  });

  it('errors when title is under 10 chars', () => {
    const draft = makeDraft({ title: 'Short' });
    const result = validateBlogDraft(draft);
    expect(result.passed).toBe(false);
    expect(result.errors.some(e => e.includes('Title too short'))).toBe(true);
  });

  it('warns when description exceeds 160 chars', () => {
    const draft = makeDraft({ description: 'A'.repeat(161) });
    const result = validateBlogDraft(draft);
    expect(result.warnings.some(w => w.includes('Description too long'))).toBe(true);
  });

  it('warns when description is under 50 chars', () => {
    const draft = makeDraft({ description: 'Short desc' });
    const result = validateBlogDraft(draft);
    expect(result.warnings.some(w => w.includes('too short for SEO'))).toBe(true);
  });

  it('warns when content is under 300 words', () => {
    const draft = makeDraft({ content: '## Heading\nOnly a few words here.' });
    const result = validateBlogDraft(draft);
    expect(result.warnings.some(w => w.includes('under 300 words'))).toBe(true);
  });

  it('warns when content is over 1500 words', () => {
    const bigContent = '## Section\n' + 'word '.repeat(1510);
    const draft = makeDraft({ content: bigContent });
    const result = validateBlogDraft(draft);
    expect(result.warnings.some(w => w.includes('over 1500 words'))).toBe(true);
  });
});

describe('validateBlogDraft — banned AI phrases', () => {
  const phrases = [
    "it's important to note",
    "in today's world",
    "comprehensive solution",
    "bespoke solution",
    "tailored solution",
    "don't hesitate to contact",
    "our team of experts",
    "our skilled professionals",
    "we pride ourselves",
    "state-of-the-art",
    "cutting-edge",
    "navigate",
    "leverage",
    "delve",
    "elevate",
    "myriad",
    "seamless",
    "seamlessly",
    "game-changer",
    "in conclusion",
    "to sum up",
    "look no further",
    "realm",
    "journey",
  ];

  for (const phrase of phrases) {
    it(`flags banned phrase: "${phrase}"`, () => {
      const content = LONG_CONTENT + `\n\nWe ${phrase} when fixing boilers.`;
      const draft = makeDraft({ content });
      const result = validateBlogDraft(draft);
      expect(result.warnings.some(w => w.includes(phrase))).toBe(true);
    });
  }

  it('is case-insensitive for banned phrases', () => {
    const content = LONG_CONTENT + '\n\nThis is a SEAMLESS experience.';
    const draft = makeDraft({ content });
    const result = validateBlogDraft(draft);
    expect(result.warnings.some(w => w.includes('seamless'))).toBe(true);
  });
});

describe('validateBlogDraft — em dash detection', () => {
  it('warns on em dash in content', () => {
    const content = LONG_CONTENT + '\n\nThe boiler — which was old — needed replacing.';
    const draft = makeDraft({ content });
    const result = validateBlogDraft(draft);
    expect(result.warnings.some(w => w.includes('Em dash detected'))).toBe(true);
  });

  it('does not warn when no em dash present', () => {
    const result = validateBlogDraft(makeDraft());
    expect(result.warnings.some(w => w.includes('Em dash'))).toBe(false);
  });
});

describe('validateBlogDraft — legal claim checks', () => {
  it('flags superlative claim: "best"', () => {
    const content = LONG_CONTENT + '\n\nWe are the best engineers in Suffolk.';
    const result = validateBlogDraft(makeDraft({ content }));
    expect(result.warnings.some(w => w.includes('Superlative claim'))).toBe(true);
  });

  it('flags superlative claim: "leading"', () => {
    const content = LONG_CONTENT + '\n\nWe are the leading provider.';
    const result = validateBlogDraft(makeDraft({ content }));
    expect(result.warnings.some(w => w.includes('Superlative claim'))).toBe(true);
  });

  it('flags guarantee claim: "guaranteed"', () => {
    const content = LONG_CONTENT + '\n\nResults are guaranteed.';
    const result = validateBlogDraft(makeDraft({ content }));
    expect(result.warnings.some(w => w.includes('Guarantee claim'))).toBe(true);
  });

  it('flags guarantee claim: "100%"', () => {
    const content = LONG_CONTENT + '\n\nWe are 100% reliable.';
    const result = validateBlogDraft(makeDraft({ content }));
    expect(result.warnings.some(w => w.includes('Guarantee claim'))).toBe(true);
  });

  it('flags comparative claim: "better than"', () => {
    const content = LONG_CONTENT + '\n\nWe are better than the rest.';
    const result = validateBlogDraft(makeDraft({ content }));
    expect(result.warnings.some(w => w.includes('Comparative claim'))).toBe(true);
  });

  it('flags comparative claim: "competitors"', () => {
    const content = LONG_CONTENT + '\n\nUnlike our competitors, we respond quickly.';
    const result = validateBlogDraft(makeDraft({ content }));
    expect(result.warnings.some(w => w.includes('Comparative claim'))).toBe(true);
  });
});

describe('validateBlogDraft — customer name detection', () => {
  it('errors on "Mr Smith" pattern', () => {
    const content = LONG_CONTENT + '\n\nMr Smith was happy with the work.';
    const result = validateBlogDraft(makeDraft({ content }));
    expect(result.passed).toBe(false);
    expect(result.errors.some(e => e.includes('GDPR violation'))).toBe(true);
  });

  it('errors on "Mrs Johnson" pattern', () => {
    const content = LONG_CONTENT + '\n\nThe job was for Mrs Johnson in Clare.';
    const result = validateBlogDraft(makeDraft({ content }));
    expect(result.passed).toBe(false);
    expect(result.errors.some(e => e.includes('Possible customer name'))).toBe(true);
  });

  it('errors on "Dr Williams" pattern', () => {
    const content = LONG_CONTENT + '\n\nDr Williams had a faulty boiler.';
    const result = validateBlogDraft(makeDraft({ content }));
    expect(result.passed).toBe(false);
    expect(result.errors.some(e => e.includes('GDPR violation'))).toBe(true);
  });

  it('does not flag plain text without title prefix', () => {
    const content = LONG_CONTENT + '\n\nThe customer in Haverhill was pleased.';
    const result = validateBlogDraft(makeDraft({ content }));
    expect(result.errors.some(e => e.includes('GDPR violation'))).toBe(false);
  });
});

describe('validateBlogDraft — address detection', () => {
  it('errors on full street address', () => {
    const content = LONG_CONTENT + '\n\nThe job was at 42 Church Street in Haverhill.';
    const result = validateBlogDraft(makeDraft({ content }));
    expect(result.passed).toBe(false);
    expect(result.errors.some(e => e.includes('Possible address detected'))).toBe(true);
  });

  it('errors on "Road" address', () => {
    const content = LONG_CONTENT + '\n\nWe visited 7 Maple Road.';
    const result = validateBlogDraft(makeDraft({ content }));
    expect(result.passed).toBe(false);
    expect(result.errors.some(e => e.includes('should be town level only'))).toBe(true);
  });

  it('does not flag town-only references', () => {
    const content = LONG_CONTENT + '\n\nThe customer was based in Haverhill, Suffolk.';
    const result = validateBlogDraft(makeDraft({ content }));
    expect(result.errors.some(e => e.includes('address'))).toBe(false);
  });
});

describe('validateBlogDraft — heading structure', () => {
  it('warns when no H2 headings present', () => {
    const draft = makeDraft({ content: 'word '.repeat(310) });
    const result = validateBlogDraft(draft);
    expect(result.warnings.some(w => w.includes('No H2 headings'))).toBe(true);
  });

  it('does not warn when H2 headings are present', () => {
    const result = validateBlogDraft(makeDraft());
    expect(result.warnings.some(w => w.includes('No H2 headings'))).toBe(false);
  });
});

describe('validateBlogDraft — invented details check', () => {
  it('warns on time duration not in original caption', () => {
    const content = LONG_CONTENT + '\n\nThe job took 3 hours to complete.';
    const result = validateBlogDraft(makeDraft({ content }), 'Boiler repair in Haverhill');
    expect(result.warnings.some(w => w.includes('Possibly invented detail'))).toBe(true);
  });

  it('does not warn when duration matches caption', () => {
    const content = LONG_CONTENT + '\n\nThe job took 3 hours to complete.';
    const result = validateBlogDraft(makeDraft({ content }), 'Boiler repair took 3 hours');
    expect(result.warnings.some(w => w.includes('Possibly invented detail'))).toBe(false);
  });

  it('does not warn for generic "12 months" servicing advice', () => {
    const content = LONG_CONTENT + '\n\nBoilers should be serviced every 12 months.';
    const result = validateBlogDraft(makeDraft({ content }), 'Boiler service completed');
    expect(result.warnings.some(w => w.includes('12 months'))).toBe(false);
  });

  it('does not warn for generic "1 year" advice', () => {
    const content = LONG_CONTENT + '\n\nAnnual checks should be done every 1 year.';
    const result = validateBlogDraft(makeDraft({ content }), 'Annual boiler check');
    expect(result.warnings.some(w => w.includes('1 year'))).toBe(false);
  });

  it('does not run invented detail checks when no caption provided', () => {
    const content = LONG_CONTENT + '\n\nThe job took 3 hours to complete.';
    const result = validateBlogDraft(makeDraft({ content }));
    expect(result.warnings.some(w => w.includes('Possibly invented detail'))).toBe(false);
  });
});

// ─── validatePhoneUK ──────────────────────────────────────────────────────────

describe('validatePhoneUK — UK mobile', () => {
  it('accepts standard mobile number', () => {
    const result = validatePhoneUK('07828943186');
    expect(result.valid).toBe(true);
    expect(result.normalised).toBe('+447828943186');
  });

  it('accepts mobile with spaces', () => {
    const result = validatePhoneUK('07828 943 186');
    expect(result.valid).toBe(true);
    expect(result.normalised).toBe('+447828943186');
  });

  it('accepts mobile with dashes', () => {
    const result = validatePhoneUK('07828-943-186');
    expect(result.valid).toBe(true);
    expect(result.normalised).toBe('+447828943186');
  });
});

describe('validatePhoneUK — UK landline', () => {
  it('accepts 01xxx landline', () => {
    const result = validatePhoneUK('01440712345');
    expect(result.valid).toBe(true);
    expect(result.normalised).toBe('+441440712345');
  });

  it('accepts 02xxx landline', () => {
    const result = validatePhoneUK('02071234567');
    expect(result.valid).toBe(true);
    expect(result.normalised).toBe('+442071234567');
  });

  it('accepts 03xxx non-geo number', () => {
    const result = validatePhoneUK('03001234567');
    expect(result.valid).toBe(true);
    expect(result.normalised).toBe('+443001234567');
  });

  it('accepts already-normalised +44 format', () => {
    const result = validatePhoneUK('+447828943186');
    expect(result.valid).toBe(true);
    expect(result.normalised).toBe('+447828943186');
  });
});

describe('validatePhoneUK — invalid numbers', () => {
  it('rejects a US number', () => {
    const result = validatePhoneUK('12125550100');
    expect(result.valid).toBe(false);
    expect(result.reason).toBeDefined();
  });

  it('rejects too-short number', () => {
    const result = validatePhoneUK('0782812');
    expect(result.valid).toBe(false);
  });

  it('rejects empty string', () => {
    const result = validatePhoneUK('');
    expect(result.valid).toBe(false);
  });

  it('rejects letters', () => {
    const result = validatePhoneUK('notanumber');
    expect(result.valid).toBe(false);
  });
});

// ─── validatePostcode ─────────────────────────────────────────────────────────

describe('validatePostcode', () => {
  it('accepts valid postcode and formats with space', () => {
    const result = validatePostcode('CB98BB');
    expect(result.valid).toBe(true);
    expect(result.normalised).toBe('CB9 8BB');
  });

  it('accepts postcode with existing space', () => {
    const result = validatePostcode('CB9 8BB');
    expect(result.valid).toBe(true);
    expect(result.normalised).toBe('CB9 8BB');
  });

  it('accepts London postcode format', () => {
    const result = validatePostcode('EC1A1BB');
    expect(result.valid).toBe(true);
    expect(result.normalised).toBe('EC1A 1BB');
  });

  it('accepts single-letter area code', () => {
    const result = validatePostcode('W1A1AA');
    expect(result.valid).toBe(true);
  });

  it('rejects obviously invalid postcode', () => {
    const result = validatePostcode('INVALID');
    expect(result.valid).toBe(false);
  });

  it('rejects empty string', () => {
    const result = validatePostcode('');
    expect(result.valid).toBe(false);
  });

  it('normalises to uppercase', () => {
    const result = validatePostcode('cb9 8bb');
    expect(result.valid).toBe(true);
    expect(result.normalised).toBe('CB9 8BB');
  });
});

// ─── validateEmail ────────────────────────────────────────────────────────────

describe('validateEmail', () => {
  it('accepts standard email address', () => {
    const result = validateEmail('lee@gaschampion.co.uk');
    expect(result.valid).toBe(true);
  });

  it('accepts email with plus addressing', () => {
    const result = validateEmail('user+tag@example.com');
    expect(result.valid).toBe(true);
  });

  it('rejects email with no @', () => {
    const result = validateEmail('notanemail');
    expect(result.valid).toBe(false);
    expect(result.reason).toBeDefined();
  });

  it('rejects email with no domain', () => {
    const result = validateEmail('user@');
    expect(result.valid).toBe(false);
  });

  it('rejects email with spaces', () => {
    const result = validateEmail('user @example.com');
    expect(result.valid).toBe(false);
  });

  it('rejects empty string', () => {
    const result = validateEmail('');
    expect(result.valid).toBe(false);
  });
});
