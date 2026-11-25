import {
  RegisteredItem,
  TagDesignTemplate,
  UserPlanTier,
} from '../types/domain';
import { canAccessTemplateByPlanOrPurchase } from './adminLogic';
import { evaluateIndividualQrAvailability } from './qrModeRules';

export interface PrintStudioSettings {
  customCalloutText: string;
  customSubLabel: string;
  backgroundTintHex: string;
  showFrameLayer: boolean;
  showCalloutLayer: boolean;
  showSerialLayer: boolean;
  qrZoneLocked: boolean;
  dpi: 150 | 300 | 600;
  bleedMm: number;
  widthMm: number;
  heightMm: number;
  paperFormat: 'a4' | 'letter' | 'single';
}

export interface PrintPreflightIssue {
  id: string;
  severity: 'error' | 'warning' | 'pass';
  titleAr: string;
  titleEn: string;
  detailAr: string;
  detailEn: string;
}

export interface PrintPreflightReport {
  canExportProduction: boolean;
  hasOwnershipAccess: boolean;
  errorCount: number;
  warningCount: number;
  passCount: number;
  issues: PrintPreflightIssue[];
}

export function evaluatePrintReadiness(params: {
  item: RegisteredItem | null;
  template: TagDesignTemplate | null;
  settings: PrintStudioSettings;
  userPlan: UserPlanTier;
  purchasedTemplateIds: Set<string>;
}): PrintPreflightReport {
  const issues: PrintPreflightIssue[] = [];
  const { item, template, settings, userPlan, purchasedTemplateIds } = params;

  if (!item) {
    issues.push({
      id: 'missing-item',
      severity: 'error',
      titleAr: 'لم يتم اختيار غرض لربط رمز QR',
      titleEn: 'No Item Selected for QR Binding',
      detailAr: 'اختر غرضًا نشطًا من حسابك لتضمين رمز QR الحقيقي الخاص به في التصميم.',
      detailEn: 'Select an active item from your account to bind its real ISO QR code.',
    });
  } else {
    const qrAvailability = evaluateIndividualQrAvailability(item);
    if (!qrAvailability.active) {
      if (item.qrMode === 'shared') {
        issues.push({
          id: 'item-shared-mode',
          severity: 'error',
          titleAr: 'الغرض مرتبط بمجموعة QR مشتركة',
          titleEn: 'Item Bound to Shared QR Group',
          detailAr:
            'الرمز الفردي لهذا الغرض موقوف تلقائيًا لمنع التعارض. اطبع رمز المجموعة المشتركة من صفحة المجموعات أو استعد الوضع الفردي أولًا.',
          detailEn:
            'This item’s individual QR is paused while linked to a Shared QR Group. Print the Shared Group QR or restore Individual QR mode first.',
        });
      } else if (item.qrMode === 'unassigned') {
        issues.push({
          id: 'item-unassigned-mode',
          severity: 'error',
          titleAr: 'الغرض غير معيّن برمز QR نشط',
          titleEn: 'Item Has No Active QR Mode',
          detailAr: 'أعد تفعيل رمز QR الفردي لهذا الغرض قبل طباعة الملصق.',
          detailEn: 'Restore the individual QR code for this item before printing.',
        });
      } else {
        issues.push({
          id: 'item-inactive-qr',
          severity: 'error',
          titleAr: 'صفحة الاسترداد أو الغرض غير نشط',
          titleEn: 'Item or Public Recovery Page Inactive',
          detailAr: 'لا يمكن تصدير ملف طباعة لغرض مؤرشف أو معطّل العرض العام.',
          detailEn: 'Production export is blocked while the item is archived or public recovery is disabled.',
        });
      }
    } else {
      issues.push({
        id: 'qr-binding-ok',
        severity: 'pass',
        titleAr: 'ربط رمز QR الحقيقي سليم',
        titleEn: 'Real Item QR Binding Verified',
        detailAr: `الرمز (${item.codeSerial}) نشط ومربوط بصفحة الاسترداد بدون تضمين بيانات شخصية.`,
        detailEn: `Code (${item.codeSerial}) is active and encodes only the PII-free recovery URL.`,
      });
    }
  }

  let hasOwnershipAccess = false;
  if (!template) {
    issues.push({
      id: 'missing-template',
      severity: 'error',
      titleAr: 'لم يتم اختيار قالب تصميم',
      titleEn: 'No Template Selected',
      detailAr: 'اختر قالبًا من مكتبة الـ 58 قالبًا لإعداد ملف الطباعة.',
      detailEn: 'Choose a template from the 58-template library to prepare production output.',
    });
  } else {
    hasOwnershipAccess = canAccessTemplateByPlanOrPurchase({
      template,
      userPlan,
      purchasedTemplateIds,
    });
    if (!hasOwnershipAccess) {
      issues.push({
        id: 'ownership-required',
        severity: 'error',
        titleAr: 'القالب يتطلب ملكية أو ترقية باقة قبل التصدير',
        titleEn: 'Template Ownership Required for Production Export',
        detailAr: 'يمكنك معاينة القالب وتجربة التخصيص بحرية، لكن تصدير ملفات الإنتاج يتطلب شراء القالب أو الترقية.',
        detailEn: 'You can preview and customize freely, but production export requires owning this template or upgrading your plan.',
      });
    } else {
      issues.push({
        id: 'ownership-ok',
        severity: 'pass',
        titleAr: 'صلاحية ملكية القالب متحققة',
        titleEn: 'Template Ownership & License Verified',
        detailAr: 'يحق لحسابك تصدير ملفات الإنتاج والطباعة لهذا القالب.',
        detailEn: 'Your account is authorized to export production print files for this template.',
      });
    }
  }

  if (!settings.qrZoneLocked) {
    issues.push({
      id: 'qr-zone-unlocked',
      severity: 'error',
      titleAr: 'منطقة أمان رمز QR غير مقفلة',
      titleEn: 'QR Quiet-Zone Lock Disabled',
      detailAr: 'يجب إبقاء منطقة أمان رمز QR مقفلة لضمان المسح السليم بعد الطباعة.',
      detailEn: 'Keep QR quiet-zone lock enabled to guarantee reliable camera scanning after printing.',
    });
  } else {
    issues.push({
      id: 'qr-zone-locked',
      severity: 'pass',
      titleAr: 'مساحة QR والهامش الهادئ مقفلان بأمان',
      titleEn: 'QR Quiet-Zone Locked Safely',
      detailAr: 'مساحة المسح محمية من التداخل مع النصوص أو الخلفيات.',
      detailEn: 'Scan zone is protected from text or layer overlaps.',
    });
  }

  if (settings.dpi < 300) {
    issues.push({
      id: 'dpi-too-low',
      severity: 'error',
      titleAr: `دقة الطباعة (${settings.dpi} DPI) أقل من الحد الآمن`,
      titleEn: `Print Resolution (${settings.dpi} DPI) Below Print Minimum`,
      detailAr: 'ارفع الدقة إلى 300 DPI أو 600 DPI لضمان وضوح وحدات رمز QR عند الطباعة.',
      detailEn: 'Increase resolution to 300 DPI or 600 DPI to keep QR modules crisp on physical media.',
    });
  } else {
    issues.push({
      id: 'dpi-ok',
      severity: 'pass',
      titleAr: `دقة الطباعة مثالية (${settings.dpi} DPI)`,
      titleEn: `Print Resolution Verified (${settings.dpi} DPI)`,
      detailAr: 'مناسبة للطباعة الاحترافية والملصقات المقاومة للماء.',
      detailEn: 'Suitable for sharp commercial and waterproof vinyl sticker printing.',
    });
  }

  if (settings.widthMm < 25 || settings.heightMm < 25) {
    issues.push({
      id: 'dimensions-too-small',
      severity: 'error',
      titleAr: 'المقاس المختار أصغر من الحد الأدنى لقراءة QR (25mm)',
      titleEn: 'Sticker Size Below Minimum Scannable Threshold (25mm)',
      detailAr: 'ارفع العرض والارتفاع إلى 25mm على الأقل لضمان قراءة الكاميرا بسهولة.',
      detailEn: 'Increase width and height to at least 25mm for reliable phone camera scanning.',
    });
  } else {
    issues.push({
      id: 'dimensions-ok',
      severity: 'pass',
      titleAr: `المقاس جاهز للطباعة (${settings.widthMm}×${settings.heightMm} mm)`,
      titleEn: `Trim Size Ready (${settings.widthMm}×${settings.heightMm} mm)`,
      detailAr: `هوامش القص مضبوطة على ${settings.bleedMm}mm.`,
      detailEn: `Bleed margin configured at ${settings.bleedMm}mm.`,
    });
  }

  if (settings.bleedMm < 2) {
    issues.push({
      id: 'bleed-low',
      severity: 'warning',
      titleAr: 'هامش القص أقل من 2mm',
      titleEn: 'Bleed Margin Under 2mm',
      detailAr: 'يُفضل ضبط هامش القص على 2mm–3mm لتفادي حواف بيضاء عند القص.',
      detailEn: 'Recommended bleed is 2mm–3mm to avoid white edges during die-cutting.',
    });
  }

  if (settings.customCalloutText.trim().length > 42) {
    issues.push({
      id: 'callout-too-long',
      severity: 'error',
      titleAr: 'نص العبارة المخصصة طويل جدًا للملصق',
      titleEn: 'Custom Callout Text Exceeds Safe Label Length',
      detailAr: 'اختصر العبارة إلى 42 حرفًا أو أقل لمنع التفاف النص أو تداخله.',
      detailEn: 'Keep custom callout text to 42 characters or fewer to prevent text clipping.',
    });
  }

  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;
  const passCount = issues.filter((i) => i.severity === 'pass').length;

  return {
    canExportProduction: errorCount === 0,
    hasOwnershipAccess,
    errorCount,
    warningCount,
    passCount,
    issues,
  };
}
