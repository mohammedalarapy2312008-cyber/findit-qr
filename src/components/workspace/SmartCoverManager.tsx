import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Grid2x2,
  Image as ImageIcon,
  Info,
  Loader2,
  Search,
  Sparkles,
  Trash2,
  Upload,
  Wand2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  COVER_LIBRARY_CATALOG,
  CoverLibraryEntry,
  FALLBACK_LIBRARY_COVERS,
  GROUP_LIBRARY_COVERS,
  ITEM_LIBRARY_COVERS,
  findCoverLibraryEntryByUrl,
} from '../../data/coverLibraryCatalog';
import { userAppApi } from '../../services/userAppApi';
import { CoverSourceType, ItemCategory } from '../../types/domain';
import {
  CandidateCoverImage,
  matchSmartCover,
  searchCoverLibrary,
  selectBestCoverFromImages,
} from '../../utils/aiCoverLogic';

export interface SmartCoverValue {
  coverUrl: string;
  coverSource: CoverSourceType;
  originalImages: string[];
}

interface SmartCoverManagerProps {
  entityType: 'item' | 'org_group' | 'shared_group';
  entityName: string;
  category?: ItemCategory;
  description?: string;
  childItemNames?: string[];
  childItemCategories?: ItemCategory[];
  value: SmartCoverValue;
  onChange: (next: SmartCoverValue) => void;
}

function readFileAsDataUrlWithDims(
  file: File
): Promise<{ dataUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!dataUrl) {
        reject(new Error('EMPTY_FILE'));
        return;
      }
      const img = new Image();
      img.onload = () => {
        resolve({
          dataUrl,
          width: img.naturalWidth || 0,
          height: img.naturalHeight || 0,
        });
      };
      img.onerror = () => {
        resolve({ dataUrl, width: 0, height: 0 });
      };
      img.src = dataUrl;
    };
    reader.onerror = () => reject(new Error('READ_ERROR'));
    reader.readAsDataURL(file);
  });
}

