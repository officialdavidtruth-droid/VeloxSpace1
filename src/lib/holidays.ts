export interface Holiday {
  month: number;   // 1-12
  day: number;
  name: string;
  countries: string[];  // 'all' | 'NG' | 'GH' | 'KE' | 'ZA' | 'US' | 'UK'
  type: "public" | "religious" | "social" | "ecommerce";
  emoji: string;
}

export const COUNTRY_OPTIONS = [
  { code: "NG", name: "Nigeria", flag: "🇳🇬" },
  { code: "GH", name: "Ghana",   flag: "🇬🇭" },
  { code: "KE", name: "Kenya",   flag: "🇰🇪" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦" },
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "UK", name: "United Kingdom", flag: "🇬🇧" },
];

export const HOLIDAYS: Holiday[] = [
  // ── January ───────────────────────────────────────────────────────────────
  { month:1, day:1,  name:"New Year's Day",         countries:["all"],        type:"public",    emoji:"🎉" },
  { month:1, day:7,  name:"Constitution Day",        countries:["GH"],         type:"public",    emoji:"🇬🇭" },
  { month:1, day:15, name:"Martin Luther King Jr Day",countries:["US"],        type:"public",    emoji:"✊" },
  { month:1, day:13, name:"National Remembrance Day",countries:["NG"],         type:"public",    emoji:"🕯️" },

  // ── February ──────────────────────────────────────────────────────────────
  { month:2, day:1,  name:"February Holiday",        countries:["KE"],         type:"public",    emoji:"🇰🇪" },
  { month:2, day:14, name:"Valentine's Day",          countries:["all"],        type:"social",    emoji:"❤️" },

  // ── March ─────────────────────────────────────────────────────────────────
  { month:3, day:6,  name:"Independence Day",         countries:["GH"],         type:"public",    emoji:"🇬🇭" },
  { month:3, day:8,  name:"International Women's Day",countries:["all"],        type:"social",    emoji:"👩" },
  { month:3, day:17, name:"St Patrick's Day",         countries:["UK","US"],    type:"social",    emoji:"☘️" },
  { month:3, day:21, name:"Human Rights Day",         countries:["ZA"],         type:"public",    emoji:"✊" },
  { month:3, day:25, name:"Good Friday",              countries:["NG","GH","KE","ZA","UK"], type:"religious", emoji:"✝️" },
  { month:3, day:28, name:"Easter Monday",            countries:["NG","GH","KE","ZA","UK"], type:"religious", emoji:"🐣" },

  // ── April ─────────────────────────────────────────────────────────────────
  { month:4, day:1,  name:"April Fools' Day",         countries:["all"],        type:"social",    emoji:"😂" },
  { month:4, day:22, name:"Earth Day",                countries:["all"],        type:"social",    emoji:"🌍" },
  { month:4, day:27, name:"Freedom Day",              countries:["ZA"],         type:"public",    emoji:"🇿🇦" },

  // ── May ───────────────────────────────────────────────────────────────────
  { month:5, day:1,  name:"Workers' Day",             countries:["NG","GH","KE","ZA","UK"], type:"public", emoji:"👷" },
  { month:5, day:11, name:"Mother's Day",             countries:["all"],        type:"social",    emoji:"🌷" },
  { month:5, day:25, name:"Africa Day",               countries:["NG","GH","KE","ZA"],      type:"social", emoji:"🌍" },

  // ── June ──────────────────────────────────────────────────────────────────
  { month:6, day:1,  name:"Madaraka Day",             countries:["KE"],         type:"public",    emoji:"🇰🇪" },
  { month:6, day:12, name:"Democracy Day",            countries:["NG"],         type:"public",    emoji:"🇳🇬" },
  { month:6, day:15, name:"Father's Day",             countries:["all"],        type:"social",    emoji:"👔" },
  { month:6, day:16, name:"Youth Day",                countries:["ZA"],         type:"public",    emoji:"🇿🇦" },
  { month:6, day:19, name:"World Social Media Day",   countries:["all"],        type:"social",    emoji:"📱" },
  { month:6, day:19, name:"Juneteenth",               countries:["US"],         type:"public",    emoji:"✊" },
  { month:6, day:30, name:"Social Media Day",         countries:["all"],        type:"social",    emoji:"📲" },

  // ── July ──────────────────────────────────────────────────────────────────
  { month:7, day:1,  name:"Republic Day",             countries:["GH"],         type:"public",    emoji:"🇬🇭" },
  { month:7, day:4,  name:"Independence Day",         countries:["US"],         type:"public",    emoji:"🇺🇸" },

  // ── August ────────────────────────────────────────────────────────────────
  { month:8, day:9,  name:"National Women's Day",     countries:["ZA"],         type:"public",    emoji:"🇿🇦" },
  { month:8, day:26, name:"National Heroes Day",      countries:["GH"],         type:"public",    emoji:"🇬🇭" },

  // ── September ─────────────────────────────────────────────────────────────
  { month:9, day:24, name:"Heritage Day",             countries:["ZA"],         type:"public",    emoji:"🇿🇦" },

  // ── October ───────────────────────────────────────────────────────────────
  { month:10, day:1,  name:"Independence Day",        countries:["NG"],         type:"public",    emoji:"🇳🇬" },
  { month:10, day:4,  name:"World Animal Day",        countries:["all"],        type:"social",    emoji:"🐾" },
  { month:10, day:10, name:"Utamaduni Day",           countries:["KE"],         type:"public",    emoji:"🇰🇪" },
  { month:10, day:20, name:"Mashujaa Day",            countries:["KE"],         type:"public",    emoji:"🇰🇪" },
  { month:10, day:31, name:"Halloween",               countries:["US","UK"],    type:"social",    emoji:"🎃" },

  // ── November ──────────────────────────────────────────────────────────────
  { month:11, day:11, name:"Singles' Day (11.11)",    countries:["all"],        type:"ecommerce", emoji:"🛍️" },
  { month:11, day:28, name:"Black Friday",            countries:["all"],        type:"ecommerce", emoji:"🏷️" },
  { month:11, day:30, name:"Cyber Monday + 2",        countries:["all"],        type:"ecommerce", emoji:"💻" },

  // ── December ──────────────────────────────────────────────────────────────
  { month:12, day:3,  name:"Int'l Day of Persons w/ Disabilities", countries:["all"], type:"social", emoji:"♿" },
  { month:12, day:12, name:"Jamhuri Day",             countries:["KE"],         type:"public",    emoji:"🇰🇪" },
  { month:12, day:16, name:"Day of Reconciliation",   countries:["ZA"],         type:"public",    emoji:"🇿🇦" },
  { month:12, day:25, name:"Christmas Day",           countries:["all"],        type:"religious", emoji:"🎄" },
  { month:12, day:26, name:"Boxing Day",              countries:["NG","GH","KE","ZA","UK"], type:"public", emoji:"🎁" },
  { month:12, day:31, name:"New Year's Eve",          countries:["all"],        type:"social",    emoji:"🥂" },
];

export function getHolidaysForMonth(month: number, year: number, country: string): Holiday[] {
  return HOLIDAYS.filter(h =>
    h.month === month &&
    (h.countries.includes("all") || h.countries.includes(country))
  );
}

export function getHolidaysForDay(day: number, month: number, year: number, country: string): Holiday[] {
  return HOLIDAYS.filter(h =>
    h.month === month && h.day === day &&
    (h.countries.includes("all") || h.countries.includes(country))
  );
}
