import { ALL_45_TAG_DESIGNS, CORE_FIVE_TEMPLATES } from '../data/designTemplates45';
import { BATCH_01_NEW_TEMPLATES } from '../data/batch01Designs';
import { BATCH_02_NEW_TEMPLATES } from '../data/batch02Designs';
import { BATCH_02_STICKER_TEMPLATES_8 } from '../data/batch02StickerTemplates8';
import {
  applyLibraryShowcaseRegistry,
  LIBRARY_SHOWCASE_REGISTRY,
} from '../data/libraryShowcaseRegistry';
import { MASTER_COLLECTION_TEMPLATES_33 } from '../data/masterCollectionTemplates33';
import { PEBBLE_POP_TEMPLATE } from '../data/pebblePopDesign';
import { PILOT_FIVE_TAG_DESIGNS } from '../data/pilotDesigns5';
import { CANONICAL_PLANS } from '../data/plansCatalog';
import {
  LicenseType,
  ManagedPlanDefinition,
  PlatformSettings,
  TagDesignTemplate,
} from '../types/domain';
import { enrichTemplateDefaults } from '../utils/adminLogic';
import { DatabaseSchema } from './dbSchema';

export function buildDefaultLicenseTypes(nowIso = new Date().toISOString()): Record<string, LicenseType> {
  return {
    'lic-personal-standard': {
      id: 'lic-personal-standard',
      nameAr: 'رخصة الاستخدام الشخصي القياسية',
      nameEn: 'Personal Standard License',
      descriptionAr: 'تخوّل المالك طباعة واستخدام القالب لحماية ممتلكاته الشخصية والعائلية دون إعادة بيع.',
      descriptionEn: 'Grants personal & family tag printing rights for your own belongings without resale.',
      allowPersonalUse: true,
      allowCommercialUse: false,
      durationDays: null,
      maxCopies: 5,
      printRulesAr: 'يُسمح بطباعة حتى ٥ ملصقات/ميداليات للممتلكات الشخصية لنفس الحساب.',
      printRulesEn: 'Up to 5 physical prints or laser engravings for personal property.',
      transferable: false,
      resaleAllowed: false,
      redistributionAllowed: false,
      exceptionsAr: 'لا يُسمح بإعادة بيع التصميم أو توزيعه كمنتج رقمي مستقل.',
      exceptionsEn: 'Resale or standalone redistribution of source artwork is prohibited.',
      isActive: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    'lic-commercial-standard': {
      id: 'lic-commercial-standard',
      nameAr: 'رخصة الأصول التجارية والفرق',
      nameEn: 'Commercial Asset License',
      descriptionAr: 'مخصصة للشركات لإدارة أصول الموظفين والمعدات الميدانية وأسطول الأجهزة.',
      descriptionEn: 'Designed for businesses tagging employee equipment, fleets, and field hardware.',
      allowPersonalUse: true,
      allowCommercialUse: true,
      durationDays: 365,
      maxCopies: 50,
      printRulesAr: 'يُسمح بالطباعة والحفر على حتى ٥٠ أصلًا تجاريًا تابعًا لنفس المنشأة.',
      printRulesEn: 'Permits printing/etching up to 50 corporate asset tags within the organization.',
      transferable: true,
      resaleAllowed: false,
      redistributionAllowed: false,
      exceptionsAr: 'يجوز نقل العهدة بين موظفي نفس المنشأة؛ يُحظر إعادة البيع التجاري للغير.',
      exceptionsEn: 'Transferable across internal staff assets; external commercial resale is disallowed.',
      isActive: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    'lic-enterprise-fleet': {
      id: 'lic-enterprise-fleet',
      nameAr: 'رخصة المؤسسات الموسّعة',
      nameEn: 'Enterprise Fleet Unlimited Print',
      descriptionAr: 'رخصة سنوية مرنة لطباعة وإصدار بطاقات العهد والأصول على نطاق مؤسسي واسع.',
      descriptionEn: 'Flexible enterprise annual license for high-volume serialized company property tags.',
      allowPersonalUse: true,
      allowCommercialUse: true,
      durationDays: 365,
      maxCopies: 250,
      printRulesAr: 'تشمل طباعة حتى ٢٥٠ بطاقة أصول مع إمكانية التمديد عبر الإدارة.',
      printRulesEn: 'Covers up to 250 serialized tags per cycle with custom corporate guidelines.',
      transferable: true,
      resaleAllowed: false,
      redistributionAllowed: false,
      exceptionsAr: 'إعادة التوزيع للعملاء الخارجيين تتطلب اتفاقية موزع معتمد.',
      exceptionsEn: 'External white-label distribution requires an authorized partner agreement.',
      isActive: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  };
}

export function buildDefaultPlans(nowIso = new Date().toISOString()): Record<string, ManagedPlanDefinition> {
  const plans: Record<string, ManagedPlanDefinition> = {};
  for (const p of CANONICAL_PLANS) {
    const scope =
      p.id === 'starter'
        ? 'free_only'
        : p.id === 'plus'
        ? 'plus_and_free'
        : 'all_templates';

    plans[p.id] = {
      id: p.id,
      quotaTier: p.quotaTier,
      nameAr: p.nameAr,
      nameEn: p.nameEn,
      audienceAr: p.audienceAr,
      audienceEn: p.audienceEn,
      monthlySar: p.monthlySar,
      monthlyUsd: p.monthlyUsd,
      quarterlySar: p.monthlySar * 3,
      quarterlyUsd: p.monthlyUsd * 3,
      yearlySar: p.monthlySar * 12,
      yearlyUsd: p.monthlyUsd * 12,
      maxActiveItems: p.maxActiveItems,
      maxContactMethods: p.maxContactMethods,
      maxTemplateCopies: p.id === 'starter' ? 2 : p.id === 'plus' ? 10 : p.id === 'premium' ? 25 : 100,
      includedTemplatesScope: scope,
      allowCustomBranding: p.id !== 'starter',
      allowSvgExport: true,
      featured: p.featured,
      accentHex: p.accentHex,
      isActive: true,
      isCoreFree: p.id === 'starter',
      featuresAr: [...p.featuresAr],
      featuresEn: [...p.featuresEn],
      updatedAt: nowIso,
    };
  }
  return plans;
}

export function buildDefaultTemplates(): Record<string, TagDesignTemplate> {
  const coreIds = new Set(CORE_FIVE_TEMPLATES.map((t) => t.id));
  const map: Record<string, TagDesignTemplate> = {};
  for (const masterTpl of MASTER_COLLECTION_TEMPLATES_33) {
    map[masterTpl.id] = enrichTemplateDefaults(
      applyLibraryShowcaseRegistry({ ...masterTpl, status: 'published' }),
      false
    );
  }
  for (const pilot of PILOT_FIVE_TAG_DESIGNS) {
    map[pilot.id] = enrichTemplateDefaults(
      applyLibraryShowcaseRegistry({ ...pilot, status: 'published' }),
      false
    );
  }
  map[PEBBLE_POP_TEMPLATE.id] = enrichTemplateDefaults(
    applyLibraryShowcaseRegistry({ ...PEBBLE_POP_TEMPLATE, status: 'published' }),
    false
  );
  for (const batchTpl of BATCH_01_NEW_TEMPLATES) {
    map[batchTpl.id] = enrichTemplateDefaults(
      applyLibraryShowcaseRegistry({ ...batchTpl, status: 'published' }),
      false
    );
  }
  for (const batch2Tpl of BATCH_02_NEW_TEMPLATES) {
    map[batch2Tpl.id] = enrichTemplateDefaults(
      applyLibraryShowcaseRegistry({ ...batch2Tpl, status: 'published' }),
      false
    );
  }
  for (const batch2StickerTpl of BATCH_02_STICKER_TEMPLATES_8) {
    map[batch2StickerTpl.id] = enrichTemplateDefaults(
      applyLibraryShowcaseRegistry({ ...batch2StickerTpl, status: 'published' }),
      false
    );
  }
  for (const tpl of ALL_45_TAG_DESIGNS) {
    map[tpl.id] = enrichTemplateDefaults({ ...tpl, status: 'archived' }, coreIds.has(tpl.id));
  }
  return map;
}

export function buildDefaultPlatformSettings(nowIso = new Date().toISOString()): PlatformSettings {
  return {
    platformNameAr: 'FindIt QR',
    platformNameEn: 'FindIt QR',
    slogan: 'Scan. Connect. Return.',
    primaryColorHex: '#2563EB',
    tealColorHex: '#19B5A5',
    navyColorHex: '#17243A',
    coralColorHex: '#FF8A65',
    defaultLanguage: 'ar',
    enableArabic: true,
    enableEnglish: true,
    defaultCurrency: 'SAR',
    marketRegionAr: 'السعودية والخليج والأسواق العالمية',
    marketRegionEn: 'Saudi Arabia, GCC & Global',
    supportEmail: 'support@finditqr.com',
    supportPhone: '+966 55 000 0000',
    reportProblemUrl: '/contact',
    bankTransferInstructionsAr:
      'أرسل حوالة بنكية واضحة وأدخل رقم المرجع أو رابط إيصال التحويل ليتم مراجعته واعتماده من الإدارة.',
    bankTransferInstructionsEn:
      'Submit your bank transfer reference or receipt URL for manual verification and approval by our team.',
    enablePublicRegistration: true,
    enableDesignStore: true,
    enableManualBankTransfer: true,
    enableZipTemplateImport: true,
    enableTemplateFavorites: true,
    enableReportProblemButton: true,
    maintenanceMode: false,
    sessionTtlHours: 168,
    reauthWindowMinutes: 15,
    maxLoginAttemptsPerWindow: 10,
    faqs: [
      {
        id: 'faq-1',
        questionAr: 'هل يحتاج الشخص الذي يجد غرضي إلى تحميل تطبيق لمسح الكود؟',
        questionEn: 'Does a finder need to install an app to scan my QR tag?',
        answerAr:
          'لا أبدًا. يعمل الكود عبر كاميرا أي هاتف ذكي مباشرة في المتصفح باللغتين العربية والإنجليزية دون تسجيل.',
        answerEn:
          'No app is needed. Any smartphone camera opens your bilingual recovery page directly in the mobile browser.',
        isPublished: true,
      },
      {
        id: 'faq-2',
        questionAr: 'ماذا يحدث إذا أوقفت الكود مؤقتًا أو أرشفت الغرض؟',
        questionEn: 'What happens when I pause a QR code or archive an item?',
        answerAr:
          'تتوقف قنوات التواصل عن الظهور في صفحة العثور العامة فورًا ويُحرّر المقعد ضمن حد باقتك مع بقاء الكود محفوظًا لاستخدامه لاحقًا.',
        answerEn:
          'Your contact channels are immediately hidden from public scans and your active plan slot is freed while keeping the serial reserved.',
        isPublished: true,
      },
      {
        id: 'faq-3',
        questionAr: 'ما الحد المسموح في الباقة المجانية Starter / Free؟',
        questionEn: 'What are the limits on the Starter / Free plan?',
        answerAr:
          'تمنحك الباقة المجانية غرضين نشطين كحد أقصى ووسيلتي تواصل مباشرتين لكل غرض مع كود QR دائم ووضع الوسيط المجهول.',
        answerEn:
          'Starter / Free includes up to 2 active items and up to 2 direct contact methods per item plus Anonymous Relay.',
        isPublished: true,
      },
    ],
    updatedAt: nowIso,
  };
}

export function ensureDatabaseAdminDefaults(db: DatabaseSchema): boolean {
  let changed = false;
  const nowIso = new Date().toISOString();

  if (!db.templates || Object.keys(db.templates).length === 0) {
    db.templates = buildDefaultTemplates();
    changed = true;
  } else {
    // Seed the 5 Pilot Showcase templates non-destructively if missing by ID
    for (const pilot of PILOT_FIVE_TAG_DESIGNS) {
      if (!db.templates[pilot.id]) {
        db.templates[pilot.id] = enrichTemplateDefaults(pilot, false);
        changed = true;
      } else if (!db.templates[pilot.id].printSpecs || !db.templates[pilot.id].pilotArtStyle) {
        db.templates[pilot.id] = enrichTemplateDefaults(
          {
            ...pilot,
            ...db.templates[pilot.id],
            isPilotShowcase: true,
            pilotArtStyle: pilot.pilotArtStyle,
            printSpecs: pilot.printSpecs,
          },
          false
        );
        changed = true;
      }
    }
    if (!db.templates[PEBBLE_POP_TEMPLATE.id]) {
      db.templates[PEBBLE_POP_TEMPLATE.id] = enrichTemplateDefaults(PEBBLE_POP_TEMPLATE, false);
      changed = true;
    } else if (
      db.templates[PEBBLE_POP_TEMPLATE.id].dimensionsMm === '68 × 54 mm' ||
      db.templates[PEBBLE_POP_TEMPLATE.id].defaultCalloutText === 'SCAN TO FIND ME'
    ) {
      db.templates[PEBBLE_POP_TEMPLATE.id] = enrichTemplateDefaults(
        {
          ...db.templates[PEBBLE_POP_TEMPLATE.id],
          ...PEBBLE_POP_TEMPLATE,
          salesCount: db.templates[PEBBLE_POP_TEMPLATE.id].salesCount || 0,
          usageCount: db.templates[PEBBLE_POP_TEMPLATE.id].usageCount || 0,
        },
        false
      );
      changed = true;
    }
    // Seed Batch 01 new templates non-destructively if missing by ID (never overwriting Pebble Pop or existing edits)
    for (const batchTpl of BATCH_01_NEW_TEMPLATES) {
      if (!db.templates[batchTpl.id]) {
        db.templates[batchTpl.id] = enrichTemplateDefaults({ ...batchTpl, status: 'published' }, false);
        changed = true;
      }
    }
    // Seed Batch 02 new templates non-destructively if missing by ID
    for (const batch2Tpl of BATCH_02_NEW_TEMPLATES) {
      if (!db.templates[batch2Tpl.id]) {
        db.templates[batch2Tpl.id] = enrichTemplateDefaults({ ...batch2Tpl, status: 'published' }, false);
        changed = true;
      }
    }
    // Seed Batch 02 approved 8 sticker templates non-destructively if missing by ID
    for (const batch2StickerTpl of BATCH_02_STICKER_TEMPLATES_8) {
      if (!db.templates[batch2StickerTpl.id]) {
        db.templates[batch2StickerTpl.id] = enrichTemplateDefaults(
          { ...batch2StickerTpl, status: 'published' },
          false
        );
        changed = true;
      } else if (
        db.templates[batch2StickerTpl.id].originalDesignUrl !== batch2StickerTpl.originalDesignUrl ||
        db.templates[batch2StickerTpl.id].printFileUrl !== batch2StickerTpl.printFileUrl ||
        db.templates[batch2StickerTpl.id].defaultCalloutText !== batch2StickerTpl.defaultCalloutText
      ) {
        db.templates[batch2StickerTpl.id] = enrichTemplateDefaults(
          {
            ...db.templates[batch2StickerTpl.id],
            ...batch2StickerTpl,
            status: 'published',
          },
          false
        );
        changed = true;
      }
    }
    // Seed Master Collection 33 templates non-destructively if missing by ID
    for (const masterTpl of MASTER_COLLECTION_TEMPLATES_33) {
      if (!db.templates[masterTpl.id]) {
        db.templates[masterTpl.id] = enrichTemplateDefaults(
          { ...masterTpl, status: 'published' },
          false
        );
        changed = true;
      } else if (
        db.templates[masterTpl.id].originalDesignUrl !== masterTpl.originalDesignUrl ||
        db.templates[masterTpl.id].printFileUrl !== masterTpl.printFileUrl
      ) {
        db.templates[masterTpl.id] = enrichTemplateDefaults(
          {
            ...db.templates[masterTpl.id],
            ...masterTpl,
            status: 'published',
          },
          false
        );
        changed = true;
      }
    }
    // Non-destructively archive all 45 legacy catalog templates so active library stays at the curated 58,
    // while keeping their database records intact so all existing user items/QR/purchases remain functional.
    const coreIds = new Set(CORE_FIVE_TEMPLATES.map((t) => t.id));
    for (const legacyTpl of ALL_45_TAG_DESIGNS) {
      const existing = db.templates[legacyTpl.id];
      if (!existing) {
        db.templates[legacyTpl.id] = enrichTemplateDefaults(
          { ...legacyTpl, status: 'archived' },
          coreIds.has(legacyTpl.id)
        );
        changed = true;
      } else if (existing.status !== 'archived') {
        db.templates[legacyTpl.id] = enrichTemplateDefaults(
          {
            ...existing,
            status: 'archived',
          },
          coreIds.has(legacyTpl.id)
        );
        changed = true;
      }
    }
    // Ensure all 58 active templates receive the 4-shot showcase gallery & upgraded taxonomy non-destructively
    // (preserving custom admin titles, descriptions, usage counts, and sales counts).
    for (const [id, tpl] of Object.entries(db.templates)) {
      const hasRegistry = Boolean(LIBRARY_SHOWCASE_REGISTRY[id]);
      let nextTpl = tpl;
      let needsUpdate = !tpl.status || !tpl.customizationMode || !tpl.purchaseMode || !tpl.domainCategory;
      if (hasRegistry && !tpl.showcaseGallery) {
        nextTpl = applyLibraryShowcaseRegistry(tpl);
        needsUpdate = true;
      }
      if (needsUpdate) {
        db.templates[id] = enrichTemplateDefaults(nextTpl, coreIds.has(id));
        changed = true;
      }
    }
  }

  if (!db.licenseTypes || Object.keys(db.licenseTypes).length === 0) {
    db.licenseTypes = buildDefaultLicenseTypes(nowIso);
    changed = true;
  }

  if (!db.issuedLicenses) {
    db.issuedLicenses = {};
    changed = true;
  }

  if (!db.plans || Object.keys(db.plans).length === 0) {
    db.plans = buildDefaultPlans(nowIso);
    changed = true;
  }

  if (!db.subscriptions) {
    db.subscriptions = {};
    changed = true;
  }

  if (!db.orders) {
    db.orders = {};
    changed = true;
  }

  if (!db.favorites) {
    db.favorites = {};
    changed = true;
  }

  if (!db.announcements) {
    db.announcements = {};
    changed = true;
  }

  if (!db.coupons) {
    db.coupons = {};
    changed = true;
  }

  if (!db.campaigns) {
    db.campaigns = {};
    changed = true;
  }

  if (!db.supportTickets) {
    db.supportTickets = {};
    changed = true;
  }

  if (!db.platformSettings) {
    db.platformSettings = buildDefaultPlatformSettings(nowIso);
    changed = true;
  }

  if (!db.auditLogs) {
    db.auditLogs = {};
    changed = true;
  }

  if (!Array.isArray(db.loginLogs)) {
    db.loginLogs = [];
    changed = true;
  }

  if (!Array.isArray(db.securityEvents)) {
    db.securityEvents = [];
    changed = true;
  }

  return changed;
}
