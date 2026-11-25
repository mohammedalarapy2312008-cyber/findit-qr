import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Archive,
  ArrowUpDown,
  ArrowUpRight,
  Briefcase,
  CheckCircle2,
  Edit3,
  Eye,
  FolderPlus,
  Globe,
  GlobeLock,
  Layers,
  MailCheck,
  Plus,
  Printer,
  QrCode,
  RotateCcw,
  Save,
  Search,
  Shield,
  Sliders,
  Trash2,
} from 'lucide-react';
import { QrCodeVector } from '../../components/brand/FindItLogo';
import { SemanticStatusText } from '../../components/common/DesignSystem';
import { BatchPrintStudioModal } from '../../components/common/BatchPrintStudioModal';
import { ItemCompositedDesignStudio } from '../../components/common/ItemCompositedDesignStudio';
import { ItemTemplateCarousel } from '../../components/common/ItemTemplateCarousel';
import { ItemTemplatePicker } from '../../components/common/ItemTemplatePicker';
import { AsyncStateBoundary, ViewStateBar } from '../../components/common/UiPrimitives';
import { ContactMethodsSelector } from '../../components/workspace/ContactMethodsSelector';
import { SmartCoverManager } from '../../components/workspace/SmartCoverManager';
import { SmartRelatedServices } from '../../components/workspace/SmartRelatedServices';
import { useApp } from '../../context/AppContext';
import {
  CoverSourceType,
  DEFAULT_ITEM_PRIVACY_SETTINGS,
  ItemCategory,
  ItemPrivacySettings,
  ItemSortBy,
  ItemStatus,
  NewItemDraft,
} from '../../types/domain';
import { canAccessTemplateByPlanOrPurchase } from '../../utils/adminLogic';
import { getFallbackCoverUrl } from '../../utils/aiCoverLogic';
import {
  buildChannelPreferenceFromSelectedMethods,
  ensureProfileContactMethods,
} from '../../utils/contactMethodsLogic';
import {
  canAddOrReactivateItem,
  computeDashboardStats,
  countEnabledContactMethods,
  filterAndSortItems,
  resolveItemPrivacySettings,
  validateItemDraft,
  validateItemUpdate,
} from '../../utils/qrLogic';
import {
  composeItemTemplateDesignSvg,
  getDefaultUnlockedTemplateId,
} from '../../utils/templateQrCompositor';

