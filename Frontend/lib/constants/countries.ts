export interface CountryCode {
  code: string;
  flag: string;
  country: string;
  iso: string;
}

export const COUNTRY_CODES: CountryCode[] = [
  { iso: "KE", country: "Kenya", code: "+254", flag: "🇰🇪" },
  { iso: "UG", country: "Uganda", code: "+256", flag: "🇺🇬" },
  { iso: "TZ", country: "Tanzania", code: "+255", flag: "🇹🇿" },
  { iso: "RW", country: "Rwanda", code: "+250", flag: "🇷🇼" },
  { iso: "GH", country: "Ghana", code: "+233", flag: "🇬🇭" },
  { iso: "ZM", country: "Zambia", code: "+260", flag: "🇿🇲" },
  { iso: "SN", country: "Senegal", code: "+221", flag: "🇸🇳" },
];