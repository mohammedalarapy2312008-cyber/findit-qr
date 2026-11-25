import React, { useEffect, useMemo, useState } from 'react';
import {
  Archive,
  CheckCircle2,
  Edit3,
  Eye,
  FileArchive,
  FolderPlus,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { TagProductPreview } from '../../components/brand/TagProductPreview';
import { useApp } from '../../context/AppContext';
import { adminApi, ApiRequestError } from '../../services/adminApi';
import {
  IssuedLicense,
  LicenseType,
  TagDesignTemplate,
  TagShapeSilhouette,
  TemplateCustomizationMode,
  TemplateDomainCategory,
  TemplatePurchaseMode,
  TemplateStatus,
} from '../../types/domain';

export const AdminTemplatesView: React.FC<{
  onRequireReauth: (retryAction?: () => Promise<void>) => void;
}> = ({ onRequireReauth }) => {
  const { lang, showToast, refreshCatalog } = useApp();
  const [templates, setTemplates] = useState<TagDesignTemplate[]>([]);
  const [licenseTypes, setLicenseTypes] = useState<LicenseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TemplateStatus>('all');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'general' | 'specialized'>('all');

  const [previewTemplate, setPreviewTemplate] = useState<TagDesignTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Partial<TagDesignTemplate> | null>(null);
  const [savingTpl, setSavingTpl] = useState(false);

  // ZIP Upload Modal state
  const [zipModalOpen, setZipModalOpen] = useState(false);
  const [zipFileName, setZipFileName] = useState('');
  const [zipBase64, setZipBase64] = useState('');
  const [zipBusy, setZipBusy] = useState(false);
  const [zipReport, setZipReport] = useState<{
    importedCount: number;
    fileCount: number;
    warnings: string[];
  } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [tRes, lRes] = await Promise.all([
        adminApi.getTemplates(),
        adminApi.getLicenses(),
      ]);
      setTemplates(tRes.templates || []);
      setLicenseTypes(lRes.licenseTypes || []);
    } catch (err) {
      showToast(
        'error',
        lang === 'ar' ? 'خطأ تحميل' : 'Load Error',
        err instanceof ApiRequestError
          ? lang === 'ar'
            ? err.messageAr
            : err.messageEn
          : 'Failed to load templates.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const openCreateModal = () => {
    setEditingTemplate({
      titleAr: '',
      titleEn: '',
      subtitleAr: 'قالب QR ذكي جاهز للتخصيص والطباعة',
      subtitleEn: 'Smart printable QR tag template',
      category: 'sticker',
      domainCategory: 'personal',
      templateScope: 'general',
      shapeSilhouette: 'dome_sticker',
      primaryHex: '#2563EB',
      secondaryHex: '#17243A',
      badgeColorHex: '#19B5A5',
      priceSar: 35,
      priceUsd: 9,
      includedInTier: 'plus',
      status: 'draft',
      isFree: false,
      isFeatured: false,
      purchaseMode: 'both',
      customizationMode: 'mixed',
      allowEditAfterSave: false,
      maxCopies: 5,
      licenseTypeId: licenseTypes[0]?.id || 'lic-personal-standard',
      originalDesignUrl: '',
      printFileUrl: '',
      tags: ['qr', 'smart-tag'],
    });
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate) return;
    setSavingTpl(true);
    try {
      if (editingTemplate.id) {
        await adminApi.updateTemplate(editingTemplate.id, editingTemplate);
      } else {
        await adminApi.createTemplate(editingTemplate);
      }
      showToast(
        'success',
        lang === 'ar' ? 'تم حفظ القالب' : 'Template Saved',
        editingTemplate.titleAr || editingTemplate.titleEn || ''
      );
      setEditingTemplate(null);
      await load();
      await refreshCatalog();
    } catch (err) {
      showToast(
        'error',
        lang === 'ar' ? 'تعذر الحفظ' : 'Save Error',
        err instanceof ApiRequestError
          ? lang === 'ar'
            ? err.messageAr
            : err.messageEn
          : 'Failed to save template.'
      );
    } finally {
      setSavingTpl(false);
    }
  };

  const handleQuickStatus = async (tpl: TagDesignTemplate, nextStatus: TemplateStatus) => {
    try {
      await adminApi.updateTemplate(tpl.id, { status: nextStatus });
      showToast(
        'success',
        lang === 'ar' ? 'تم تحديث الحالة' : 'Status Updated',
        `${tpl.titleEn} -> ${nextStatus}`
      );
      await load();
      await refreshCatalog();
    } catch (err) {
      showToast(
        'error',
        lang === 'ar' ? 'تعذر التحديث' : 'Update Error',
        err instanceof ApiRequestError
          ? lang === 'ar'
            ? err.messageAr
            : err.messageEn
          : 'Failed to change template status.'
      );
    }
  };

  const handleDeleteTemplate = async (tpl: TagDesignTemplate) => {
    try {
      await adminApi.deleteTemplate(tpl.id);
      showToast(
        'info',
        lang === 'ar' ? 'تم حذف القالب' : 'Template Deleted',
        tpl.titleEn
      );
      await load();
      await refreshCatalog();
    } catch (err) {
      if (err instanceof ApiRequestError && err.isReauthRequired) {
        onRequireReauth(() => handleDeleteTemplate(tpl));
      } else {
        showToast(
          'error',
          lang === 'ar' ? 'حذف محمي' : 'Delete Guarded',
          err instanceof ApiRequestError
            ? lang === 'ar'
              ? err.messageAr
              : err.messageEn
            : 'Cannot delete protected or active template.'
        );
      }
    }
  };

  const handleZipFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setZipFileName(file.name);
    setZipReport(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setZipBase64(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleZipUpload = async () => {
    if (!zipBase64) return;
    setZipBusy(true);
    try {
      const res = await adminApi.uploadTemplatesZip({
        fileName: zipFileName || 'templates.zip',
        base64Zip: zipBase64,
      });
      setZipReport({
        importedCount: res.importedCount,
        fileCount: res.fileCount,
        warnings: res.warnings || [],
      });
      showToast(
        'success',
        lang === 'ar' ? 'تم استيراد حزمة ZIP' : 'ZIP Import Complete',
        lang === 'ar'
          ? `تم استيراد ${res.importedCount} قالب كمسودة جاهزة للمراجعة.`
          : `Imported ${res.importedCount} draft template(s) for review.`
      );
      await load();
    } catch (err) {
      showToast(
        'error',
        lang === 'ar' ? 'فشل فحص أو استيراد ZIP' : 'ZIP Security/Parse Failed',
        err instanceof ApiRequestError
          ? lang === 'ar'
            ? err.messageAr
            : err.messageEn
          : 'Invalid ZIP package.'
      );
    } finally {
      setZipBusy(false);
    }
  };

  const counts = useMemo(() => {
    const general = templates.filter((t) => t.templateScope === 'general').length;
    const specialized = templates.filter((t) => t.templateScope === 'specialized').length;
    const coreProtected = templates.filter((t) => t.isCoreProtected).length;
    return { total: templates.length, general, specialized, coreProtected };
  }, [templates]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return templates.filter((t) => {
      if (statusFilter !== 'all' && (t.status || 'published') !== statusFilter) return false;
      if (scopeFilter !== 'all' && t.templateScope !== scopeFilter) return false;
      if (!q) return true;
      return (
        t.titleAr.toLowerCase().includes(q) ||
        t.titleEn.toLowerCase().includes(q) ||
        t.slug.toLowerCase().includes(q)
      );
    });
  }, [templates, query, statusFilter, scopeFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-[#17243A] dark:text-white">
            {lang === 'ar' ? 'مكتبة القوالب والتصاميم' : 'Templates & Designs Library'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {lang === 'ar'
              ? `الإجمالي: ${counts.total} قالب (${counts.general} عام · ${counts.specialized} متخصص · ${counts.coreProtected} أساسي محمي)`
              : `Total: ${counts.total} (${counts.general} general · ${counts.specialized} specialized · ${counts.coreProtected} protected core)`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setZipModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
          >
            <FileArchive className="w-3.5 h-3.5 text-[#19B5A5]" />
            <span>{lang === 'ar' ? 'استيراد حزمة ZIP' : 'Import ZIP Batch'}</span>
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-bold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'قالب جديد' : 'New Template'}</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0F1A2B] border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="md:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute top-3 start-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              lang === 'ar' ? 'بحث باسم القالب أو المعرف...' : 'Search by template title or slug...'
            }
            className="w-full ps-9 pe-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-200 dark:border-slate-700 text-xs"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | TemplateStatus)}
          className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-200 dark:border-slate-700 text-xs font-semibold"
        >
          <option value="all">{lang === 'ar' ? 'كل الحالات' : 'All Statuses'}</option>
          <option value="published">{lang === 'ar' ? 'منشور' : 'Published'}</option>
          <option value="draft">{lang === 'ar' ? 'مسودة' : 'Draft'}</option>
          <option value="archived">{lang === 'ar' ? 'مؤرشف' : 'Archived'}</option>
        </select>

        <select
          value={scopeFilter}
          onChange={(e) =>
            setScopeFilter(e.target.value as 'all' | 'general' | 'specialized')
          }
          className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-200 dark:border-slate-700 text-xs font-semibold"
        >
          <option value="all">{lang === 'ar' ? 'عام + متخصص' : 'General & Specialized'}</option>
          <option value="general">{lang === 'ar' ? 'عام (30+)' : 'General'}</option>
          <option value="specialized">{lang === 'ar' ? 'متخصص (15+)' : 'Specialized'}</option>
        </select>
      </div>

      {/* Templates Table */}
      <div className="rounded-2xl bg-white dark:bg-[#0F1A2B] border border-slate-200 dark:border-slate-800 overflow-hidden">
        {loading && templates.length === 0 ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-[#2563EB]" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="bg-slate-50 dark:bg-[#0B1424] border-b border-slate-200 dark:border-slate-800 text-slate-500">
                <tr>
                  <th className="py-3 px-4 text-start font-bold">
                    {lang === 'ar' ? 'القالب' : 'Template'}
                  </th>
                  <th className="py-3 px-4 text-start font-bold">
                    {lang === 'ar' ? 'النطاق والتخصيص' : 'Scope & Customization'}
                  </th>
                  <th className="py-3 px-4 text-start font-bold">
                    {lang === 'ar' ? 'التسعير والباقة' : 'Price & Tier'}
                  </th>
                  <th className="py-3 px-4 text-start font-bold">
                    {lang === 'ar' ? 'الاستخدام / المبيعات' : 'Usage / Sales'}
                  </th>
                  <th className="py-3 px-4 text-start font-bold">
                    {lang === 'ar' ? 'الحالة' : 'Status'}
                  </th>
                  <th className="py-3 px-4 text-end font-bold">
                    {lang === 'ar' ? 'الإجراءات' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((tpl) => {
                  const st = tpl.status || 'published';
                  return (
                    <tr key={tpl.id}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-4 h-4 rounded-md border border-white/20 shrink-0"
                            style={{ backgroundColor: tpl.primaryHex }}
                          />
                          <div>
                            <div className="font-bold text-[#17243A] dark:text-white flex items-center gap-1.5">
                              <span>{lang === 'ar' ? tpl.titleAr : tpl.titleEn}</span>
                              {tpl.isCoreProtected && (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px]">
                                  Core
                                </span>
                              )}
                              {tpl.isFeatured && (
                                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                              )}
                            </div>
                            <div className="text-[11px] font-mono text-slate-400">{tpl.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold">
                          {tpl.templateScope} · {tpl.domainCategory || 'personal'}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {tpl.customizationMode || 'mixed'} · {tpl.purchaseMode || 'both'}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums">
                        <div className="font-bold">
                          {tpl.isFree || tpl.priceSar === 0
                            ? 'FREE'
                            : `${tpl.priceSar} SAR / $${tpl.priceUsd}`}
                        </div>
                        <div className="text-[11px] text-slate-400">Tier: {tpl.includedInTier}</div>
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums">
                        {tpl.usageCount || 0} / {tpl.salesCount || 0}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            st === 'published'
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                              : st === 'draft'
                              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                          }`}
                        >
                          {st}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-end">
                        <div className="inline-flex flex-wrap justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setPreviewTemplate(tpl)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:text-[#2563EB]"
                            title={lang === 'ar' ? 'معاينة' : 'Preview'}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingTemplate({ ...tpl })}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:text-[#2563EB]"
                            title={lang === 'ar' ? 'تعديل' : 'Edit'}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              void handleQuickStatus(
                                tpl,
                                st === 'published' ? 'archived' : 'published'
                              )
                            }
                            className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-bold"
                          >
                            {st === 'published' ? (
                              <Archive className="w-3.5 h-3.5 text-amber-600" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            )}
                          </button>
                          {!tpl.isCoreProtected && (
                            <button
                              type="button"
                              onClick={() => void handleDeleteTemplate(tpl)}
                              className="p-1.5 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white"
                              title={lang === 'ar' ? 'حذف آمن' : 'Safe Delete'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Live Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#0F1A2B] border border-slate-200 dark:border-slate-700 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-[#17243A] dark:text-white">
                {lang === 'ar' ? previewTemplate.titleAr : previewTemplate.titleEn}
              </h3>
              <button
                type="button"
                onClick={() => setPreviewTemplate(null)}
                className="p-1 rounded-lg text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="py-4 rounded-xl bg-slate-50 dark:bg-[#070D17] flex justify-center">
              <TagProductPreview
                seed={previewTemplate.slug}
                primaryHex={previewTemplate.primaryHex}
                secondaryHex={previewTemplate.secondaryHex}
                badgeColorHex={previewTemplate.badgeColorHex}
                silhouette={previewTemplate.shapeSilhouette}
                badgeText={previewTemplate.specialtyBadgeEn || 'SCAN TO RETURN'}
                size="lg"
              />
            </div>
            <div className="text-xs space-y-1 text-slate-600 dark:text-slate-300">
              <p>
                {lang === 'ar' ? 'نمط التخصيص:' : 'Customization:'}{' '}
                <strong className="font-mono">{previewTemplate.customizationMode}</strong>
              </p>
              <p>
                {lang === 'ar' ? 'التعديل بعد الحفظ:' : 'Edit after save:'}{' '}
                <strong>{previewTemplate.allowEditAfterSave ? 'Allowed' : 'Locked'}</strong>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Template Modal */}
      {editingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
          <form
            onSubmit={handleSaveTemplate}
            className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white dark:bg-[#0F1A2B] border border-slate-200 dark:border-slate-700 p-6 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-[#17243A] dark:text-white">
                {editingTemplate.id
                  ? lang === 'ar'
                    ? 'تعديل بيانات القالب'
                    : 'Edit Template'
                  : lang === 'ar'
                  ? 'إنشاء قالب تصميم جديد'
                  : 'Create New Template'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingTemplate(null)}
                className="p-1 rounded-lg text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">
                    {lang === 'ar' ? 'الاسم بالعربية' : 'Arabic Title'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editingTemplate.titleAr || ''}
                    onChange={(e) =>
                      setEditingTemplate({ ...editingTemplate, titleAr: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-300 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">
                    {lang === 'ar' ? 'الاسم بالإنجليزية' : 'English Title'}
                  </label>
                  <input
                    type="text"
                    required
                    dir="ltr"
                    value={editingTemplate.titleEn || ''}
                    onChange={(e) =>
                      setEditingTemplate({ ...editingTemplate, titleEn: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-300 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">
                    {lang === 'ar' ? 'الفئة المجالية' : 'Domain Category'}
                  </label>
                  <select
                    value={editingTemplate.domainCategory || 'personal'}
                    onChange={(e) =>
                      setEditingTemplate({
                        ...editingTemplate,
                        domainCategory: e.target.value as TemplateDomainCategory,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-300 dark:border-slate-700"
                  >
                    <option value="personal">personal</option>
                    <option value="travel">travel</option>
                    <option value="family">family</option>
                    <option value="pets">pets</option>
                    <option value="business">business</option>
                    <option value="anime_cartoon">anime_cartoon</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">
                    {lang === 'ar' ? 'الشكل الهندسي' : 'Silhouette'}
                  </label>
                  <select
                    value={editingTemplate.shapeSilhouette || 'dome_sticker'}
                    onChange={(e) =>
                      setEditingTemplate({
                        ...editingTemplate,
                        shapeSilhouette: e.target.value as TagShapeSilhouette,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-300 dark:border-slate-700"
                  >
                    <option value="dome_sticker">dome_sticker</option>
                    <option value="luggage_loop">luggage_loop</option>
                    <option value="chamfer_keyfob">chamfer_keyfob</option>
                    <option value="pet_medal">pet_medal</option>
                    <option value="metal_plate">metal_plate</option>
                    <option value="smart_card">smart_card</option>
                    <option value="shield_tag">shield_tag</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">
                    {lang === 'ar' ? 'نمط التخصيص' : 'Customization Mode'}
                  </label>
                  <select
                    value={editingTemplate.customizationMode || 'mixed'}
                    onChange={(e) =>
                      setEditingTemplate({
                        ...editingTemplate,
                        customizationMode: e.target.value as TemplateCustomizationMode,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-300 dark:border-slate-700"
                  >
                    <option value="fixed">fixed (Locked graphics)</option>
                    <option value="mixed">mixed (Fixed art + dynamic QR)</option>
                    <option value="full">full (Editable frame & text)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">
                    {lang === 'ar' ? 'نمط الشراء' : 'Purchase Mode'}
                  </label>
                  <select
                    value={editingTemplate.purchaseMode || 'both'}
                    onChange={(e) =>
                      setEditingTemplate({
                        ...editingTemplate,
                        purchaseMode: e.target.value as TemplatePurchaseMode,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-300 dark:border-slate-700"
                  >
                    <option value="both">both</option>
                    <option value="single">single</option>
                    <option value="subscription">subscription</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">Price (SAR)</label>
                  <input
                    type="number"
                    min={0}
                    value={editingTemplate.priceSar ?? 0}
                    onChange={(e) =>
                      setEditingTemplate({
                        ...editingTemplate,
                        priceSar: Number(e.target.value),
                        isFree: Number(e.target.value) === 0,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-300 dark:border-slate-700 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">Price (USD)</label>
                  <input
                    type="number"
                    min={0}
                    value={editingTemplate.priceUsd ?? 0}
                    onChange={(e) =>
                      setEditingTemplate({ ...editingTemplate, priceUsd: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-300 dark:border-slate-700 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">
                    {lang === 'ar' ? 'الحالة' : 'Publish Status'}
                  </label>
                  <select
                    value={editingTemplate.status || 'draft'}
                    onChange={(e) =>
                      setEditingTemplate({
                        ...editingTemplate,
                        status: e.target.value as TemplateStatus,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-300 dark:border-slate-700"
                  >
                    <option value="draft">draft</option>
                    <option value="published">published</option>
                    <option value="archived">archived</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">
                    {lang === 'ar' ? 'نوع الترخيص المرتبط' : 'License Type'}
                  </label>
                  <select
                    value={editingTemplate.licenseTypeId || ''}
                    onChange={(e) =>
                      setEditingTemplate({ ...editingTemplate, licenseTypeId: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-300 dark:border-slate-700"
                  >
                    {licenseTypes.map((lt) => (
                      <option key={lt.id} value={lt.id}>
                        {lang === 'ar' ? lt.nameAr : lt.nameEn}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2 grid grid-cols-3 gap-2">
                  <div>
                    <label className="block font-bold mb-1">Primary Hex</label>
                    <input
                      type="color"
                      value={editingTemplate.primaryHex || '#2563EB'}
                      onChange={(e) =>
                        setEditingTemplate({ ...editingTemplate, primaryHex: e.target.value })
                      }
                      className="w-full h-9 rounded-lg cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Secondary Hex</label>
                    <input
                      type="color"
                      value={editingTemplate.secondaryHex || '#17243A'}
                      onChange={(e) =>
                        setEditingTemplate({ ...editingTemplate, secondaryHex: e.target.value })
                      }
                      className="w-full h-9 rounded-lg cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Badge Hex</label>
                    <input
                      type="color"
                      value={editingTemplate.badgeColorHex || '#19B5A5'}
                      onChange={(e) =>
                        setEditingTemplate({ ...editingTemplate, badgeColorHex: e.target.value })
                      }
                      className="w-full h-9 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2 flex flex-wrap gap-4 pt-1">
                  <label className="inline-flex items-center gap-2 font-bold">
                    <input
                      type="checkbox"
                      checked={Boolean(editingTemplate.isFeatured)}
                      onChange={(e) =>
                        setEditingTemplate({ ...editingTemplate, isFeatured: e.target.checked })
                      }
                    />
                    <span>{lang === 'ar' ? 'قالب مميز (Featured)' : 'Featured Template'}</span>
                  </label>

                  <label className="inline-flex items-center gap-2 font-bold">
                    <input
                      type="checkbox"
                      checked={Boolean(editingTemplate.allowEditAfterSave)}
                      onChange={(e) =>
                        setEditingTemplate({
                          ...editingTemplate,
                          allowEditAfterSave: e.target.checked,
                        })
                      }
                    />
                    <span>
                      {lang === 'ar' ? 'السماح بالتعديل بعد الحفظ' : 'Allow Edit After Save'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-3">
                <span className="text-[11px] font-bold text-slate-400">
                  {lang === 'ar' ? 'معاينة حية قبل النشر' : 'Live Pre-Publish Preview'}
                </span>
                <TagProductPreview
                  seed={editingTemplate.titleEn || 'preview'}
                  primaryHex={editingTemplate.primaryHex || '#2563EB'}
                  secondaryHex={editingTemplate.secondaryHex || '#17243A'}
                  badgeColorHex={editingTemplate.badgeColorHex || '#19B5A5'}
                  silhouette={editingTemplate.shapeSilhouette}
                  size="md"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingTemplate(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={savingTpl}
                className="px-5 py-2 rounded-xl bg-[#2563EB] text-white font-bold disabled:opacity-50"
              >
                {savingTpl
                  ? lang === 'ar'
                    ? 'جاري الحفظ...'
                    : 'Saving...'
                  : lang === 'ar'
                  ? 'حفظ القالب'
                  : 'Save Template'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ZIP Batch Upload Modal */}
      {zipModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#0F1A2B] border border-slate-200 dark:border-slate-700 p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-[#17243A] dark:text-white flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-[#19B5A5]" />
                <span>
                  {lang === 'ar' ? 'استيراد دفعة قوالب عبر ZIP' : 'Secure ZIP Batch Import'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setZipModalOpen(false)}
                className="p-1 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              {lang === 'ar'
                ? 'يفحص الخادم الأرشيف ضد المسارات الخبيثة والملفات التنفيذية وأكواد SVG الضارة، ثم يستورد القوالب المعرّفة في manifest.json كمسودات دون المساس بالقوالب الأساسية.'
                : 'Server validates paths, disallowed binaries, and unsafe SVG scripts before importing manifest.json items as drafts without overwriting core templates.'}
            </p>

            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl cursor-pointer hover:border-[#2563EB]">
              <Upload className="w-7 h-7 text-[#2563EB] mb-2" />
              <span className="font-bold text-[#17243A] dark:text-white">
                {zipFileName ||
                  (lang === 'ar' ? 'اختر ملف .zip من جهازك' : 'Choose a .zip archive file')}
              </span>
              <input
                type="file"
                accept=".zip,application/zip"
                onChange={handleZipFileSelect}
                className="hidden"
              />
            </label>

            {zipReport && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-1">
                <p className="font-bold text-emerald-800 dark:text-emerald-200">
                  {lang === 'ar'
                    ? `تم فحص ${zipReport.fileCount} ملف واستيراد ${zipReport.importedCount} قالب كمسودة.`
                    : `Scanned ${zipReport.fileCount} entries, imported ${zipReport.importedCount} draft template(s).`}
                </p>
                {zipReport.warnings.length > 0 && (
                  <p className="text-amber-600">{zipReport.warnings.join(' | ')}</p>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setZipModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
              >
                {lang === 'ar' ? 'إغلاق' : 'Close'}
              </button>
              <button
                type="button"
                disabled={zipBusy || !zipBase64}
                onClick={() => void handleZipUpload()}
                className="px-4 py-2 rounded-xl bg-[#2563EB] text-white font-bold disabled:opacity-50"
              >
                {zipBusy
                  ? lang === 'ar'
                    ? 'جاري الفحص والاستيراد...'
                    : 'Validating & Importing...'
                  : lang === 'ar'
                  ? 'فحص واستيراد الآن'
                  : 'Validate & Import'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const AdminLicensesView: React.FC = () => {
  const { lang, showToast } = useApp();
  const [licenseTypes, setLicenseTypes] = useState<LicenseType[]>([]);
  const [issuedLicenses, setIssuedLicenses] = useState<IssuedLicense[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<LicenseType> | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getLicenses();
      setLicenseTypes(res.licenseTypes || []);
      setIssuedLicenses(res.issuedLicenses || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      if (editing.id) {
        await adminApi.updateLicenseType(editing.id, editing);
      } else {
        await adminApi.createLicenseType(editing);
      }
      showToast(
        'success',
        lang === 'ar' ? 'تم حفظ الرخصة' : 'License Saved',
        editing.nameEn || editing.nameAr || ''
      );
      setEditing(null);
      await load();
    } catch (err) {
      showToast(
        'error',
        lang === 'ar' ? 'خطأ' : 'Error',
        err instanceof ApiRequestError ? err.messageEn : 'Save failed.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-[#17243A] dark:text-white">
            {lang === 'ar' ? 'التراخيص وحقوق الاستخدام' : 'Licenses & Usage Rights'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {lang === 'ar'
              ? 'إدارة قوالب التراخيص وسجل الشهادات الصادرة تلقائيًا بعد تأكيد الشراء.'
              : 'Configure dynamic license types and inspect licenses auto-issued upon confirmed orders.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            setEditing({
              nameAr: '',
              nameEn: '',
              allowPersonalUse: true,
              allowCommercialUse: false,
              maxCopies: 5,
              durationDays: null,
              transferable: false,
              resaleAllowed: false,
              redistributionAllowed: false,
              isActive: true,
            })
          }
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-bold"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{lang === 'ar' ? 'إنشاء نوع ترخيص' : 'New License Type'}</span>
        </button>
      </div>

      {/* License Types Grid */}
      {loading && licenseTypes.length === 0 ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-[#2563EB]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {licenseTypes.map((lt) => (
            <div
              key={lt.id}
              className="p-5 rounded-2xl bg-white dark:bg-[#0F1A2B] border border-slate-200 dark:border-slate-800 space-y-3 text-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-extrabold text-sm text-[#17243A] dark:text-white">
                    {lang === 'ar' ? lt.nameAr : lt.nameEn}
                  </h3>
                  <span className="font-mono text-[11px] text-slate-400">{lt.id}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setEditing({ ...lt })}
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {lang === 'ar' ? lt.descriptionAr : lt.descriptionEn}
              </p>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 font-mono text-[11px]">
                <span>Personal: {lt.allowPersonalUse ? 'Yes' : 'No'}</span>
                <span>Commercial: {lt.allowCommercialUse ? 'Yes' : 'No'}</span>
                <span>Max Copies: {lt.maxCopies}</span>
                <span>Days: {lt.durationDays ?? 'Lifetime'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Issued Licenses Registry */}
      <div className="rounded-2xl bg-white dark:bg-[#0F1A2B] border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-[#17243A] dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#19B5A5]" />
            <span>
              {lang === 'ar'
                ? `التراخيص الصادرة للعملاء (${issuedLicenses.length})`
                : `Issued Customer Licenses (${issuedLicenses.length})`}
            </span>
          </h2>
          <button
            type="button"
            onClick={() => void load()}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {issuedLicenses.length === 0 ? (
          <p className="py-10 text-center text-xs text-slate-500">
            {lang === 'ar'
              ? 'لم تصدر أي تراخيص بعد. تصدر التراخيص تلقائيًا عند اعتماد الطلبات.'
              : 'No licenses issued yet. Licenses issue automatically when orders are approved.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="bg-slate-50 dark:bg-[#0B1424] text-slate-500">
                <tr>
                  <th className="py-2.5 px-4 text-start font-bold">License #</th>
                  <th className="py-2.5 px-4 text-start font-bold">User</th>
                  <th className="py-2.5 px-4 text-start font-bold">Template</th>
                  <th className="py-2.5 px-4 text-start font-bold">Type</th>
                  <th className="py-2.5 px-4 text-start font-bold">Copies</th>
                  <th className="py-2.5 px-4 text-start font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {issuedLicenses.map((lic) => (
                  <tr key={lic.id}>
                    <td className="py-2.5 px-4 font-mono font-bold">{lic.licenseNumber}</td>
                    <td className="py-2.5 px-4 font-mono" dir="ltr">
                      {lic.userEmail}
                    </td>
                    <td className="py-2.5 px-4 font-bold">{lic.templateTitleEn}</td>
                    <td className="py-2.5 px-4">{lang === 'ar' ? lic.licenseNameAr : lic.licenseNameEn}</td>
                    <td className="py-2.5 px-4 font-mono">{lic.maxCopies}</td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 font-bold">
                        {lic.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* License Type Editor Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
          <form
            onSubmit={handleSave}
            className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#0F1A2B] border border-slate-200 dark:border-slate-700 p-6 space-y-4 text-xs"
          >
            <h3 className="text-base font-extrabold text-[#17243A] dark:text-white">
              {editing.id
                ? lang === 'ar'
                  ? 'تعديل نوع الترخيص'
                  : 'Edit License Type'
                : lang === 'ar'
                ? 'نوع ترخيص جديد'
                : 'Create License Type'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold mb-1">Name (AR)</label>
                <input
                  type="text"
                  required
                  value={editing.nameAr || ''}
                  onChange={(e) => setEditing({ ...editing, nameAr: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-300 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Name (EN)</label>
                <input
                  type="text"
                  required
                  dir="ltr"
                  value={editing.nameEn || ''}
                  onChange={(e) => setEditing({ ...editing, nameEn: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-300 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Max Copies</label>
                <input
                  type="number"
                  min={1}
                  value={editing.maxCopies ?? 5}
                  onChange={(e) => setEditing({ ...editing, maxCopies: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-300 dark:border-slate-700 font-mono"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Duration Days (blank = Lifetime)</label>
                <input
                  type="number"
                  min={1}
                  value={editing.durationDays ?? ''}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      durationDays: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070D17] border border-slate-300 dark:border-slate-700 font-mono"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="inline-flex items-center gap-1.5 font-bold">
                <input
                  type="checkbox"
                  checked={editing.allowPersonalUse !== false}
                  onChange={(e) => setEditing({ ...editing, allowPersonalUse: e.target.checked })}
                />
                <span>Personal Use</span>
              </label>
              <label className="inline-flex items-center gap-1.5 font-bold">
                <input
                  type="checkbox"
                  checked={Boolean(editing.allowCommercialUse)}
                  onChange={(e) =>
                    setEditing({ ...editing, allowCommercialUse: e.target.checked })
                  }
                />
                <span>Commercial Use</span>
              </label>
              <label className="inline-flex items-center gap-1.5 font-bold">
                <input
                  type="checkbox"
                  checked={Boolean(editing.transferable)}
                  onChange={(e) => setEditing({ ...editing, transferable: e.target.checked })}
                />
                <span>Transferable</span>
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-[#2563EB] text-white font-bold"
              >
                {lang === 'ar' ? 'حفظ' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
