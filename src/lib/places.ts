export const KINDS = [
  { key: "attraction", label: "Attractions", single: "Attraction", color: "#BC0000" },
  { key: "restaurant", label: "Restaurants", single: "Restaurant", color: "#E6B800" },
  { key: "park", label: "Parks", single: "Park", color: "#006600" },
  { key: "mall", label: "Malls", single: "Mall", color: "#121212" },
  { key: "hotel", label: "Hotels", single: "Hotel", color: "#5F6368" },
  { key: "hospital", label: "Hospitals", single: "Hospital", color: "#D32F2F" },
  { key: "school", label: "Schools", single: "School", color: "#1A5FB4" },
  { key: "other", label: "Other", single: "Place", color: "#5F6368" },
] as const;

export const kindInfo = (k: string) => KINDS.find((x) => x.key === k) ?? KINDS[KINDS.length - 1];
export const countryName = (c: string) => (c === "KE" ? "Kenya" : "Zimbabwe");
export const directionsUrl = (lat: number, lng: number) => `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