export const DashboardPage: React.FC = () => {
  const {
    lang,
    t,
    profile,
    items,
    activityLogs,
    navigate,
    setFirebaseModalOpen,
    resendVerificationEmail,
  } = useApp();

  const stats = computeDashboardStats(items);
  const canAddMore = canAddOrReactivateItem(profile.activeItemsCount, profile.activeItemsLimit);
  const remainingSlots = Math.max(0, profile.activeItemsLimit - profile.activeItemsCount);

  return (
    <div className="space-y-8">
      {/* Page Title & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17243A] dark:text-white">
            {t.workspaceNav.dashboard}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            {lang === 'ar'
              ? `مرحبًا ${profile.displayName || profile.displayNameAr} — ملخص فوري لأغراضك المسجلة وحد الباقة (${profile.plan}).`
              : `Welcome ${profile.displayName || profile.displayNameEn} — Real-time overview of your registered items and ${profile.plan} plan quota.`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => navigate('groups')}
            className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0E192B] text-xs font-bold text-[#0B1320] dark:text-slate-200 hover:border-[#0F9D8E]"
          >
            {lang === 'ar' ? 'المجموعات' : 'Groups Hub'}
          </button>
          <button
            type="button"
            onClick={() => navigate('print-studio')}
            className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0E192B] text-xs font-bold text-[#0B1320] dark:text-slate-200 hover:border-[#0F9D8E]"
          >
            {lang === 'ar' ? 'استوديو الطباعة' : 'Print Studio'}
          </button>
          <button
            type="button"
            onClick={() => navigate('analytics')}
            className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0E192B] text-xs font-bold text-[#0B1320] dark:text-slate-200 hover:border-[#0F9D8E]"
          >
            {lang === 'ar' ? 'الإحصائيات' : 'Analytics'}
          </button>
          <button
            type="button"
            onClick={() => navigate('add-item')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F9D8E] hover:bg-[#19B5A5] text-white dark:text-[#07101A] text-xs sm:text-sm font-extrabold transition-colors shadow-sm shadow-[#0F9D8E]/25"
          >
            <Plus className="w-4 h-4" />
            <span>{t.workspaceNav.addItem}</span>
          </button>
          <button
            type="button"
            onClick={() => setFirebaseModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0E192B] text-xs font-bold text-[#0B1320] dark:text-slate-200 hover:border-[#0F9D8E]"
          >
            {t.common.configureFirebaseBtn}
          </button>
        </div>
      </div>

      {/* Email Verification Alert Banner */}
      {!profile.emailVerified && profile.uid && (
        <div className="rounded-2xl border border-[#FFD166] bg-[#FFD166]/15 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <MailCheck className="w-5 h-5 text-[#17243A] dark:text-[#FFD166] shrink-0" />
            <div>
              <p className="text-xs sm:text-sm font-bold text-[#17243A] dark:text-white">
                {lang === 'ar'
                  ? 'البريد الإلكتروني غير مؤكد بعد'
                  : 'Your email address is not verified yet'}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {lang === 'ar'
                  ? `تحقق من البريد (${profile.email}) لضمان استلام تنبيهات الفقدان.`
                  : `Verify (${profile.email}) to ensure recovery alerts reach you reliably.`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void resendVerificationEmail()}
            className="px-3.5 py-2 rounded-xl bg-[#17243A] text-white text-xs font-bold shrink-0"
          >
            {lang === 'ar' ? 'تأكيد البريد الآن' : 'Verify Email'}
          </button>
        </div>
      )}

      {/* Plan Quota Indicator Bar */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1A2B] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-[#0F9D8E]/10 text-[#0F9D8E] dark:text-[#2DD4BF]">
              {lang === 'ar' ? `الباقة الحالية: ${profile.plan}` : `Current Plan: ${profile.plan}`}
            </span>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
              <span className="font-mono tabular-nums">
                {profile.activeItemsCount} / {profile.activeItemsLimit}
              </span>{' '}
              {lang === 'ar' ? 'أغراض نشطة' : 'active items'} ·{' '}
              <span className="font-mono tabular-nums">{profile.contactMethodsLimit || 2}</span>{' '}
              {lang === 'ar' ? 'وسائل تواصل/غرض' : 'channels/item'}
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            {canAddMore
              ? lang === 'ar'
                ? `متبقي لديك (${remainingSlots}) خانة غرض نشط متاحة في باقة (${profile.plan}). الأغراض المؤرشفة لا تُحتسب ضمن الحد.`
                : `You have (${remainingSlots}) active item slot(s) remaining on ${profile.plan}. Archived items do not consume your quota.`
              : lang === 'ar'
              ? `وصلت إلى الحد الأقصى (${profile.activeItemsCount}/${profile.activeItemsLimit} أغراض نشطة). قم بأرشفة أحد الأغراض لإضافة غرض جديد.`
              : `You have reached your active limit (${profile.activeItemsCount}/${profile.activeItemsLimit}). Archive an active item to add another.`}
          </p>
        </div>
        <div className="w-full sm:w-48 bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden shrink-0">
          <div
            className={`h-full transition-all ${
              canAddMore ? 'bg-[#19B5A5]' : 'bg-[#FF8A65]'
            }`}
            style={{
              width: `${Math.min(
                100,
                Math.round((profile.activeItemsCount / Math.max(1, profile.activeItemsLimit)) * 100)
              )}%`,
            }}
          />
        </div>
      </div>

      <ViewStateBar
        pageHintAr="تعرض لوحة التحكم أرقامًا حقيقية مباشرة من حسابك، مع إمكانية معاينة حالات التحميل والفراغ والخطأ."
        pageHintEn="The dashboard displays live counts from your account database with full view-state diagnostics."
      />

      <AsyncStateBoundary
        emptyTitleAr="لا توجد أغراض مسجلة في حسابك بعد"
        emptyTitleEn="No Registered Belongings Yet"
        emptyDescAr="ابدأ بإضافة أول غرض شخصي أو تجاري لتوليد كود QR ذكي وتفعيل حماية المفقودات."
        emptyDescEn="Register your first personal item or corporate asset to generate a smart QR recovery code."
        emptyActionLabelAr={t.workspaceNav.addItem}
        emptyActionLabelEn={t.workspaceNav.addItem}
        onEmptyAction={() => navigate('add-item')}
      >
        {/* 4 Real Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              id: 'stat-active',
              labelAr: 'عدد الأغراض النشطة',
              labelEn: 'Active Items Count',
              value: stats.activeCount,
              subAr: `الحد المستخدم: ${profile.activeItemsCount}/${profile.activeItemsLimit}`,
              subEn: `Quota used: ${profile.activeItemsCount}/${profile.activeItemsLimit}`,
              color: 'text-[#2563EB]',
              route: 'my-items' as const,
            },
            {
              id: 'stat-lost',
              labelAr: 'عدد الأغراض المفقودة',
              labelEn: 'Lost Items Count',
              value: stats.lostCount,
              subAr: 'في وضع الفقدان وتنبيه المكتشف',
              subEn: 'Currently in Lost alert mode',
              color: 'text-[#E05D38] dark:text-[#FF8A65]',
              route: 'my-items' as const,
            },
            {
              id: 'stat-recovered',
              labelAr: 'تم العثور عليها / استعادتها',
              labelEn: 'Found / Recovered Items',
              value: stats.foundOrRecoveredCount,
              subAr: 'تم العثور عليها أو استلامها بنجاح',
              subEn: 'Found by scanner or recovered',
              color: 'text-[#0F9D8E] dark:text-[#19B5A5]',
              route: 'my-items' as const,
            },
            {
              id: 'stat-archived',
              labelAr: 'الأغراض المؤرشفة',
              labelEn: 'Archived Items Count',
              value: stats.archivedCount,
              subAr: 'لا تُحتسب ضمن الحد النشط للباقة',
              subEn: 'Excluded from active plan limit',
              color: 'text-slate-600 dark:text-slate-300',
              route: 'my-items' as const,
            },
          ].map((stat) => (
            <button
              key={stat.id}
              data-testid={stat.id}
              type="button"
              onClick={() => navigate(stat.route)}
              className="text-start rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1A2B] p-5 hover:border-[#2563EB] flex flex-col justify-between findit-card-hover"
            >
              <div className="flex items-center justify-between gap-2 w-full">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {lang === 'ar' ? stat.labelAr : stat.labelEn}
                </span>
                <ArrowUpRight className="w-4 h-4 text-slate-400 shrink-0" />
              </div>
              <p className={`text-3xl font-extrabold font-mono tabular-nums mt-3 ${stat.color}`}>
                {stat.value}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                {lang === 'ar' ? stat.subAr : stat.subEn}
              </p>
            </button>
          ))}
        </div>

        {/* Latest Added Items + Latest User Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
          <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1A2B] p-6 space-y-5">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-base font-bold text-[#17243A] dark:text-white">
                {lang === 'ar' ? 'آخر الأغراض المضافة' : 'Latest Added Items'}
              </h2>
              <button
                type="button"
                onClick={() => navigate('my-items')}
                className="text-xs font-bold text-[#2563EB] dark:text-[#19B5A5] hover:underline"
              >
                {lang === 'ar' ? 'عرض جميع الأغراض' : 'View All Items'}
              </button>
            </div>

            {items.length === 0 ? (
              <div className="rounded-xl bg-[#F4F7FB] dark:bg-[#070D17] p-8 text-center space-y-3 border border-dashed border-slate-300 dark:border-slate-800">
                <Briefcase className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-sm font-bold text-[#17243A] dark:text-white">
                  {lang === 'ar'
                    ? 'لم تقم بإضافة أي غرض حتى الآن'
                    : 'You have not added any items yet'}
                </p>
                <p className="text-xs text-slate-500">
                  {lang === 'ar'
                    ? 'أضف أول غرض في حسابك لتوليد كود QR خاص به ومتابعة حالته من هنا.'
                    : 'Add your first belonging to generate its unique QR code and track it here.'}
                </p>
                <button
                  type="button"
                  onClick={() => navigate('add-item')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-bold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t.workspaceNav.addItem}</span>
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-200/70 dark:divide-slate-800">
                {items.slice(0, 4).map((item) => {
                  const thumbUrl = item.coverUrl || item.imageUrl || getFallbackCoverUrl(item.category);
                  return (
                  <div
                    key={item.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={thumbUrl}
                        alt={item.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-100 dark:bg-[#0B1320]"
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm text-[#0B1320] dark:text-white truncate">
                            {item.name || (lang === 'ar' ? item.nameAr : item.nameEn)}
                          </span>
                          <span className="text-xs font-mono text-slate-400 tabular-nums">
                            · {item.codeSerial}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                          <span>{t.categories[item.category]}</span>
                          <span>·</span>
                          <SemanticStatusText
                            status={item.status}
                            lang={lang}
                            label={t.statuses[item.status]}
                          />
                          {(item.city || item.cityAr || item.cityEn) && (
                            <>
                              <span>·</span>
                              <span>{item.city || (lang === 'ar' ? item.cityAr : item.cityEn)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => navigate('item-details', { itemId: item.id })}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-[#0B1320] dark:text-slate-200 hover:border-[#0F9D8E]"
                      >
                        {t.common.viewDetails}
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate('qr-preview', { qrId: item.qrId, itemId: item.id })}
                        className="px-3 py-1.5 rounded-lg bg-[#0F9D8E]/10 dark:bg-[#19B5A5]/15 text-xs font-bold text-[#0F9D8E] dark:text-[#2DD4BF]"
                      >
                        {t.common.previewQr}
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1A2B] p-6 space-y-5">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-base font-bold text-[#17243A] dark:text-white">
                {lang === 'ar' ? 'آخر العمليات والنشاطات' : 'Latest User Operations'}
              </h2>
              <button
                type="button"
                onClick={() => navigate('activity')}
                className="text-xs font-bold text-[#2563EB] dark:text-[#19B5A5] hover:underline"
              >
                {t.workspaceNav.activity}
              </button>
            </div>

            {activityLogs.length === 0 ? (
              <div className="rounded-xl bg-[#F4F7FB] dark:bg-[#070D17] p-6 text-center text-xs text-slate-500">
                {lang === 'ar'
                  ? 'لا توجد عمليات مسجلة بعد. ستظهر هنا عمليات الإضافة والتعديل والأرشفة فور تنفيذها.'
                  : 'No operations recorded yet. Item additions, edits, and archives will appear here.'}
              </div>
            ) : (
              <div className="space-y-3">
                {activityLogs.slice(0, 5).map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-xl bg-[#F4F7FB] dark:bg-[#070D17] border border-slate-200/70 dark:border-slate-800 space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-bold text-[#17243A] dark:text-white">
                        {lang === 'ar' ? log.titleAr : log.titleEn}
                      </span>
                      <span className="font-mono text-[11px] text-slate-400 tabular-nums shrink-0">
                        {log.timestamp}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {lang === 'ar' ? log.detailAr : log.detailEn}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </AsyncStateBoundary>

      <SmartRelatedServices currentPage="dashboard" />
    </div>
  );
};

export const MyItemsPage: React.FC = () => {
  const {
    lang,
    t,
    profile,
    items,
    groups,
    designs,
    navigate,
    createGroupInSession,
    deleteGroupInSession,
    updateItemStatusInSession,
    archiveItemInSession,
    reactivateItemInSession,
    deleteItemInSession,
    restoreItemIndividualQrInSession,
    requestConfirm,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ItemCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ItemStatus | 'all'>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<ItemSortBy>('newest');
  const [newGroupName, setNewGroupName] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [showGroupCreator, setShowGroupCreator] = useState(false);
  const [selectedPrintIds, setSelectedPrintIds] = useState<string[]>([]);
  const [batchPrintOpen, setBatchPrintOpen] = useState(false);
  const [batchPrintQueueIds, setBatchPrintQueueIds] = useState<string[]>([]);

  const filteredItems = filterAndSortItems(
    items,
    searchQuery,
    categoryFilter,
    statusFilter,
    sortBy,
    groupFilter
  );

  const togglePrintSelection = (itemId: string) => {
    setSelectedPrintIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const openBatchPrint = (ids?: string[]) => {
    const targetIds =
      ids && ids.length > 0
        ? ids
        : selectedPrintIds.length > 0
        ? selectedPrintIds
        : filteredItems.map((i) => i.id);
    setBatchPrintQueueIds(targetIds);
    setBatchPrintOpen(true);
  };

  const handleQuickCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || creatingGroup) return;
    setCreatingGroup(true);
    try {
      const created = await createGroupInSession(newGroupName.trim());
      if (created) {
        setNewGroupName('');
        setShowGroupCreator(false);
      }
    } finally {
      setCreatingGroup(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17243A] dark:text-white">
            {t.workspaceNav.myItems}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            {lang === 'ar'
              ? `إدارة أغراضك المسجلة (${profile.activeItemsCount}/${profile.activeItemsLimit} نشطة في باقة ${profile.plan}) مع التنظيم بالمجموعات والبحث والأرشفة.`
              : `Manage your registered items (${profile.activeItemsCount}/${profile.activeItemsLimit} active on ${profile.plan}) with groups, search, and archiving.`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {items.length > 0 && (
            <button
              type="button"
              data-testid="open-batch-print-btn"
              onClick={() => openBatchPrint()}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#2563EB]/40 bg-[#2563EB]/10 text-[#2563EB] dark:text-[#19B5A5] text-xs sm:text-sm font-bold hover:bg-[#2563EB] hover:text-white transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>
                {selectedPrintIds.length > 0
                  ? lang === 'ar'
                    ? `طباعة المحدد (${selectedPrintIds.length})`
                    : `Batch Print (${selectedPrintIds.length})`
                  : lang === 'ar'
                  ? 'طباعة جماعية (A4)'
                  : 'Batch Print (A4)'}
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate('groups')}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0E192B] text-xs sm:text-sm font-bold text-[#0B1320] dark:text-white hover:border-[#0F9D8E]"
          >
            <Layers className="w-4 h-4 text-[#0F9D8E] dark:text-[#2DD4BF]" />
            <span>{lang === 'ar' ? 'مركز المجموعات' : 'Groups Hub'}</span>
          </button>
          <button
            type="button"
            onClick={() => setShowGroupCreator((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0E192B] text-xs sm:text-sm font-bold text-[#0B1320] dark:text-white hover:border-[#0F9D8E]"
          >
            <FolderPlus className="w-4 h-4 text-[#0F9D8E] dark:text-[#2DD4BF]" />
            <span>{lang === 'ar' ? 'مجموعة جديدة' : 'New Group'}</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('add-item')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F9D8E] hover:bg-[#19B5A5] text-white dark:text-[#07101A] text-sm font-extrabold transition-colors shadow-sm shadow-[#0F9D8E]/25"
          >
            <Plus className="w-4 h-4" />
            <span>{t.workspaceNav.addItem}</span>
          </button>
        </div>
      </div>

      {/* Item Groups Quick Bar */}
      {(groups.length > 0 || showGroupCreator) && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1A2B] p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 me-1">
              <Layers className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#19B5A5]" />
              <span>{lang === 'ar' ? 'المجموعات:' : 'Groups:'}</span>
            </span>
            <button
              type="button"
              onClick={() => setGroupFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                groupFilter === 'all'
                  ? 'bg-[#2563EB] text-white'
                  : 'bg-[#F4F7FB] dark:bg-[#070D17] text-slate-600 dark:text-slate-300'
              }`}
            >
              {lang === 'ar' ? 'الكل' : 'All'}
            </button>
            {groups.map((grp) => (
              <div key={grp.id} className="inline-flex items-center rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setGroupFilter(grp.id)}
                  className={`px-3 py-1 text-xs font-bold transition-colors ${
                    groupFilter === grp.id
                      ? 'bg-[#2563EB] text-white'
                      : 'bg-[#F4F7FB] dark:bg-[#070D17] text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {grp.name}
                </button>
                <button
                  type="button"
                  aria-label={lang === 'ar' ? `حذف مجموعة ${grp.name}` : `Delete group ${grp.name}`}
                  onClick={() =>
                    requestConfirm({
                      title: lang === 'ar' ? 'حذف المجموعة' : 'Delete Group',
                      description:
                        lang === 'ar'
                          ? `هل تريد حذف مجموعة "${grp.name}"؟ ستبقى جميع أغراضك محفوظة دون حذف.`
                          : `Delete group "${grp.name}"? All items inside will be preserved safely.`,
                      confirmLabel: lang === 'ar' ? 'حذف المجموعة' : 'Delete Group',
                      variant: 'danger',
                      onConfirm: () => {
                        void deleteGroupInSession(grp.id).then((ok) => {
                          if (ok && groupFilter === grp.id) setGroupFilter('all');
                        });
                      },
                    })
                  }
                  className="px-2 py-1 bg-[#F4F7FB] dark:bg-[#070D17] text-slate-400 hover:text-red-500 text-xs"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setGroupFilter('ungrouped')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                groupFilter === 'ungrouped'
                  ? 'bg-[#2563EB] text-white'
                  : 'bg-[#F4F7FB] dark:bg-[#070D17] text-slate-600 dark:text-slate-300'
              }`}
            >
              {lang === 'ar' ? 'بدون مجموعة' : 'Ungrouped'}
            </button>
          </div>

          {showGroupCreator && (
            <form onSubmit={handleQuickCreateGroup} className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder={lang === 'ar' ? 'اسم المجموعة الجديدة (مثل: أغراض السفر، العمل...)' : 'New group name (e.g. Travel, Work...)'}
                aria-label={lang === 'ar' ? 'اسم المجموعة الجديدة' : 'New group name'}
                className="flex-1 min-w-[200px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17] text-xs sm:text-sm"
              />
              <button
                type="submit"
                disabled={creatingGroup || newGroupName.trim().length < 2}
                className="px-4 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-bold disabled:opacity-50"
              >
                {creatingGroup
                  ? lang === 'ar'
                    ? 'جارٍ الإنشاء...'
                    : 'Creating...'
                  : lang === 'ar'
                  ? 'حفظ المجموعة'
                  : 'Save Group'}
              </button>
            </form>
          )}
        </div>
      )}

      <ViewStateBar
        pageHintAr="يمكنك البحث بالاسم أو الكود، التصفية حسب المجموعة أو الفئة أو الحالة، والانتقال لتنزيل التصميم النهائي المدمج بكود QR."
        pageHintEn="Search by name or code, filter by group, category, or status, and open any item to download its composited Template + QR design."
      />

      {/* Search, Filter & Sort Toolbar */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1A2B] p-4 grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-4 relative">
          <Search className="w-4 h-4 text-slate-400 absolute top-3 start-3.5" aria-hidden="true" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.common.searchPlaceholder}
            aria-label={t.common.searchPlaceholder}
            className="w-full ps-10 pe-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17] text-sm"
          />
        </div>

        <div className="md:col-span-3">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as ItemCategory | 'all')}
            aria-label={t.common.allCategories}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17] text-sm"
          >
            <option value="all">{t.common.allCategories}</option>
            {(Object.keys(t.categories) as ItemCategory[]).map((cat) => (
              <option key={cat} value={cat}>
                {t.categories[cat]}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ItemStatus | 'all')}
            aria-label={t.common.allStatuses}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17] text-sm"
          >
            <option value="all">{t.common.allStatuses}</option>
            {(Object.keys(t.statuses) as ItemStatus[]).map((st) => (
              <option key={st} value={st}>
                {t.statuses[st]}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2 relative">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute top-3 start-3 pointer-events-none" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as ItemSortBy)}
            aria-label={lang === 'ar' ? 'فرز الأغراض' : 'Sort Items'}
            className="w-full ps-8 pe-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17] text-xs sm:text-sm font-semibold"
          >
            <option value="newest">{t.common.sortNewest}</option>
            <option value="oldest">{t.common.sortOldest}</option>
            <option value="name">{t.common.sortName}</option>
            <option value="updated">{t.common.sortUpdated}</option>
          </select>
        </div>
      </div>

      <AsyncStateBoundary
        emptyTitleAr="لا توجد أغراض مطابقة"
        emptyTitleEn="No Matching Items Found"
        emptyDescAr="لم نتمكن من العثور على أغراض تطابق معايير البحث الحالية."
        emptyDescEn="No registered items match your current search filter."
        emptyActionLabelAr={t.workspaceNav.addItem}
        emptyActionLabelEn={t.workspaceNav.addItem}
        onEmptyAction={() => navigate('add-item')}
      >
        {filteredItems.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1A2B] p-10 text-center space-y-3">
            <Briefcase className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-base font-bold text-[#17243A] dark:text-white">
              {items.length === 0
                ? lang === 'ar'
                  ? 'لا توجد أغراض مسجلة في حسابك بعد'
                  : 'You have no registered items yet'
                : lang === 'ar'
                ? 'لا توجد نتائج مطابقة لبحثك الحالي'
                : 'No items match your current filter'}
            </p>
            {items.length === 0 ? (
              <button
                type="button"
                onClick={() => navigate('add-item')}
                className="px-4 py-2 rounded-xl bg-[#0F9D8E] hover:bg-[#0D8A7D] text-white text-xs font-bold transition-colors"
              >
                {t.workspaceNav.addItem}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('all');
                  setStatusFilter('all');
                  setGroupFilter('all');
                }}
                className="px-4 py-2 rounded-xl bg-[#0F9D8E] hover:bg-[#0D8A7D] text-white text-xs font-bold transition-colors"
              >
                {lang === 'ar' ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredItems.map((item) => {
              const linkedTpl = designs.find((d) => d.id === item.designId);
              const itemPrivacy = resolveItemPrivacySettings(item);
              const effectiveQrMode = item.qrMode || 'individual';
              const isPublicLive =
                effectiveQrMode === 'individual' &&
                itemPrivacy.publicPageEnabled &&
                item.status !== 'Archived';

              return (
              <div
                key={item.id}
                data-testid={`item-card-${item.id}`}
                className={`rounded-2xl border p-6 flex flex-col justify-between gap-5 findit-card-hover ${
                  selectedPrintIds.includes(item.id)
                    ? 'border-[#2563EB] ring-2 ring-[#2563EB]/20 bg-white dark:bg-[#0F1A2B]'
                    : item.status === 'Archived'
                    ? 'border-slate-200/70 dark:border-slate-800/70 bg-slate-50/80 dark:bg-[#0B1424] opacity-85'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1A2B]'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <label className="inline-flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-[#2563EB] dark:text-[#19B5A5]">
                        <input
                          type="checkbox"
                          checked={selectedPrintIds.includes(item.id)}
                          onChange={() => togglePrintSelection(item.id)}
                          aria-label={
                            lang === 'ar'
                              ? `تحديد ${item.name} للطباعة الجماعية`
                              : `Select ${item.name} for batch print`
                          }
                        />
                        <span>{lang === 'ar' ? 'تحديد للطباعة' : 'Print'}</span>
                      </label>
                      <span>·</span>
                      <span className="font-mono font-bold text-[#2563EB] dark:text-[#19B5A5] tabular-nums">
                        {item.codeSerial}
                      </span>
                      <span>·</span>
                      <span>{t.categories[item.category]}</span>
                      {(item.city || item.cityAr || item.cityEn) && (
                        <>
                          <span>·</span>
                          <span>{item.city || (lang === 'ar' ? item.cityAr : item.cityEn)}</span>
                        </>
                      )}
                    </div>
                    <h2 className="text-lg font-extrabold text-[#17243A] dark:text-white">
                      {item.name || (lang === 'ar' ? item.nameAr : item.nameEn)}
                    </h2>
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
                      {item.groupName && (
                        <span className="px-2 py-0.5 rounded-md bg-[#2563EB]/10 text-[#2563EB] dark:text-[#19B5A5]">
                          {item.groupName}
                        </span>
                      )}
                      {linkedTpl && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {lang === 'ar' ? linkedTpl.titleAr : linkedTpl.titleEn}
                        </span>
                      )}
                      {effectiveQrMode === 'shared' ? (
                        <span
                          data-testid={`item-qr-mode-badge-${item.id}`}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md ${
                            item.sharedQrGroupPaused
                              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                              : 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300'
                          }`}
                        >
                          <Layers className="w-3 h-3" />
                          <span>
                            {item.sharedQrGroupPaused
                              ? lang === 'ar'
                                ? `QR مشترك متوقف (${item.sharedQrGroupName || ''})`
                                : `Shared QR Paused (${item.sharedQrGroupName || ''})`
                              : lang === 'ar'
                              ? `QR مشترك: ${item.sharedQrGroupName || ''}`
                              : `Shared QR: ${item.sharedQrGroupName || ''}`}
                          </span>
                        </span>
                      ) : effectiveQrMode === 'unassigned' ? (
                        <span
                          data-testid={`item-qr-mode-badge-${item.id}`}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300"
                        >
                          <GlobeLock className="w-3 h-3" />
                          <span>
                            {lang === 'ar' ? 'بدون QR نشط' : 'No Active QR'}
                          </span>
                        </span>
                      ) : (
                        <span
                          data-testid={`item-qr-mode-badge-${item.id}`}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md ${
                            isPublicLive
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                              : 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
                          }`}
                        >
                          {isPublicLive ? (
                            <Globe className="w-3 h-3" />
                          ) : (
                            <GlobeLock className="w-3 h-3" />
                          )}
                          <span>
                            {isPublicLive
                              ? lang === 'ar'
                                ? 'QR فردي نشط'
                                : 'Individual QR Live'
                              : lang === 'ar'
                              ? 'الصفحة العامة متوقفة'
                              : 'Public Page Paused'}
                          </span>
                        </span>
                      )}
                    </div>
                    {(item.description || item.descriptionAr || item.descriptionEn) && (
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        {item.description || (lang === 'ar' ? item.descriptionAr : item.descriptionEn)}
                      </p>
                    )}
                    <div className="pt-2 flex items-center gap-3">
                      <img
                        src={item.coverUrl || item.imageUrl || getFallbackCoverUrl(item.category)}
                        alt={item.name}
                        className="h-16 w-24 object-cover rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-[#0B1320]"
                      />
                      {item.coverSource && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#0F9D8E]/10 text-[#0F9D8E] dark:text-[#2DD4BF]">
                          {item.coverSource === 'library_matched'
                            ? lang === 'ar'
                              ? 'غلاف مطابق ذكيًا'
                              : 'Smart Matched'
                            : item.coverSource === 'ai_generated'
                            ? lang === 'ar'
                              ? 'غلاف ذكي'
                              : 'Smart Cover'
                            : item.coverSource === 'auto_selected'
                            ? lang === 'ar'
                              ? 'صورة شخصية'
                              : 'Personal Photo'
                            : item.coverSource === 'user_selected'
                            ? lang === 'ar'
                              ? 'غلاف مختار'
                              : 'Selected Cover'
                            : lang === 'ar'
                            ? 'غلاف افتراضي'
                            : 'Midnight Teal Cover'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 hidden sm:block">
                    <QrCodeVector
                      seed={item.codeSerial}
                      primaryColor={
                        item.status === 'Lost'
                          ? '#FF8A65'
                          : item.status === 'Archived'
                          ? '#64748B'
                          : '#2563EB'
                      }
                      accentColor="#19B5A5"
                      size={78}
                    />
                  </div>
                </div>

                {/* Status Quick Selector & Action Bar */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor={`status-${item.id}`}
                      className="text-xs font-bold text-slate-500"
                    >
                      {lang === 'ar' ? 'الحالة:' : 'Status:'}
                    </label>
                    <select
                      id={`status-${item.id}`}
                      value={item.status}
                      onChange={(e) =>
                        updateItemStatusInSession(item.id, e.target.value as ItemStatus)
                      }
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17] text-xs font-bold"
                    >
                      {(Object.keys(t.statuses) as ItemStatus[]).map((st) => (
                        <option key={st} value={st}>
                          {t.statuses[st]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {(effectiveQrMode === 'unassigned' || effectiveQrMode === 'shared') && (
                      <button
                        type="button"
                        data-testid={`btn-restore-individual-qr-${item.id}`}
                        onClick={() => void restoreItemIndividualQrInSession(item.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#19B5A5]/15 text-[#0F9D8E] dark:text-[#19B5A5] text-xs font-bold hover:bg-[#19B5A5]/25"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>
                          {lang === 'ar' ? 'إعادة تفعيل QR الفردي' : 'Restore Individual QR'}
                        </span>
                      </button>
                    )}

                    {item.status === 'Archived' ? (
                      <button
                        type="button"
                        onClick={() => reactivateItemInSession(item.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#19B5A5]/15 text-[#17243A] dark:text-[#19B5A5] text-xs font-bold hover:bg-[#19B5A5]/25"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{t.common.reactivateItem}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => archiveItemInSession(item.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:border-[#FF8A65]"
                      >
                        <Archive className="w-3.5 h-3.5" />
                        <span>{t.common.archiveItem}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        navigate('print-studio', { itemId: item.id, designId: item.designId })
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-[#0F9D8E] dark:text-[#2DD4BF] hover:border-[#0F9D8E]"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>{lang === 'ar' ? 'استوديو الطباعة' : 'Print'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate('item-details', { itemId: item.id })}
                      className="px-3 py-1.5 rounded-lg bg-[#0F9D8E] text-white dark:text-[#07101A] text-xs font-extrabold hover:bg-[#19B5A5]"
                    >
                      {t.common.viewDetails}
                    </button>

                    <button
                      type="button"
                      aria-label={`${t.common.deleteItem} ${item.name}`}
                      onClick={() =>
                        requestConfirm({
                          title:
                            lang === 'ar'
                              ? 'تأكيد حذف الغرض المسجل نهائيًا'
                              : 'Confirm Deleting Registered Item',
                          description:
                            lang === 'ar'
                              ? `هل أنت متأكد من حذف "${item.name}" (${item.codeSerial}) نهائيًا من قاعدة البيانات؟ لا يمكن التراجع عن هذا الإجراء.`
                              : `Are you sure you want to permanently delete "${item.name}" (${item.codeSerial})? This action cannot be undone.`,
                          confirmLabel: t.common.deleteItem,
                          variant: 'danger',
                          onConfirm: () => {
                            void deleteItemInSession(item.id);
                          },
                        })
                      }
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </AsyncStateBoundary>

      <SmartRelatedServices currentPage="my-items" />

      <BatchPrintStudioModal
        isOpen={batchPrintOpen}
        onClose={() => setBatchPrintOpen(false)}
        initialItemIds={batchPrintQueueIds}
      />
    </div>
  );
};

export const AddItemPage: React.FC = () => {
  const {
    lang,
    t,
    designs,
    groups,
    issuedLicenses,
    selectedDesignId,
    pendingItemDraft,
    savePendingItemDraft,
    clearPendingItemDraft,
    profile,
    createGroupInSession,
    addNewItemInSession,
    navigate,
  } = useApp();

  const activeDesigns = useMemo(
    () => designs.filter((d) => (d.status || 'published') === 'published'),
    [designs]
  );

  const purchasedTemplateIds = useMemo(() => {
    const nowMs = Date.now();
    const set = new Set<string>();
    for (const lic of issuedLicenses) {
      if (lic.status !== 'active') continue;
      if (lic.expiresAt && Date.parse(lic.expiresAt) <= nowMs) continue;
      set.add(lic.templateId);
    }
    return set;
  }, [issuedLicenses]);

  const safeDefaultDesignId = useMemo(() => {
    const preselected = activeDesigns.find((d) => d.id === selectedDesignId);
    if (
      preselected &&
      canAccessTemplateByPlanOrPurchase({
        template: preselected,
        userPlan: profile.plan,
        purchasedTemplateIds,
      })
    ) {
      return preselected.id;
    }
    return getDefaultUnlockedTemplateId(activeDesigns, profile.plan, purchasedTemplateIds);
  }, [activeDesigns, selectedDesignId, profile.plan, purchasedTemplateIds]);

  const accountMethods = useMemo(() => ensureProfileContactMethods(profile), [profile]);
  const defaultSelectedMethodIds = useMemo(
    () =>
      accountMethods
        .filter((m) => m.isActive)
        .slice(0, profile.contactMethodsLimit || 2)
        .map((m) => m.id),
    [accountMethods, profile.contactMethodsLimit]
  );

  const [draft, setDraft] = useState<NewItemDraft>(() => {
    if (pendingItemDraft) {
      return {
        ...pendingItemDraft,
        designId: pendingItemDraft.designId || safeDefaultDesignId,
      };
    }
    const defaultChannels = buildChannelPreferenceFromSelectedMethods({
      selectedMethodIds: defaultSelectedMethodIds,
      accountMethods,
      anonymousRelayOnly: false,
    });
    return {
      name: '',
      category: 'electronics',
      groupId: null,
      description: '',
      imageUrl: '',
      coverUrl: '',
      coverSource: 'fallback',
      originalImages: [],
      selectedContactMethodIds: defaultChannels.selectedMethodIds,
      finderNote:
        lang === 'ar'
          ? 'شكرًا لأمانتك! يرجى التواصل معي عبر القنوات الموضحة أدناه لتنسيق استلام الغرض.'
          : 'Thank you for finding my item! Please reach out via the approved channels below to coordinate return.',
      city: '',
      rewardOffered: false,
      rewardAmountText: '',
      designId: safeDefaultDesignId,
      showPhone: defaultChannels.showPhone,
      showWhatsapp: defaultChannels.showWhatsapp,
      showEmail: defaultChannels.showEmail,
      showTelegram: defaultChannels.showTelegram,
      anonymousRelayOnly: false,
      customPhone: defaultChannels.customPhone || profile.phone || '',
      customWhatsapp: defaultChannels.customWhatsapp || profile.whatsapp || '',
      customEmail: defaultChannels.customEmail || profile.email || '',
      customTelegram: defaultChannels.customTelegram || profile.telegram || '',
      privacySettings: { ...DEFAULT_ITEM_PRIVACY_SETTINGS },
    };
  });

  const hasUserEditedContactsRef = useRef(false);

  // Sync template choice cleanly whenever returning from Full Library / Details with pendingItemDraft
  useEffect(() => {
    if (pendingItemDraft?.designId && pendingItemDraft.designId !== draft.designId) {
      setDraft((prev) => ({
        ...pendingItemDraft,
        designId: pendingItemDraft.designId,
      }));
    }
  }, [pendingItemDraft]);

  // Hydrate default active contact methods on cold page loads once profile finishes loading
  useEffect(() => {
    if (hasUserEditedContactsRef.current) return;
    if (draft.anonymousRelayOnly) return;
    if ((draft.selectedContactMethodIds || []).length > 0) return;
    if (defaultSelectedMethodIds.length === 0) return;

    const synced = buildChannelPreferenceFromSelectedMethods({
      selectedMethodIds: defaultSelectedMethodIds,
      accountMethods,
      anonymousRelayOnly: false,
    });
    setDraft((prev) => ({
      ...prev,
      selectedContactMethodIds: synced.selectedMethodIds,
      showPhone: synced.showPhone,
      showWhatsapp: synced.showWhatsapp,
      showEmail: synced.showEmail,
      showTelegram: synced.showTelegram,
      customPhone: synced.customPhone || prev.customPhone,
      customWhatsapp: synced.customWhatsapp || prev.customWhatsapp,
      customEmail: synced.customEmail || prev.customEmail,
      customTelegram: synced.customTelegram || prev.customTelegram,
    }));
  }, [accountMethods, defaultSelectedMethodIds, draft.anonymousRelayOnly, draft.selectedContactMethodIds]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [inlineGroupOpen, setInlineGroupOpen] = useState(false);
  const [inlineGroupName, setInlineGroupName] = useState('');
  const [creatingInlineGroup, setCreatingInlineGroup] = useState(false);

  const chosenDesign =
    designs.find((d) => d.id === draft.designId) ?? activeDesigns[0] ?? designs[0];
  const canAddMore = canAddOrReactivateItem(profile.activeItemsCount, profile.activeItemsLimit);
  const contactLimit = profile.contactMethodsLimit || 2;
  const activeChannelCount = countEnabledContactMethods({
    showPhone: draft.showPhone,
    showWhatsapp: draft.showWhatsapp,
    showEmail: draft.showEmail,
    showTelegram: draft.showTelegram,
    anonymousRelayOnly: draft.anonymousRelayOnly,
  });

  const livePreviewComposed = useMemo(() => {
    if (!chosenDesign) return null;
    return composeItemTemplateDesignSvg({
      design: chosenDesign,
      codeSerial: draft.name.trim() ? `FQR-PREVIEW-${draft.name.trim().slice(0, 6).toUpperCase()}` : 'FQR-2026-NEW',
      mode: 'clean',
    });
  }, [chosenDesign, draft.name]);

  const privacy = resolveItemPrivacySettings({
    privacySettings: draft.privacySettings as ItemPrivacySettings,
  });

  const updatePrivacyFlag = (key: keyof ItemPrivacySettings, value: boolean) => {
    setDraft((prev) => ({
      ...prev,
      privacySettings: {
        ...DEFAULT_ITEM_PRIVACY_SETTINGS,
        ...(prev.privacySettings || {}),
        [key]: value,
      },
    }));
  };

  const handleCreateInlineGroup = async () => {
    if (!inlineGroupName.trim() || creatingInlineGroup) return;
    setCreatingInlineGroup(true);
    try {
      const created = await createGroupInSession(inlineGroupName.trim());
      if (created) {
        setDraft((prev) => ({ ...prev, groupId: created.id }));
        setInlineGroupName('');
        setInlineGroupOpen(false);
      }
    } finally {
      setCreatingInlineGroup(false);
    }
  };

  const handleOpenFullLibraryWithDraft = () => {
    savePendingItemDraft(draft, true);
    navigate('design-library');
  };

  const handleInspectTemplateDetailsWithDraft = (designId: string) => {
    savePendingItemDraft(draft, true);
    navigate('template-details', { designId });
  };

  const handleCancelDraft = () => {
    clearPendingItemDraft();
    navigate('my-items');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateItemDraft(draft, {
      activeItemsCount: profile.activeItemsCount,
      activeItemsLimit: profile.activeItemsLimit,
      contactMethodsLimit: contactLimit,
    });
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const created = await addNewItemInSession(draft);
      if (created) {
        clearPendingItemDraft();
        navigate('item-details', { itemId: created.id });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17243A] dark:text-white">
            {t.workspaceNav.addItem}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            {lang === 'ar'
              ? `أدخل بيانات غرضك ومعلومات التواصل، ثم اختر القالب المناسب في نهاية النموذج لتوليد تصميمك المدمج بكود QR فريد (${profile.activeItemsCount}/${profile.activeItemsLimit} نشطة في باقة ${profile.plan}).`
              : `Enter your item details and recovery channels, then pick a template at the end to generate your composited QR sticker (${profile.activeItemsCount}/${profile.activeItemsLimit} active on ${profile.plan}).`}
          </p>
        </div>
        <button
          type="button"
          onClick={handleCancelDraft}
          className="text-xs sm:text-sm font-bold text-slate-500 hover:text-[#17243A] dark:hover:text-white"
        >
          {t.common.cancel}
        </button>
      </div>

      {/* Quota Warning Banner when plan limit reached */}
      {!canAddMore && (
        <div
          data-testid="quota-limit-banner"
          className="rounded-2xl border-2 border-[#FF8A65] bg-[#FF8A65]/10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-[#FF8A65] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-extrabold text-[#17243A] dark:text-white">
                {lang === 'ar'
                  ? `وصلت إلى الحد الأقصى لباقة ${profile.plan} (${profile.activeItemsLimit} أغراض نشطة كحد أقصى)`
                  : `${profile.plan} Plan Limit Reached (Maximum ${profile.activeItemsLimit} Active Items)`}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {t.validation.QUOTA_LIMIT_REACHED}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('my-items')}
            className="px-4 py-2.5 rounded-xl bg-[#17243A] text-white text-xs font-bold shrink-0"
          >
            {lang === 'ar' ? 'إدارة وأرشفة الأغراض الحالية' : 'Manage & Archive Existing Items'}
          </button>
        </div>
      )}

      {errors.quota && (
        <div
          role="alert"
          className="rounded-xl border border-red-300 bg-red-50 dark:bg-red-950/40 dark:border-red-800 p-4 text-xs font-bold text-red-700 dark:text-red-300"
        >
          {t.validation[errors.quota as keyof typeof t.validation] || errors.quota}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Column */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="lg:col-span-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1A2B] p-6 sm:p-8 space-y-6"
        >
          {/* Step 1: Item Basics */}
          <div className="space-y-4">
            <h2 className="text-sm font-extrabold text-[#17243A] dark:text-white">
              {lang === 'ar' ? '١. بيانات الغرض والمجموعة' : '1. Item Information & Group'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="item-name"
                  className="block text-xs font-bold text-[#17243A] dark:text-slate-200 mb-1.5"
                >
                  {lang === 'ar' ? 'اسم الغرض *' : 'Item Name *'}
                </label>
                <input
                  id="item-name"
                  type="text"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder={
                    lang === 'ar' ? 'مثال: كاميرا Sony A7IV' : 'e.g., Sony A7IV Mirrorless Camera'
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17] text-sm"
                />
                {errors.name && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {t.validation[errors.name as keyof typeof t.validation]}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="item-category"
                  className="block text-xs font-bold text-[#17243A] dark:text-slate-200 mb-1.5"
                >
                  {lang === 'ar' ? 'نوع / فئة الغرض *' : 'Item Category *'}
                </label>
                <select
                  id="item-category"
                  value={draft.category}
                  onChange={(e) =>
                    setDraft({ ...draft, category: e.target.value as ItemCategory })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17] text-sm"
                >
                  {(Object.keys(t.categories) as ItemCategory[]).map((cat) => (
                    <option key={cat} value={cat}>
                      {t.categories[cat]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Group Selector + Inline Creator */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="item-group"
                    className="block text-xs font-bold text-[#17243A] dark:text-slate-200"
                  >
                    {lang === 'ar' ? 'المجموعة (اختياري)' : 'Item Group (Optional)'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setInlineGroupOpen((prev) => !prev)}
                    className="text-[11px] font-bold text-[#2563EB] dark:text-[#19B5A5] hover:underline"
                  >
                    {lang === 'ar' ? '+ مجموعة جديدة' : '+ New Group'}
                  </button>
                </div>
                <select
                  id="item-group"
                  value={draft.groupId || ''}
                  onChange={(e) =>
                    setDraft({ ...draft, groupId: e.target.value || null })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17] text-sm"
                >
                  <option value="">
                    {lang === 'ar' ? 'بدون مجموعة' : 'No Group'}
                  </option>
                  {groups.map((grp) => (
                    <option key={grp.id} value={grp.id}>
                      {grp.name}
                    </option>
                  ))}
                </select>
                {inlineGroupOpen && (
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="text"
                      value={inlineGroupName}
                      onChange={(e) => setInlineGroupName(e.target.value)}
                      placeholder={lang === 'ar' ? 'اسم المجموعة...' : 'Group name...'}
                      aria-label={lang === 'ar' ? 'اسم المجموعة الجديدة' : 'New group name'}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17] text-xs"
                    />
                    <button
                      type="button"
                      disabled={creatingInlineGroup || inlineGroupName.trim().length < 2}
                      onClick={handleCreateInlineGroup}
                      className="px-3 py-1.5 rounded-lg bg-[#2563EB] text-white text-xs font-bold disabled:opacity-50"
                    >
                      {lang === 'ar' ? 'إضافة' : 'Add'}
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label
                  htmlFor="item-city"
                  className="block text-xs font-bold text-[#17243A] dark:text-slate-200 mb-1.5"
                >
                  {lang === 'ar' ? 'المدينة / الموقع المعتاد' : 'City / Home Base'}
                </label>
                <input
                  id="item-city"
                  type="text"
                  value={draft.city}
                  onChange={(e) => setDraft({ ...draft, city: e.target.value })}
                  placeholder={
                    lang === 'ar' ? 'مثال: الرياض، دبي، لندن...' : 'e.g., Riyadh, Dubai, London...'
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17] text-sm"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="item-desc"
                className="block text-xs font-bold text-[#17243A] dark:text-slate-200 mb-1.5"
              >
                {lang === 'ar'
                  ? 'وصف الغرض ومميزاته (اختياري)'
                  : 'Item Description (Optional)'}
              </label>
              <textarea
                id="item-desc"
                rows={2}
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                placeholder={
                  lang === 'ar'
                    ? 'اللون، الموديل، أو علامات تساعد على تمييز الغرض...'
                    : 'Color, model, or distinguishing details...'
                }
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17] text-sm"
              />
              {errors.description && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  {t.validation[errors.description as keyof typeof t.validation]}
                </p>
              )}
            </div>

            {/* Unified Smart Cover Manager (Multi-Photo Upload Auto-Select + AI Cover Generation + Fallback) */}
            <SmartCoverManager
              entityType="item"
              entityName={draft.name}
              category={draft.category}
              description={draft.description}
              value={{
                coverUrl: draft.coverUrl || draft.imageUrl || '',
                coverSource: draft.coverSource || 'fallback',
                originalImages: draft.originalImages || [],
              }}
              onChange={(nextCover) =>
                setDraft((prev) => ({
                  ...prev,
                  coverUrl: nextCover.coverUrl,
                  imageUrl: nextCover.coverUrl,
                  coverSource: nextCover.coverSource,
                  originalImages: nextCover.originalImages,
                }))
              }
            />
          </div>

          {/* Step 2: Recovery Instructions & Central Contact Methods */}
          <div className="pt-5 border-t border-slate-200 dark:border-slate-800 space-y-4">
            <h2 className="text-sm font-extrabold text-[#17243A] dark:text-white">
              {lang === 'ar'
                ? '٢. تعليمات الاسترجاع وطرق التواصل والخصوصية'
                : '2. Recovery Instructions, Contact Methods & Privacy'}
            </h2>
            <div>
              <label
                htmlFor="finder-note"
                className="block text-xs font-bold text-[#17243A] dark:text-slate-200 mb-1.5"
              >
                {lang === 'ar'
                  ? 'تعليمات الاسترجاع (الرسالة التي تظهر لمن يمسح الكود) *'
                  : 'Recovery Instructions (Shown to Finder Upon Scan) *'}
              </label>
              <textarea
                id="finder-note"
                rows={2}
                value={draft.finderNote}
                onChange={(e) => setDraft({ ...draft, finderNote: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17] text-sm"
              />
              {errors.finderNote && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  {t.validation[errors.finderNote as keyof typeof t.validation]}
                </p>
              )}
            </div>

            <ContactMethodsSelector
              selectedMethodIds={draft.selectedContactMethodIds || []}
              anonymousRelayOnly={draft.anonymousRelayOnly}
              onChange={(nextSel) => {
                hasUserEditedContactsRef.current = true;
                const synced = buildChannelPreferenceFromSelectedMethods({
                  selectedMethodIds: nextSel.selectedMethodIds,
                  accountMethods,
                  anonymousRelayOnly: nextSel.anonymousRelayOnly,
                });
                setDraft((prev) => ({
                  ...prev,
                  selectedContactMethodIds: nextSel.selectedMethodIds,
                  anonymousRelayOnly: nextSel.anonymousRelayOnly,
                  showPhone: synced.showPhone,
                  showWhatsapp: synced.showWhatsapp,
                  showEmail: synced.showEmail,
                  showTelegram: synced.showTelegram,
                  customPhone: synced.customPhone,
                  customWhatsapp: synced.customWhatsapp,
                  customEmail: synced.customEmail,
                  customTelegram: synced.customTelegram,
                }));
              }}
            />

            {errors.channels && (
              <p className="text-xs text-red-600 dark:text-red-400">
                {t.validation[errors.channels as keyof typeof t.validation] || errors.channels}
              </p>
            )}

            {/* Granular Privacy Controls for Public Recovery Page */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <h3 className="text-xs font-extrabold text-[#17243A] dark:text-white flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-[#19B5A5]" />
                <span>
                  {lang === 'ar'
                    ? 'إعدادات خصوصية صفحة الاسترداد العامة'
                    : 'Public Recovery Page Privacy Controls'}
                </span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#F4F7FB] dark:bg-[#070D17] border border-slate-200/80 dark:border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={privacy.publicPageEnabled}
                    onChange={(e) => updatePrivacyFlag('publicPageEnabled', e.target.checked)}
                  />
                  <span className="font-semibold">
                    {lang === 'ar' ? 'تفعيل الصفحة العامة فورًا' : 'Activate Public Recovery Page'}
                  </span>
                </label>
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#F4F7FB] dark:bg-[#070D17] border border-slate-200/80 dark:border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={privacy.showDescription}
                    onChange={(e) => updatePrivacyFlag('showDescription', e.target.checked)}
                  />
                  <span className="font-semibold">
                    {lang === 'ar' ? 'إظهار وصف الغرض للمكتشف' : 'Show Item Description'}
                  </span>
                </label>
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#F4F7FB] dark:bg-[#070D17] border border-slate-200/80 dark:border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={privacy.showCity}
                    onChange={(e) => updatePrivacyFlag('showCity', e.target.checked)}
                  />
                  <span className="font-semibold">
                    {lang === 'ar' ? 'إظهار المدينة في الصفحة العامة' : 'Show City on Public Page'}
                  </span>
                </label>
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#F4F7FB] dark:bg-[#070D17] border border-slate-200/80 dark:border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={privacy.allowFinderMessages}
                    onChange={(e) => updatePrivacyFlag('allowFinderMessages', e.target.checked)}
                  />
                  <span className="font-semibold">
                    {lang === 'ar' ? 'السماح بإرسال رسائل من المكتشف' : 'Allow Finder Messages'}
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Step 3 (At the End): Compact 3-Card Template Carousel + Browse Full Library */}
          <div className="pt-5 border-t border-slate-200 dark:border-slate-800">
            <ItemTemplateCarousel
              selectedDesignId={draft.designId}
              onSelectDesign={(id) => setDraft((prev) => ({ ...prev, designId: id }))}
              onOpenFullLibrary={handleOpenFullLibraryWithDraft}
              onInspectDetails={handleInspectTemplateDetailsWithDraft}
              previewSeed={draft.name ? `FQR-${draft.name.slice(0, 6).toUpperCase()}` : 'FQR-2026-NEW'}
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleCancelDraft}
              className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-bold"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-[#0F9D8E] hover:bg-[#19B5A5] disabled:opacity-50 text-white dark:text-[#07101A] text-sm font-extrabold transition-colors"
            >
              {submitting
                ? lang === 'ar'
                  ? 'جارٍ الحفظ وتوليد التصميم...'
                  : 'Saving & Compositing...'
                : lang === 'ar'
                ? 'حفظ الغرض وتوليد التصميم وكود QR'
                : 'Save Item & Generate Composited QR'}
            </button>
          </div>
        </form>

        {/* Sticky Live Composited Template + QR Preview Column */}
        <div className="lg:col-span-4 lg:sticky lg:top-20 self-start rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E192B] p-6 space-y-5">
          <h2 className="text-sm font-bold text-[#0B1320] dark:text-white">
            {lang === 'ar'
              ? 'معاينة حية لتركيب الكود داخل القالب'
              : 'Live Template + QR Composition Preview'}
          </h2>
          <div className="rounded-xl bg-[#F4F8FA] dark:bg-[#0B1320] p-4 flex flex-col items-center text-center border border-slate-200 dark:border-slate-800">
            {livePreviewComposed && (
              <div
                data-testid="add-item-live-composite-preview"
                className="w-full max-w-[300px] [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-h-[260px] [&>svg]:mx-auto"
                dangerouslySetInnerHTML={{ __html: livePreviewComposed.svgMarkup }}
              />
            )}
            <p className="text-sm font-bold text-[#0B1320] dark:text-white mt-4">
              {draft.name || (lang === 'ar' ? 'غرض جديد' : 'New Registered Item')}
            </p>
            {chosenDesign && (
              <>
                <p className="text-xs text-slate-500 mt-1">
                  {lang === 'ar' ? chosenDesign.titleAr : chosenDesign.titleEn}
                </p>
                <p className="text-[11px] font-mono text-slate-400 mt-1" dir="ltr">
                  {chosenDesign.dimensionsMm} · {chosenDesign.weatherproofRating}
                </p>
              </>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {lang === 'ar'
              ? 'عند الحفظ، يُولَّد رقم تسلسلي فريد وكود QR قياسي مرتبط بصفحة الاسترداد العامة، ويُركَّب تلقائيًا داخل مساحة الكود المخصصة في القالب المختار دون تعديل القالب الأصلي.'
              : 'Upon saving, a unique serial and ISO-18004 QR linked to your public recovery page are composited into the selected template without modifying the original template.'}
          </p>
        </div>
      </div>

      <SmartRelatedServices currentPage="add-item" />
    </div>
  );
};

export const ItemDetailsPage: React.FC = () => {
  const {
    lang,
    t,
    items,
    groups,
    designs,
    profile,
    selectedItemId,
    navigate,
    updateItemStatusInSession,
    updateItemDetailsInSession,
    archiveItemInSession,
    reactivateItemInSession,
    deleteItemInSession,
    restoreItemIndividualQrInSession,
    requestConfirm,
  } = useApp();

  const item = items.find((i) => i.id === selectedItemId) ?? items[0];
  const design = designs.find((d) => d.id === item?.designId) ?? designs[0];

  const accountMethods = useMemo(() => ensureProfileContactMethods(profile), [profile]);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<ItemCategory>('electronics');
  const [editGroupId, setEditGroupId] = useState<string>('');
  const [editDesignId, setEditDesignId] = useState<string>('');
  const [editCity, setEditCity] = useState('');
  const [editCoverUrl, setEditCoverUrl] = useState('');
  const [editCoverSource, setEditCoverSource] = useState<CoverSourceType>('fallback');
  const [editOriginalImages, setEditOriginalImages] = useState<string[]>([]);
  const [editDescription, setEditDescription] = useState('');
  const [editInstructions, setEditInstructions] = useState('');
  const [editSelectedMethodIds, setEditSelectedMethodIds] = useState<string[]>([]);
  const [editAnonymous, setEditAnonymous] = useState(false);
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [savingPrivacyKey, setSavingPrivacyKey] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setEditName(item.name || (lang === 'ar' ? item.nameAr : item.nameEn));
      setEditCategory(item.category);
      setEditGroupId(item.groupId || '');
      setEditDesignId(item.designId);
      setEditCity(item.city || (lang === 'ar' ? item.cityAr : item.cityEn));
      setEditCoverUrl(item.coverUrl || item.imageUrl || '');
      setEditCoverSource(item.coverSource || 'fallback');
      setEditOriginalImages(item.originalImages || (item.imageUrl ? [item.imageUrl] : []));
      setEditDescription(
        item.description || (lang === 'ar' ? item.descriptionAr : item.descriptionEn)
      );
      setEditInstructions(
        item.recoveryInstructions || (lang === 'ar' ? item.finderNoteAr : item.finderNoteEn)
      );
      const initialIds =
        item.selectedContactMethodIds ||
        item.contactChannels.selectedMethodIds ||
        accountMethods
          .filter((m) => m.isActive)
          .slice(0, profile.contactMethodsLimit || 2)
          .map((m) => m.id);
      setEditSelectedMethodIds(initialIds);
      setEditAnonymous(item.contactChannels.anonymousRelayOnly);
      setEditErrors({});
    }
  }, [item, lang, accountMethods, profile.contactMethodsLimit]);

  if (!item) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1A2B] p-10 text-center space-y-3">
        <p className="text-base font-bold text-[#17243A] dark:text-white">
          {lang === 'ar' ? 'لم يتم العثور على الغرض المطلوب' : 'Item not found'}
        </p>
        <button
          type="button"
          onClick={() => navigate('my-items')}
          className="px-4 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-bold"
        >
          {t.workspaceNav.myItems}
        </button>
      </div>
    );
  }

  const itemPrivacy = resolveItemPrivacySettings(item);

  const handleTogglePrivacyField = async (key: keyof ItemPrivacySettings) => {
    if (savingPrivacyKey) return;
    setSavingPrivacyKey(key);
    try {
      await updateItemDetailsInSession(item.id, {
        privacySettings: {
          ...itemPrivacy,
          [key]: !itemPrivacy[key],
        },
      });
    } finally {
      setSavingPrivacyKey(null);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    const syncedChannels = buildChannelPreferenceFromSelectedMethods({
      selectedMethodIds: editSelectedMethodIds,
      accountMethods,
      anonymousRelayOnly: editAnonymous,
    });
    const payload = {
      name: editName.trim(),
      category: editCategory,
      groupId: editGroupId || null,
      designId: editDesignId || item.designId,
      city: editCity.trim(),
      imageUrl: editCoverUrl.trim(),
      coverUrl: editCoverUrl.trim(),
      coverSource: editCoverSource,
      originalImages: editOriginalImages,
      selectedContactMethodIds: editSelectedMethodIds,
      description: editDescription.trim(),
      recoveryInstructions: editInstructions.trim(),
      contactChannels: {
        ...item.contactChannels,
        ...syncedChannels,
      },
    };
    const check = validateItemUpdate(payload, profile.contactMethodsLimit || 2);
    if (!check.valid) {
      setEditErrors(check.errors);
      return;
    }
    setEditErrors({});
    const ok = await updateItemDetailsInSession(item.id, payload);
    if (ok) {
      setIsEditing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate('my-items')}
            className="text-xs font-bold text-[#2563EB] dark:text-[#19B5A5] hover:underline mb-1 block"
          >
            {lang === 'ar' ? '← العودة إلى قائمة أغراضي' : '← Back to My Items'}
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17243A] dark:text-white">
            {item.name || (lang === 'ar' ? item.nameAr : item.nameEn)}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
            <span className="font-mono font-bold text-[#2563EB] dark:text-[#19B5A5] tabular-nums">
              {item.codeSerial}
            </span>
            <span>·</span>
            <span>{t.categories[item.category]}</span>
            <span>·</span>
            <span>{t.statuses[item.status]}</span>
            {item.groupName && (
              <>
                <span>·</span>
                <span className="px-2 py-0.5 rounded-md bg-[#2563EB]/10 text-[#2563EB] dark:text-[#19B5A5] font-bold">
                  {item.groupName}
                </span>
              </>
            )}
            {(item.city || item.cityAr || item.cityEn) && (
              <>
                <span>·</span>
                <span>{item.city || (lang === 'ar' ? item.cityAr : item.cityEn)}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsEditing((p) => !p)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0F1A2B] text-xs font-bold text-[#17243A] dark:text-white"
          >
            <Edit3 className="w-4 h-4" />
            <span>{isEditing ? t.common.cancel : t.common.editItem}</span>
          </button>

          {item.status === 'Archived' ? (
            <button
              type="button"
              onClick={() => reactivateItemInSession(item.id)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#19B5A5] text-[#070D17] text-xs font-bold"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{t.common.reactivateItem}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => archiveItemInSession(item.id)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0F1A2B] text-xs font-bold text-slate-700 dark:text-slate-200"
            >
              <Archive className="w-4 h-4" />
              <span>{t.common.archiveItem}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() =>
              navigate('found-item', { itemId: item.id, codeSerial: item.codeSerial })
            }
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#19B5A5]/20 text-[#17243A] dark:text-[#19B5A5] text-xs font-bold"
          >
            <Eye className="w-4 h-4" />
            <span>{lang === 'ar' ? 'معاينة صفحة الاسترداد' : 'Open Recovery Page'}</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('print-studio', { itemId: item.id, designId: item.designId })}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#0F9D8E]/40 bg-[#0F9D8E]/10 text-[#0F9D8E] dark:text-[#2DD4BF] text-xs font-bold"
          >
            <Printer className="w-4 h-4" />
            <span>{lang === 'ar' ? 'استوديو الطباعة' : 'Print Studio'}</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('qr-preview', { qrId: item.qrId, itemId: item.id })}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0F9D8E] text-white dark:text-[#07101A] text-xs font-extrabold"
          >
            <QrCode className="w-4 h-4" />
            <span>{t.common.previewQr}</span>
          </button>

          <button
            type="button"
            onClick={() =>
              requestConfirm({
                title:
                  lang === 'ar'
                    ? 'تأكيد حذف الغرض المسجل نهائيًا'
                    : 'Confirm Deleting Registered Item',
                description:
                  lang === 'ar'
                    ? `هل أنت متأكد من حذف "${item.name}" نهائيًا من حسابك؟ سيتم إيقاف صفحة الاسترداد المرتبطة بالكود (${item.codeSerial}) فورًا.`
                    : `Are you sure you want to permanently delete "${item.name}"? Its public recovery page (${item.codeSerial}) will be immediately removed.`,
                confirmLabel: t.common.deleteItem,
                variant: 'danger',
                onConfirm: () => {
                  void deleteItemInSession(item.id).then(() => navigate('my-items'));
                },
              })
            }
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-red-300 dark:border-red-800 text-red-600 text-xs font-bold"
          >
            <Trash2 className="w-4 h-4" />
            <span>{t.common.deleteItem}</span>
          </button>
        </div>
      </div>

      {/* QR Mode Banner when item is in Shared QR Group or Unassigned */}
      {(item.qrMode === 'shared' || item.qrMode === 'unassigned') && (
        <div
          data-testid="item-details-qr-mode-banner"
          className="rounded-2xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="space-y-1 text-xs sm:text-sm text-amber-900 dark:text-amber-200">
            <p className="font-extrabold">
              {item.qrMode === 'shared'
                ? item.sharedQrGroupPaused
                  ? lang === 'ar'
                    ? `هذا الغرض مرتبط بمجموعة QR مشترك متوقفة مؤقتًا (${item.sharedQrGroupName || ''})`
                    : `This item is in a paused Shared QR Group (${item.sharedQrGroupName || ''})`
                  : lang === 'ar'
                  ? `هذا الغرض يعمل حاليًا عبر مجموعة QR المشترك (${item.sharedQrGroupName || ''})`
                  : `This item is currently using a Shared QR Group (${item.sharedQrGroupName || ''})`
                : lang === 'ar'
                ? 'هذا الغرض حاليًا بدون QR نشط (تم حذف مجموعته المشتركة السابقة)'
                : 'This item currently has no active QR (its previous Shared QR Group was deleted)'}
            </p>
            <p className="text-xs opacity-90">
              {lang === 'ar'
                ? `رمز QR الفردي الأصلي (${item.codeSerial}) محفوظ بأمان ويمكنك إعادة تفعيله فورًا بضغطة واحدة.`
                : `Your original individual QR (${item.codeSerial}) is safely preserved and can be restored immediately in one click.`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {item.qrMode === 'shared' && item.sharedQrGroupId && (
              <button
                type="button"
                onClick={() => navigate('shared-qr-groups')}
                className="px-3.5 py-2 rounded-xl border border-amber-400/60 bg-white/80 dark:bg-[#0F1A2B] text-xs font-bold text-[#17243A] dark:text-white"
              >
                {lang === 'ar' ? 'إدارة مجموعة QR المشترك' : 'Manage Shared QR Group'}
              </button>
            )}
            <button
              type="button"
              data-testid="btn-item-details-restore-individual-qr"
              onClick={() => void restoreItemIndividualQrInSession(item.id)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-bold"
            >
              <QrCode className="w-4 h-4" />
              <span>{lang === 'ar' ? 'إعادة تفعيل QR الفردي' : 'Restore Individual QR'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Final Composited Sticker Design Studio (Template + Item's Real ISO-18004 QR) */}
      <ItemCompositedDesignStudio item={item} design={design} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Item Details, Edit Form, Status & Contact Channels */}
        <div className="lg:col-span-8 space-y-6">
          {isEditing ? (
            <form
              onSubmit={handleSaveEdit}
              noValidate
              className="rounded-2xl border border-[#2563EB] bg-white dark:bg-[#0F1A2B] p-6 space-y-5"
            >
              <h2 className="text-base font-bold text-[#17243A] dark:text-white">
                {lang === 'ar'
                  ? 'تعديل بيانات الغرض والمجموعة والقالب'
                  : 'Edit Item Details, Group & Template'}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="edit-item-name"
                    className="block text-xs font-bold text-slate-500 mb-1"
                  >
                    {lang === 'ar' ? 'اسم الغرض' : 'Item Name'}
                  </label>
                  <input
                    id="edit-item-name"
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17] text-sm"
                  />
                  {editErrors.name && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      {t.validation[editErrors.name as keyof typeof t.validation] || editErrors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="edit-item-category"
                    className="block text-xs font-bold text-slate-500 mb-1"
                  >
                    {lang === 'ar' ? 'الفئة' : 'Category'}
                  </label>
                  <select
                    id="edit-item-category"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as ItemCategory)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17] text-sm"
                  >
                    {(Object.keys(t.categories) as ItemCategory[]).map((cat) => (
                      <option key={cat} value={cat}>
                        {t.categories[cat]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="edit-item-group"
                    className="block text-xs font-bold text-slate-500 mb-1"
                  >
                    {lang === 'ar' ? 'المجموعة' : 'Item Group'}
                  </label>
                  <select
                    id="edit-item-group"
                    value={editGroupId}
                    onChange={(e) => setEditGroupId(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17] text-sm"
                  >
                    <option value="">{lang === 'ar' ? 'بدون مجموعة' : 'No Group'}</option>
                    {groups.map((grp) => (
                      <option key={grp.id} value={grp.id}>
                        {grp.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="edit-item-city"
                    className="block text-xs font-bold text-slate-500 mb-1"
                  >
                    {lang === 'ar' ? 'المدينة' : 'City'}
                  </label>
                  <input
                    id="edit-item-city"
                    type="text"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17] text-sm"
                  />
                  {editErrors.city && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      {t.validation[editErrors.city as keyof typeof t.validation] || editErrors.city}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <SmartCoverManager
                    entityType="item"
                    entityName={editName}
                    category={editCategory}
                    description={editDescription}
                    value={{
                      coverUrl: editCoverUrl,
                      coverSource: editCoverSource,
                      originalImages: editOriginalImages,
                    }}
                    onChange={(nextCover) => {
                      setEditCoverUrl(nextCover.coverUrl);
                      setEditCoverSource(nextCover.coverSource);
                      setEditOriginalImages(nextCover.originalImages);
                    }}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="edit-item-desc"
                  className="block text-xs font-bold text-slate-500 mb-1"
                >
                  {lang === 'ar' ? 'وصف الغرض (اختياري)' : 'Description (Optional)'}
                </label>
                <textarea
                  id="edit-item-desc"
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17] text-sm"
                />
                {editErrors.description && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {t.validation[editErrors.description as keyof typeof t.validation] || editErrors.description}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="edit-item-instructions"
                  className="block text-xs font-bold text-slate-500 mb-1"
                >
                  {lang === 'ar' ? 'تعليمات الاسترجاع للمكتشف' : 'Recovery Instructions'}
                </label>
                <textarea
                  id="edit-item-instructions"
                  rows={2}
                  value={editInstructions}
                  onChange={(e) => setEditInstructions(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17] text-sm"
                />
                {editErrors.recoveryInstructions && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {t.validation[editErrors.recoveryInstructions as keyof typeof t.validation] ||
                      editErrors.recoveryInstructions}
                  </p>
                )}
              </div>

              {/* Change Linked Template (keeps codeSerial immutable) */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <ItemTemplatePicker
                  selectedDesignId={editDesignId}
                  onSelectDesign={setEditDesignId}
                  previewSeed={item.codeSerial}
                  compact
                />
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <ContactMethodsSelector
                  selectedMethodIds={editSelectedMethodIds}
                  anonymousRelayOnly={editAnonymous}
                  onChange={(nextSel) => {
                    setEditSelectedMethodIds(nextSel.selectedMethodIds);
                    setEditAnonymous(nextSel.anonymousRelayOnly);
                  }}
                />
              </div>
              {editErrors.channels && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  {t.validation[editErrors.channels as keyof typeof t.validation] || editErrors.channels}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditErrors({});
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#0F9D8E] text-white dark:text-[#07101A] text-xs font-extrabold"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{t.common.saveChanges}</span>
                </button>
              </div>
            </form>
          ) : null}

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1A2B] p-6 space-y-5">
            <h2 className="text-base font-bold text-[#17243A] dark:text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#2563EB]" />
              <span>
                {lang === 'ar'
                  ? 'حالة الغرض والتحكم الفوري'
                  : 'Item Protection Lifecycle Status'}
              </span>
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {(['Active', 'Lost', 'Found', 'Recovered', 'Archived'] as ItemStatus[]).map(
                (st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => updateItemStatusInSession(item.id, st)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-colors ${
                      item.status === st
                        ? st === 'Lost'
                          ? 'bg-[#FF8A65] text-[#070D17] border-[#FF8A65]'
                          : st === 'Archived'
                          ? 'bg-slate-700 text-white border-slate-700'
                          : 'bg-[#2563EB] text-white border-[#2563EB]'
                        : 'bg-[#F4F7FB] dark:bg-[#070D17] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {t.statuses[st]}
                  </button>
                )
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3 text-sm">
              {(item.description || item.descriptionAr || item.descriptionEn) && (
                <div>
                  <span className="text-xs font-bold text-slate-400 block">
                    {lang === 'ar' ? 'وصف الغرض:' : 'Item Description:'}
                  </span>
                  <p className="text-[#17243A] dark:text-slate-200 mt-1">
                    {item.description || (lang === 'ar' ? item.descriptionAr : item.descriptionEn)}
                  </p>
                </div>
              )}
              <div>
                <span className="text-xs font-bold text-slate-400 block">
                  {lang === 'ar'
                    ? 'تعليمات الاسترجاع التي تظهر للمكتشف عند مسح الكود:'
                    : 'Recovery Instructions Displayed to Finder:'}
                </span>
                <p className="text-[#17243A] dark:text-slate-200 mt-1">
                  {item.recoveryInstructions ||
                    (lang === 'ar' ? item.finderNoteAr : item.finderNoteEn)}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 text-xs text-slate-500">
                <div>
                  <span className="font-bold block">
                    {lang === 'ar' ? 'تاريخ الإضافة:' : 'Created At:'}
                  </span>
                  <span className="font-mono">{item.createdAt.slice(0, 10)}</span>
                </div>
                <div>
                  <span className="font-bold block">
                    {lang === 'ar' ? 'آخر تحديث:' : 'Last Updated:'}
                  </span>
                  <span className="font-mono">{item.updatedAt.slice(0, 10)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Configured Contact Channels Matrix */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1A2B] p-6 space-y-4">
            <h2 className="text-base font-bold text-[#17243A] dark:text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#19B5A5]" />
              <span>
                {lang === 'ar'
                  ? 'قنوات التواصل المسموح بظهورها لهذا الغرض'
                  : 'Configured Contact Channels for This Item'}
              </span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
              {[
                {
                  labelAr: 'واتساب المباشر',
                  labelEn: 'WhatsApp Direct',
                  enabled:
                    item.contactChannels.showWhatsapp &&
                    !item.contactChannels.anonymousRelayOnly,
                  val: item.contactChannels.customWhatsapp || '—',
                },
                {
                  labelAr: 'الاتصال الهاتفي',
                  labelEn: 'Phone Call',
                  enabled:
                    item.contactChannels.showPhone &&
                    !item.contactChannels.anonymousRelayOnly,
                  val: item.contactChannels.customPhone || '—',
                },
                {
                  labelAr: 'البريد الإلكتروني',
                  labelEn: 'Email Address',
                  enabled:
                    item.contactChannels.showEmail &&
                    !item.contactChannels.anonymousRelayOnly,
                  val: item.contactChannels.customEmail || '—',
                },
                {
                  labelAr: 'وضع الوسيط المجهول (إخفاء الأرقام)',
                  labelEn: 'Anonymous Relay Mode',
                  enabled: item.contactChannels.anonymousRelayOnly,
                  val: item.contactChannels.anonymousRelayOnly ? 'Active' : 'Off',
                },
              ].map((ch, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-[#F4F7FB] dark:bg-[#070D17] border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-2"
                >
                  <div>
                    <p className="font-bold text-[#17243A] dark:text-white">
                      {lang === 'ar' ? ch.labelAr : ch.labelEn}
                    </p>
                    <p className="text-xs font-mono text-slate-500 mt-0.5" dir="ltr">
                      {ch.val}
                    </p>
                  </div>
                  {ch.enabled ? (
                    <CheckCircle2 className="w-4 h-4 text-[#19B5A5] shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Live Public Page & Granular Privacy Switches + Stats */}
        <div className="lg:col-span-4 space-y-6">
          <div
            data-testid="item-privacy-controls-card"
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1A2B] p-6 space-y-4"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-extrabold text-[#17243A] dark:text-white flex items-center gap-2">
                {itemPrivacy.publicPageEnabled ? (
                  <Globe className="w-4 h-4 text-[#19B5A5]" />
                ) : (
                  <GlobeLock className="w-4 h-4 text-amber-500" />
                )}
                <span>
                  {lang === 'ar'
                    ? 'التحكم في الصفحة العامة والخصوصية'
                    : 'Public Page & Privacy Controls'}
                </span>
              </h2>
            </div>

            <button
              type="button"
              data-testid="toggle-public-page-enabled"
              disabled={savingPrivacyKey !== null}
              onClick={() => handleTogglePrivacyField('publicPageEnabled')}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-extrabold transition-colors flex items-center justify-center gap-2 ${
                itemPrivacy.publicPageEnabled
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-amber-500 hover:bg-amber-600 text-[#070D17]'
              }`}
            >
              {itemPrivacy.publicPageEnabled ? (
                <>
                  <Globe className="w-4 h-4" />
                  <span>
                    {lang === 'ar'
                      ? 'الصفحة العامة مفعّلة (اضغط للإيقاف المؤقت)'
                      : 'Public Page Active (Click to Pause)'}
                  </span>
                </>
              ) : (
                <>
                  <GlobeLock className="w-4 h-4" />
                  <span>
                    {lang === 'ar'
                      ? 'الصفحة العامة متوقفة (اضغط لإعادة التفعيل)'
                      : 'Public Page Paused (Click to Activate)'}
                  </span>
                </>
              )}
            </button>

            <div className="space-y-2 text-xs">
              {(
                [
                  {
                    key: 'showDescription' as const,
                    ar: 'إظهار وصف الغرض في الصفحة العامة',
                    en: 'Show item description publicly',
                  },
                  {
                    key: 'showCity' as const,
                    ar: 'إظهار المدينة في الصفحة العامة',
                    en: 'Show city on public page',
                  },
                  {
                    key: 'showImage' as const,
                    ar: 'إظهار صورة الغرض (إن وُجدت)',
                    en: 'Show item photo (if added)',
                  },
                  {
                    key: 'allowFinderMessages' as const,
                    ar: 'السماح بإرسال رسائل من المكتشف',
                    en: 'Allow internal finder messages',
                  },
                  {
                    key: 'allowFoundReports' as const,
                    ar: 'السماح بزر "عثرت على هذا الغرض"',
                    en: 'Allow "I Found This Item" alert',
                  },
                ] as const
              ).map((row) => (
                <label
                  key={row.key}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-[#F4F7FB] dark:bg-[#070D17] border border-slate-200/70 dark:border-slate-800 cursor-pointer"
                >
                  <span className="font-semibold text-[#17243A] dark:text-slate-200">
                    {lang === 'ar' ? row.ar : row.en}
                  </span>
                  <input
                    type="checkbox"
                    data-testid={`privacy-toggle-${row.key}`}
                    checked={itemPrivacy[row.key]}
                    disabled={savingPrivacyKey !== null}
                    onChange={() => handleTogglePrivacyField(row.key)}
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1A2B] p-6 space-y-4">
            <h2 className="text-sm font-bold text-[#17243A] dark:text-white">
              {lang === 'ar' ? 'إحصائيات الكود والملصق' : 'Tag & Scan Summary'}
            </h2>
            <div className="grid grid-cols-2 gap-2.5 text-xs text-center">
              <div className="p-3 rounded-xl bg-[#F4F7FB] dark:bg-[#070D17]">
                <span className="text-slate-400 block">
                  {lang === 'ar' ? 'مرات المسح' : 'Total Scans'}
                </span>
                <span className="font-mono font-bold text-lg text-[#17243A] dark:text-white tabular-nums">
                  {item.totalScans}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#F4F7FB] dark:bg-[#070D17]">
                <span className="text-slate-400 block">
                  {lang === 'ar' ? 'القالب المرتبط' : 'Linked Template'}
                </span>
                <span className="font-bold text-xs text-[#17243A] dark:text-white line-clamp-1 mt-1">
                  {lang === 'ar' ? design.titleAr : design.titleEn}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SmartRelatedServices currentPage="item-details" contextItemId={item.id} contextDesignId={item.designId} />
    </div>
  );
};
