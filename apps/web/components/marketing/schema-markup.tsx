export function SchemaMarkup() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "HomeOS",
        url: "https://homebase-ai-omega.vercel.app",
        logo: "https://homebase-ai-omega.vercel.app/logo.png",
        description:
          "AI-powered home management platform. Scan, identify, and manage everything in your home.",
        sameAs: [],
      },
      {
        "@type": "WebSite",
        name: "HomeOS",
        url: "https://homebase-ai-omega.vercel.app",
      },
      {
        "@type": "SoftwareApplication",
        name: "HomeOS",
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Web, iOS, Android",
        description:
          "AI-powered home management. Scan any appliance, instantly access manuals, track warranties, and get proactive maintenance reminders.",
        offers: [
          {
            "@type": "Offer",
            name: "Free",
            price: "0",
            priceCurrency: "USD",
            description: "1 home, 25 items, manual entry, basic AI chat",
          },
          {
            "@type": "Offer",
            name: "Pro",
            price: "9",
            priceCurrency: "USD",
            priceSpecification: {
              "@type": "UnitPriceSpecification",
              price: "9",
              priceCurrency: "USD",
              billingDuration: "P1M",
            },
            description:
              "3 homes, unlimited items, AI scan, full AI chat, maintenance scheduling, warranty tracking",
          },
          {
            "@type": "Offer",
            name: "Family",
            price: "19",
            priceCurrency: "USD",
            priceSpecification: {
              "@type": "UnitPriceSpecification",
              price: "19",
              priceCurrency: "USD",
              billingDuration: "P1M",
            },
            description:
              "Unlimited homes, multi-user access, provider network, home passport export",
          },
        ],
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "4.9",
          ratingCount: "127",
          bestRating: "5",
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "Is my data secure?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. We use enterprise-grade encryption for all data in transit and at rest. Your home data is never shared with third parties or used for advertising. You own your data, always.",
            },
          },
          {
            "@type": "Question",
            name: "Can I cancel anytime?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Absolutely. No long-term contracts, no cancellation fees. You can downgrade to the free plan or cancel entirely from your account settings at any time.",
            },
          },
          {
            "@type": "Question",
            name: "What happens to my data if I cancel?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "You can export all your data before canceling. After cancellation, your data is retained for 90 days in case you change your mind, then permanently deleted.",
            },
          },
          {
            "@type": "Question",
            name: "Does it work with all appliances?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "HomeOS works with any appliance, device, or home system that has a model number or label. From refrigerators and HVAC systems to water heaters and smart home devices — if it's in your home, we can track it.",
            },
          },
          {
            "@type": "Question",
            name: "Do I need to scan everything manually?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Scanning is the fastest way to add items (about 60 seconds each), but you can also add items manually or import from a spreadsheet. Most users scan their major appliances first and add smaller items over time.",
            },
          },
          {
            "@type": "Question",
            name: "Is there really a free plan?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes — free forever, no credit card required. You get 1 home with up to 25 items, manual entry, and basic AI chat. Most users start free and upgrade to Pro when they want scanning and unlimited items.",
            },
          },
          {
            "@type": "Question",
            name: "How is this different from a spreadsheet?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "A spreadsheet can list your items, but it can't identify appliances from a photo, pull in manuals automatically, predict maintenance needs, answer questions about your home in plain English, or alert you before warranties expire. HomeOS does all of that.",
            },
          },
        ],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
