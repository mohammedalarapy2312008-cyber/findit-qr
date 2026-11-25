import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  FolderPlus,
  Image as ImageIcon,
  Layers,
  PauseCircle,
  PlayCircle,
  Plus,
  QrCode,
  RotateCcw,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import { downloadQrSvgMarkup, QrCodeVector } from '../../components/brand/FindItLogo';
import { useApp } from '../../context/AppContext';
import { RegisteredItem, SharedQrGroup } from '../../types/domain';
import { buildSharedQrRecoveryUrl } from '../../utils/sharedQrLogic';

function exportSvgToPng(svgEl: SVGSVGElement | null, filename: string): void {
  if (!svgEl || typeof window === 'undefined') return;
  const serializer = new XMLSerializer();
  const svgMarkup = serializer.serializeToString(svgEl);
  const svgBlob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
  const blobUrl = URL.createObjectURL(svgBlob);
  const img = new window.Image();
  img.onload = () => {
    const scale = 4;
    const width = (svgEl.viewBox.baseVal?.width || 160) * scale;
    const height = (svgEl.viewBox.baseVal?.height || 188) * scale;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width);
    canvas.height = Math.round(height);
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const pngUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = pngUrl;
      link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    URL.revokeObjectURL(blobUrl);
  };
  img.onerror = () => {
    URL.revokeObjectURL(blobUrl);
  };
  img.src = blobUrl;
}

