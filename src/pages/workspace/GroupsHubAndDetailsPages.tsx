import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Download,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  FolderKanban,
  FolderPlus,
  Layers,
  PauseCircle,
  PlayCircle,
  Plus,
  QrCode,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { downloadQrSvgMarkup, QrCodeVector } from '../../components/brand/FindItLogo';
import { SmartCoverManager, SmartCoverValue } from '../../components/workspace/SmartCoverManager';
import { SmartRelatedServices } from '../../components/workspace/SmartRelatedServices';
import { useApp } from '../../context/AppContext';
import { ItemGroup, RegisteredItem, SharedQrGroup } from '../../types/domain';
import { getFallbackCoverUrl } from '../../utils/aiCoverLogic';
import { buildSharedQrRecoveryUrl } from '../../utils/sharedQrLogic';
import { SharedQrGroupsPage } from './SharedQrGroupsPage';

const GROUP_COLOR_SWATCHES = ['#0F9D8E', '#19B5A5', '#0B1320', '#2563EB', '#F59E0B', '#EC4899'];

export const GroupsHubPage: React.FC<{ defaultTab?: 'org' | 'shared' }> = ({ defaultTab }) => {
  const {
    lang,
    isRtl,
    t,
    groups,
    sharedQrGroups,
    items,
    selectedTab,
    navigate,
    requestConfirm,
    createGroupInSession,
    deleteGroupInSession,
  } = useApp();

  const initialTab: 'org' | 'shared' =
    defaultTab || (selectedTab === 'shared' ? 'shared' : 'org');
  const [activeTab, setActiveTab] = useState<'org' | 'shared'>(initialTab);

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    } else if (selectedTab === 'shared' || selectedTab === 'org') {
      setActiveTab(selectedTab);
    }
  }, [defaultTab, selectedTab]);

  // Create Org Group State
  const [isCreateOrgOpen, setIsCreateOrgOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgDesc, setNewOrgDesc] = useState('');
  const [newOrgColor, setNewOrgColor] = useState('#0F9D8E');
  const [newOrgCover, setNewOrgCover] = useState<SmartCoverValue>({
    coverUrl: getFallbackCoverUrl('org_group'),
    coverSource: 'fallback',
    originalImages: [],
  });
  const [creatingOrg, setCreatingOrg] = useState(false);
  const [orgFormError, setOrgFormError] = useState('');

  const itemsCountByOrgGroup = useMemo(() => {
    const map = new Map<string, number>();
    for (const it of items) {
      if (it.groupId) {
        map.set(it.groupId, (map.get(it.groupId) || 0) + 1);
      }
    }
    return map;
  }, [items]);

  const handleCreateOrgSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newOrgName.trim();
    if (trimmed.length < 2 || trimmed.length > 60) {
      setOrgFormError(
        lang === 'ar'
          ? 'يرجى إدخال اسم مجموعة بين حرفين و٦٠ حرفًا.'
          : 'Group name must be between 2 and 60 characters.'
      );
      return;
    }
    setOrgFormError('');
    setCreatingOrg(true);
    const created = await createGroupInSession(trimmed, newOrgColor, {
      description: newOrgDesc.trim(),
      coverUrl: newOrgCover.coverUrl,
      coverSource: newOrgCover.coverSource,
      originalImages: newOrgCover.originalImages,
    });
    setCreatingOrg(false);
    if (created) {
      setNewOrgName('');
      setNewOrgDesc('');
      setNewOrgCover({
        coverUrl: getFallbackCoverUrl('org_group'),
        coverSource: 'fallback',
        originalImages: [],
      });
      setIsCreateOrgOpen(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="groups-hub-page">
      {/* Midnight Teal Header & Segmented Switch */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E192B] p-6 sm:p-7 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0F9D8E]/10 dark:bg-[#19B5A5]/15 text-[#0F9D8E] dark:text-[#2DD4BF] text-xs font-bold">
              <Layers className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'مركز المجموعات الموحد' : 'Unified Groups Hub'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1320] dark:text-white">
              {lang === 'ar'
                ? 'المجموعات التنظيمية ومجموعات QR المشترك'
                : 'Organizational & Shared QR Groups'}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
              {lang === 'ar'
                ? 'فصل واضح بين مجموعات التنظيم الشخصي داخل لوحتك، ومجموعات رمز QR المشترك التي تدمج عدة مقتنيات تحت كود استرداد عام واحد.'
                : 'Clear separation between private Organizational folders in your workspace and Shared QR Groups that unify multiple items under one public QR.'}
            </p>
          </div>

          <div
            role="tablist"
            aria-label={lang === 'ar' ? 'نوع المجموعات' : 'Group Type'}
            className="inline-flex p-1.5 rounded-2xl bg-[#F7FAFC] dark:bg-[#0B1320] border border-slate-200 dark:border-slate-800 shrink-0"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'org'}
              data-testid="tab-org-groups"
              onClick={() => setActiveTab('org')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'org'
                  ? 'bg-[#0F9D8E] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-[#0B1320] dark:hover:text-white'
              }`}
            >
              {lang === 'ar'
                ? `المجموعات التنظيمية (${groups.length})`
                : `Organizational (${groups.length})`}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'shared'}
              data-testid="tab-shared-groups"
              onClick={() => setActiveTab('shared')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'shared'
                  ? 'bg-[#0F9D8E] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-[#0B1320] dark:hover:text-white'
              }`}
            >
              {lang === 'ar'
                ? `مجموعات QR المشترك (${sharedQrGroups.length})`
                : `Shared QR Groups (${sharedQrGroups.length})`}
            </button>
          </div>
        </div>
      </div>

      {/* Tab 1: Organizational Groups */}
      {activeTab === 'org' && (
        <div className="space-y-6" data-testid="org-groups-section">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              {lang === 'ar'
                ? 'المجموعات التنظيمية تساعدك في تصنيف الأغراض (سفر، عمل، أسرة، مركبة) دون تغيير رموز QR الفردية.'
                : 'Organizational groups categorize items cleanly inside your dashboard without altering their individual QR codes.'}
            </div>
            <button
              type="button"
              data-testid="btn-open-create-org-group"
              onClick={() => setIsCreateOrgOpen((p) => !p)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F9D8E] hover:bg-[#0D8A7D] text-white text-xs sm:text-sm font-bold shadow-sm transition-colors"
            >
              <FolderPlus className="w-4 h-4" />
              <span>
                {lang === 'ar' ? 'إنشاء مجموعة تنظيمية' : 'New Organizational Group'}
              </span>
            </button>
          </div>

          {isCreateOrgOpen && (
            <form
              onSubmit={handleCreateOrgSubmit}
              data-testid="create-org-group-form"
              className="rounded-3xl border-2 border-[#0F9D8E]/30 bg-white dark:bg-[#0E192B] p-6 space-y-5 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-lg font-extrabold text-[#0B1320] dark:text-white">
                  {lang === 'ar' ? 'إنشاء مجموعة تنظيمية جديدة' : 'Create Organizational Group'}
                </h2>
                <button
                  type="button"
                  onClick={() => setIsCreateOrgOpen(false)}
                  aria-label={t.common.cancel}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="org-group-name"
                    className="block text-xs font-bold text-[#0B1320] dark:text-slate-200 mb-1.5"
                  >
                    {lang === 'ar' ? 'اسم المجموعة *' : 'Group Name *'}
                  </label>
                  <input
                    id="org-group-name"
                    data-testid="org-group-name-input"
                    type="text"
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    placeholder={
                      lang === 'ar' ? 'مثال: معدات المكتب أو حقيبة السفر' : 'e.g., Office Gear, Travel Kit'
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F7FAFC] dark:bg-[#0B1320] text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="org-group-desc"
                    className="block text-xs font-bold text-[#0B1320] dark:text-slate-200 mb-1.5"
                  >
                    {lang === 'ar' ? 'وصف المجموعة (اختياري)' : 'Description (Optional)'}
                  </label>
                  <input
                    id="org-group-desc"
                    type="text"
                    value={newOrgDesc}
                    onChange={(e) => setNewOrgDesc(e.target.value)}
                    placeholder={
                      lang === 'ar' ? 'وصف موجز لغرض هذه المجموعة...' : 'Brief summary for this collection...'
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F7FAFC] dark:bg-[#0B1320] text-sm"
                  />
                </div>
              </div>

              <div>
                <span className="block text-xs font-bold text-[#0B1320] dark:text-slate-200 mb-2">
                  {lang === 'ar' ? 'اللون المميز' : 'Accent Color'}
                </span>
                <div className="flex flex-wrap gap-2">
                  {GROUP_COLOR_SWATCHES.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => setNewOrgColor(hex)}
                      aria-label={hex}
                      className={`w-8 h-8 rounded-xl border-2 transition-transform ${
                        newOrgColor === hex ? 'scale-110 border-[#0B1320] dark:border-white' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
              </div>

              <SmartCoverManager
                entityType="org_group"
                entityName={newOrgName}
                description={newOrgDesc}
                value={newOrgCover}
                onChange={setNewOrgCover}
              />

              {orgFormError && (
                <p role="alert" className="text-xs font-bold text-red-600 dark:text-red-400">
                  {orgFormError}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOrgOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  data-testid="btn-submit-org-group"
                  disabled={creatingOrg}
                  className="px-5 py-2.5 rounded-xl bg-[#0F9D8E] hover:bg-[#0D8A7D] text-white text-xs sm:text-sm font-bold disabled:opacity-60"
                >
                  {creatingOrg
                    ? lang === 'ar'
                      ? 'جارٍ الحفظ...'
                      : 'Saving...'
                    : lang === 'ar'
                    ? 'حفظ المجموعة التنظيمية'
                    : 'Save Organizational Group'}
                </button>
              </div>
            </form>
          )}

          {groups.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E192B] p-10 text-center space-y-3">
              <FolderKanban className="w-10 h-10 text-[#0F9D8E] mx-auto" />
              <h2 className="text-lg font-extrabold text-[#0B1320] dark:text-white">
                {lang === 'ar' ? 'لا توجد مجموعات تنظيمية بعد' : 'No Organizational Groups Yet'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                {lang === 'ar'
                  ? 'أنشئ أول مجموعة تنظيمية لتجميع مقتنياتك المتشابهة مع غلاف ذكي وتفاصيل واضحة.'
                  : 'Create your first organizational folder with a custom Smart Cover to sort your belongings cleanly.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {groups.map((grp) => {
                const count = itemsCountByOrgGroup.get(grp.id) || 0;
                const cover = grp.coverUrl || getFallbackCoverUrl('org_group');
                return (
                  <div
                    key={grp.id}
                    data-testid={`org-group-card-${grp.id}`}
                    className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E192B] overflow-hidden shadow-sm flex flex-col"
                  >
                    <div className="relative h-36 bg-[#0B1320]">
                      <img src={cover} alt={grp.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0B1320]/80 via-transparent to-transparent" />
                      <span
                        className="absolute top-3 start-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold text-white shadow"
                        style={{ backgroundColor: grp.colorHex || '#0F9D8E' }}
                      >
                        {count} {lang === 'ar' ? 'أغراض' : 'items'}
                      </span>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                      <div>
                        <h3 className="text-base font-extrabold text-[#0B1320] dark:text-white truncate">
                          {grp.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                          {grp.description ||
                            (lang === 'ar'
                              ? 'مجموعة تنظيمية لتصنيف المقتنيات داخل لوحة المستخدم.'
                              : 'Organizational collection folder inside your workspace.')}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() =>
                            navigate('group-details', { groupId: grp.id, groupType: 'org' })
                          }
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0F9D8E] hover:bg-[#0D8A7D] text-white text-xs font-bold transition-colors"
                        >
                          <span>{lang === 'ar' ? 'فتح تفاصيل المجموعة' : 'Open Group Details'}</span>
                          {isRtl ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          type="button"
                          aria-label={lang === 'ar' ? `حذف ${grp.name}` : `Delete ${grp.name}`}
                          onClick={() =>
                            requestConfirm({
                              title: lang === 'ar' ? 'حذف المجموعة التنظيمية' : 'Delete Group',
                              description:
                                lang === 'ar'
                                  ? `هل تريد حذف مجموعة «${grp.name}»؟ ستبقى جميع أغراضك محفوظة وتنتقل لخارج المجموعة فقط.`
                                  : `Delete "${grp.name}"? All linked items remain safely stored without group assignment.`,
                              confirmLabel: lang === 'ar' ? 'حذف المجموعة' : 'Delete',
                              variant: 'danger',
                              onConfirm: () => void deleteGroupInSession(grp.id),
                            })
                          }
                          className="p-2 rounded-xl border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
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
        </div>
      )}

      {/* Tab 2: Shared QR Groups */}
      {activeTab === 'shared' && (
        <div className="space-y-4">
          {sharedQrGroups.length > 0 && (
            <div className="rounded-2xl border border-[#19B5A5]/30 bg-[#0F9D8E]/5 dark:bg-[#19B5A5]/10 p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-xs font-bold text-[#0B1320] dark:text-white">
                <Sparkles className="w-4 h-4 text-[#0F9D8E]" />
                <span>
                  {lang === 'ar'
                    ? 'افتح صفحة تفاصيل أي مجموعة QR مشترك لتخصيص الغلاف الذكي وإدارة الأغراض.'
                    : 'Open Group Details on any Shared QR Group to customize its Smart Cover and manage members.'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {sharedQrGroups.slice(0, 4).map((sg) => (
                  <button
                    key={sg.id}
                    type="button"
                    onClick={() =>
                      navigate('group-details', { groupId: sg.id, groupType: 'shared' })
                    }
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#14233A] border border-slate-200 dark:border-slate-700 text-xs font-bold text-[#0F9D8E] dark:text-[#2DD4BF] hover:border-[#0F9D8E]"
                  >
                    {sg.name} ↗
                  </button>
                ))}
              </div>
            </div>
          )}
          <SharedQrGroupsPage />
        </div>
      )}

      <SmartRelatedServices currentPage="groups" />
    </div>
  );
};

export const GroupDetailsPage: React.FC = () => {
  const {
    lang,
    isRtl,
    t,
    groups,
    sharedQrGroups,
    items,
    selectedGroupId,
    selectedGroupType,
    navigate,
    showToast,
    updateGroupInSession,
    updateSharedQrGroupInSession,
    updateItemDetailsInSession,
    addItemToSharedQrGroupInSession,
    toggleSharedQrItemVisibilityInSession,
    removeItemFromSharedQrGroupInSession,
    restoreItemIndividualQrInSession,
  } = useApp();

  const resolvedType: 'org' | 'shared' =
    selectedGroupType === 'shared' ||
    (!groups.some((g) => g.id === selectedGroupId) &&
      sharedQrGroups.some((g) => g.id === selectedGroupId))
      ? 'shared'
      : 'org';

  const activeOrgGroup: ItemGroup | null =
    resolvedType === 'org'
      ? groups.find((g) => g.id === selectedGroupId) ?? groups[0] ?? null
      : null;

  const activeSharedGroup: SharedQrGroup | null =
    resolvedType === 'shared'
      ? sharedQrGroups.find((g) => g.id === selectedGroupId) ?? sharedQrGroups[0] ?? null
      : null;

  const [nameInput, setNameInput] = useState('');
  const [descInput, setDescInput] = useState('');
  const [colorInput, setColorInput] = useState('#0F9D8E');
  const [coverValue, setCoverValue] = useState<SmartCoverValue>({
    coverUrl: getFallbackCoverUrl('org_group'),
    coverSource: 'fallback',
    originalImages: [],
  });
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (resolvedType === 'org' && activeOrgGroup) {
      setNameInput(activeOrgGroup.name);
      setDescInput(activeOrgGroup.description || '');
      setColorInput(activeOrgGroup.colorHex || '#0F9D8E');
      setCoverValue({
        coverUrl: activeOrgGroup.coverUrl || getFallbackCoverUrl('org_group'),
        coverSource: activeOrgGroup.coverSource || 'fallback',
        originalImages: activeOrgGroup.originalImages || [],
      });
    } else if (resolvedType === 'shared' && activeSharedGroup) {
      setNameInput(activeSharedGroup.name);
      setDescInput(activeSharedGroup.description || '');
      setCoverValue({
        coverUrl: activeSharedGroup.coverUrl || getFallbackCoverUrl('shared_group'),
        coverSource: activeSharedGroup.coverSource || 'fallback',
        originalImages: activeSharedGroup.originalImages || [],
      });
    }
  }, [resolvedType, activeOrgGroup?.id, activeSharedGroup?.id]);

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim() || nameInput.trim().length < 2) {
      showToast(
        'error',
        lang === 'ar' ? 'اسم غير صالح' : 'Invalid Name',
        lang === 'ar' ? 'أدخل اسمًا صحيحًا للمجموعة.' : 'Enter a valid group name.'
      );
      return;
    }
    setSaving(true);
    if (resolvedType === 'org' && activeOrgGroup) {
      await updateGroupInSession(activeOrgGroup.id, {
        name: nameInput.trim(),
        description: descInput.trim(),
        colorHex: colorInput,
        coverUrl: coverValue.coverUrl,
        coverSource: coverValue.coverSource,
        originalImages: coverValue.originalImages,
      });
    } else if (resolvedType === 'shared' && activeSharedGroup) {
      await updateSharedQrGroupInSession(activeSharedGroup.id, {
        name: nameInput.trim(),
        description: descInput.trim(),
        coverUrl: coverValue.coverUrl,
        coverSource: coverValue.coverSource,
        originalImages: coverValue.originalImages,
      });
    }
    setSaving(false);
  };

  if (!activeOrgGroup && !activeSharedGroup) {
    return (
      <div className="space-y-6" data-testid="group-details-empty">
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E192B] p-10 text-center space-y-4">
          <Layers className="w-10 h-10 text-[#0F9D8E] mx-auto" />
          <h1 className="text-xl font-extrabold text-[#0B1320] dark:text-white">
            {lang === 'ar' ? 'لم يتم اختيار مجموعة بعد' : 'No Group Selected Yet'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {lang === 'ar'
              ? 'أنشئ مجموعة تنظيمية أو مجموعة QR مشترك أولًا لعرض تفاصيلها.'
              : 'Create an Organizational or Shared QR Group first to inspect its details.'}
          </p>
          <button
            type="button"
            onClick={() => navigate('groups')}
            className="px-5 py-2.5 rounded-xl bg-[#0F9D8E] text-white text-sm font-bold"
          >
            {lang === 'ar' ? 'الذهاب إلى مركز المجموعات' : 'Go to Groups Hub'}
          </button>
        </div>
        <SmartRelatedServices currentPage="group-details" />
      </div>
    );
  }

  const orgMembers: RegisteredItem[] =
    resolvedType === 'org' && activeOrgGroup
      ? items.filter((it) => it.groupId === activeOrgGroup.id)
      : [];
  const orgCandidates: RegisteredItem[] =
    resolvedType === 'org' && activeOrgGroup
      ? items.filter((it) => it.groupId !== activeOrgGroup.id)
      : [];

  const sharedUrl =
    resolvedType === 'shared' && activeSharedGroup
      ? buildSharedQrRecoveryUrl(activeSharedGroup.shareCode)
      : '';

  return (
    <div className="space-y-6" data-testid="group-details-page">
      {/* Top Breadcrumb + Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate('groups', { tab: resolvedType })}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0E192B] text-xs font-bold text-[#0B1320] dark:text-white hover:border-[#0F9D8E]"
        >
          {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          <span>{lang === 'ar' ? 'العودة لكل المجموعات' : 'Back to Groups Hub'}</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label={lang === 'ar' ? 'اختيار مجموعة' : 'Select Group'}
            value={`${resolvedType}:${activeOrgGroup?.id || activeSharedGroup?.id || ''}`}
            onChange={(e) => {
              const [gt, gid] = e.target.value.split(':');
              if (gid && (gt === 'org' || gt === 'shared')) {
                navigate('group-details', { groupId: gid, groupType: gt });
              }
            }}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0E192B] text-xs font-bold"
          >
            {groups.map((g) => (
              <option key={`org:${g.id}`} value={`org:${g.id}`}>
                [{lang === 'ar' ? 'تنظيمية' : 'Org'}] {g.name}
              </option>
            ))}
            {sharedQrGroups.map((sg) => (
              <option key={`shared:${sg.id}`} value={`shared:${sg.id}`}>
                [Shared QR] {sg.name} ({sg.shareCode})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Group Identity + Smart Cover Editor */}
      <form
        onSubmit={handleSaveChanges}
        className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E192B] p-6 space-y-5 shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#0F9D8E]/10 text-[#0F9D8E] dark:text-[#2DD4BF]">
              {resolvedType === 'shared'
                ? lang === 'ar'
                  ? 'مجموعة QR المشترك'
                  : 'Shared QR Group'
                : lang === 'ar'
                ? 'مجموعة تنظيمية'
                : 'Organizational Group'}
            </span>
            <h1 className="text-2xl font-extrabold text-[#0B1320] dark:text-white mt-2">
              {nameInput || activeOrgGroup?.name || activeSharedGroup?.name}
            </h1>
          </div>

          <button
            type="submit"
            disabled={saving}
            data-testid="btn-save-group-details"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F9D8E] hover:bg-[#0D8A7D] text-white text-xs sm:text-sm font-bold disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? '...' : t.common.saveChanges}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="gd-name-input"
              className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5"
            >
              {lang === 'ar' ? 'اسم المجموعة *' : 'Group Name *'}
            </label>
            <input
              id="gd-name-input"
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F7FAFC] dark:bg-[#0B1320] text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="gd-desc-input"
              className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5"
            >
              {lang === 'ar' ? 'وصف المجموعة' : 'Description'}
            </label>
            <input
              id="gd-desc-input"
              type="text"
              value={descInput}
              onChange={(e) => setDescInput(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F7FAFC] dark:bg-[#0B1320] text-sm"
            />
          </div>
        </div>

        {resolvedType === 'org' && (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-slate-500">
              {lang === 'ar' ? 'لون المجموعة:' : 'Group Color:'}
            </span>
            {GROUP_COLOR_SWATCHES.map((hex) => (
              <button
                key={hex}
                type="button"
                onClick={() => setColorInput(hex)}
                className={`w-7 h-7 rounded-lg border-2 ${
                  colorInput === hex ? 'border-[#0B1320] dark:border-white scale-110' : 'border-transparent'
                }`}
                style={{ backgroundColor: hex }}
                aria-label={hex}
              />
            ))}
          </div>
        )}

        <SmartCoverManager
          entityType={resolvedType === 'shared' ? 'shared_group' : 'org_group'}
          entityName={nameInput}
          description={descInput}
          value={coverValue}
          onChange={setCoverValue}
        />
      </form>

      {/* Shared QR Badge Card (if shared) */}
      {resolvedType === 'shared' && activeSharedGroup && (
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E192B] p-6 flex flex-col md:flex-row items-center gap-6">
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shrink-0">
            <QrCodeVector
              svgRef={qrRef}
              seed={activeSharedGroup.shareCode}
              payloadUrl={sharedUrl}
              primaryColor="#0B1320"
              accentColor="#0F9D8E"
              badgeText="SHARED QR · SCAN"
              size={150}
            />
          </div>
          <div className="flex-1 space-y-3 min-w-0 text-center md:text-start">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="font-mono text-base font-extrabold text-[#0B1320] dark:text-white" dir="ltr">
                {activeSharedGroup.shareCode}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  activeSharedGroup.isActive
                    ? 'bg-[#0F9D8E]/15 text-[#0F9D8E] dark:text-[#2DD4BF]'
                    : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                }`}
              >
                {activeSharedGroup.isActive
                  ? lang === 'ar'
                    ? 'نشط'
                    : 'Active'
                  : lang === 'ar'
                  ? 'متوقف مؤقتًا'
                  : 'Paused'}
              </span>
              <span className="text-xs font-mono text-slate-500">
                {activeSharedGroup.totalScans} {lang === 'ar' ? 'مسحة' : 'scans'}
              </span>
            </div>
            <p className="text-xs font-mono text-slate-500 truncate" dir="ltr">
              {sharedUrl}
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard?.writeText(sharedUrl);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1800);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0F9D8E] text-white text-xs font-bold"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{lang === 'ar' ? 'نسخ الرابط' : 'Copy Link'}</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('shared-qr', { sharedCode: activeSharedGroup.shareCode })}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#0F9D8E]" />
                <span>{lang === 'ar' ? 'معاينة العامة' : 'Public View'}</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  void updateSharedQrGroupInSession(activeSharedGroup.id, {
                    isActive: !activeSharedGroup.isActive,
                  })
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold"
              >
                {activeSharedGroup.isActive ? (
                  <>
                    <PauseCircle className="w-3.5 h-3.5 text-amber-500" />
                    <span>{lang === 'ar' ? 'إيقاف مؤقت' : 'Pause QR'}</span>
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-3.5 h-3.5 text-[#0F9D8E]" />
                    <span>{lang === 'ar' ? 'تفعيل QR' : 'Activate QR'}</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() =>
                  downloadQrSvgMarkup(qrRef.current, `finditqr-${activeSharedGroup.shareCode}`)
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold"
              >
                <Download className="w-3.5 h-3.5" />
                <span>SVG</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Linked Members Section */}
      {resolvedType === 'org' && activeOrgGroup && (
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E192B] p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-extrabold text-[#0B1320] dark:text-white">
              {lang === 'ar'
                ? `الأغراض المرتبطة بالمجموعة (${orgMembers.length})`
                : `Items in This Group (${orgMembers.length})`}
            </h2>
          </div>

          {orgMembers.length === 0 ? (
            <p className="text-xs text-slate-500">
              {lang === 'ar'
                ? 'لا توجد أغراض مرتبطة بهذه المجموعة التنظيمية حاليًا.'
                : 'No items currently assigned to this organizational group.'}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {orgMembers.map((it) => (
                <div
                  key={it.id}
                  className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-[#F7FAFC] dark:bg-[#0B1320] flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={it.coverUrl || it.imageUrl || getFallbackCoverUrl(it.category)}
                      alt={it.name}
                      className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#0B1320] dark:text-white truncate">
                        {it.name || it.nameAr}
                      </p>
                      <p className="text-[11px] font-mono text-slate-500">{it.codeSerial}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => navigate('item-details', { itemId: it.id })}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold"
                    >
                      {t.common.viewDetails}
                    </button>
                    <button
                      type="button"
                      onClick={() => void updateItemDetailsInSession(it.id, { groupId: null })}
                      className="px-2.5 py-1.5 rounded-lg border border-red-200 dark:border-red-900/50 text-xs font-bold text-red-600 dark:text-red-400"
                    >
                      {lang === 'ar' ? 'إزالة' : 'Unlink'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {orgCandidates.length > 0 && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {lang === 'ar' ? 'إضافة أغراض أخرى للمجموعة' : 'Add Other Items to This Group'}
              </h3>
              <div className="flex flex-wrap gap-2">
                {orgCandidates.map((it) => (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() =>
                      void updateItemDetailsInSession(it.id, { groupId: activeOrgGroup.id })
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F7FAFC] dark:bg-[#0B1320] text-xs font-bold hover:border-[#0F9D8E]"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#0F9D8E]" />
                    <span>{it.name || it.nameAr}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {resolvedType === 'shared' && activeSharedGroup && (
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E192B] p-6 space-y-5">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-[#0F9D8E]" />
            <span>
              {lang === 'ar'
                ? 'يمكنك إظهار أو إخفاء أي غرض في صفحة الاسترداد المشتركة فورًا مع حفظ رمز QR الفردي معطلًا لمنع التعارض.'
                : 'Show or hide any linked item instantly while keeping individual QRs paused to avoid conflict.'}
            </span>
          </div>

          <div className="space-y-2.5">
            {activeSharedGroup.items.map((entry) => {
              const member = items.find((i) => i.id === entry.itemId);
              if (!member) return null;
              return (
                <div
                  key={entry.itemId}
                  className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-[#F7FAFC] dark:bg-[#0B1320] flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={member.coverUrl || member.imageUrl || getFallbackCoverUrl(member.category)}
                      alt={member.name}
                      className="w-11 h-11 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#0B1320] dark:text-white truncate">
                        {member.name || member.nameAr}
                      </p>
                      <p className="text-[11px] font-mono text-slate-500">{member.codeSerial}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        void toggleSharedQrItemVisibilityInSession(
                          activeSharedGroup.id,
                          entry.itemId,
                          !entry.isVisible
                        )
                      }
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${
                        entry.isVisible
                          ? 'border-[#0F9D8E]/40 bg-[#0F9D8E]/10 text-[#0F9D8E] dark:text-[#2DD4BF]'
                          : 'border-slate-300 dark:border-slate-700 text-slate-500'
                      }`}
                    >
                      {entry.isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      <span>
                        {entry.isVisible
                          ? lang === 'ar'
                            ? 'ظاهر'
                            : 'Visible'
                          : lang === 'ar'
                          ? 'مخفي'
                          : 'Hidden'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        void removeItemFromSharedQrGroupInSession(activeSharedGroup.id, entry.itemId)
                      }
                      className="px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-900/50 text-xs font-bold text-red-600 dark:text-red-400"
                    >
                      {lang === 'ar' ? 'فصل' : 'Remove'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void restoreItemIndividualQrInSession(entry.itemId)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>{lang === 'ar' ? 'استعادة الفردي' : 'Restore QR'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {items.filter(
            (it) =>
              !activeSharedGroup.items.some((e) => e.itemId === it.id) &&
              !(it.qrMode === 'shared' && it.sharedQrGroupId)
          ).length > 0 && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {lang === 'ar' ? 'ربط أغراض متاحة' : 'Link Eligible Items'}
              </h3>
              <div className="flex flex-wrap gap-2">
                {items
                  .filter(
                    (it) =>
                      !activeSharedGroup.items.some((e) => e.itemId === it.id) &&
                      !(it.qrMode === 'shared' && it.sharedQrGroupId)
                  )
                  .map((it) => (
                    <button
                      key={it.id}
                      type="button"
                      onClick={() =>
                        void addItemToSharedQrGroupInSession(activeSharedGroup.id, it.id, true)
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F7FAFC] dark:bg-[#0B1320] text-xs font-bold hover:border-[#0F9D8E]"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#0F9D8E]" />
                      <span>{it.name || it.nameAr}</span>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      <SmartRelatedServices
        currentPage="group-details"
        contextGroupId={activeOrgGroup?.id || activeSharedGroup?.id}
        contextGroupType={resolvedType}
      />
    </div>
  );
};
