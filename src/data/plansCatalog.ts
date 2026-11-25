import { PLAN_QUOTA_SPECS, UserPlanTier } from '../types/domain';

export type BillingDurationId = '1m' | '3m' | '12m';

export interface BillingDurationOption {
  id: BillingDurationId;
  months: number;
  labelAr: string;
  labelEn: string;
  shortLabelAr: string;
  shortLabelEn: string;
}

export const BILLING_DURATION_OPTIONS: BillingDurationOption[] = [
  {
    id: '1m',
    months: 1,
    labelAr: 'شهر واحد',
    labelEn: '1 Month',
    shortLabelAr: 'شهري',
    shortLabelEn: '1 Mo',
  },
  {
    id: '3m',
    months: 3,
    labelAr: '٣ أشهر',
    labelEn: '3 Months',
    shortLabelAr: '٣ أشهر',
    shortLabelEn: '3 Mos',
  },
  {
    id: '12m',
    months: 12,
    labelAr: '١٢ شهرًا',
    labelEn: '12 Months',
    shortLabelAr: '١٢ شهرًا',
    shortLabelEn: '12 Mos',
  },
];

export interface CanonicalPlanDefinition {
  id: 'starter' | 'plus' | 'premium' | 'pro';
  quotaTier: UserPlanTier;
  nameAr: string;
  nameEn: string;
  audienceAr: string;
  audienceEn: string;
  monthlySar: number;
  monthlyUsd: number;
  maxActiveItems: number;
  maxContactMethods: number;
  featured: boolean;
  accentHex: string;
  featuresAr: string[];
  featuresEn: string[];
}

