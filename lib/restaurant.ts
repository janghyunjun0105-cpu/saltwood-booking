export const RESTAURANT = {
  name: "Saltwood Kitchen",
  category: "Modern American bistro",
  pitch:
    "Wood-fired cooking, Texas-grown produce and a warm room on Main Street. Pull up a chair.",
  street: "123 Main St",
  city: "Austin",
  state: "TX",
  postalCode: "78701",
  phoneDisplay: "(512) 555-0147",
  phoneHref: "tel:+15125550147",
  timeZone: "America/Chicago",
} as const;

export const FULL_ADDRESS = `${RESTAURANT.street}, ${RESTAURANT.city}, ${RESTAURANT.state} ${RESTAURANT.postalCode}`;

export const DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
  FULL_ADDRESS,
)}`;

export interface SignatureDish {
  id: "redfish" | "chicken" | "galette";
  name: string;
  description: string;
  price: number;
}

export const SIGNATURE_DISHES: readonly SignatureDish[] = [
  {
    id: "redfish",
    name: "Wood-Fired Gulf Redfish",
    description: "Brown butter, charred lemon and blistered snap peas from a farm just east of town.",
    price: 34,
  },
  {
    id: "chicken",
    name: "Salt-Crust Half Chicken",
    description: "Brined for a day, roasted over post oak, served with crispy potatoes and salsa verde.",
    price: 28,
  },
  {
    id: "galette",
    name: "Hill Country Peach Galette",
    description: "Fredericksburg peaches, brown sugar crust and a scoop of buttermilk ice cream.",
    price: 12,
  },
];

/**
 * Absolute site URL for metadata, sitemap and Open Graph tags.
 * Set NEXT_PUBLIC_SITE_URL in production; Vercel's production URL is used as a fallback.
 */
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return "http://localhost:3000";
}