export const SmartCoverManager: React.FC<SmartCoverManagerProps> = ({
  entityType,
  entityName,
  category = 'electronics',
  description = '',
  childItemNames,
  childItemCategories,
  value,
  onChange,
}) => {
  const { lang, showToast } = useApp();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryScope, setLibraryScope] = useState<'all' | 'item' | 'group' | 'fallback'>(
    entityType === 'item' ? 'item' : 'group'
  );
  const [librarySearch, setLibrarySearch] = useState('');
  const [statusNote, setStatusNote] = useState<{
    kind: 'matched' | 'fallback' | 'auto_picked' | 'manual';
    textAr: string;
    textEn: string;
  } | null>(null);

  const smartMatchPreview = useMemo(
    () =>
      matchSmartCover({
        entityType,
        name: entityName,
        category,
        description,
        childItemNames,
        childCategories: childItemCategories,
      }),
    [entityType, entityName, category, description, childItemNames, childItemCategories]
  );

  // Live automatic matching while no personal photo is uploaded and cover hasn't been manually pinned
  useEffect(() => {
    const canAutoSync =
      value.originalImages.length === 0 &&
      (value.coverSource === 'fallback' ||
        value.coverSource === 'library_matched' ||
        !value.coverUrl);

    if (!canAutoSync) return;

    if (
      value.coverUrl !== smartMatchPreview.coverUrl ||
      value.coverSource !== smartMatchPreview.coverSource
    ) {
      onChange({
        coverUrl: smartMatchPreview.coverUrl,
        coverSource: smartMatchPreview.coverSource,
        originalImages: value.originalImages,
      });
    }
  }, [
    smartMatchPreview.coverUrl,
    smartMatchPreview.coverSource,
    value.coverUrl,
    value.coverSource,
    value.originalImages,
    onChange,
  ]);

  const effectiveCover =
    value.coverUrl || value.originalImages[0] || smartMatchPreview.coverUrl;

  const activeLibraryEntry = useMemo(
    () => findCoverLibraryEntryByUrl(effectiveCover),
    [effectiveCover]
  );

  const filteredLibraryCovers = useMemo(
    () =>
      searchCoverLibrary({
        scope: libraryScope,
        query: librarySearch,
      }),
    [libraryScope, librarySearch]
  );

  const sourceLabel = (() => {
    switch (value.coverSource) {
      case 'library_matched':
        return {
          ar: 'مطابقة ذكية تلقائية',
          en: 'Smart Auto-Matched',
          cls: 'text-[#0F9D8E] dark:text-[#2DD4BF] bg-[#0F9D8E]/10 border-[#0F9D8E]/25',
        };
      case 'auto_selected':
        return {
          ar: 'أفضل صورة شخصية تلقائيًا',
          en: 'Auto-Picked Personal Photo',
          cls: 'text-sky-700 dark:text-sky-300 bg-sky-500/10 border-sky-500/25',
        };
      case 'user_selected':
        return {
          ar: 'غلاف مختار يدويًا',
          en: 'Manually Selected',
          cls: 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/25',
        };
      case 'ai_generated':
        return {
          ar: 'غلاف ذكي محفوظ',
          en: 'Saved Smart Cover',
          cls: 'text-[#0F9D8E] dark:text-[#2DD4BF] bg-[#0F9D8E]/10 border-[#0F9D8E]/25',
        };
      default:
        return {
          ar: 'غلاف Midnight Teal عام',
          en: 'Midnight Teal General Cover',
          cls: 'text-slate-600 dark:text-slate-300 bg-slate-200/70 dark:bg-slate-800 border-slate-300 dark:border-slate-700',
        };
    }
  })();

  const handleFilesPicked = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      const uploadedCandidates: CandidateCoverImage[] = value.originalImages.map((u) => ({
        url: u,
      }));
      const newOriginalUrls = [...value.originalImages];

      for (const file of Array.from(files).slice(0, 4)) {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
          showToast(
            'warning',
            lang === 'ar' ? 'صيغة غير مدعومة' : 'Unsupported Format',
            lang === 'ar'
              ? `الملف ${file.name} ليس JPG أو PNG أو WebP.`
              : `${file.name} is not a JPG, PNG, or WebP image.`
          );
          continue;
        }
        if (file.size > 5 * 1024 * 1024) {
          showToast(
            'warning',
            lang === 'ar' ? 'حجم الصورة كبير' : 'File Too Large',
            lang === 'ar'
              ? `الحد الأقصى لحجم الصورة 5MB (${file.name}).`
              : `Maximum file size is 5MB (${file.name}).`
          );
          continue;
        }
        const read = await readFileAsDataUrlWithDims(file);
        const uploaded = await userAppApi.uploadMedia({
          folder: 'originals',
          dataUrl: read.dataUrl,
          fileName: file.name,
        });
        newOriginalUrls.push(uploaded.url);
        uploadedCandidates.push({
          url: uploaded.url,
          width: read.width,
          height: read.height,
          sizeBytes: uploaded.sizeBytes,
          fileName: file.name,
        });
      }

      const uniqueOriginals = Array.from(new Set(newOriginalUrls)).slice(0, 8);
      const best = selectBestCoverFromImages(uploadedCandidates);
      if (best) {
        onChange({
          coverUrl: best.url,
          coverSource: 'auto_selected',
          originalImages: uniqueOriginals,
        });
        setStatusNote({
          kind: 'auto_picked',
          textAr: `أولوية للصور الشخصية: تم حفظ صورك الأصلية منفصلة واختيار الأنسب كغلاف تلقائيًا (${best.reasonAr}).`,
          textEn: `Personal photos prioritized: originals saved separately and sharpest cover auto-selected (${best.reasonEn}).`,
        });
      }
    } catch {
      showToast(
        'error',
        lang === 'ar' ? 'تعذر رفع الصورة' : 'Upload Failed',
        lang === 'ar'
          ? 'حدث خطأ أثناء رفع الصورة إلى التخزين الدائم.'
          : 'Could not upload image to permanent media storage.'
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSmartAutoMatch = () => {
    const matched = matchSmartCover({
      entityType,
      name: entityName,
      category,
      description,
      childItemNames,
      childCategories: childItemCategories,
    });
    onChange({
      coverUrl: matched.coverUrl,
      coverSource: matched.coverSource,
      originalImages: value.originalImages,
    });
    setStatusNote({
      kind: matched.coverSource === 'library_matched' ? 'matched' : 'fallback',
      textAr:
        matched.coverSource === 'library_matched'
          ? `تمت المطابقة الذكية تلقائيًا: «${matched.cover.nameAr}» من مكتبة الأغلفة (${COVER_LIBRARY_CATALOG.length} غلافًا).`
          : `لم يتم العثور على كلمة مفتاحية محددة، فتم اعتماد غلاف عام من هوية Midnight Teal («${matched.cover.nameAr}»).`,
      textEn:
        matched.coverSource === 'library_matched'
          ? `Smart-matched "${matched.cover.nameEn}" from the ${COVER_LIBRARY_CATALOG.length}-cover library.`
          : `No specific keyword matched — applied a general Midnight Teal cover ("${matched.cover.nameEn}").`,
    });
  };

  const handleSelectLibraryCover = (entry: CoverLibraryEntry) => {
    onChange({
      coverUrl: entry.url,
      coverSource: 'user_selected',
      originalImages: value.originalImages,
    });
    setStatusNote({
      kind: 'manual',
      textAr: `تم اختيار الغلاف «${entry.nameAr}» يدويًا مع بقاء صورك الأصلية منفصلة كما هي.`,
      textEn: `Manually selected "${entry.nameEn}" while keeping your original photos separate.`,
    });
  };

  const handleSelectOriginalAsCover = (url: string) => {
    onChange({
      coverUrl: url,
      coverSource: 'user_selected',
      originalImages: value.originalImages,
    });
    setStatusNote({
      kind: 'manual',
      textAr: 'تم تعيين هذه الصورة الشخصية كغلاف رئيسي مع الاحتفاظ بباقي الصور الأصلية.',
      textEn: 'Set this personal photo as main cover while keeping all original photos.',
    });
  };

  const handleRemoveOriginal = (url: string) => {
    const remaining = value.originalImages.filter((u) => u !== url);
    let nextCover = value.coverUrl;
    let nextSource = value.coverSource;
    if (value.coverUrl === url) {
      if (remaining.length > 0) {
        nextCover = remaining[0];
        nextSource = 'auto_selected';
      } else {
        nextCover = smartMatchPreview.coverUrl;
        nextSource = smartMatchPreview.coverSource;
      }
    }
    onChange({
      coverUrl: nextCover,
      coverSource: nextSource,
      originalImages: remaining,
    });
  };

  return (
    <div
      data-testid="smart-cover-manager"
      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-[#F7FAFC] dark:bg-[#0B1320]/80 p-4 sm:p-5 space-y-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h4 className="text-sm font-extrabold text-[#0B1320] dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#0F9D8E] dark:text-[#19B5A5]" />
            <span>
              {lang === 'ar'
                ? 'مكتبة الأغلفة الذكية والصور الشخصية'
                : 'Smart Cover Library & Personal Photos'}
            </span>
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {lang === 'ar'
              ? 'يُختار الغلاف تلقائيًا حسب الاسم والتصنيف من 40 غلافًا، وتبقى صورك المرفوعة ذات أولوية ومنفصلة عن الغلاف.'
              : 'Auto-matches from 40 curated covers by name & category; uploaded personal photos take top priority and stay separate.'}
          </p>
        </div>

        <span
          data-testid="cover-source-indicator"
          className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold border ${sourceLabel.cls}`}
        >
          {lang === 'ar' ? sourceLabel.ar : sourceLabel.en}
        </span>
      </div>

      {/* Main Cover Hero Preview + Action Controls */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
        <div className="md:col-span-2 space-y-1.5">
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-[#0B1320]">
            <img
              src={effectiveCover}
              alt={entityName || 'Cover preview'}
              data-testid="active-cover-preview"
              className="w-full h-full object-cover"
            />
          </div>
          {activeLibraryEntry && (
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
              {lang === 'ar' ? activeLibraryEntry.nameAr : activeLibraryEntry.nameEn}
            </p>
          )}
        </div>

        <div className="md:col-span-3 space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => void handleFilesPicked(e.target.files)}
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              data-testid="upload-personal-photo-btn"
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#14233A] border border-slate-300 dark:border-slate-700 text-xs font-bold text-[#0B1320] dark:text-white hover:border-[#0F9D8E] dark:hover:border-[#19B5A5] transition-colors disabled:opacity-60"
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#0F9D8E]" />
              ) : (
                <Upload className="w-4 h-4 text-[#0F9D8E] dark:text-[#19B5A5]" />
              )}
              <span>
                {lang === 'ar' ? 'رفع صورة شخصية' : 'Upload Personal Photo'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleSmartAutoMatch}
              data-testid="smart-auto-match-btn"
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#0F9D8E] hover:bg-[#0D8A7D] text-white text-xs font-bold transition-colors shadow-sm"
            >
              <Wand2 className="w-4 h-4" />
              <span>
                {lang === 'ar' ? 'اختيار ذكي تلقائي' : 'Smart Auto-Match'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setLibraryOpen((prev) => !prev)}
              data-testid="toggle-cover-library-btn"
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#14233A] border border-slate-300 dark:border-slate-700 text-xs font-bold text-[#0B1320] dark:text-white hover:border-[#0F9D8E] dark:hover:border-[#19B5A5] transition-colors"
            >
              <Grid2x2 className="w-4 h-4 text-[#0F9D8E] dark:text-[#19B5A5]" />
              <span>
                {libraryOpen
                  ? lang === 'ar'
                    ? 'إخفاء المكتبة'
                    : 'Hide Library'
                  : lang === 'ar'
                  ? `تصفح المكتبة (${COVER_LIBRARY_CATALOG.length})`
                  : `Browse Library (${COVER_LIBRARY_CATALOG.length})`}
              </span>
            </button>
          </div>

          {/* Quick suggested alternatives from smart matcher */}
          {smartMatchPreview.alternatives.length > 0 && !libraryOpen && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                {lang === 'ar' ? 'أغلفة مقترحة سريعة:' : 'Quick suggested covers:'}
              </p>
              <div className="grid grid-cols-4 gap-2">
                {[smartMatchPreview.cover, ...smartMatchPreview.alternatives.slice(0, 3)].map(
                  (entry) => {
                    const isSelected = effectiveCover === entry.url;
                    return (
                      <button
                        key={entry.id}
                        type="button"
                        onClick={() => handleSelectLibraryCover(entry)}
                        title={lang === 'ar' ? entry.nameAr : entry.nameEn}
                        className={`relative aspect-[4/3] rounded-lg overflow-hidden border-2 transition-all focus:outline-none ${
                          isSelected
                            ? 'border-[#0F9D8E] ring-2 ring-[#0F9D8E]/25'
                            : 'border-slate-200 dark:border-slate-700 hover:border-[#0F9D8E]/70'
                        }`}
                      >
                        <img
                          src={entry.url}
                          alt={lang === 'ar' ? entry.nameAr : entry.nameEn}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          )}

          {statusNote && (
            <div
              className={`p-2.5 rounded-xl border text-xs flex items-start gap-2 ${
                statusNote.kind === 'fallback'
                  ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
                  : 'bg-[#19B5A5]/10 border-[#19B5A5]/30 text-[#0B1320] dark:text-slate-100'
              }`}
            >
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#0F9D8E] dark:text-[#19B5A5]" />
              <span>{lang === 'ar' ? statusNote.textAr : statusNote.textEn}</span>
            </div>
          )}
        </div>
      </div>

      {/* Expandable Full 40-Cover Curated Library Picker */}
      {libraryOpen && (
        <div
          data-testid="curated-cover-library-picker"
          className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  {
                    id: 'all',
                    ar: `الكل (${COVER_LIBRARY_CATALOG.length})`,
                    en: `All (${COVER_LIBRARY_CATALOG.length})`,
                  },
                  {
                    id: 'item',
                    ar: `أغراض (${ITEM_LIBRARY_COVERS.length})`,
                    en: `Items (${ITEM_LIBRARY_COVERS.length})`,
                  },
                  {
                    id: 'group',
                    ar: `مجموعات (${GROUP_LIBRARY_COVERS.length})`,
                    en: `Groups (${GROUP_LIBRARY_COVERS.length})`,
                  },
                  {
                    id: 'fallback',
                    ar: `عامة (${FALLBACK_LIBRARY_COVERS.length})`,
                    en: `General (${FALLBACK_LIBRARY_COVERS.length})`,
                  },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setLibraryScope(tab.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    libraryScope === tab.id
                      ? 'bg-[#0F9D8E] text-white'
                      : 'bg-white dark:bg-[#14233A] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-[#0F9D8E]'
                  }`}
                >
                  {lang === 'ar' ? tab.ar : tab.en}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3 pointer-events-none" />
              <input
                type="text"
                value={librarySearch}
                onChange={(e) => setLibrarySearch(e.target.value)}
                placeholder={
                  lang === 'ar' ? 'ابحث: حقيبة، مفتاح، لابتوب...' : 'Search: bag, key, laptop...'
                }
                className="w-full ps-8 pe-3 py-1.5 rounded-lg bg-white dark:bg-[#14233A] border border-slate-200 dark:border-slate-700 text-xs text-[#0B1320] dark:text-white focus:outline-none focus:border-[#0F9D8E]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5 max-h-72 overflow-y-auto pe-1">
            {filteredLibraryCovers.map((entry) => {
              const isSelected = effectiveCover === entry.url;
              return (
                <button
                  key={entry.id}
                  type="button"
                  data-testid={`library-cover-${entry.id}`}
                  onClick={() => handleSelectLibraryCover(entry)}
                  className={`group text-start rounded-xl overflow-hidden border-2 transition-all bg-white dark:bg-[#111C2D] focus:outline-none ${
                    isSelected
                      ? 'border-[#0F9D8E] ring-2 ring-[#0F9D8E]/25'
                      : 'border-slate-200 dark:border-slate-800 hover:border-[#0F9D8E]/60'
                  }`}
                >
                  <div className="relative aspect-[4/3] bg-[#0B1320] overflow-hidden">
                    <img
                      src={entry.url}
                      alt={lang === 'ar' ? entry.nameAr : entry.nameEn}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-200"
                    />
                    {isSelected && (
                      <span className="absolute top-1 start-1 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#0F9D8E] text-white text-[10px] font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        {lang === 'ar' ? 'مختار' : 'Active'}
                      </span>
                    )}
                  </div>
                  <div className="px-2 py-1.5">
                    <p className="text-[11px] font-bold text-[#0B1320] dark:text-slate-100 truncate">
                      {lang === 'ar' ? entry.nameAr : entry.nameEn}
                    </p>
                  </div>
                </button>
              );
            })}
            {filteredLibraryCovers.length === 0 && (
              <div className="col-span-full py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                {lang === 'ar'
                  ? 'لا توجد أغلفة مطابقة لبحثك. جرّب كلمة أخرى أو استعرض كل الأغلفة.'
                  : 'No covers matched your search. Try another keyword or browse all covers.'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Original Uploaded Photos Gallery (strictly separated from coverUrl) */}
      <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-[#0F9D8E]" />
            <span>
              {lang === 'ar'
                ? `الصور الأصلية المحفوظة (${value.originalImages.length})`
                : `Saved Original Photos (${value.originalImages.length})`}
            </span>
          </span>
          {value.originalImages.length > 0 && (
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {lang === 'ar'
                ? 'اضغط على أي صورة أصلية لتعيينها كغلاف مع بقاء بقية الصور محفوظة.'
                : 'Click any photo to set as cover while preserving all originals.'}
            </span>
          )}
        </div>

        {value.originalImages.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {lang === 'ar'
              ? 'لا توجد صور مرفوعة بعد — يُستخدم الغلاف الذكي المطابق من المكتبة تلقائيًا، ويمكنك رفع صورك في أي وقت.'
              : 'No uploaded photos yet — your smart-matched library cover is active automatically, and you can upload photos anytime.'}
          </p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
            {value.originalImages.map((url) => {
              const isCover = value.coverUrl === url;
              return (
                <div
                  key={url}
                  className={`relative aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all ${
                    isCover
                      ? 'border-[#19B5A5] ring-2 ring-[#19B5A5]/25'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleSelectOriginalAsCover(url)}
                    className="w-full h-full block focus:outline-none"
                    title={lang === 'ar' ? 'تعيين كغلاف' : 'Set as Cover'}
                  >
                    <img src={url} alt="Original" className="w-full h-full object-cover" />
                  </button>
                  {isCover && (
                    <span className="absolute top-1 start-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#0F9D8E] text-white text-[10px] font-bold">
                      <CheckCircle2 className="w-3 h-3" />
                      {lang === 'ar' ? 'الغلاف' : 'Cover'}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveOriginal(url)}
                    aria-label={lang === 'ar' ? 'حذف الصورة' : 'Remove photo'}
                    className="absolute bottom-1 end-1 p-1 rounded-md bg-black/65 text-white hover:bg-red-600 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
