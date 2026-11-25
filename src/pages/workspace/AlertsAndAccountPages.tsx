import React, { useEffect, useState } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Database,
  KeyRound,
  Link2,
  Loader2,
  MailCheck,
  MapPin,
  Moon,
  PhoneCall,
  Save,
  Shield,
  ShieldCheck,
  Sun,
  Trash2,
  Upload,
  User,
} from 'lucide-react';
import { CheckoutModal } from '../../components/common/CheckoutModal';
import { AsyncStateBoundary, ViewStateBar } from '../../components/common/UiPrimitives';
import { SmartRelatedServices } from '../../components/workspace/SmartRelatedServices';
import { useApp } from '../../context/AppContext';
import {
  BILLING_DURATION_OPTIONS,
  BillingDurationId,
  CANONICAL_PLANS,
} from '../../data/plansCatalog';
import { firebaseServiceLayer } from '../../services/firebase/services';
import { userAppApi } from '../../services/userAppApi';
import { Language, ManagedPlanDefinition, NotificationEntry } from '../../types/domain';
import { validateProfileUpdate } from '../../utils/qrLogic';

export const NotificationsPage: React.FC = () => {
  const {
    lang,
    t,
    finderMessages,
    notifications,
    settings,
    updateSettingsInSession,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotificationsInSession,
    updateFinderMessageStatusInSession,
    requestConfirm,
    navigate,
  } = useApp();

  const [filterUnread, setFilterUnread] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<'all' | NotificationEntry['type']>('all');
  const [savingPref, setSavingPref] = useState(false);

  const visibleList = notifications.filter((n) => {
    if (filterUnread && n.isRead) return false;
    if (categoryFilter !== 'all' && n.type !== categoryFilter) return false;
    return true;
  });

  const visibleMessages = filterUnread
    ? finderMessages.filter((m) => m.status === 'unread')
    : finderMessages.filter((m) => m.status !== 'archived');

  const toggleAlertPref = async (
    key:
      | 'notifyOnQrScan'
      | 'notifyOnFinderMessage'
      | 'notifyOnRecovery'
      | 'notifyOnSubscription'
      | 'notifyOnSystemUpdates'
  ) => {
    setSavingPref(true);
    try {
      const currentVal = settings[key] !== false;
      await updateSettingsInSession({ ...settings, [key]: !currentVal });
    } finally {
      setSavingPref(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1320] dark:text-white">
            {t.workspaceNav.notifications}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            {lang === 'ar'
              ? 'مركز بلاغات «عثرت على هذا الغرض» ورسائل المكتشفين وتنبيهات النظام.'
              : 'Centralized inbox for "I Found This Item" reports, finder messages, and scan alerts.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setFilterUnread((p) => !p)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors ${
              filterUnread
                ? 'bg-[#0F9D8E] text-white border-[#0F9D8E]'
                : 'bg-white dark:bg-[#0E192B] border-slate-200 dark:border-slate-700'
            }`}
          >
            {lang === 'ar' ? 'غير المقروءة فقط' : 'Unread Only'}
          </button>

          <button
            type="button"
            onClick={markAllNotificationsRead}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0E192B] text-xs font-bold"
          >
            <CheckCheck className="w-3.5 h-3.5 text-[#19B5A5]" />
            <span>{lang === 'ar' ? 'تحديد الكل كمقروء' : 'Mark All Read'}</span>
          </button>

          {notifications.length > 0 && (
            <button
              type="button"
              onClick={() =>
                requestConfirm({
                  title:
                    lang === 'ar'
                      ? 'تأكيد إفراغ مركز الإشعارات'
                      : 'Confirm Clearing Notification Center',
                  description:
                    lang === 'ar'
                      ? 'هل ترغب في مسح جميع الإشعارات من حسابك؟'
                      : 'Are you sure you want to clear all notifications?',
                  confirmLabel: t.common.confirm,
                  variant: 'danger',
                  onConfirm: clearNotificationsInSession,
                })
              }
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-red-600"
              aria-label={lang === 'ar' ? 'مسح جميع الإشعارات' : 'Clear all notifications'}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Pills + Notification Type Preferences */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E192B] p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: 'all' as const, ar: 'كل الفئات', en: 'All Categories' },
              { id: 'found_report' as const, ar: 'بلاغات العثور', en: 'Found Reports' },
              { id: 'finder_message' as const, ar: 'رسائل المكتشفين', en: 'Finder Messages' },
              { id: 'scan_alert' as const, ar: 'تنبيهات المسح', en: 'QR Scans' },
              { id: 'security_notice' as const, ar: 'تنبيهات الأمان', en: 'Security' },
              { id: 'system_architecture' as const, ar: 'النظام والاشتراك', en: 'System & Plans' },
            ] as const
          ).map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                categoryFilter === cat.id
                  ? 'bg-[#0F9D8E] text-white dark:text-[#07101A]'
                  : 'bg-[#F4F8FA] dark:bg-[#0B1320] text-slate-600 dark:text-slate-300'
              }`}
            >
              {lang === 'ar' ? cat.ar : cat.en}
            </button>
          ))}
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs font-bold text-slate-500 mb-2">
            {lang === 'ar' ? 'التحكم بتفعيل أنواع التنبيهات:' : 'Notification Category Toggles:'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 text-xs">
            {(
              [
                { key: 'notifyOnQrScan' as const, ar: 'مسح QR', en: 'QR Scans' },
                { key: 'notifyOnFinderMessage' as const, ar: 'رسائل المكتشفين', en: 'Finder Messages' },
                { key: 'notifyOnRecovery' as const, ar: 'بلاغات العثور', en: 'Found Reports' },
                { key: 'notifyOnSubscription' as const, ar: 'الاشتراكات', en: 'Subscriptions' },
                { key: 'notifyOnSystemUpdates' as const, ar: 'تحديثات النظام', en: 'System Updates' },
              ] as const
            ).map((pref) => (
              <label
                key={pref.key}
                className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#F4F8FA] dark:bg-[#0B1320] border border-slate-200/80 dark:border-slate-800 cursor-pointer"
              >
                <span className="font-semibold text-[#0B1320] dark:text-slate-200">
                  {lang === 'ar' ? pref.ar : pref.en}
                </span>
                <input
                  type="checkbox"
                  disabled={savingPref}
                  checked={settings[pref.key] !== false}
                  onChange={() => void toggleAlertPref(pref.key)}
                />
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Finder Messages & Found Reports Inbox Section */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1A2B] p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-base font-extrabold text-[#17243A] dark:text-white">
            {lang === 'ar'
              ? 'صندوق رسائل المكتشفين وبلاغات العثور الفورية'
              : 'Finder Messages & Instant Found Reports Inbox'}
          </h2>
          <span className="text-xs font-bold tabular-nums shrink-0 px-2.5 py-1 rounded-lg bg-[#19B5A5]/15 text-[#17243A] dark:text-[#19B5A5]">
            {visibleMessages.length}{' '}
            {lang === 'ar' ? 'رسائل / بلاغات' : 'messages / reports'}
          </span>
        </div>

        {visibleMessages.length === 0 ? (
          <div className="rounded-xl bg-[#F4F7FB] dark:bg-[#070D17] p-6 text-center text-xs text-slate-500">
            {lang === 'ar'
              ? 'لا توجد رسائل واردة أو بلاغات عثور حتى الآن. عندما يقوم شخص بمسح كود QR وإرسال رسالة أو الضغط على «عثرت على هذا الغرض» ستظهر هنا فورًا.'
              : 'No incoming finder messages or found reports yet. They will appear here as soon as someone scans your QR code.'}
          </div>
        ) : (
          <div className="space-y-3" data-testid="finder-messages-list">
            {visibleMessages.map((msg) => (
              <div
                key={msg.id}
                data-testid={`finder-msg-${msg.id}`}
                className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  msg.status === 'unread'
                    ? 'border-[#19B5A5] bg-[#19B5A5]/5'
                    : 'border-slate-200 dark:border-slate-800 bg-[#F4F7FB] dark:bg-[#070D17]'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-mono font-bold text-[#2563EB] dark:text-[#19B5A5]">
                      {msg.codeSerial}
                    </span>
                    <span>·</span>
                    <span className="font-bold text-[#17243A] dark:text-white">
                      {msg.itemName}
                    </span>
                    <span>·</span>
                    <span className="font-mono text-slate-400">
                      {msg.createdAt.replace('T', ' ').slice(0, 16)}
                    </span>
                    <span>·</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        msg.status === 'unread'
                          ? 'bg-[#FF8A65]/20 text-[#17243A] dark:text-[#FF8A65]'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {msg.status === 'unread'
                        ? lang === 'ar'
                          ? 'غير مقروءة'
                          : 'Unread'
                        : lang === 'ar'
                        ? 'مقروءة'
                        : 'Read'}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-[#17243A] dark:text-white">
                    {msg.message}
                  </p>
                  {msg.senderContact && (
                    <p className="text-xs text-[#2563EB] dark:text-[#19B5A5]">
                      {lang === 'ar' ? 'وسيلة تواصل المرسل: ' : 'Sender contact: '}
                      <span dir="ltr" className="font-mono font-semibold">
                        {msg.senderContact}
                      </span>
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => navigate('item-details', { itemId: msg.itemId })}
                    className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#0F1A2B] border border-slate-200 dark:border-slate-700 text-xs font-bold"
                  >
                    {t.common.viewDetails}
                  </button>
                  {msg.status === 'unread' && (
                    <button
                      type="button"
                      onClick={() =>
                        void updateFinderMessageStatusInSession(msg.id, 'read')
                      }
                      className="px-3 py-1.5 rounded-lg bg-[#2563EB] text-white text-xs font-bold"
                    >
                      {lang === 'ar' ? 'تحديد كمقروء' : 'Mark Read'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ViewStateBar
        pageHintAr="يعرض مركز الإشعارات التنبيهات المرتبطة بحسابك في قاعدة البيانات."
        pageHintEn="Notification Center displays alerts stored in your account database."
      />

      <AsyncStateBoundary
        emptyTitleAr="لا توجد إشعارات جديدة"
        emptyTitleEn="No Notifications to Display"
        emptyDescAr="ستظهر هنا تنبيهات مسح أكواد QR ورسائل الأشخاص الذين يعثرون على أغراضك."
        emptyDescEn="QR scan alerts and finder messages will appear here when your tags are scanned."
      >
        {visibleList.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1A2B] p-10 text-center space-y-2">
            <Bell className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-base font-bold text-[#17243A] dark:text-white">
              {lang === 'ar' ? 'لا توجد إشعارات في هذه القائمة' : 'No notifications in this view'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleList.map((notif) => (
              <div
                key={notif.id}
                className={`rounded-2xl border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                  notif.isRead
                    ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1A2B]'
                    : 'border-[#2563EB] bg-white dark:bg-[#0F1A2B]'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono text-slate-400 tabular-nums">
                      {notif.timestamp}
                    </span>
                    <span>·</span>
                    <span className="font-bold text-[#2563EB] dark:text-[#19B5A5]">
                      {notif.isRead
                        ? lang === 'ar'
                          ? 'مقروء'
                          : 'Read'
                        : lang === 'ar'
                        ? 'جديد'
                        : 'New Alert'}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-[#17243A] dark:text-white">
                    {lang === 'ar' ? notif.titleAr : notif.titleEn}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {lang === 'ar' ? notif.bodyAr : notif.bodyEn}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {notif.relatedItemId && (
                    <button
                      type="button"
                      onClick={() =>
                        navigate('item-details', { itemId: notif.relatedItemId })
                      }
                      className="px-3 py-1.5 rounded-lg bg-[#F4F7FB] dark:bg-slate-800 text-xs font-bold text-[#2563EB] dark:text-[#19B5A5]"
                    >
                      {t.common.viewDetails}
                    </button>
                  )}
                  {!notif.isRead && (
                    <button
                      type="button"
                      onClick={() => markNotificationRead(notif.id)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                    >
                      {lang === 'ar' ? 'كمقروء' : 'Mark Read'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </AsyncStateBoundary>

      <SmartRelatedServices currentPage="notifications" />
    </div>
  );
};

export const ActivityPage: React.FC = () => {
  const { lang, t, activityLogs, navigate } = useApp();
  const [activityFilter, setActivityFilter] = useState<'all' | 'items' | 'recovery' | 'account'>('all');

  const filteredLogs = activityLogs.filter((entry) => {
    if (activityFilter === 'all') return true;
    if (activityFilter === 'items') {
      return (
        entry.actionType === 'item_created' ||
        entry.actionType === 'item_registered' ||
        entry.actionType === 'item_updated' ||
        entry.actionType === 'item_archived' ||
        entry.actionType === 'item_reactivated' ||
        entry.actionType === 'item_deleted' ||
        entry.actionType === 'design_assigned'
      );
    }
    if (activityFilter === 'recovery') {
      return (
        entry.actionType === 'qr_scan' ||
        entry.actionType === 'finder_message' ||
        entry.actionType === 'found_report' ||
        entry.actionType === 'status_changed'
      );
    }
    return entry.actionType === 'profile_updated' || entry.actionType === 'privacy_updated';
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17243A] dark:text-white">
            {t.workspaceNav.activity}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            {lang === 'ar'
              ? 'سجل زمني دقيق لجميع عمليات إضافة وتعديل وأرشفة الأغراض ومسح الأكواد.'
              : 'Chronological audit trail of item registrations, edits, archives, and QR scans.'}
          </p>
        </div>

        <div className="inline-flex flex-wrap gap-1.5 p-1 rounded-xl bg-white dark:bg-[#0F1A2B] border border-slate-200 dark:border-slate-800">
          {[
            { id: 'all' as const, ar: 'الكل', en: 'All' },
            { id: 'items' as const, ar: 'الأغراض', en: 'Items' },
            { id: 'recovery' as const, ar: 'المسح والاستعادة', en: 'Recovery' },
            { id: 'account' as const, ar: 'الحساب', en: 'Account' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActivityFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activityFilter === tab.id
                  ? 'bg-[#2563EB] text-white'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {lang === 'ar' ? tab.ar : tab.en}
            </button>
          ))}
        </div>
      </div>

      <ViewStateBar
        pageHintAr="يتتبع سجل النشاط كل تغيير في حالة الأغراض أو مسح للأكواد بالوقت والتاريخ."
        pageHintEn="Activity Log records every scan event and item state change with timestamps."
      />

      <AsyncStateBoundary
        emptyTitleAr="سجل النشاط فارغ حاليًا"
        emptyTitleEn="Activity Log is Empty"
        emptyDescAr="سيتم تسجيل أول حدث تلقائيًا عند إضافة غرض أو مسح كود QR."
        emptyDescEn="Events will be logged automatically as you register items or receive QR scans."
      >
        {filteredLogs.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1A2B] p-10 text-center text-sm text-slate-500">
            {lang === 'ar'
              ? 'لا توجد عمليات مسجلة تحت هذا الفلتر.'
              : 'No operations recorded under this filter.'}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1A2B] divide-y divide-slate-200/70 dark:divide-slate-800">
            {filteredLogs.map((entry) => (
              <div
                key={entry.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono font-bold text-[#2563EB] dark:text-[#19B5A5] tabular-nums">
                      {entry.timestamp}
                    </span>
                    <span>·</span>
                    <span>{lang === 'ar' ? entry.actorAr : entry.actorEn}</span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {lang === 'ar' ? entry.locationAr : entry.locationEn}
                    </span>
                  </div>
                  <h2 className="text-sm sm:text-base font-bold text-[#17243A] dark:text-white">
                    {lang === 'ar' ? entry.titleAr : entry.titleEn}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    {lang === 'ar' ? entry.detailAr : entry.detailEn}
                  </p>
                </div>

                {entry.itemId && (
                  <button
                    type="button"
                    onClick={() => navigate('item-details', { itemId: entry.itemId })}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold shrink-0 self-start sm:self-center"
                  >
                    {t.common.viewDetails}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </AsyncStateBoundary>
    </div>
  );
};

export const ProfilePage: React.FC = () => {
  const {
    lang,
    t,
    profile,
    updateProfileInSession,
    resendVerificationEmail,
    setAccountPassword,
    linkGoogleAccount,
    navigate,
    showToast,
  } = useApp();
  const [formState, setFormState] = useState(profile);
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Sign-In Methods & Security state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordFormError, setPasswordFormError] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const [showLinkGoogleForm, setShowLinkGoogleForm] = useState(false);
  const [linkGooglePassword, setLinkGooglePassword] = useState('');
  const [linkGoogleError, setLinkGoogleError] = useState('');
  const [linkingGoogle, setLinkingGoogle] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
        reader.onerror = () => reject(new Error('READ_FAILED'));
        reader.readAsDataURL(file);
      });
      const res = await userAppApi.uploadMedia({
        folder: 'avatars',
        dataUrl,
        fileName: file.name,
      });
      setFormState((prev) => ({ ...prev, photoURL: res.url }));
      showToast(
        'success',
        lang === 'ar' ? 'تم رفع الصورة الشخصية' : 'Avatar Uploaded',
        lang === 'ar'
          ? 'احفظ التغييرات لتثبيت الصورة الجديدة في ملفك.'
          : 'Save profile changes to apply the new photo.'
      );
    } catch {
      showToast(
        'error',
        lang === 'ar' ? 'تعذر رفع الصورة' : 'Avatar Upload Failed',
        lang === 'ar' ? 'تأكد من الصيغة (JPG/PNG/WebP) والحجم.' : 'Check format (JPG/PNG/WebP) and size.'
      );
    } finally {
      setUploadingAvatar(false);
    }
  };

  const hasPasswordMethod =
    profile.hasPassword ??
    (profile.authProviders ? profile.authProviders.includes('password') : true);
  const hasGoogleMethod =
    profile.hasGoogle ??
    (profile.authProviders ? profile.authProviders.includes('google') : false);

  useEffect(() => {
    setFormState(profile);
    setProfileErrors({});
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateProfileUpdate({
      displayName: formState.displayName,
      country: formState.country,
      preferredLanguage: formState.preferredLanguage,
      photoURL: formState.photoURL,
      phone: formState.phone,
      whatsapp: formState.whatsapp,
      telegram: formState.telegram,
    });
    if (!check.valid) {
      setProfileErrors(check.errors);
      return;
    }
    setProfileErrors({});
    await updateProfileInSession({
      ...formState,
      displayNameAr: formState.displayName,
      displayNameEn: formState.displayName,
    });
  };

  const handleSetOrChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFormError('');
    if (newPassword.length < 8) {
      setPasswordFormError(
        lang === 'ar'
          ? 'يجب أن تتكون كلمة المرور الجديدة من ٨ أحرف على الأقل.'
          : 'New password must be at least 8 characters long.'
      );
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordFormError(
        lang === 'ar'
          ? 'كلمتا المرور غير متطابقتين.'
          : 'Passwords do not match.'
      );
      return;
    }
    if (hasPasswordMethod && !currentPassword) {
      setPasswordFormError(
        lang === 'ar'
          ? 'يرجى إدخال كلمة المرور الحالية أولًا.'
          : 'Please enter your current password first.'
      );
      return;
    }

    setSavingPassword(true);
    try {
      let googleIdToken: string | undefined;
      if (!hasPasswordMethod) {
        const tokenRes = await firebaseServiceLayer.getFreshGoogleIdToken();
        if (!tokenRes.ok || !tokenRes.data?.idToken) {
          setPasswordFormError(
            lang === 'ar'
              ? tokenRes.messageAr || 'تعذر التحقق من حساب Google قبل تعيين كلمة المرور.'
              : tokenRes.messageEn || 'Could not verify your Google account before setting a password.'
          );
          return;
        }
        googleIdToken = tokenRes.data.idToken;
      }

      const res = await setAccountPassword({
        newPassword,
        ...(hasPasswordMethod ? { currentPassword } : { googleIdToken }),
      });
      if (res.ok) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      }
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLinkGoogleAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setLinkGoogleError('');
    if (!linkGooglePassword) {
      setLinkGoogleError(
        lang === 'ar'
          ? 'أدخل كلمة مرور حسابك الحالية لتأكيد ملكية الحساب قبل ربط Google.'
          : 'Enter your current account password to verify ownership before linking Google.'
      );
      return;
    }

    setLinkingGoogle(true);
    try {
      const tokenRes = await firebaseServiceLayer.getFreshGoogleIdToken();
      if (!tokenRes.ok || !tokenRes.data?.idToken) {
        setLinkGoogleError(
          lang === 'ar'
            ? tokenRes.messageAr || 'تعذر إتمام التحقق من Google.'
            : tokenRes.messageEn || 'Could not complete Google verification.'
        );
        return;
      }
      const res = await linkGoogleAccount(linkGooglePassword, tokenRes.data.idToken);
      if (res.ok) {
        setLinkGooglePassword('');
        setShowLinkGoogleForm(false);
      }
    } finally {
      setLinkingGoogle(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17243A] dark:text-white">
          {t.workspaceNav.profile}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          {lang === 'ar'
            ? 'ملفك الشخصي الحقيقي المرتبط بمعرف حسابك وإعدادات الباقة واللغة.'
            : 'Your real user profile linked to your account UID, plan quota, and language preferences.'}
        </p>
      </div>

      <form
        onSubmit={handleSave}
        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1A2B] p-6 sm:p-8 space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-4">
            {formState.photoURL ? (
              <img
                src={formState.photoURL}
                alt={formState.displayName}
                className="w-14 h-14 rounded-2xl object-cover border border-slate-200 dark:border-slate-700"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-[#2563EB] text-white flex items-center justify-center font-extrabold text-xl">
                <User className="w-7 h-7" />
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-[#17243A] dark:text-white">
                {formState.displayName || formState.displayNameAr}
              </h2>
              <p className="text-xs font-mono text-slate-500">{formState.email}</p>
              <p className="text-[11px] font-mono text-[#2563EB] dark:text-[#19B5A5] mt-0.5">
                UID: {formState.uid}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-lg bg-[#2563EB]/10 text-[#2563EB] dark:text-[#19B5A5] text-xs font-extrabold">
              {lang === 'ar' ? `الباقة: ${formState.plan}` : `Plan: ${formState.plan}`}
            </span>
            <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
              {lang === 'ar'
                ? `الحالة: ${formState.accountStatus === 'active' ? 'نشط' : formState.accountStatus}`
                : `Status: ${formState.accountStatus}`}
            </span>
          </div>
        </div>

        {/* Read-only System Metadata Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-[#F4F7FB] dark:bg-[#070D17] border border-slate-200/80 dark:border-slate-800 text-xs">
          <div>
            <span className="text-slate-400 block">
              {lang === 'ar' ? 'معرف المستخدم (UID):' : 'User ID (UID):'}
            </span>
            <span className="font-mono font-bold text-[#17243A] dark:text-white break-all">
              {formState.uid}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">
              {lang === 'ar' ? 'تاريخ إنشاء الحساب:' : 'Account Created At:'}
            </span>
            <span className="font-mono font-bold text-[#17243A] dark:text-white">
              {formState.createdAt ? formState.createdAt.slice(0, 10) : '—'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">
              {lang === 'ar' ? 'الحد الأساسي للأغراض النشطة:' : 'Active Items Quota:'}
            </span>
            <span className="font-mono font-bold text-[#2563EB] dark:text-[#19B5A5]">
              {formState.activeItemsCount} / {formState.activeItemsLimit}{' '}
              {lang === 'ar' ? 'أغراض نشطة' : 'active items'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="prof-display-name"
              className="block text-xs font-bold text-slate-500 mb-1.5"
            >
              {lang === 'ar' ? 'الاسم الكامل *' : 'Full Name *'}
            </label>
            <input
              id="prof-display-name"
              type="text"
              required
              value={formState.displayName}
              onChange={(e) =>
                setFormState({
                  ...formState,
                  displayName: e.target.value,
                  displayNameAr: e.target.value,
                  displayNameEn: e.target.value,
                })
              }
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17] text-sm"
            />
            {profileErrors.displayName && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                {t.validation[profileErrors.displayName as keyof typeof t.validation] ||
                  profileErrors.displayName}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="prof-country"
              className="block text-xs font-bold text-slate-500 mb-1.5"
            >
              {lang === 'ar' ? 'الدولة *' : 'Country *'}
            </label>
            <input
              id="prof-country"
              type="text"
              required
              value={formState.country}
              placeholder={
                lang === 'ar' ? 'مثال: السعودية، الإمارات، مصر...' : 'e.g., Saudi Arabia, UK, UAE...'
              }
              onChange={(e) => setFormState({ ...formState, country: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17] text-sm"
            />
            {profileErrors.country && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                {t.validation[profileErrors.country as keyof typeof t.validation] ||
                  profileErrors.country}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="prof-photo-url"
              className="block text-xs font-bold text-slate-500 mb-1.5"
            >
              {lang === 'ar' ? 'الصورة الشخصية (رفع من الجهاز أو رابط)' : 'Profile Photo (Upload or URL)'}
            </label>
            <div className="flex items-center gap-2">
              <input
                id="prof-photo-url"
                type="url"
                dir="ltr"
                value={formState.photoURL}
                onChange={(e) => setFormState({ ...formState, photoURL: e.target.value })}
                placeholder="https://... or /api/media/avatars/..."
                className="flex-1 min-w-0 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F4F8FA] dark:bg-[#0B1320] text-sm font-mono"
              />
              <label className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-[#0F9D8E]/40 bg-[#0F9D8E]/10 text-[#0F9D8E] dark:text-[#2DD4BF] text-xs font-bold cursor-pointer shrink-0">
                {uploadingAvatar ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                <span>{lang === 'ar' ? 'رفع' : 'Upload'}</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>
            </div>
            {profileErrors.photoURL && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                {t.validation[profileErrors.photoURL as keyof typeof t.validation] ||
                  profileErrors.photoURL}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="prof-lang"
              className="block text-xs font-bold text-slate-500 mb-1.5"
            >
              {lang === 'ar' ? 'اللغة المفضلة' : 'Preferred Language'}
            </label>
            <select
              id="prof-lang"
              value={formState.preferredLanguage}
              onChange={(e) =>
                setFormState({
                  ...formState,
                  preferredLanguage: e.target.value as Language,
                })
              }
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17] text-sm"
            >
              <option value="ar">العربية (الافتراضية)</option>
              <option value="en">English</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="prof-phone"
              className="block text-xs font-bold text-slate-500 mb-1.5"
            >
              {lang === 'ar' ? 'رقم الهاتف الافتراضي' : 'Default Phone Number'}
            </label>
            <input
              id="prof-phone"
              type="tel"
              dir="ltr"
              value={formState.phone}
              onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17] text-sm font-mono"
            />
          </div>

          <div>
            <label
              htmlFor="prof-whatsapp"
              className="block text-xs font-bold text-slate-500 mb-1.5"
            >
              {lang === 'ar' ? 'رقم واتساب الافتراضي' : 'Default WhatsApp Number'}
            </label>
            <input
              id="prof-whatsapp"
              type="tel"
              dir="ltr"
              value={formState.whatsapp}
              onChange={(e) => setFormState({ ...formState, whatsapp: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17] text-sm font-mono"
            />
          </div>
        </div>

        {/* Email verification status row */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <MailCheck className="w-4 h-4 text-[#19B5A5]" />
            <span className="font-bold text-[#17243A] dark:text-white">
              {lang === 'ar' ? 'حالة التحقق من البريد الإلكتروني:' : 'Email Verification Status:'}
            </span>
            <span
              className={`font-bold ${
                formState.emailVerified ? 'text-emerald-600' : 'text-[#FF8A65]'
              }`}
            >
              {formState.emailVerified
                ? lang === 'ar'
                  ? 'مؤكد'
                  : 'Verified'
                : lang === 'ar'
                ? 'بانتظار التأكيد'
                : 'Pending Verification'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {!formState.emailVerified && (
              <button
                type="button"
                onClick={() => void resendVerificationEmail()}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold"
              >
                {lang === 'ar' ? 'تأكيد البريد الإلكتروني' : 'Verify Email'}
              </button>
            )}
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-600 text-white text-sm font-bold"
            >
              <Save className="w-4 h-4" />
              <span>{t.common.saveChanges}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Sign-In Methods & Account Security Card */}
      <div
        data-testid="profile-signin-methods-card"
        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1A2B] p-6 sm:p-8 space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-base font-extrabold text-[#17243A] dark:text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#2563EB] dark:text-[#19B5A5]" />
              <span>
                {lang === 'ar'
                  ? 'طرق تسجيل الدخول وأمان الحساب'
                  : 'Sign-In Methods & Account Security'}
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {lang === 'ar'
                ? 'أدر طرق الدخول المرتبطة بنفس حسابك الموحد دون إنشاء حساب مكرر.'
                : 'Manage sign-in methods linked to your single unified account without creating duplicate accounts.'}
            </p>
          </div>
        </div>

        {/* Linked Methods Status Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-[#F4F7FB] dark:bg-[#070D17] p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#17243A] dark:text-white">
                {lang === 'ar' ? 'تسجيل الدخول عبر Google' : 'Google Sign-In'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {hasGoogleMethod
                  ? lang === 'ar'
                    ? 'مرتبط ومفعّل على هذا الحساب'
                    : 'Linked and active on this account'
                  : lang === 'ar'
                  ? 'غير مرتبط بعد'
                  : 'Not linked yet'}
              </p>
            </div>
            {hasGoogleMethod ? (
              <span
                data-testid="badge-google-linked"
                className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-bold shrink-0"
              >
                {lang === 'ar' ? 'مرتبط' : 'Linked'}
              </span>
            ) : (
              <button
                type="button"
                data-testid="btn-open-link-google"
                onClick={() => {
                  setShowLinkGoogleForm((p) => !p);
                  setLinkGoogleError('');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-bold shrink-0"
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'ربط Google' : 'Link Google'}</span>
              </button>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-[#F4F7FB] dark:bg-[#070D17] p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#17243A] dark:text-white">
                {lang === 'ar' ? 'البريد الإلكتروني وكلمة المرور' : 'Email & Password'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {hasPasswordMethod
                  ? lang === 'ar'
                    ? 'كلمة المرور مفعّلة على هذا الحساب'
                    : 'Password sign-in is enabled'
                  : lang === 'ar'
                  ? 'الحساب يعمل عبر Google فقط — يمكنك إضافة كلمة مرور أدناه'
                  : 'Google-only account — you can set a password below'}
              </p>
            </div>
            <span
              data-testid="badge-password-status"
              className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 ${
                hasPasswordMethod
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                  : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
              }`}
            >
              {hasPasswordMethod
                ? lang === 'ar'
                  ? 'مفعّلة'
                  : 'Enabled'
                : lang === 'ar'
                ? 'غير معيّنة'
                : 'Not Set'}
            </span>
          </div>
        </div>

        {/* Inline Link Google Confirmation Form (when password-only account) */}
        {!hasGoogleMethod && showLinkGoogleForm && (
          <form
            onSubmit={handleLinkGoogleAccount}
            data-testid="form-link-google-account"
            className="rounded-xl border border-[#2563EB]/30 bg-[#2563EB]/5 dark:bg-[#2563EB]/10 p-4 space-y-3"
          >
            <p className="text-xs font-bold text-[#17243A] dark:text-white">
              {lang === 'ar'
                ? 'تأكيد ملكية الحساب لربط Google بنفس البريد الإلكتروني:'
                : 'Verify account ownership to link Google with the same email:'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="password"
                dir="ltr"
                value={linkGooglePassword}
                onChange={(e) => setLinkGooglePassword(e.target.value)}
                placeholder={
                  lang === 'ar' ? 'كلمة مرور حسابك الحالية' : 'Current account password'
                }
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D17] text-sm"
              />
              <button
                type="submit"
                disabled={linkingGoogle}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-600 disabled:opacity-60 text-white text-xs font-bold"
              >
                {linkingGoogle ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
                <span>{lang === 'ar' ? 'تأكيد وربط Google' : 'Verify & Link Google'}</span>
              </button>
            </div>
            {linkGoogleError && (
              <p role="alert" className="text-xs font-bold text-red-600 dark:text-red-400">
                {linkGoogleError}
              </p>
            )}
          </form>
        )}

        {/* Set or Change Password Form */}
        <form
          onSubmit={handleSetOrChangePassword}
          data-testid="form-set-change-password"
          className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800"
        >
          <div>
            <h3 className="text-sm font-bold text-[#17243A] dark:text-white">
              {hasPasswordMethod
                ? lang === 'ar'
                  ? 'تغيير كلمة المرور'
                  : 'Change Account Password'
                : lang === 'ar'
                ? 'تعيين كلمة مرور لحسابك (اختياري)'
                : 'Set a Password for Your Account (Optional)'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {hasPasswordMethod
                ? lang === 'ar'
                  ? 'بعد التغيير سيتم تسجيل الخروج من أي جلسات أخرى نشطة تلقائيًا.'
                  : 'Other active sessions will be signed out automatically after updating.'
                : lang === 'ar'
                ? 'سيُطلب منك تأكيد هويتك عبر نافذة Google قبل تعيين كلمة المرور لتتمكن من الدخول بها أيضًا (ولإعادة التحقق في لوحة الأدمن).'
                : 'You will be asked to re-verify via Google before setting a password so you can also sign in with email & password (and re-authenticate in Admin).'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {hasPasswordMethod && (
              <div>
                <label
                  htmlFor="sec-current-password"
                  className="block text-xs font-bold text-slate-500 mb-1"
                >
                  {lang === 'ar' ? 'كلمة المرور الحالية' : 'Current Password'}
                </label>
                <input
                  id="sec-current-password"
                  type="password"
                  dir="ltr"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17] text-sm"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="sec-new-password"
                className="block text-xs font-bold text-slate-500 mb-1"
              >
                {lang === 'ar' ? 'كلمة المرور الجديدة (٨+ أحرف)' : 'New Password (8+ chars)'}
              </label>
              <input
                id="sec-new-password"
                type="password"
                dir="ltr"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17] text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="sec-confirm-password"
                className="block text-xs font-bold text-slate-500 mb-1"
              >
                {lang === 'ar' ? 'تأكيد كلمة المرور الجديدة' : 'Confirm New Password'}
              </label>
              <input
                id="sec-confirm-password"
                type="password"
                dir="ltr"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F4F7FB] dark:bg-[#070D17] text-sm"
              />
            </div>
          </div>

          {passwordFormError && (
            <p role="alert" className="text-xs font-bold text-red-600 dark:text-red-400">
              {passwordFormError}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('contact-methods')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold hover:border-[#0F9D8E]"
              >
                <PhoneCall className="w-3.5 h-3.5 text-[#0F9D8E]" />
                <span>{lang === 'ar' ? 'إدارة طرق التواصل' : 'Manage Contact Methods'}</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('privacy-security')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold hover:border-[#0F9D8E]"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#0F9D8E]" />
                <span>{lang === 'ar' ? 'الخصوصية والأمان' : 'Privacy & Security'}</span>
              </button>
            </div>
            <button
              type="submit"
              data-testid="btn-save-account-password"
              disabled={savingPassword}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#0F9D8E] dark:bg-[#19B5A5] text-white dark:text-[#07101A] text-xs font-extrabold hover:opacity-90 disabled:opacity-60"
            >
              {savingPassword ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <KeyRound className="w-3.5 h-3.5" />
              )}
              <span>
                {hasPasswordMethod
                  ? lang === 'ar'
                    ? 'تحديث كلمة المرور'
                    : 'Update Password'
                  : lang === 'ar'
                  ? 'التحقق عبر Google وتعيين كلمة المرور'
                  : 'Verify with Google & Set Password'}
              </span>
            </button>
          </div>
        </form>
      </div>

      <SmartRelatedServices currentPage="profile" />
    </div>
  );
};

export const SettingsPage: React.FC = () => {
  const {
    lang,
    setLang,
    publicTheme,
    workspaceTheme,
    setPublicTheme,
    setWorkspaceTheme,
    t,
    settings,
    updateSettingsInSession,
    firebaseStatus,
    setFirebaseModalOpen,
  } = useApp();

  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettingsInSession(localSettings);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17243A] dark:text-white">
          {t.workspaceNav.settings}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          {lang === 'ar'
            ? 'تخصيص تفضيلات الخصوصية الافتراضية، اللغة، ونظام المظهر المزدوج المستقل للموقع ولوحة المستخدم.'
            : 'Configure persistent privacy defaults, language, and independent Public Site / Workspace appearance modes.'}
        </p>
      </div>

      <form
        onSubmit={handleSave}
        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1A2B] p-6 sm:p-8 space-y-6"
      >
        <h2 className="text-base font-bold text-[#17243A] dark:text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#19B5A5]" />
          <span>
            {lang === 'ar'
              ? 'تفضيلات الخصوصية والتنبيهات الافتراضية'
              : 'Default Privacy & Scan Alert Preferences'}
          </span>
        </h2>

        <div className="space-y-3 text-sm">
          {[
            {
              key: 'instantEmailAlerts' as const,
              ar: 'تفعيل تنبيهات البريد الإلكتروني الفورية عند مسح أي كود QR',
              en: 'Enable instant email alerts whenever a QR tag is scanned',
            },
            {
              key: 'whatsappScanAlerts' as const,
              ar: 'استلام إشعارات المسح عبر واتساب',
              en: 'Receive scan notifications via WhatsApp',
            },
            {
              key: 'defaultAnonymousMode' as const,
              ar: 'تفعيل «وضع الوسيط المجهول» افتراضيًا لأي غرض جديد',
              en: 'Default new items to "Anonymous Relay Only" mode',
            },
            {
              key: 'autoLockQrAfterRecovery' as const,
              ar: 'إيقاف كود QR تلقائيًا بعد تغيير حالة الغرض إلى «تم استرجاعه»',
              en: 'Automatically pause QR tag once item is marked recovered',
            },
          ].map((opt) => (
            <label
              key={opt.key}
              className="flex items-center justify-between gap-4 p-4 rounded-xl bg-[#F4F7FB] dark:bg-[#070D17] border border-slate-200/80 dark:border-slate-800 cursor-pointer"
            >
              <span className="font-semibold text-[#17243A] dark:text-slate-200">
                {lang === 'ar' ? opt.ar : opt.en}
              </span>
              <input
                type="checkbox"
                checked={localSettings[opt.key]}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, [opt.key]: e.target.checked })
                }
                className="w-4 h-4 rounded text-[#2563EB]"
              />
            </label>
          ))}
        </div>

        {/* Language & Dual-Theme Architecture Controls */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-[#F4F7FB] dark:bg-[#070D17] border border-slate-200 dark:border-slate-800">
            <span className="block text-xs font-bold text-slate-500 mb-2">
              {lang === 'ar' ? 'لغة الواجهة المحفوظة:' : 'Saved Interface Language:'}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setLang('ar')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold ${
                  lang === 'ar'
                    ? 'bg-[#2563EB] text-white'
                    : 'bg-white dark:bg-[#0F1A2B] text-slate-600 dark:text-slate-300'
                }`}
              >
                العربية
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold ${
                  lang === 'en'
                    ? 'bg-[#2563EB] text-white'
                    : 'bg-white dark:bg-[#0F1A2B] text-slate-600 dark:text-slate-300'
                }`}
              >
                English
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#F4F7FB] dark:bg-[#070D17] border border-slate-200 dark:border-slate-800">
            <span className="block text-xs font-bold text-slate-500 mb-2">
              {lang === 'ar'
                ? 'مظهر لوحة المستخدم (الفاتح افتراضي):'
                : 'Workspace Theme (Light Default):'}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                data-testid="settings-ws-light"
                onClick={() => setWorkspaceTheme('light')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1 ${
                  workspaceTheme === 'light'
                    ? 'bg-[#2563EB] text-white'
                    : 'bg-white dark:bg-[#0F1A2B] text-slate-600 dark:text-slate-300'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'فاتح' : 'Light'}</span>
              </button>
              <button
                type="button"
                data-testid="settings-ws-dark"
                onClick={() => setWorkspaceTheme('dark')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1 ${
                  workspaceTheme === 'dark'
                    ? 'bg-[#2563EB] text-white'
                    : 'bg-white dark:bg-[#0F1A2B] text-slate-600 dark:text-slate-300'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'داكن' : 'Dark'}</span>
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#F4F7FB] dark:bg-[#070D17] border border-slate-200 dark:border-slate-800">
            <span className="block text-xs font-bold text-slate-500 mb-2">
              {lang === 'ar'
                ? 'مظهر الموقع العام (الداكن افتراضي):'
                : 'Public Site Theme (Dark Default):'}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                data-testid="settings-pub-dark"
                onClick={() => setPublicTheme('dark')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1 ${
                  publicTheme === 'dark'
                    ? 'bg-[#17243A] text-white'
                    : 'bg-white dark:bg-[#0F1A2B] text-slate-600 dark:text-slate-300'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'داكن' : 'Dark'}</span>
              </button>
              <button
                type="button"
                data-testid="settings-pub-light"
                onClick={() => setPublicTheme('light')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1 ${
                  publicTheme === 'light'
                    ? 'bg-[#2563EB] text-white'
                    : 'bg-white dark:bg-[#0F1A2B] text-slate-600 dark:text-slate-300'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'فاتح' : 'Light'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Firebase Architecture Readiness Box */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Database className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-[#17243A] dark:text-white">
                {lang === 'ar'
                  ? 'حالة الربط السحابي (Cloud & Persistence)'
                  : 'Cloud Persistence & Firebase Integration Status'}
              </p>
              <p className="text-xs text-slate-500">
                {firebaseStatus.isConfigured
                  ? `${t.common.firebaseReadyText} (${firebaseStatus.projectId})`
                  : `${t.common.firebaseMissingText}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFirebaseModalOpen(true)}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold shrink-0"
          >
            {t.common.configureFirebaseBtn}
          </button>
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            type="submit"
            data-testid="btn-save-settings"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0F9D8E] hover:bg-[#19B5A5] text-white dark:text-[#07101A] text-sm font-extrabold"
          >
            <Save className="w-4 h-4" />
            <span>{t.common.saveChanges}</span>
          </button>
        </div>
      </form>

      <SmartRelatedServices currentPage="settings" />
    </div>
  );
};

export const PlansWorkspacePage: React.FC = () => {
  const { lang, t, profile, plans, platformSettings, navigate } = useApp();
  const [billingDuration, setBillingDuration] = useState<BillingDurationId>('1m');
  const [checkoutPlan, setCheckoutPlan] = useState<ManagedPlanDefinition | null>(null);

  const activePlans: ManagedPlanDefinition[] =
    plans.length > 0
      ? plans.filter((p) => p.isActive)
      : CANONICAL_PLANS.map((c) => ({
          id: `plan-${c.id}`,
          quotaTier: c.quotaTier,
          nameAr: c.nameAr,
          nameEn: c.nameEn,
          audienceAr: c.audienceAr,
          audienceEn: c.audienceEn,
          monthlySar: c.monthlySar,
          monthlyUsd: c.monthlyUsd,
          quarterlySar: Math.round(c.monthlySar * 2.7),
          quarterlyUsd: Math.round(c.monthlyUsd * 2.7),
          yearlySar: Math.round(c.monthlySar * 9.5),
          yearlyUsd: Math.round(c.monthlyUsd * 9.5),
          maxActiveItems: c.maxActiveItems,
          maxContactMethods: c.maxContactMethods,
          maxTemplateCopies: c.quotaTier === 'Free' ? 3 : 50,
          includedTemplatesScope: c.quotaTier === 'Free' ? 'free_only' : 'all_templates',
          allowCustomBranding: c.quotaTier !== 'Free',
          allowSvgExport: c.quotaTier !== 'Free',
          featured: c.featured,
          accentHex: c.accentHex,
          isActive: true,
          isCoreFree: c.quotaTier === 'Free',
          featuresAr: c.featuresAr,
          featuresEn: c.featuresEn,
          updatedAt: new Date().toISOString(),
        }));

  const currentPlanDef =
    activePlans.find((p) => p.quotaTier === profile.plan) || activePlans[0];
  const currency = platformSettings.defaultCurrency || 'SAR';

  const getPriceDisplay = (tier: ManagedPlanDefinition) => {
    const sar =
      billingDuration === '3m'
        ? tier.quarterlySar
        : billingDuration === '12m'
        ? tier.yearlySar
        : tier.monthlySar;
    const usd =
      billingDuration === '3m'
        ? tier.quarterlyUsd
        : billingDuration === '12m'
        ? tier.yearlyUsd
        : tier.monthlyUsd;
    if (sar === 0 && usd === 0) {
      return {
        primary: lang === 'ar' ? 'مجانية' : 'Free',
        note: lang === 'ar' ? 'مفعّلة افتراضيًا لكل حساب' : 'Included by default',
      };
    }
    const primary = currency === 'USD' ? `$${usd}` : `${sar} ر.س`;
    const note =
      billingDuration === '1m'
        ? lang === 'ar'
          ? 'لمدة شهر واحد'
          : '1-month cycle'
        : billingDuration === '3m'
        ? lang === 'ar'
          ? 'لمدة ٣ أشهر'
          : '3-month cycle'
        : lang === 'ar'
        ? 'لمدة ١٢ شهرًا'
        : '12-month cycle';
    return { primary, note };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17243A] dark:text-white">
            {t.workspaceNav.plans}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            {lang === 'ar'
              ? 'اختر الباقة والمدة المناسبة (١، ٣، ١٢ شهرًا). تبدأ الترقية بطلب رسمي يُعتمد بعد تأكيد التحويل أو الدفع.'
              : 'Select a plan across 1, 3, or 12 months. Paid upgrades submit a formal order reviewed before activation.'}
          </p>
        </div>

        <div
          role="group"
          aria-label={lang === 'ar' ? 'مدة الباقة' : 'Plan Duration'}
          className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-white dark:bg-[#0F1A2B] border border-slate-200 dark:border-slate-800 shrink-0"
        >
          {BILLING_DURATION_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              data-testid={`ws-duration-${opt.id}`}
              onClick={() => setBillingDuration(opt.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                billingDuration === opt.id
                  ? 'bg-[#2563EB] text-white'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {lang === 'ar' ? opt.labelAr : opt.labelEn}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1A2B] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-xs font-bold text-[#0F9D8E] dark:text-[#19B5A5]">
            {lang === 'ar' ? 'الباقة المفعّلة حاليًا' : 'CURRENT ACTIVE TIER'}
          </span>
          <h2 className="text-lg font-extrabold text-[#17243A] dark:text-white">
            {currentPlanDef?.nameEn || profile.plan} —{' '}
            {lang === 'ar'
              ? `${profile.activeItemsLimit} أغراض نشطة · ${profile.contactMethodsLimit || 2} وسائل تواصل`
              : `${profile.activeItemsLimit} Active Items · ${profile.contactMethodsLimit || 2} Contact Methods`}
          </h2>
          <p className="text-xs text-slate-500">
            {lang === 'ar'
              ? `الأغراض النشطة حاليًا: ${profile.activeItemsCount} من أصل ${profile.activeItemsLimit} (الأغراض المؤرشفة لا تستهلك الحد)`
              : `Currently active items: ${profile.activeItemsCount} of ${profile.activeItemsLimit} (Archived items do not count toward quota)`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('pricing')}
          className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold shrink-0"
        >
          {lang === 'ar' ? 'عرض صفحة الأسعار العامة' : 'View Public Pricing Page'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {activePlans.map((tier) => {
          const isCurrent = tier.quotaTier === profile.plan;
          const priceInfo = getPriceDisplay(tier);

          return (
            <div
              key={tier.id}
              data-testid={`ws-plan-${tier.id}`}
              className={`rounded-2xl border p-5 flex flex-col justify-between gap-4 findit-card-hover ${
                isCurrent
                  ? 'border-2 border-[#19B5A5] bg-white dark:bg-[#0F1A2B]'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1A2B]'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-extrabold text-[#17243A] dark:text-white">
                    {lang === 'ar' ? tier.nameAr : tier.nameEn}
                  </h3>
                  {isCurrent && (
                    <span className="px-2 py-0.5 rounded bg-[#19B5A5]/15 text-[#0F9D8E] dark:text-[#19B5A5] text-[10px] font-extrabold">
                      {lang === 'ar' ? 'الحالية' : 'Current'}
                    </span>
                  )}
                </div>

                <div>
                  <p
                    className={`text-xl font-extrabold text-[#2563EB] dark:text-[#19B5A5] whitespace-nowrap tabular-nums ${
                      lang === 'en' ? 'font-mono' : 'font-sans'
                    }`}
                  >
                    {priceInfo.primary}
                  </p>
                  <p className="text-[11px] text-slate-400">{priceInfo.note}</p>
                </div>

                <div className="space-y-1.5 pt-2 text-xs text-slate-600 dark:text-slate-300">
                  <p className="flex items-center gap-1.5 font-semibold">
                    <Check className="w-3.5 h-3.5 text-[#19B5A5] shrink-0" />
                    <span>
                      {lang === 'ar'
                        ? `حتى ${tier.maxActiveItems} أغراض نشطة`
                        : `Up to ${tier.maxActiveItems} active items`}
                    </span>
                  </p>
                  <p className="flex items-center gap-1.5 font-semibold">
                    <Check className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                    <span>
                      {lang === 'ar'
                        ? `حتى ${tier.maxContactMethods} وسائل تواصل/غرض`
                        : `Up to ${tier.maxContactMethods} channels/item`}
                    </span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isCurrent || tier.isCoreFree}
                onClick={() => setCheckoutPlan(tier)}
                className={`w-full py-2.5 rounded-xl text-xs font-bold transition-colors ${
                  isCurrent
                    ? 'bg-[#19B5A5] text-[#070D17]'
                    : tier.isCoreFree
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-default'
                    : 'bg-[#2563EB] text-white hover:bg-blue-600'
                }`}
              >
                {isCurrent
                  ? lang === 'ar'
                    ? 'باقتك الحالية'
                    : 'Your Current Plan'
                  : tier.isCoreFree
                  ? lang === 'ar'
                    ? 'الباقة الأساسية'
                    : 'Starter Base'
                  : lang === 'ar'
                  ? 'طلب ترقية الباقة'
                  : 'Request Upgrade'}
              </button>
            </div>
          );
        })}
      </div>

      <SmartRelatedServices currentPage="plans" />

      <CheckoutModal
        isOpen={Boolean(checkoutPlan)}
        onClose={() => setCheckoutPlan(null)}
        orderType="subscription_upgrade"
        plan={checkoutPlan || undefined}
        defaultDuration={billingDuration}
      />
    </div>
  );
};
