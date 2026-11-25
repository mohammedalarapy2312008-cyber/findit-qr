import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Globe,
  Layers,
  Loader2,
  Lock,
  Mail,
  MessageCircle,
  PauseCircle,
  Phone,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { firebaseServiceLayer } from '../../services/firebase/services';
import { SharedQrPublicItem, SharedQrPublicPayload } from '../../types/domain';

export const SharedQrRecoveryPage: React.FC = () => {
  const { lang, t, selectedSharedCode, navigate, authUser, showToast } = useApp();

  const [loading, setLoading] = useState<boolean>(true);
  const [payload, setPayload] = useState<SharedQrPublicPayload | null>(null);
  const [errorCode, setErrorCode] = useState<string>('');
  const [errorMsgAr, setErrorMsgAr] = useState<string>('');
  const [errorMsgEn, setErrorMsgEn] = useState<string>('');

  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [foundReportSentByItem, setFoundReportSentByItem] = useState<Record<string, string>>({});
  const [reportingFound, setReportingFound] = useState<boolean>(false);

  const [finderMessage, setFinderMessage] = useState<string>('');
  const [finderContact, setFinderContact] = useState<string>('');
  const [finderName, setFinderName] = useState<string>('');
  const [honeypot, setHoneypot] = useState<string>('');
  const [relayError, setRelayError] = useState<string>('');
  const [sendingMessage, setSendingMessage] = useState<boolean>(false);
  const [sentMessageByItem, setSentMessageByItem] = useState<Record<string, boolean>>({});

  const detailPanelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;
    const code = selectedSharedCode.trim();
    if (!code) {
      setLoading(false);
      setPayload(null);
      setErrorCode('SHARED_QR_NOT_FOUND');
      setErrorMsgAr('لم يتم تحديد رمز QR مشترك صالح.');
      setErrorMsgEn('No valid shared QR code was provided.');
      return;
    }

    setLoading(true);
    setErrorCode('');
    setErrorMsgAr('');
    setErrorMsgEn('');
    setSelectedItemId('');

    void firebaseServiceLayer.fetchPublicSharedQrGroup(code).then((res) => {
      if (!active) return;
      setLoading(false);
      if (res.ok && res.data) {
        setPayload(res.data);
      } else {
        setPayload(null);
        setErrorCode(res.errorCode || 'SHARED_QR_NOT_FOUND');
        setErrorMsgAr(res.messageAr || '');
        setErrorMsgEn(res.messageEn || '');
      }
    });

    return () => {
      active = false;
    };
  }, [selectedSharedCode]);

  const selectedItem: SharedQrPublicItem | null =
    payload?.items.find((it) => it.itemId === selectedItemId) ?? null;

  const handleSelectItem = (itemId: string) => {
    setSelectedItemId(itemId);
    setRelayError('');
    setTimeout(() => {
      detailPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 60);
  };

  const handleFoundReport = async (item: SharedQrPublicItem) => {
    if (!payload || reportingFound) return;
    setReportingFound(true);
    const res = await firebaseServiceLayer.submitPublicSharedQrFoundReport(
      payload.shareCode,
      item.itemId
    );
    setReportingFound(false);

    const welcomeText =
      res.ok && res.data
        ? lang === 'ar'
          ? res.data.welcomeAr
          : res.data.welcomeEn
        : lang === 'ar'
        ? res.messageAr
        : res.messageEn;

    setFoundReportSentByItem((prev) => ({
      ...prev,
      [item.itemId]: welcomeText,
    }));

    showToast(
      res.ok ? 'success' : 'info',
      lang === 'ar' ? 'تم تسجيل بلاغ العثور' : 'Found Report Submitted',
      welcomeText
    );
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payload || !selectedItem || sendingMessage) return;

    if (!finderMessage.trim() || finderMessage.trim().length < 5) {
      setRelayError(
        lang === 'ar'
          ? 'يرجى كتابة رسالة قصيرة (٥ أحرف على الأقل) توضح مكان وجود الغرض أو طريقة التسليم.'
          : 'Please enter a short message (at least 5 characters) explaining where the item is.'
      );
      return;
    }

    setRelayError('');
    setSendingMessage(true);
    const res = await firebaseServiceLayer.submitPublicSharedQrMessage(
      payload.shareCode,
      selectedItem.itemId,
      {
        message: finderMessage,
        senderContact: finderContact,
        senderName: finderName,
        honeypot,
      }
    );
    setSendingMessage(false);

    if (!res.ok) {
      setRelayError(lang === 'ar' ? res.messageAr : res.messageEn);
      return;
    }

    setSentMessageByItem((prev) => ({ ...prev, [selectedItem.itemId]: true }));
    setFinderMessage('');
    showToast(
      'success',
      lang === 'ar' ? 'تم إرسال الرسالة لصاحب الغرض' : 'Message Sent to Owner',
      lang === 'ar' ? res.messageAr : res.messageEn
    );
  };

  if (loading) {
    return (
      <div className="py-16 max-w-2xl mx-auto px-4 sm:px-6 text-center">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1A2B] p-10 space-y-3">
          <Loader2 className="w-8 h-8 text-[#2563EB] dark:text-[#19B5A5] animate-spin mx-auto" />
          <p className="text-sm font-bold text-[#17243A] dark:text-white">
            {lang === 'ar'
              ? 'جارٍ تحميل صفحة الاسترداد المشتركة...'
              : 'Loading shared QR recovery page...'}
          </p>
        </div>
      </div>
    );
  }

  if (!payload || errorCode) {
    return (
      <div className="py-14 max-w-2xl mx-auto px-4 sm:px-6">
        <div
          data-testid="shared-qr-not-found"
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1A2B] p-8 sm:p-10 text-center space-y-5 shadow-xl shadow-black/5 dark:shadow-black/25"
        >
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-[#17243A] dark:text-white">
              {lang === 'ar'
                ? 'رمز QR المشترك غير مسجل أو تم حذفه'
                : 'Shared QR Code Not Found or Removed'}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-md mx-auto">
              {(lang === 'ar' ? errorMsgAr : errorMsgEn) ||
                (lang === 'ar'
                  ? 'لم يتم العثور على مجموعة QR مشترك مطابقة لهذا الرابط.'
                  : 'No active shared QR group matches this link.')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('home')}
            className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-600 text-white text-sm font-bold"
          >
            {lang === 'ar' ? 'العودة إلى الصفحة الرئيسية' : 'Back to Home'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-10 lg:py-14 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1A2B] overflow-hidden shadow-xl shadow-black/5 dark:shadow-black/25">
        {/* Top Dark Brand Header */}
        <div className="bg-[#0B1424] text-white p-6 sm:p-8 border-b border-slate-800 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="inline-flex items-center gap-2 text-xs font-mono font-bold text-[#19B5A5]">
              <Layers className="w-4 h-4" />
              <span dir="ltr">FINDIT QR SHARED GROUP · {payload.shareCode}</span>
            </p>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-[#19B5A5]" />
              <span>
                {lang === 'ar'
                  ? 'يعمل بدون تسجيل دخول'
                  : 'No Account Required'}
              </span>
            </span>
          </div>

          <h1
            data-testid="shared-qr-group-name"
            className="text-2xl sm:text-3xl font-extrabold text-white"
          >
            {payload.name}
          </h1>

          {payload.description && (
            <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
              {payload.description}
            </p>
          )}
        </div>

        {/* Body States: Paused / Empty or All Hidden / Visible Items */}
        <div className="p-6 sm:p-8 space-y-6">
          {!payload.isActive ? (
            <div
              data-testid="shared-qr-paused"
              className="rounded-2xl border border-amber-300 bg-amber-50 dark:bg-amber-950/40 p-6 flex items-start gap-4 text-amber-900 dark:text-amber-200"
            >
              <PauseCircle className="w-6 h-6 shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <h2 className="text-base font-extrabold">
                  {lang === 'ar'
                    ? 'تم إيقاف رمز QR المشترك مؤقتًا من قِبل المالك'
                    : 'This Shared QR Code Is Temporarily Paused by the Owner'}
                </h2>
                <p className="text-xs sm:text-sm leading-relaxed">
                  {lang === 'ar'
                    ? 'اختار صاحب هذه المجموعة إيقاف صفحة الاسترداد المشتركة مؤقتًا. إذا كان على الغرض نفسه ملصق QR فردي مستقل، يمكنك مسحه مباشرة.'
                    : 'The owner has temporarily paused this shared recovery page. If the belonging also carries an individual QR tag, you can scan that tag directly.'}
                </p>
              </div>
            </div>
          ) : payload.items.length === 0 ? (
            <div
              data-testid="shared-qr-empty"
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-[#F4F7FB] dark:bg-[#070D17] p-8 text-center space-y-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-200/80 dark:bg-slate-800 text-slate-500 dark:text-slate-300 flex items-center justify-center mx-auto">
                <Layers className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-extrabold text-[#17243A] dark:text-white">
                {lang === 'ar'
                  ? 'لا توجد أغراض متاحة للعرض حاليًا في هذه المجموعة'
                  : 'No Items Are Currently Visible in This Shared Group'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
                {lang === 'ar'
                  ? 'لم يقم المالك بإظهار أي أغراض على صفحة QR المشترك في الوقت الحالي.'
                  : 'The owner has not made any items visible on this shared QR recovery page right now.'}
              </p>
            </div>
          ) : (
            <>
              {/* Step 1: Select the Item You Found */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base sm:text-lg font-extrabold text-[#17243A] dark:text-white">
                      {lang === 'ar'
                        ? 'أي غرض من هذه المجموعة عثرت عليه؟'
                        : 'Which Belonging Did You Find?'}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                      {lang === 'ar'
                        ? 'اضغط على الغرض الذي عثرت عليه لعرض تعليمات الاسترداد ووسائل التواصل المسموح بها لهذا الغرض تحديدًا.'
                        : 'Select the item you found to view the owner-approved contact methods and return instructions for that specific item.'}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-[#0F9D8E] dark:text-[#19B5A5]">
                    {lang === 'ar'
                      ? `${payload.items.length} غرض متاح`
                      : `${payload.items.length} visible`}
                  </span>
                </div>

                <div
                  data-testid="shared-qr-items-list"
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3.5"
                >
                  {payload.items.map((item) => {
                    const isSelected = selectedItem?.itemId === item.itemId;
                    const displayName = lang === 'ar' ? item.itemNameAr : item.itemNameEn;
                    const displayCity = lang === 'ar' ? item.cityAr : item.cityEn;

                    return (
                      <button
                        key={item.itemId}
                        type="button"
                        data-testid={`shared-item-card-${item.itemId}`}
                        onClick={() => handleSelectItem(item.itemId)}
                        className={`text-start rounded-2xl border p-4 transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                          isSelected
                            ? 'border-[#19B5A5] ring-2 ring-[#19B5A5]/30 bg-[#19B5A5]/5 dark:bg-[#19B5A5]/10'
                            : 'border-slate-200 dark:border-slate-800 bg-[#F4F7FB] dark:bg-[#070D17] hover:border-[#2563EB]'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {item.imageUrl && (
                            <img
                              src={item.imageUrl}
                              alt={displayName}
                              className="w-16 h-16 rounded-xl object-contain bg-white dark:bg-[#0F1A2B] border border-slate-200 dark:border-slate-800 shrink-0 p-1"
                            />
                          )}
                          <div className="min-w-0 space-y-1 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="text-sm sm:text-base font-extrabold text-[#17243A] dark:text-white truncate">
                                {displayName}
                              </h3>
                              {isSelected && (
                                <CheckCircle2 className="w-4 h-4 text-[#19B5A5] shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {t.categories[item.category]} · {t.statuses[item.status]}
                              {displayCity ? ` · ${displayCity}` : ''}
                            </p>
                            {item.rewardOffered && (
                              <p className="text-[11px] font-bold text-amber-700 dark:text-[#FFD166]">
                                {lang === 'ar' ? 'مكافأة تقديرية معلنة' : 'Reward Offered'}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-[#2563EB] dark:text-[#19B5A5]">
                          <span>
                            {isSelected
                              ? lang === 'ar'
                                ? 'تم اختيار هذا الغرض — انظر وسائل التواصل أدناه'
                                : 'Selected — View contact options below'
                              : lang === 'ar'
                              ? 'اختر هذا الغرض للتواصل مع صاحبه'
                              : 'Select this item to contact owner'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Focused Item Recovery Panel (ONLY selected item's permitted channels & details) */}
              {selectedItem && (
                <div
                  ref={detailPanelRef}
                  data-testid="shared-selected-item-panel"
                  className="rounded-2xl border-2 border-[#19B5A5]/60 bg-white dark:bg-[#0B1424] p-5 sm:p-6 space-y-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-[#0F9D8E] dark:text-[#19B5A5]">
                        {lang === 'ar' ? 'الغرض المختار للاسترداد:' : 'Selected Belonging:'}
                      </p>
                      <h3
                        data-testid="shared-selected-item-name"
                        className="text-xl font-extrabold text-[#17243A] dark:text-white"
                      >
                        {lang === 'ar' ? selectedItem.itemNameAr : selectedItem.itemNameEn}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {t.categories[selectedItem.category]} · {t.statuses[selectedItem.status]}
                        {(lang === 'ar' ? selectedItem.cityAr : selectedItem.cityEn) && (
                          <span data-testid="shared-selected-item-city">
                            {' · '}
                            {lang === 'ar' ? selectedItem.cityAr : selectedItem.cityEn}
                          </span>
                        )}
                      </p>
                    </div>

                    {selectedItem.isContactEnabled && selectedItem.allowFoundReports && (
                      <button
                        type="button"
                        data-testid="shared-btn-found-report"
                        disabled={reportingFound}
                        onClick={() => void handleFoundReport(selectedItem)}
                        className="px-5 py-3 rounded-xl bg-[#19B5A5] hover:bg-teal-400 text-[#070D17] font-extrabold text-xs sm:text-sm shrink-0 transition-colors cursor-pointer"
                      >
                        {reportingFound
                          ? lang === 'ar'
                            ? 'جارٍ إشعار المالك...'
                            : 'Notifying Owner...'
                          : lang === 'ar'
                          ? 'عثرت على هذا الغرض'
                          : 'I Found This Item'}
                      </button>
                    )}
                  </div>

                  {foundReportSentByItem[selectedItem.itemId] && (
                    <div
                      data-testid="shared-found-report-success"
                      className="rounded-xl bg-[#19B5A5]/15 border border-[#19B5A5] p-4 text-xs sm:text-sm font-bold text-[#17243A] dark:text-white"
                    >
                      {foundReportSentByItem[selectedItem.itemId]}
                    </div>
                  )}

                  {selectedItem.imageUrl && (
                    <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-[#F4F7FB] dark:bg-[#070D17] flex justify-center p-3">
                      <img
                        src={selectedItem.imageUrl}
                        alt={lang === 'ar' ? selectedItem.itemNameAr : selectedItem.itemNameEn}
                        className="max-h-52 w-auto rounded-lg object-contain"
                      />
                    </div>
                  )}

                  {(lang === 'ar' ? selectedItem.descriptionAr : selectedItem.descriptionEn) && (
                    <div
                      data-testid="shared-selected-item-description"
                      className="rounded-xl bg-[#F4F7FB] dark:bg-[#070D17] p-4 border border-slate-200 dark:border-slate-800 space-y-1"
                    >
                      <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        {lang === 'ar' ? 'وصف الغرض:' : 'Item Description:'}
                      </h4>
                      <p className="text-sm text-[#17243A] dark:text-slate-200 leading-relaxed">
                        {lang === 'ar' ? selectedItem.descriptionAr : selectedItem.descriptionEn}
                      </p>
                    </div>
                  )}

                  {selectedItem.rewardOffered && (
                    <div className="rounded-xl bg-[#FFD166]/25 dark:bg-[#FFD166]/15 border border-[#FFD166] p-4 flex items-center gap-3">
                      <UserCheck className="w-5 h-5 text-[#17243A] dark:text-[#FFD166] shrink-0" />
                      <p className="text-sm font-bold text-[#17243A] dark:text-[#FFD166]">
                        {lang === 'ar'
                          ? `مكافأة تقديرية معلنة من المالك: ${selectedItem.rewardAmountTextAr}`
                          : `Owner Appreciation Reward Offered: ${selectedItem.rewardAmountTextEn}`}
                      </p>
                    </div>
                  )}

                  {(lang === 'ar' ? selectedItem.finderNoteAr : selectedItem.finderNoteEn) && (
                    <div className="rounded-xl bg-[#F4F7FB] dark:bg-[#070D17] p-4 border border-slate-200 dark:border-slate-800 space-y-1.5">
                      <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        {lang === 'ar'
                          ? 'رسالة وتعليمات صاحب هذا الغرض:'
                          : 'Return Instructions for This Item:'}
                      </h4>
                      <p className="text-sm sm:text-base font-medium text-[#17243A] dark:text-white leading-relaxed">
                        {lang === 'ar' ? selectedItem.finderNoteAr : selectedItem.finderNoteEn}
                      </p>
                    </div>
                  )}

                  {/* Owner-Approved Contact Channels ONLY for this specific item */}
                  {!selectedItem.anonymousRelayOnly &&
                    Boolean(
                      selectedItem.visibleChannels.phone ||
                        selectedItem.visibleChannels.whatsapp ||
                        selectedItem.visibleChannels.email ||
                        selectedItem.visibleChannels.telegram ||
                        selectedItem.visibleChannels.facebook ||
                        (selectedItem.visibleChannels.customLinks &&
                          selectedItem.visibleChannels.customLinks.length > 0)
                    ) && (
                      <div className="space-y-3" data-testid="shared-approved-channels">
                        <h4 className="text-sm font-bold text-[#17243A] dark:text-white">
                          {lang === 'ar'
                            ? 'وسائل التواصل المسموح بها لهذا الغرض:'
                            : 'Approved Contact Channels for This Item:'}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {selectedItem.visibleChannels.whatsapp && (
                            <a
                              data-testid="shared-channel-whatsapp"
                              href={`https://wa.me/${selectedItem.visibleChannels.whatsapp.replace(
                                /[^0-9]/g,
                                ''
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#19B5A5] text-[#070D17] font-bold text-sm"
                            >
                              <MessageCircle className="w-4 h-4" />
                              <span dir="ltr">
                                WhatsApp: {selectedItem.visibleChannels.whatsapp}
                              </span>
                            </a>
                          )}
                          {selectedItem.visibleChannels.phone && (
                            <a
                              data-testid="shared-channel-phone"
                              href={`tel:${selectedItem.visibleChannels.phone}`}
                              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#0F9D8E] text-white font-bold text-sm"
                            >
                              <Phone className="w-4 h-4" />
                              <span dir="ltr">{selectedItem.visibleChannels.phone}</span>
                            </a>
                          )}
                          {selectedItem.visibleChannels.email && (
                            <a
                              data-testid="shared-channel-email"
                              href={`mailto:${selectedItem.visibleChannels.email}`}
                              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-[#17243A] dark:text-white font-bold text-sm"
                            >
                              <Mail className="w-4 h-4 text-[#0F9D8E]" />
                              <span dir="ltr">{selectedItem.visibleChannels.email}</span>
                            </a>
                          )}
                          {selectedItem.visibleChannels.telegram && (
                            <a
                              data-testid="shared-channel-telegram"
                              href={`https://t.me/${selectedItem.visibleChannels.telegram.replace(
                                /^@/,
                                ''
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-[#0F9D8E]/40 bg-[#0F9D8E]/10 text-[#17243A] dark:text-white font-bold text-sm"
                            >
                              <MessageCircle className="w-4 h-4 text-[#0F9D8E]" />
                              <span dir="ltr">
                                Telegram: {selectedItem.visibleChannels.telegram}
                              </span>
                            </a>
                          )}
                          {selectedItem.visibleChannels.facebook &&
                            /^https:\/\/[a-z0-9.-]+/i.test(
                              selectedItem.visibleChannels.facebook
                            ) && (
                              <a
                                data-testid="shared-channel-facebook"
                                href={selectedItem.visibleChannels.facebook}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-[#17243A] dark:text-white font-bold text-sm"
                              >
                                <Globe className="w-4 h-4 text-[#0F9D8E]" />
                                <span dir="ltr">Facebook</span>
                              </a>
                            )}
                          {Array.isArray(selectedItem.visibleChannels.customLinks) &&
                            selectedItem.visibleChannels.customLinks
                              .filter((lnk) => /^https:\/\/[a-z0-9.-]+/i.test(lnk.value))
                              .map((lnk) => (
                                <a
                                  key={lnk.id}
                                  data-testid={`shared-channel-custom-${lnk.id}`}
                                  href={lnk.value}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-[#17243A] dark:text-white font-bold text-sm"
                                >
                                  <ExternalLink className="w-4 h-4 text-[#0F9D8E]" />
                                  <span className="truncate">{lnk.label}</span>
                                </a>
                              ))}
                        </div>
                      </div>
                    )}

                  {/* Finder Message Form for Selected Item */}
                  {selectedItem.allowFinderMessages && (
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-[#19B5A5]" />
                        <h4 className="text-sm font-bold text-[#17243A] dark:text-white">
                          {lang === 'ar'
                            ? 'إرسال رسالة مباشرة لصاحب هذا الغرض (بدون حساب)'
                            : 'Send a Direct Message to the Owner (No Account Required)'}
                        </h4>
                      </div>

                      {sentMessageByItem[selectedItem.itemId] ? (
                        <div
                          data-testid="shared-finder-message-success"
                          className="rounded-xl bg-[#19B5A5]/15 border border-[#19B5A5] p-4 text-sm text-[#17243A] dark:text-white flex items-center justify-between gap-4"
                        >
                          <span>
                            {lang === 'ar'
                              ? 'تم إرسال رسالتك إلى صاحب الغرض بنجاح! شكرًا لأمانتك.'
                              : 'Your message has been delivered to the item owner! Thank you.'}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setSentMessageByItem((prev) => ({
                                ...prev,
                                [selectedItem.itemId]: false,
                              }))
                            }
                            className="text-xs font-bold underline shrink-0"
                          >
                            {lang === 'ar' ? 'إرسال رسالة أخرى' : 'Send another'}
                          </button>
                        </div>
                      ) : (
                        <form
                          onSubmit={handleSendMessage}
                          noValidate
                          data-testid="shared-finder-message-form"
                          className="space-y-3"
                        >
                          <input
                            type="text"
                            name="websiteUrl"
                            value={honeypot}
                            onChange={(e) => setHoneypot(e.target.value)}
                            tabIndex={-1}
                            autoComplete="off"
                            className="hidden"
                            aria-hidden="true"
                          />
                          <div>
                            <label
                              htmlFor="shared-finder-message-input"
                              className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1"
                            >
                              {lang === 'ar' ? 'الرسالة لصاحب الغرض *' : 'Message to Owner *'}
                            </label>
                            <textarea
                              id="shared-finder-message-input"
                              data-testid="shared-finder-message-input"
                              rows={3}
                              value={finderMessage}
                              onChange={(e) => setFinderMessage(e.target.value)}
                              placeholder={
                                lang === 'ar'
                                  ? 'اكتب أين وجدت هذا الغرض وكيف يمكن تسليمه بأمان...'
                                  : 'Describe where you found this item and how to hand it back...'
                              }
                              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17] text-sm"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label
                                htmlFor="shared-finder-contact-input"
                                className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1"
                              >
                                {lang === 'ar'
                                  ? 'وسيلة تواصل اختيارية للمرسل'
                                  : 'Optional Contact Info'}
                              </label>
                              <input
                                id="shared-finder-contact-input"
                                type="text"
                                value={finderContact}
                                onChange={(e) => setFinderContact(e.target.value)}
                                placeholder={
                                  lang === 'ar' ? 'هاتف أو بريد (اختياري)' : 'Phone or email'
                                }
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17] text-sm"
                              />
                            </div>
                            <div>
                              <label
                                htmlFor="shared-finder-name-input"
                                className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1"
                              >
                                {lang === 'ar' ? 'اسمك (اختياري)' : 'Your Name (Optional)'}
                              </label>
                              <input
                                id="shared-finder-name-input"
                                type="text"
                                value={finderName}
                                onChange={(e) => setFinderName(e.target.value)}
                                placeholder={lang === 'ar' ? 'فاعل خير' : 'Good Samaritan'}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17] text-sm"
                              />
                            </div>
                          </div>

                          {relayError && (
                            <p role="alert" className="text-xs font-bold text-red-600 dark:text-red-400">
                              {relayError}
                            </p>
                          )}

                          <button
                            type="submit"
                            data-testid="shared-finder-message-submit"
                            disabled={sendingMessage}
                            className="px-5 py-2.5 rounded-xl bg-[#17243A] dark:bg-[#2563EB] text-white text-xs sm:text-sm font-bold disabled:opacity-50 cursor-pointer"
                          >
                            {sendingMessage
                              ? lang === 'ar'
                                ? 'جارٍ الإرسال...'
                                : 'Sending...'
                              : lang === 'ar'
                              ? 'إرسال الرسالة لصاحب الغرض'
                              : 'Send Message to Owner'}
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {authUser && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => navigate('shared-qr-groups')}
            className="text-xs font-bold text-[#2563EB] dark:text-[#19B5A5] hover:underline"
          >
            {lang === 'ar'
              ? 'العودة إلى إدارة مجموعات QR المشترك في لوحة المستخدم ←'
              : 'Manage Shared QR Groups in User Workspace →'}
          </button>
        </div>
      )}
    </div>
  );
};
