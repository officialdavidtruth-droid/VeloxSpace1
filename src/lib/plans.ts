export type PlanId = "starter" | "pro" | "agency";
export type BillingCycle = "monthly" | "annual";

export interface PlanConfig {
  id: PlanId;
  name: string;
  monthlyPrice: number;
  annualMonthlyPrice: number;   // displayed monthly equivalent when billed annually
  annualTotal: number;          // total billed per year
  description: string;
  maxPlatforms: number;
  maxTeamMembers: number;
  maxWorkspaces: number;
  adsAnalytics: boolean;
  aiInsightsPerMonth: number;   // -1 = unlimited
  composerScheduling: boolean;
  approvalWorkflow: boolean;
  contentLibrary: boolean;
  pdfReports: boolean;
  clientViewer: boolean;
  multiWorkspace: boolean;
  pms: boolean;
  leadScraper: boolean;
  leadCreditsMonthly: number;
  contentCalendar: boolean;
  aiCaptions: boolean;
  analyticsHistoryDays: number;
  clientPortal: boolean;
  referralProgram: boolean;
  color: string;
  badge?: string;
}

export const PLANS: Record<PlanId, PlanConfig> = {
  starter: {
    id: "starter", name: "Starter",
    monthlyPrice: 0, annualMonthlyPrice: 0, annualTotal: 0,
    description: "For individuals just getting started",
    maxPlatforms: 2, maxTeamMembers: 0, maxWorkspaces: 1,
    adsAnalytics: false, aiInsightsPerMonth: 5,
    composerScheduling: false, approvalWorkflow: false,
    contentLibrary: false, pdfReports: false,
    clientViewer: false, multiWorkspace: false,
    pms: false, leadScraper: true, leadCreditsMonthly: 10,
    contentCalendar: false, aiCaptions: false,
    analyticsHistoryDays: 7, clientPortal: false,
    referralProgram: true,
    color: "var(--muted)",
  },
  pro: {
    id: "pro", name: "Pro",
    monthlyPrice: 29, annualMonthlyPrice: 26.10, annualTotal: 313,
    description: "For professionals and small teams",
    maxPlatforms: -1, maxTeamMembers: 2, maxWorkspaces: 1,
    adsAnalytics: true, aiInsightsPerMonth: -1,
    composerScheduling: true, approvalWorkflow: true,
    contentLibrary: true, pdfReports: true,
    clientViewer: false, multiWorkspace: false,
    pms: false, leadScraper: true, leadCreditsMonthly: 50,
    contentCalendar: true, aiCaptions: true,
    analyticsHistoryDays: 90, clientPortal: false,
    referralProgram: true,
    color: "var(--primary)", badge: "Most popular",
  },
  agency: {
    id: "agency", name: "Agency",
    monthlyPrice: 79, annualMonthlyPrice: 71.10, annualTotal: 853,
    description: "For agencies managing multiple brands",
    maxPlatforms: -1, maxTeamMembers: 6, maxWorkspaces: 10,
    adsAnalytics: true, aiInsightsPerMonth: -1,
    composerScheduling: true, approvalWorkflow: true,
    contentLibrary: true, pdfReports: true,
    clientViewer: true, multiWorkspace: true,
    pms: true, leadScraper: true, leadCreditsMonthly: 200,
    contentCalendar: true, aiCaptions: true,
    analyticsHistoryDays: 365, clientPortal: true,
    referralProgram: true,
    color: "#9333ea", badge: "For agencies",
  },
};

export const PLAN_FEATURES: { key: keyof PlanConfig; label: string }[] = [
  { key: "maxPlatforms",         label: "Connected platforms"     },
  { key: "analyticsHistoryDays", label: "Analytics history"       },
  { key: "adsAnalytics",         label: "Ads Analytics"           },
  { key: "aiInsightsPerMonth",   label: "AI insights / month"     },
  { key: "aiCaptions",           label: "AI caption generator"    },
  { key: "contentCalendar",      label: "Content calendar"        },
  { key: "composerScheduling",   label: "Scheduled publishing"    },
  { key: "approvalWorkflow",     label: "Approval workflow"       },
  { key: "pdfReports",           label: "PDF exports"             },
  { key: "leadCreditsMonthly",   label: "Lead Finder credits/mo"  },
  { key: "maxTeamMembers",       label: "Extra team seats"        },
  { key: "clientPortal",         label: "Client portal"           },
  { key: "multiWorkspace",       label: "Multiple workspaces"     },
  { key: "pms",                  label: "Business Management"     },
];

export function formatLimit(key: keyof PlanConfig, value: any): string {
  if (typeof value === "boolean")  return value ? "✓" : "—";
  if (value === -1)                return "Unlimited";
  if (value === 0 && key === "maxTeamMembers") return "Just you";
  if (key === "analyticsHistoryDays") return `${value} days`;
  return String(value);
}

export function getPrice(plan: PlanConfig, cycle: BillingCycle): string {
  if (plan.monthlyPrice === 0) return "Free";
  const price = cycle === "annual" ? plan.annualMonthlyPrice : plan.monthlyPrice;
  return `$${price.toFixed(2)}`;
}