export const SharedQrGroupsPage: React.FC = () => {
  const {
    lang,
    t,
    items,
    sharedQrGroups,
    navigate,
    showToast,
    requestConfirm,
    createSharedQrGroupInSession,
    updateSharedQrGroupInSession,
    addItemToSharedQrGroupInSession,
    toggleSharedQrItemVisibilityInSession,
    removeItemFromSharedQrGroupInSession,
    deleteSharedQrGroupInSession,
    restoreItemIndividualQrInSession,
  } = useApp();

  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [selectedDraftItems, setSelectedDraftItems] = useState<
    Record<string, { selected: boolean; isVisible: boolean }>
  >({});
  const [createError, setCreateError] = useState<string>('');
  const [creating, setCreating] = useState<boolean>(false);

  const [isEditingMeta, setIsEditingMeta] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');
  const [savingMeta, setSavingMeta] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<string>('');
  const [busyKey, setBusyKey] = useState<string>('');

  const qrSvgRef = useRef<SVGSVGElement | null>(null);

  const itemsById = useMemo(() => {
    const map = new Map<string, RegisteredItem>();
    for (const item of items) {
      map.set(item.id, item);
    }
    return map;
  }, [items]);

  useEffect(() => {
    if (sharedQrGroups.length === 0) {
      setSelectedGroupId('');
      return;
    }
    if (!selectedGroupId || !sharedQrGroups.some((g) => g.id === selectedGroupId)) {
      setSelectedGroupId(sharedQrGroups[0].id);
    }
  }, [sharedQrGroups, selectedGroupId]);

  const selectedGroup: SharedQrGroup | null = useMemo(
    () => sharedQrGroups.find((g) => g.id === selectedGroupId) ?? sharedQrGroups[0] ?? null,
    [sharedQrGroups, selectedGroupId]
  );

  useEffect(() => {
    if (selectedGroup) {
      setEditName(selectedGroup.name);
      setEditDescription(selectedGroup.description || '');
      setIsEditingMeta(false);
    }
  }, [selectedGroup?.id]);

  const openCreateForm = () => {
    setNewName('');
    setNewDescription('');
    setCreateError('');
    const initialSelection: Record<string, { selected: boolean; isVisible: boolean }> = {};
    items.forEach((it) => {
      initialSelection[it.id] = { selected: false, isVisible: true };
    });
    setSelectedDraftItems(initialSelection);
    setIsCreateOpen(true);
  };

  const toggleDraftItemSelect = (itemId: string) => {
    setSelectedDraftItems((prev) => {
      const curr = prev[itemId] ?? { selected: false, isVisible: true };
      return {
        ...prev,
        [itemId]: { ...curr, selected: !curr.selected },
      };
    });
  };

  const toggleDraftItemVisibility = (itemId: string) => {
    setSelectedDraftItems((prev) => {
      const curr = prev[itemId] ?? { selected: true, isVisible: true };
      return {
        ...prev,
        [itemId]: { ...curr, isVisible: !curr.isVisible },
      };
    });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (trimmed.length < 2 || trimmed.length > 80) {
      setCreateError(
        lang === 'ar'
          ? 'يرجى إدخال اسم واضح للمجموعة (من حرفين إلى ٨٠ حرفًا).'
          : 'Please enter a group name between 2 and 80 characters.'
      );
      return;
    }
    if (newDescription.trim().length > 240) {
      setCreateError(
        lang === 'ar'
          ? 'الوصف المختصر يجب ألا يتجاوز ٢٤٠ حرفًا.'
          : 'Short description must be 240 characters or fewer.'
      );
      return;
    }

    setCreateError('');
    setCreating(true);
    const chosenItems = Object.entries(selectedDraftItems)
      .filter(([, cfg]) => cfg.selected)
      .map(([itemId, cfg]) => ({ itemId, isVisible: cfg.isVisible }));

    const created = await createSharedQrGroupInSession({
      name: trimmed,
      description: newDescription.trim(),
      items: chosenItems,
    });
    setCreating(false);

    if (created) {
      setSelectedGroupId(created.id);
      setIsCreateOpen(false);
    }
  };

  const handleSaveMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) return;
    const trimmed = editName.trim();
    if (trimmed.length < 2 || trimmed.length > 80) {
      showToast(
        'error',
        lang === 'ar' ? 'اسم غير صالح' : 'Invalid Name',
        lang === 'ar'
          ? 'يرجى إدخال اسم بين حرفين و٨٠ حرفًا.'
          : 'Group name must be between 2 and 80 characters.'
      );
      return;
    }
    setSavingMeta(true);
    const updated = await updateSharedQrGroupInSession(selectedGroup.id, {
      name: trimmed,
      description: editDescription.trim(),
    });
    setSavingMeta(false);
    if (updated) {
      setIsEditingMeta(false);
    }
  };

  const handleToggleActive = async (group: SharedQrGroup) => {
    setBusyKey(`active-${group.id}`);
    await updateSharedQrGroupInSession(group.id, { isActive: !group.isActive });
    setBusyKey('');
  };

  const handleToggleItemVisibility = async (
    group: SharedQrGroup,
    itemId: string,
    nextVisible: boolean
  ) => {
    setBusyKey(`vis-${itemId}`);
    await toggleSharedQrItemVisibilityInSession(group.id, itemId, nextVisible);
    setBusyKey('');
  };

  const handleRemoveItem = async (group: SharedQrGroup, itemId: string) => {
    setBusyKey(`rem-${itemId}`);
    await removeItemFromSharedQrGroupInSession(group.id, itemId);
    setBusyKey('');
  };

  const handleAddExistingItem = async (group: SharedQrGroup, itemId: string) => {
    setBusyKey(`add-${itemId}`);
    await addItemToSharedQrGroupInSession(group.id, itemId, true);
    setBusyKey('');
  };

  const handleRestoreIndividualQr = async (itemId: string) => {
    setBusyKey(`restore-${itemId}`);
    await restoreItemIndividualQrInSession(itemId);
    setBusyKey('');
  };

  const handleDeleteGroup = (group: SharedQrGroup) => {
    requestConfirm({
      title: lang === 'ar' ? 'حذف مجموعة QR المشترك' : 'Delete Shared QR Group',
      description:
        lang === 'ar'
          ? `هل أنت متأكد من حذف مجموعة «${group.name}»؟ سيتوقف رمز QR المشترك (${group.shareCode}) عن العمل، بينما ستظل جميع أغراضك محفوظة بالكامل وتنتقل إلى حالة «بدون QR نشط» ويمكنك إعادة تفعيل QR الفردي لكل غرض بضغطة واحدة من صفحة أغراضك.`
          : `Delete "${group.name}"? Its shared QR code (${group.shareCode}) will stop working, while all of your registered items remain safely preserved as "No Active QR" and you can restore each item's original individual QR in one click.`,
      confirmLabel: lang === 'ar' ? 'تأكيد حذف مجموعة QR المشترك' : 'Delete Shared QR Group',
      variant: 'danger',
      onConfirm: () => {
        void deleteSharedQrGroupInSession(group.id, false);
      },
    });
  };

  const handleCopyRecoveryLink = async (shareCode: string) => {
    const url = buildSharedQrRecoveryUrl(shareCode);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedCode(shareCode);
      setTimeout(() => setCopiedCode(''), 2000);
      showToast(
        'success',
        lang === 'ar' ? 'تم نسخ رابط QR المشترك' : 'Shared QR Link Copied',
        url
      );
    } catch {
      showToast(
        'info',
        lang === 'ar' ? 'رابط صفحة الاسترداد' : 'Recovery Page Link',
        url
      );
    }
  };

  const linkedItemIds = useMemo(() => {
    return new Set((selectedGroup?.items || []).map((entry) => entry.itemId));
  }, [selectedGroup]);

  const unlinkedItems = useMemo(() => {
    return items.filter((it) => !linkedItemIds.has(it.id));
  }, [items, linkedItemIds]);

  const recoveryUrl = selectedGroup
    ? buildSharedQrRecoveryUrl(selectedGroup.shareCode)
    : '';

  return (
    <div className="space-y-6" data-testid="shared-qr-groups-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-[#2563EB] dark:text-[#19B5A5] shrink-0" />
            <h1 className="text-2xl font-extrabold text-[#17243A] dark:text-white">
              {lang === 'ar' ? 'مجموعات QR المشترك' : 'Shared QR Groups'}
            </h1>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
            {lang === 'ar'
              ? 'اربط عدة أغراض مسجلة تحت رمز QR مشترك واحد. عند ربط غرض هنا يتوقف رمز QR الفردي مؤقتًا دون حذفه لمنع أي تعارض، ويمكنك إعادته للوضع الفردي بضغطة واحدة في أي وقت.'
              : 'Link multiple existing items under one shared QR code. Linking an item temporarily pauses its individual QR (never deletes it) to prevent dual-QR conflicts, and you can restore individual mode in one click anytime.'}
          </p>
        </div>

        <button
          type="button"
          data-testid="btn-open-create-shared-group"
          onClick={openCreateForm}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-600 text-white text-sm font-bold shadow-sm shadow-blue-600/20 transition-colors shrink-0 cursor-pointer"
        >
          <FolderPlus className="w-4 h-4" />
          <span>
            {lang === 'ar' ? 'إنشاء مجموعة QR مشترك' : 'Create Shared QR Group'}
          </span>
        </button>
      </div>

      {/* Clear Distinction Callout (Strict Individual vs Shared QR Rules) */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1A2B] p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-[#19B5A5] shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <strong className="text-[#17243A] dark:text-white">
            {lang === 'ar'
              ? 'قواعد منع التعارض بين QR الفردي وQR المشترك:'
              : 'Strict Non-Conflict Rules (Individual vs. Shared QR):'}
          </strong>{' '}
          {lang === 'ar'
            ? 'لا يمكن أن يكون للغرض رمزا QR نشطان في الوقت نفسه، ولا يمكن إضافته لأكثر من مجموعة QR مشترك واحدة. عند إيقاف المجموعة مؤقتًا تظل الأغراض متوقفة، وعند حذفها تُحفظ جميع الأغراض بدون QR نشط مع إمكانية إعادة تفعيل QR الفردي الأصلي لكل غرض بضغطة واحدة.'
            : 'An item can never have two active QR codes at once or belong to more than one Shared QR Group. Pausing a group keeps items paused, and deleting a group preserves all items without an active QR so you can restore their original individual QR in one click.'}
        </div>
      </div>

      {/* Create Shared QR Group Panel */}
      {isCreateOpen && (
        <form
          onSubmit={handleCreateSubmit}
          data-testid="create-shared-group-form"
          className="rounded-2xl border-2 border-[#2563EB]/30 bg-white dark:bg-[#0F1A2B] p-5 sm:p-6 space-y-5 shadow-sm"
        >
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-extrabold text-[#17243A] dark:text-white">
                {lang === 'ar'
                  ? 'إنشاء مجموعة QR مشترك جديدة'
                  : 'Create a New Shared QR Group'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {lang === 'ar'
                  ? 'الخطوة ١: أدخل اسم المجموعة · الخطوة ٢: اختر أغراضك الحالية · الخطوة ٣: حدد حالة الظهور لكل غرض'
                  : 'Step 1: Name the group · Step 2: Pick existing items · Step 3: Set visibility per item'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              aria-label={t.common.cancel}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-[#17243A] dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="shared-group-name-input"
                className="block text-xs font-bold text-[#17243A] dark:text-slate-200 mb-1.5"
              >
                {lang === 'ar' ? 'اسم مجموعة QR المشترك *' : 'Shared QR Group Name *'}
              </label>
              <input
                id="shared-group-name-input"
                data-testid="shared-group-name-input"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={
                  lang === 'ar'
                    ? 'مثال: حقيبة السفر، معدات التصوير، أغراض المدرسة...'
                    : 'e.g., Travel Backpack, Camera Kit, Work Bag...'
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17] text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="shared-group-desc-input"
                className="block text-xs font-bold text-[#17243A] dark:text-slate-200 mb-1.5"
              >
                {lang === 'ar' ? 'وصف مختصر (اختياري)' : 'Short Description (Optional)'}
              </label>
              <input
                id="shared-group-desc-input"
                data-testid="shared-group-desc-input"
                type="text"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder={
                  lang === 'ar'
                    ? 'ملاحظة موجزة تظهر أعلى صفحة الاسترداد المشتركة...'
                    : 'Optional brief note shown on the shared recovery page...'
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17] text-sm"
              />
            </div>
          </div>

          {/* Step 2 & 3: Pick existing items + initial visibility */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-bold text-[#17243A] dark:text-slate-200">
                {lang === 'ar'
                  ? 'اختر الأغراض المسجلة المرتبطة بهذه المجموعة (بدون تكرار للغرض):'
                  : 'Select existing registered items to link (zero item duplication):'}
              </label>
              <span className="text-xs font-mono text-slate-500">
                {Object.values(selectedDraftItems).filter((c) => c.selected).length}/{items.length}
              </span>
            </div>

            {items.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F4F7FB] dark:bg-[#070D17]">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {lang === 'ar'
                    ? 'لا توجد أغراض مسجلة في حسابك بعد. يمكنك إنشاء المجموعة فارغة الآن وإضافة الأغراض لاحقًا، أو تسجيل غرض جديد أولًا.'
                    : 'You have no registered items yet. You can create an empty group now and link items later, or add your first item.'}
                </p>
                <button
                  type="button"
                  onClick={() => navigate('add-item')}
                  className="px-3.5 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-bold shrink-0"
                >
                  {t.workspaceNav.addItem}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pe-1">
                {items.map((item) => {
                  const cfg = selectedDraftItems[item.id] ?? { selected: false, isVisible: true };
                  const inAnotherSharedGroup =
                    item.qrMode === 'shared' && Boolean(item.sharedQrGroupId);
                  return (
                    <div
                      key={item.id}
                      className={`rounded-xl border p-3 flex items-center justify-between gap-3 transition-colors ${
                        inAnotherSharedGroup
                          ? 'border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 opacity-80'
                          : cfg.selected
                          ? 'border-[#2563EB] bg-[#2563EB]/5 dark:bg-[#2563EB]/10'
                          : 'border-slate-200 dark:border-slate-800 bg-[#F4F7FB] dark:bg-[#070D17]'
                      }`}
                    >
                      <label
                        className={`flex items-center gap-3 min-w-0 flex-1 ${
                          inAnotherSharedGroup ? 'cursor-not-allowed' : 'cursor-pointer'
                        }`}
                      >
                        <input
                          type="checkbox"
                          data-testid={`create-select-item-${item.id}`}
                          disabled={inAnotherSharedGroup}
                          checked={!inAnotherSharedGroup && cfg.selected}
                          onChange={() => {
                            if (!inAnotherSharedGroup) toggleDraftItemSelect(item.id);
                          }}
                          className="w-4 h-4 rounded text-[#2563EB] focus:ring-[#2563EB]"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-[#17243A] dark:text-white truncate">
                            {lang === 'ar' ? item.nameAr || item.name : item.nameEn || item.name}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {t.categories[item.category]} · {t.statuses[item.status]} ·{' '}
                            <span className="font-mono" dir="ltr">
                              {item.codeSerial}
                            </span>
                          </p>
                          {inAnotherSharedGroup && (
                            <p className="text-[11px] font-bold text-amber-700 dark:text-amber-300 mt-0.5 truncate">
                              {lang === 'ar'
                                ? `مرتبط حاليًا بمجموعة: ${item.sharedQrGroupName || item.sharedQrGroupId}`
                                : `Already in group: ${item.sharedQrGroupName || item.sharedQrGroupId}`}
                            </p>
                          )}
                        </div>
                      </label>

                      {!inAnotherSharedGroup && cfg.selected && (
                        <button
                          type="button"
                          onClick={() => toggleDraftItemVisibility(item.id)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold shrink-0 border transition-colors ${
                            cfg.isVisible
                              ? 'border-[#19B5A5]/40 bg-[#19B5A5]/15 text-[#0F9D8E] dark:text-[#19B5A5]'
                              : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0F1A2B] text-slate-500'
                          }`}
                        >
                          {cfg.isVisible ? (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              <span>{lang === 'ar' ? 'ظاهر' : 'Visible'}</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5" />
                              <span>{lang === 'ar' ? 'مخفي' : 'Hidden'}</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {createError && (
            <p role="alert" className="text-xs font-bold text-red-600 dark:text-red-400">
              {createError}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              data-testid="btn-submit-create-shared-group"
              disabled={creating}
              className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-600 disabled:opacity-60 text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer"
            >
              {creating
                ? lang === 'ar'
                  ? 'جارٍ الإنشاء وتوليد QR...'
                  : 'Creating & Generating QR...'
                : lang === 'ar'
                ? 'إنشاء وتوليد رمز QR المشترك'
                : 'Create & Generate Shared QR'}
            </button>
          </div>
        </form>
      )}

      {/* Empty State when no shared groups exist */}
      {sharedQrGroups.length === 0 && !isCreateOpen ? (
        <div
          data-testid="shared-qr-groups-empty"
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1A2B] p-10 text-center space-y-4"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#2563EB]/10 text-[#2563EB] dark:text-[#19B5A5] flex items-center justify-center mx-auto">
            <QrCode className="w-7 h-7" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h2 className="text-lg font-extrabold text-[#17243A] dark:text-white">
              {lang === 'ar'
                ? 'لا توجد مجموعات QR مشترك بعد'
                : 'No Shared QR Groups Yet'}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {lang === 'ar'
                ? 'أنشئ أول مجموعة QR مشترك لربط عدة أغراض مسجلة (مثل حقيبة سفر ومحتوياتها أو مفاتيح العائلة) برمز QR واحد مع تحكم كامل في إظهار وإخفاء كل غرض.'
                : 'Create your first Shared QR Group to link multiple registered belongings (like a travel bag and its contents) under one shared QR code with per-item visibility.'}
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-600 text-white text-sm font-bold"
          >
            <Plus className="w-4 h-4" />
            <span>
              {lang === 'ar' ? 'إنشاء أول مجموعة QR مشترك' : 'Create First Shared QR Group'}
            </span>
          </button>
        </div>
      ) : (
        sharedQrGroups.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Sidebar: Groups List */}
            <div className="lg:col-span-4 space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {lang === 'ar'
                    ? `مجموعاتك (${sharedQrGroups.length})`
                    : `Your Groups (${sharedQrGroups.length})`}
                </h2>
              </div>

              <div className="space-y-2.5">
                {sharedQrGroups.map((group) => {
                  const isSelected = selectedGroup?.id === group.id;
                  const visibleCount = group.items.filter((e) => {
                    const it = itemsById.get(e.itemId);
                    return e.isVisible && it && it.status !== 'Archived';
                  }).length;

                  return (
                    <button
                      key={group.id}
                      type="button"
                      data-testid={`shared-group-card-${group.id}`}
                      onClick={() => setSelectedGroupId(group.id)}
                      className={`w-full text-start p-4 rounded-2xl border transition-colors ${
                        isSelected
                          ? 'border-[#2563EB] bg-white dark:bg-[#0F1A2B] shadow-sm ring-1 ring-[#2563EB]/20'
                          : 'border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#0F1A2B]/70 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="text-sm font-extrabold text-[#17243A] dark:text-white truncate">
                            {group.name}
                          </h3>
                          <p
                            className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5"
                            dir="ltr"
                          >
                            {group.shareCode}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] font-bold shrink-0 ${
                            group.isActive
                              ? 'bg-[#19B5A5]/15 text-[#0F9D8E] dark:text-[#19B5A5]'
                              : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                          }`}
                        >
                          {group.isActive
                            ? lang === 'ar'
                              ? 'نشط'
                              : 'Active'
                            : lang === 'ar'
                            ? 'متوقف مؤقتًا'
                            : 'Paused'}
                        </span>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>
                          {lang === 'ar'
                            ? `${visibleCount} ظاهر من ${group.items.length} غرض`
                            : `${visibleCount} visible of ${group.items.length} linked`}
                        </span>
                        <span className="font-mono tabular-nums">
                          {group.totalScans} {lang === 'ar' ? 'مسحة' : 'scans'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Detail Panel: Selected Shared QR Group Studio */}
            {selectedGroup && (
              <div className="lg:col-span-8 space-y-5">
                {/* Group Header & Controls */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1A2B] p-5 sm:p-6 space-y-5">
                  {isEditingMeta ? (
                    <form onSubmit={handleSaveMeta} className="space-y-3">
                      <div>
                        <label
                          htmlFor="edit-shared-group-name"
                          className="block text-xs font-bold text-[#17243A] dark:text-slate-200 mb-1"
                        >
                          {lang === 'ar' ? 'اسم المجموعة *' : 'Group Name *'}
                        </label>
                        <input
                          id="edit-shared-group-name"
                          data-testid="edit-shared-group-name-input"
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17] text-sm"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="edit-shared-group-desc"
                          className="block text-xs font-bold text-[#17243A] dark:text-slate-200 mb-1"
                        >
                          {lang === 'ar' ? 'وصف مختصر' : 'Short Description'}
                        </label>
                        <input
                          id="edit-shared-group-desc"
                          type="text"
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17] text-sm"
                        />
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setIsEditingMeta(false)}
                          className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold"
                        >
                          {t.common.cancel}
                        </button>
                        <button
                          type="submit"
                          data-testid="btn-save-shared-group-meta"
                          disabled={savingMeta}
                          className="px-4 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-bold"
                        >
                          {savingMeta ? '...' : t.common.saveChanges}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2
                            data-testid="selected-shared-group-title"
                            className="text-xl font-extrabold text-[#17243A] dark:text-white"
                          >
                            {selectedGroup.name}
                          </h2>
                          <span
                            data-testid="selected-shared-group-status"
                            className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${
                              selectedGroup.isActive
                                ? 'bg-[#19B5A5]/15 text-[#0F9D8E] dark:text-[#19B5A5]'
                                : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                            }`}
                          >
                            {selectedGroup.isActive
                              ? lang === 'ar'
                                ? 'QR المشترك نشط'
                                : 'Shared QR Active'
                              : lang === 'ar'
                              ? 'QR المشترك متوقف مؤقتًا'
                              : 'Shared QR Paused'}
                          </span>
                        </div>
                        {selectedGroup.description && (
                          <p className="text-sm text-slate-600 dark:text-slate-300">
                            {selectedGroup.description}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          data-testid="btn-edit-shared-group"
                          onClick={() => setIsEditingMeta(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-[#17243A] dark:text-slate-200 hover:border-[#2563EB]"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>{lang === 'ar' ? 'تعديل الاسم' : 'Edit'}</span>
                        </button>

                        <button
                          type="button"
                          data-testid="btn-toggle-shared-active"
                          disabled={busyKey === `active-${selectedGroup.id}`}
                          onClick={() => void handleToggleActive(selectedGroup)}
                          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-colors ${
                            selectedGroup.isActive
                              ? 'border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200'
                              : 'border-[#19B5A5] bg-[#19B5A5]/15 text-[#0F9D8E] dark:text-[#19B5A5]'
                          }`}
                        >
                          {selectedGroup.isActive ? (
                            <>
                              <PauseCircle className="w-3.5 h-3.5" />
                              <span>{lang === 'ar' ? 'إيقاف QR مؤقتًا' : 'Pause Shared QR'}</span>
                            </>
                          ) : (
                            <>
                              <PlayCircle className="w-3.5 h-3.5" />
                              <span>{lang === 'ar' ? 'إعادة تفعيل QR' : 'Reactivate QR'}</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          data-testid="btn-delete-shared-group"
                          onClick={() => handleDeleteGroup(selectedGroup)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 dark:border-red-900/50 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{lang === 'ar' ? 'حذف المجموعة' : 'Delete'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Shared QR Code Card */}
                  <div className="rounded-2xl bg-[#F4F7FB] dark:bg-[#070D17] border border-slate-200 dark:border-slate-800 p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-5">
                    <div className="bg-white p-2.5 rounded-2xl shadow-sm border border-slate-200 shrink-0">
                      <QrCodeVector
                        svgRef={qrSvgRef}
                        seed={selectedGroup.shareCode}
                        payloadUrl={recoveryUrl}
                        primaryColor="#17243A"
                        accentColor="#19B5A5"
                        badgeText="SHARED QR · SCAN"
                        size={148}
                      />
                    </div>

                    <div className="flex-1 min-w-0 space-y-3 text-center sm:text-start w-full">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          {lang === 'ar' ? 'رمز QR المشترك الثابت' : 'Immutable Shared QR Code'}
                        </p>
                        <p
                          data-testid="selected-shared-group-code"
                          className="text-lg font-mono font-extrabold text-[#17243A] dark:text-white mt-0.5"
                          dir="ltr"
                        >
                          {selectedGroup.shareCode}
                        </p>
                        <p
                          data-testid="selected-shared-group-url"
                          className="text-xs font-mono text-slate-500 dark:text-slate-400 truncate mt-1"
                          dir="ltr"
                        >
                          {recoveryUrl}
                        </p>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {lang === 'ar'
                          ? 'يبقى هذا الرمز ثابتًا بالكامل حتى عند إضافة أغراض جديدة، أو إخفاء وإظهار الأغراض، أو تعديل اسم المجموعة، أو إيقافها مؤقتًا وإعادة تفعيلها.'
                          : 'This QR code stays permanently unchanged when you add or remove items, toggle item visibility, rename the group, or pause and reactivate it.'}
                      </p>

                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <button
                          type="button"
                          data-testid="btn-copy-shared-link"
                          onClick={() => void handleCopyRecoveryLink(selectedGroup.shareCode)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-bold transition-colors"
                        >
                          {copiedCode === selectedGroup.shareCode ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span>
                            {copiedCode === selectedGroup.shareCode
                              ? lang === 'ar'
                                ? 'تم النسخ'
                                : 'Copied'
                              : lang === 'ar'
                              ? 'نسخ رابط الاسترداد'
                              : 'Copy Link'}
                          </span>
                        </button>

                        <button
                          type="button"
                          data-testid="btn-open-shared-public"
                          onClick={() =>
                            navigate('shared-qr', { sharedCode: selectedGroup.shareCode })
                          }
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0F1A2B] text-[#17243A] dark:text-white text-xs font-bold hover:border-[#19B5A5]"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-[#19B5A5]" />
                          <span>
                            {lang === 'ar'
                              ? 'معاينة صفحة الاسترداد العامة'
                              : 'Preview Public Page'}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            downloadQrSvgMarkup(
                              qrSvgRef.current,
                              `finditqr-shared-${selectedGroup.shareCode}`
                            )
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0F1A2B] text-[#17243A] dark:text-slate-200 text-xs font-bold hover:border-[#2563EB]"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>SVG</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            exportSvgToPng(
                              qrSvgRef.current,
                              `finditqr-shared-${selectedGroup.shareCode}`
                            )
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0F1A2B] text-[#17243A] dark:text-slate-200 text-xs font-bold hover:border-[#2563EB]"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>PNG</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Linked Items & Per-Item Visibility Control */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1A2B] p-5 sm:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                    <div>
                      <h3 className="text-base font-extrabold text-[#17243A] dark:text-white">
                        {lang === 'ar'
                          ? `الأغراض المرتبطة بالمجموعة والتحكم بالظهور (${selectedGroup.items.length})`
                          : `Linked Items & Shared QR Visibility (${selectedGroup.items.length})`}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {lang === 'ar'
                          ? 'طوال وجود الغرض داخل المجموعة يعمل عبر رمز QR المشترك فقط ويتوقف QR الفردي مؤقتًا دون حذفه. يمكنك إزالته أو إعادة تفعيل QR الفردي بضغطة واحدة.'
                          : 'While linked to this group, the item uses the Shared QR only and its individual QR is paused without deletion. Remove it or restore individual QR in one click anytime.'}
                      </p>
                    </div>
                  </div>

                  {!selectedGroup.isActive && (
                    <div
                      data-testid="shared-group-paused-banner"
                      className="rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-3.5 text-xs text-amber-900 dark:text-amber-200 leading-relaxed"
                    >
                      {lang === 'ar'
                        ? 'هذه المجموعة متوقفة مؤقتًا — تظل الأغراض المرتبطة بها متوقفة ولا يعود QR الفردي تلقائيًا. يمكنك إعادة تفعيل المجموعة أو إعادة تفعيل QR الفردي لأي غرض يدويًا.'
                        : 'This Shared QR Group is paused — linked items remain paused and individual QRs do not auto-reactivate. You can reactivate the group or manually restore individual QR per item.'}
                    </div>
                  )}

                  {selectedGroup.items.length === 0 ? (
                    <div
                      data-testid="shared-group-no-items"
                      className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-6 text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400"
                    >
                      {lang === 'ar'
                        ? 'هذه المجموعة لا تحتوي على أغراض مرتبطة حاليًا. أضف أغراضًا من القائمة أدناه.'
                        : 'No items are currently linked to this group. Add existing items from the list below.'}
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {selectedGroup.items.map((entry) => {
                        const item = itemsById.get(entry.itemId);
                        if (!item) return null;
                        const isArchived = item.status === 'Archived';
                        const isPublicDisabled =
                          item.privacySettings && item.privacySettings.publicPageEnabled === false;

                        return (
                          <div
                            key={entry.itemId}
                            data-testid={`linked-item-row-${entry.itemId}`}
                            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-[#F4F7FB] dark:bg-[#070D17] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="min-w-0 space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-bold text-[#17243A] dark:text-white truncate">
                                  {lang === 'ar'
                                    ? item.nameAr || item.name
                                    : item.nameEn || item.name}
                                </span>
                                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                                  {t.statuses[item.status]}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                {t.categories[item.category]} ·{' '}
                                {lang === 'ar' ? 'QR الفردي:' : 'Individual QR:'}{' '}
                                <span className="font-mono" dir="ltr">
                                  {item.codeSerial}
                                </span>
                              </p>
                              {!entry.isVisible && (
                                <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                                  {lang === 'ar'
                                    ? 'مخفي من صفحة QR المشتركة حاليًا — ورمز QR الفردي متوقف مؤقتًا طوال ارتباط الغرض بالمجموعة.'
                                    : 'Hidden from Shared QR page — individual QR remains paused while linked to this group.'}
                                </p>
                              )}
                              {entry.isVisible && (isArchived || isPublicDisabled) && (
                                <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                                  {isArchived
                                    ? lang === 'ar'
                                      ? 'الغرض مؤرشف حاليًا؛ لن يظهر للعامة حتى يُعاد تفعيله.'
                                      : 'Item is currently archived and will not appear publicly until reactivated.'
                                    : lang === 'ar'
                                    ? 'الصفحة العامة للغرض موقوفة من إعدادات خصوصيته.'
                                    : 'Item public page is paused in its own privacy settings.'}
                                </p>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                              <button
                                type="button"
                                data-testid={`btn-toggle-visibility-${entry.itemId}`}
                                disabled={busyKey === `vis-${entry.itemId}`}
                                onClick={() =>
                                  void handleToggleItemVisibility(
                                    selectedGroup,
                                    entry.itemId,
                                    !entry.isVisible
                                  )
                                }
                                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                                  entry.isVisible
                                    ? 'border-[#19B5A5]/50 bg-[#19B5A5]/15 text-[#0F9D8E] dark:text-[#19B5A5]'
                                    : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0F1A2B] text-slate-600 dark:text-slate-300'
                                }`}
                              >
                                {entry.isVisible ? (
                                  <>
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>
                                      {lang === 'ar' ? 'ظاهر في QR المشترك' : 'Visible on Shared QR'}
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <EyeOff className="w-3.5 h-3.5" />
                                    <span>
                                      {lang === 'ar' ? 'مخفي من QR المشترك' : 'Hidden from Shared QR'}
                                    </span>
                                  </>
                                )}
                              </button>

                              {!selectedGroup.isActive && (
                                <button
                                  type="button"
                                  data-testid={`btn-restore-individual-from-paused-${entry.itemId}`}
                                  disabled={busyKey === `restore-${entry.itemId}`}
                                  onClick={() => void handleRestoreIndividualQr(entry.itemId)}
                                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#2563EB]/40 bg-[#2563EB]/10 text-[#2563EB] dark:text-[#19B5A5] text-xs font-bold hover:bg-[#2563EB] hover:text-white transition-colors"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>
                                    {lang === 'ar' ? 'إعادة QR الفردي' : 'Restore Individual QR'}
                                  </span>
                                </button>
                              )}

                              <button
                                type="button"
                                data-testid={`btn-remove-item-${entry.itemId}`}
                                disabled={busyKey === `rem-${entry.itemId}`}
                                onClick={() => void handleRemoveItem(selectedGroup, entry.itemId)}
                                title={
                                  lang === 'ar'
                                    ? 'فصل من المجموعة وإعادة QR الفردي'
                                    : 'Remove from group & restore individual QR'
                                }
                                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-red-600 hover:border-red-300 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Add More Existing Items */}
                  {unlinkedItems.length > 0 && (
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
                      <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        {lang === 'ar'
                          ? 'إضافة أغراض أخرى من حسابك إلى هذه المجموعة:'
                          : 'Link additional existing items from your account:'}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {unlinkedItems.map((item) => {
                          const inOtherGroup =
                            item.qrMode === 'shared' &&
                            Boolean(item.sharedQrGroupId) &&
                            item.sharedQrGroupId !== selectedGroup.id;

                          return (
                            <div
                              key={item.id}
                              className={`flex items-center justify-between gap-2 p-3 rounded-xl border ${
                                inOtherGroup
                                  ? 'border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 opacity-80'
                                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1424]'
                              }`}
                            >
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-[#17243A] dark:text-white truncate">
                                  {lang === 'ar' ? item.nameAr || item.name : item.nameEn || item.name}
                                </p>
                                <p className="text-[11px] text-slate-500 truncate">
                                  {t.categories[item.category]} · {t.statuses[item.status]}
                                </p>
                                {inOtherGroup && (
                                  <p className="text-[11px] font-bold text-amber-700 dark:text-amber-300 truncate mt-0.5">
                                    {lang === 'ar'
                                      ? `مرتبط بمجموعة أخرى: ${item.sharedQrGroupName || item.sharedQrGroupId}`
                                      : `Linked to: ${item.sharedQrGroupName || item.sharedQrGroupId}`}
                                  </p>
                                )}
                              </div>
                              <button
                                type="button"
                                data-testid={`btn-add-item-${item.id}`}
                                disabled={inOtherGroup || busyKey === `add-${item.id}`}
                                onClick={() => void handleAddExistingItem(selectedGroup, item.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#2563EB]/10 hover:bg-[#2563EB] disabled:opacity-45 disabled:cursor-not-allowed text-[#2563EB] hover:text-white text-xs font-bold transition-colors shrink-0"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>
                                  {inOtherGroup
                                    ? lang === 'ar'
                                      ? 'مرتبط'
                                      : 'Linked'
                                    : lang === 'ar'
                                    ? 'إضافة'
                                    : 'Add'}
                                </span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
};