export const CANONICAL_PLANS: CanonicalPlanDefinition[] = [
  {
    id: 'starter',
    quotaTier: 'Free',
    nameAr: 'Starter / Free',
    nameEn: 'Starter / Free',
    audienceAr: 'للأفراد والتجربة الأساسية',
    audienceEn: 'For individuals getting started',
    monthlySar: 0,
    monthlyUsd: 0,
    maxActiveItems: PLAN_QUOTA_SPECS.Free.maxActiveItems, // 2
    maxContactMethods: PLAN_QUOTA_SPECS.Free.maxContactMethods, // 2
    featured: false,
    accentHex: '#19B5A5',
    featuresAr: [
      'تسجيل غرضين نشطين كحد أقصى (الأرشيف خارج الحد)',
      'حتى وسيلتي تواصل مباشرتين (2) لكل غرض',
      'كود QR قياسي فريد وثابت مع صفحة استعادة ثنائية اللغة',
      'التحكم الفوري بحالة الغرض وإشعارات العثور',
    ],
    featuresEn: [
      'Up to 2 active items (archived items do not count)',
      'Up to 2 direct contact methods per item',
      'Unique ISO QR code with bilingual finder recovery page',
      'Instant Lost/Active status toggles & found alerts',
    ],
  },
  {
    id: 'plus',
    quotaTier: 'Plus',
    nameAr: 'Plus',
    nameEn: 'Plus',
    audienceAr: 'للعائلات وكثيري التنقل',
    audienceEn: 'For families & daily commuters',
    monthlySar: 19,
    monthlyUsd: 5,
    maxActiveItems: PLAN_QUOTA_SPECS.Plus.maxActiveItems, // 10
    maxContactMethods: PLAN_QUOTA_SPECS.Plus.maxContactMethods, // 3
    featured: true,
    accentHex: '#2563EB',
    featuresAr: [
      'حتى ١٠ أغراض نشطة (شخصية وعائلية)',
      'حتى ٣ وسائل تواصل لكل غرض + وضع الوسيط المجهول',
      'إتاحة قوالب متجر التصاميم والتخصيص اللوني للكود',
      'إعلان مكافأة تقديرية وسجل عمليات تفصيلي',
    ],
    featuresEn: [
      'Up to 10 active personal and family items',
      'Up to 3 contact channels + Anonymous Relay mode',
      'Access to Design Store templates & custom colorways',
      'Appreciation reward banner & detailed audit trail',
    ],
  },
  {
    id: 'premium',
    quotaTier: 'Premium',
    nameAr: 'Premium',
    nameEn: 'Premium',
    audienceAr: 'للمسافرين والمصورين والمحترفين',
    audienceEn: 'For travelers, creators & pros',
    monthlySar: 39,
    monthlyUsd: 10,
    maxActiveItems: PLAN_QUOTA_SPECS.Premium.maxActiveItems, // 25
    maxContactMethods: PLAN_QUOTA_SPECS.Premium.maxContactMethods, // 5
    featured: false,
    accentHex: '#19B5A5',
    featuresAr: [
      'حتى ٢٥ غرضًا نشطًا لمعدات السفر والتصوير',
      'حتى ٥ وسائل تواصل لكل غرض مع تنبيهات أولوية',
      'وصول شامل لجميع القوالب العامة والمتخصصة (45 قالبًا)',
      'أرشفة مرنة وتصدير ملصقات QR بدقة متجهية SVG',
    ],
    featuresEn: [
      'Up to 25 active items for travel & creator gear',
      'Up to 5 contact methods per item with priority alerts',
      'Full access to all 45 general & specialized templates',
      'Flexible archiving & scalable SVG tag exports',
    ],
  },
  {
    id: 'pro',
    quotaTier: 'Pro',
    nameAr: 'Pro',
    nameEn: 'Pro',
    audienceAr: 'للشركات وإدارة العهد والأصول',
    audienceEn: 'For teams, fleets & commercial IT assets',
    monthlySar: 99,
    monthlyUsd: 29,
    maxActiveItems: PLAN_QUOTA_SPECS.Pro.maxActiveItems, // 100
    maxContactMethods: PLAN_QUOTA_SPECS.Pro.maxContactMethods, // 7
    featured: false,
    accentHex: '#FFD166',
    featuresAr: [
      'حتى ١٠٠ غرض وأصل نشط بأرقام تسلسلية منظمة',
      'حتى ٧ وسائل تواصل وقنوات توجيه لمكتب الدعم أو المرافق',
      'سجل عمليات كامل وتنبيهات فورية لكل عهدة موظف',
      'قوالب اللوحات الصناعية والمعدات الميدانية',
    ],
    featuresEn: [
      'Up to 100 active serialized assets & hardware items',
      'Up to 7 contact & IT/facilities desk routing channels',
      'Comprehensive scan timeline & asset alerts',
      'Industrial & field equipment plate templates',
    ],
  },
];

export function formatPlanDurationPrice(
  plan: CanonicalPlanDefinition,
  duration: BillingDurationId,
  lang: 'ar' | 'en'
): {
  primaryPrice: string;
  periodNote: string;
  totalSar: number;
  totalUsd: number;
} {
  const opt =
    BILLING_DURATION_OPTIONS.find((d) => d.id === duration) ??
    BILLING_DURATION_OPTIONS[0];

  if (plan.monthlySar === 0) {
    return {
      primaryPrice: lang === 'ar' ? '٠ ر.س / مجانًا' : '$0 / Free',
      periodNote:
        lang === 'ar' ? 'خطة أساسية مجانية' : 'Free starter tier',
      totalSar: 0,
      totalUsd: 0,
    };
  }

  const totalSar = plan.monthlySar * opt.months;
  const totalUsd = plan.monthlyUsd * opt.months;

  if (opt.months === 1) {
    return {
      primaryPrice: lang === 'ar' ? `${totalSar} ر.س` : `$${totalUsd}`,
      periodNote: lang === 'ar' ? 'لمدة شهر واحد' : 'per 1 month',
      totalSar,
      totalUsd,
    };
  }

  return {
    primaryPrice: lang === 'ar' ? `${totalSar} ر.س` : `$${totalUsd}`,
    periodNote:
      lang === 'ar'
        ? `إجمالي لمدة ${opt.labelAr} (${plan.monthlySar} ر.س / شهر)`
        : `total for ${opt.labelEn} ($${plan.monthlyUsd}/mo)`,
    totalSar,
    totalUsd,
  };
}
