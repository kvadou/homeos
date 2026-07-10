export interface ValuationResult {
  estimatedValue: number | null;
  source: string;
  confidence: "low" | "medium" | "high";
  lastUpdated: string;
}

// Median price per sq ft by state (approximate 2024 values)
const STATE_MEDIAN_PSF: Record<string, number> = {
  AL: 130, AK: 200, AZ: 250, AR: 115, CA: 400,
  CO: 300, CT: 230, DE: 220, FL: 265, GA: 185,
  HI: 550, ID: 250, IL: 175, IN: 135, IA: 130,
  KS: 130, KY: 130, LA: 135, ME: 200, MD: 230,
  MA: 330, MI: 145, MN: 195, MS: 115, MO: 145,
  MT: 250, NE: 145, NV: 250, NH: 240, NJ: 275,
  NM: 185, NY: 280, NC: 190, ND: 150, OH: 140,
  OK: 120, OR: 280, PA: 170, RI: 260, SC: 170,
  SD: 160, TN: 180, TX: 165, UT: 275, VT: 230,
  VA: 220, WA: 310, WV: 100, WI: 165, WY: 190,
  DC: 450,
};

// National fallback
const NATIONAL_MEDIAN_PSF = 185;

export async function getHomeValuation(
  address: string,
  city: string,
  state: string,
  zipCode: string,
  squareFeet?: number | null
): Promise<ValuationResult> {
  // Try Zillow/Bridge API if key is available
  const zillowKey = process.env.ZILLOW_API_KEY;
  if (zillowKey) {
    try {
      const fullAddress = `${address}, ${city}, ${state} ${zipCode}`;
      const url = new URL("https://api.bridgedataoutput.com/api/v2/zestimates");
      url.searchParams.set("access_token", zillowKey);
      url.searchParams.set("address", fullAddress);

      const res = await fetch(url.toString(), { next: { revalidate: 86400 } });
      if (res.ok) {
        const data = await res.json();
        if (data.bundle?.length > 0 && data.bundle[0].zestimate) {
          return {
            estimatedValue: data.bundle[0].zestimate,
            source: "Zillow Zestimate",
            confidence: "high",
            lastUpdated: new Date().toISOString(),
          };
        }
      }
    } catch {
      // Fall through to estimation
    }
  }

  // Fallback: estimate based on square footage and state median
  const pricePerSqFt = STATE_MEDIAN_PSF[state.toUpperCase()] ?? NATIONAL_MEDIAN_PSF;
  const sqft = squareFeet ?? 1800; // Default assumption

  const estimatedValue = Math.round(pricePerSqFt * sqft);

  return {
    estimatedValue,
    source: "HomeOS Estimate (based on state median $/sqft)",
    confidence: squareFeet ? "medium" : "low",
    lastUpdated: new Date().toISOString(),
  };
}
