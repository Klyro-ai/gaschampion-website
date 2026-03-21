export function generateLocalBusinessSchema(business: any) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': 'https://gaschampion.co.uk/#business',
    name: business.name,
    description: business.description,
    url: 'https://gaschampion.co.uk',
    telephone: business.phone,
    email: business.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: business.address.street,
      addressLocality: business.address.town,
      addressRegion: business.address.county,
      postalCode: business.address.postcode,
      addressCountry: 'GB',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 52.0824,
      longitude: 0.4399,
    },
    areaServed: business.serviceAreas.map((area: string) => ({
      '@type': 'City',
      name: area,
    })),
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: business.stats.averageRating,
      reviewCount: business.stats.reviewCount,
      bestRating: 5,
    },
    hasCredential: {
      '@type': 'EducationalOccupationalCredential',
      credentialCategory: 'Gas Safe Registration',
      recognizedBy: {
        '@type': 'Organization',
        name: 'Gas Safe Register',
      },
    },
    priceRange: '$$',
    image: 'https://gaschampion.co.uk/og-image.jpg',
    sameAs: [business.socialMedia.facebook, business.socialMedia.twitter],
  }
}

export function generateServiceSchemas(business: any, services: any[]) {
  return services.map((service) => ({
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    description: service.description,
    provider: {
      '@type': 'LocalBusiness',
      name: business.name,
    },
    areaServed: business.serviceAreas.map((area: string) => ({
      '@type': 'City',
      name: area,
    })),
    offers: {
      '@type': 'Offer',
      priceSpecification: {
        '@type': 'PriceSpecification',
        price: service.fromPrice.replace('£', ''),
        priceCurrency: 'GBP',
      },
    },
  }))
}

export function generateReviewSchemas(business: any, reviews: any[]) {
  return reviews.map((review) => ({
    '@context': 'https://schema.org',
    '@type': 'Review',
    author: { '@type': 'Person', name: review.name },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: review.rating,
      bestRating: 5,
    },
    reviewBody: review.text,
    itemReviewed: {
      '@type': 'LocalBusiness',
      name: business.name,
    },
  }))
}

export function generateFAQSchema(faqs: any[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  }
}
