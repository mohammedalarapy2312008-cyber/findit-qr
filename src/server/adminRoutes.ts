import crypto from 'node:crypto';
import { Express, NextFunction, Request, Response } from 'express';
import JSZip from 'jszip';
import {
  ActivityLogEntry,
  AdminAuditLogEntry,
  AdminItemSummary,
  AdminPermissionKey,
  AdminSessionSummary,
  AdminUserSummary,
  ALL_ADMIN_PERMISSIONS,
  AnnouncementBanner,
  CouponCode,
  IssuedLicense,
  LicenseType,
  ManagedOrderStatus,
  ManagedPlanDefinition,
  ManagedPurchaseOrder,
  MarketingCampaign,
  NotificationEntry,
  PlatformSettings,
  RegisteredItem,
  SubscriptionRecord,
  SupportTicket,
  TagDesignTemplate,
  UserPlanTier,
  UserRole,
} from '../types/domain';
import {
  buildCsvString,
  buildTemplateFromZipManifestItem,
  calculateDiscountedOrderTotals,
  computeAdminDashboardAnalytics,
  computeLicenseExpiryIso,
  enrichTemplateDefaults,
  hasAdminPermission,
  isSafeZipEntryPath,
  isSuperAdminEmailMatch,
  normalizeConfiguredAdminEmail,
  resolveEffectivePermissions,
  resolveEffectiveRole,
} from '../utils/adminLogic';
import { isSafeHttpsUrl } from '../utils/qrLogic';
import { DatabaseSchema, StoredSessionRecord, StoredUserRecord } from './dbSchema';

export interface AdminRouteBridge {
  app: Express;
  db: DatabaseSchema;
  saveDatabase: () => void;
  configuredAdminEmail: string;
  requireAuth: (req: AuthenticatedServerRequest, res: Response, next: NextFunction) => void;
  hashPassword: (password: string, salt: string) => string;
  timingSafeEqualHex: (a: string, b: string) => boolean;
  enforceAuthoritativePlanLimits: (userRec: StoredUserRecord) => void;
  recomputeUserActiveCount: (uid: string) => number;
  recordUserActivity: (
    uid: string,
    actionType: ActivityLogEntry['actionType'],
    titleAr: string,
    titleEn: string,
    detailAr: string,
    detailEn: string,
    itemId?: string,
    actorAr?: string,
    actorEn?: string
  ) => ActivityLogEntry;
  recordUserNotification: (
    uid: string,
    type: NotificationEntry['type'],
    severity: NotificationEntry['severity'],
    titleAr: string,
    titleEn: string,
    bodyAr: string,
    bodyEn: string,
    relatedItemId?: string,
    relatedMessageId?: string,
    senderContact?: string
  ) => NotificationEntry;
  issueSession: (uid: string) => string;
  hashSessionToken: (rawToken: string) => string;
  extractTokenFromRequest?: (req: Request) => string;
  verifyGoogleIdToken?: (idToken: string) => Promise<{
    googleUid: string;
    email: string;
    emailVerified: boolean;
    displayName?: string;
    photoURL?: string;
  } | null>;
}

export interface AuthenticatedServerRequest extends Request {
  user?: StoredUserRecord;
  session?: StoredSessionRecord;
  tokenHash?: string;
}

export function registerAdminAndCommerceRoutes(bridge: AdminRouteBridge): void {
  const {
    app,
    db,
    saveDatabase,
    configuredAdminEmail,
    requireAuth,
    hashPassword,
    timingSafeEqualHex,
    enforceAuthoritativePlanLimits,
    recomputeUserActiveCount,
    recordUserActivity,
    recordUserNotification,
    hashSessionToken,
    extractTokenFromRequest,
    verifyGoogleIdToken,
  } = bridge;

  const supportRateMap = new Map<string, number[]>();
  function isSupportRateLimited(ip: string): boolean {
    const now = Date.now();
    const windowMs = 15 * 60_000;
    const recent = (supportRateMap.get(ip) || []).filter((ts) => now - ts < windowMs);
    if (recent.length >= 6) {
      supportRateMap.set(ip, recent);
      return true;
    }
    recent.push(now);
    supportRateMap.set(ip, recent);
    return false;
  }

  function resolveRawToken(req: Request): string {
    if (extractTokenFromRequest) {
      return extractTokenFromRequest(req);
    }
    const authHeader = req.headers.authorization || '';
    return authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  }

  function resolveUserAuthority(userRec: StoredUserRecord): {
    role: UserRole;
    permissions: AdminPermissionKey[];
  } {
    const role: UserRole = resolveEffectiveRole(
      userRec.profile.role,
      userRec.email,
      configuredAdminEmail,
      userRec.profile.emailVerified
    );
    const permissions = resolveEffectivePermissions(
      role,
      userRec.profile.adminPermissions
    );
    return { role, permissions };
  }

  function recordAuditLog(params: {
    actor: StoredUserRecord;
    actorRole: UserRole;
    action: string;
    targetType: AdminAuditLogEntry['targetType'];
    targetId: string;
    summaryAr: string;
    summaryEn: string;
    beforeSnapshot?: unknown;
    afterSnapshot?: unknown;
    ip: string;
  }): AdminAuditLogEntry {
    const id = `aud-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const entry: AdminAuditLogEntry = {
      id,
      actorUid: params.actor.uid,
      actorEmail: params.actor.email,
      actorRole: params.actorRole,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      summaryAr: params.summaryAr,
      summaryEn: params.summaryEn,
      beforeSnapshot: params.beforeSnapshot,
      afterSnapshot: params.afterSnapshot,
      ip: params.ip,
      createdAt: new Date().toISOString(),
    };
    db.auditLogs[id] = entry;
    return entry;
  }

  function recordSecurityEvent(params: {
    uid?: string;
    email?: string;
    path: string;
    method: string;
    reasonCode: string;
    ip: string;
  }): void {
    db.securityEvents.unshift({
      id: `sec-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      uid: params.uid,
      email: params.email,
      path: params.path,
      method: params.method,
      reasonCode: params.reasonCode,
      ip: params.ip,
      createdAt: new Date().toISOString(),
    });
    if (db.securityEvents.length > 500) {
      db.securityEvents.length = 500;
    }
  }

  function requireAdmin(requiredPerm?: AdminPermissionKey) {
    return (
      req: AuthenticatedServerRequest,
      res: Response,
      next: NextFunction
    ): void => {
      requireAuth(req, res, () => {
        const userRec = req.user!;
        const { role, permissions } = resolveUserAuthority(userRec);
        if (!hasAdminPermission(role, permissions, requiredPerm)) {
          recordSecurityEvent({
            uid: userRec.uid,
            email: userRec.email,
            path: req.originalUrl,
            method: req.method,
            reasonCode:
              role === 'user'
                ? 'FORBIDDEN_NON_ADMIN_ACCESS'
                : `FORBIDDEN_MISSING_PERMISSION:${requiredPerm || 'admin'}`,
            ip: req.ip || 'local',
          });
          saveDatabase();
          res.status(403).json({
            ok: false,
            errorCode: 'FORBIDDEN_ADMIN_ONLY',
            messageAr: 'غير مصرح لك بالوصول إلى لوحة الإدارة أو تنفيذ هذا الإجراء.',
            messageEn: 'Access denied: Admin privileges required for this action.',
          });
          return;
        }
        next();
      });
    };
  }

  function requireReauth(
    req: AuthenticatedServerRequest,
    res: Response,
    next: NextFunction
  ): void {
    const rawToken = resolveRawToken(req);
    const tokenHash = req.tokenHash || (rawToken ? hashSessionToken(rawToken) : '');
    const session = tokenHash ? db.sessions[tokenHash] : undefined;
    const verifiedUntilMs = session?.adminVerifiedUntil
      ? Date.parse(session.adminVerifiedUntil)
      : 0;

    if (!session || !Number.isFinite(verifiedUntilMs) || Date.now() >= verifiedUntilMs) {
      res.status(428).json({
        ok: false,
        errorCode: 'REAUTH_REQUIRED',
        messageAr: 'يتطلب هذا الإجراء الإداري الحساس إعادة تأكيد كلمة المرور أولًا.',
        messageEn: 'This sensitive admin operation requires password re-verification.',
      });
      return;
    }
    next();
  }

  function issueLicenseForApprovedOrder(
    order: ManagedPurchaseOrder,
    tpl: TagDesignTemplate
  ): IssuedLicense {
    const licenseType: LicenseType =
      (tpl.licenseTypeId && db.licenseTypes[tpl.licenseTypeId]) ||
      Object.values(db.licenseTypes)[0];
    const nowIso = new Date().toISOString();
    const id = `lic-iss-${crypto.randomBytes(6).toString('hex')}`;
    const issued: IssuedLicense = {
      id,
      licenseNumber: `FQR-LIC-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
      userId: order.userId,
      userEmail: order.userEmail,
      templateId: tpl.id,
      templateTitleAr: tpl.titleAr,
      templateTitleEn: tpl.titleEn,
      purchaseId: order.id,
      licenseTypeId: licenseType.id,
      licenseNameAr: licenseType.nameAr,
      licenseNameEn: licenseType.nameEn,
      allowCommercialUse: licenseType.allowCommercialUse,
      maxCopies: Math.min(tpl.maxCopies || licenseType.maxCopies, licenseType.maxCopies),
      resaleAllowed: licenseType.resaleAllowed,
      transferable: licenseType.transferable,
      printRulesAr: licenseType.printRulesAr,
      printRulesEn: licenseType.printRulesEn,
      termsSnapshotAr: `${licenseType.descriptionAr} — ${licenseType.exceptionsAr}`,
      termsSnapshotEn: `${licenseType.descriptionEn} — ${licenseType.exceptionsEn}`,
      issuedAt: nowIso,
      expiresAt: computeLicenseExpiryIso(licenseType, nowIso),
      status: 'active',
    };
    db.issuedLicenses[id] = issued;
    order.issuedLicenseId = id;
    return issued;
  }

  function applyApprovedSubscriptionOrder(
    order: ManagedPurchaseOrder,
    plan: ManagedPlanDefinition
  ): SubscriptionRecord {
    const nowMs = Date.now();
    const nowIso = new Date(nowMs).toISOString();
    const months = order.durationMonths || 1;
    const expiresIso = new Date(nowMs + months * 30 * 24 * 60 * 60 * 1000).toISOString();
    const subId = `sub-${crypto.randomBytes(6).toString('hex')}`;

    const userRec = db.users[order.userId];
    if (userRec) {
      userRec.profile.plan = plan.quotaTier;
      userRec.profile.activeItemsLimit = plan.maxActiveItems;
      userRec.profile.contactMethodsLimit = plan.maxContactMethods;
      userRec.profile.updatedAt = nowIso;
      enforceAuthoritativePlanLimits(userRec);
      recomputeUserActiveCount(userRec.uid);
    }

    const sub: SubscriptionRecord = {
      id: subId,
      userId: order.userId,
      userEmail: order.userEmail,
      planId: plan.id,
      quotaTier: plan.quotaTier,
      durationMonths: months,
      status: 'active',
      amountSar: order.amountSar,
      amountUsd: order.amountUsd,
      orderId: order.id,
      startedAt: nowIso,
      expiresAt: expiresIso,
      autoRenewSupported: false,
      updatedAt: nowIso,
    };
    db.subscriptions[subId] = sub;
    return sub;
  }

  // ===========================================================================
  // A. PUBLIC CATALOG, COUPON CHECK & SUPPORT TICKET ENDPOINTS
  // ===========================================================================
  app.get('/api/public/catalog', (_req: Request, res: Response) => {
    const templates = Object.values(db.templates)
      .filter((t) => (t.status || 'published') === 'published')
      .map((t) => enrichTemplateDefaults(t));

    const plans = Object.values(db.plans).filter((p) => p.isActive);
    const announcements = Object.values(db.announcements).filter((a) => a.isActive);

    res.json({
      ok: true,
      templates,
      plans,
      announcements,
      platformSettings: {
        ...db.platformSettings,
        faqs: db.platformSettings.faqs.filter((f) => f.isPublished),
      },
    });
  });

  app.post('/api/coupons/validate', requireAuth, (req: AuthenticatedServerRequest, res: Response) => {
    const body = (req.body || {}) as {
      code?: string;
      subtotalSar?: number;
      subtotalUsd?: number;
      scope?: 'templates' | 'plans';
    };
    const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : '';
    const coupon = Object.values(db.coupons).find((c) => c.code.toUpperCase() === code);
    if (!coupon) {
      res.status(404).json({
        ok: false,
        errorCode: 'COUPON_NOT_FOUND',
        messageAr: 'كود الخصم غير صالح أو غير موجود.',
        messageEn: 'Coupon code is invalid or not found.',
      });
      return;
    }
    const calc = calculateDiscountedOrderTotals({
      subtotalSar: Number(body.subtotalSar) || 0,
      subtotalUsd: Number(body.subtotalUsd) || 0,
      coupon,
      orderScope: body.scope === 'plans' ? 'plans' : 'templates',
    });
    if (calc.couponErrorCode) {
      res.status(400).json({
        ok: false,
        errorCode: calc.couponErrorCode,
        messageAr: 'هذا الكوبون منتهي أو غير متاح لهذا الطلب.',
        messageEn: 'This coupon is expired, exhausted, or not applicable to this order.',
      });
      return;
    }
    res.json({ ok: true, ...calc });
  });

  app.post('/api/public/support', (req: Request, res: Response) => {
    const body = (req.body || {}) as Record<string, unknown>;
    const honeypot =
      typeof body.honeypot === 'string'
        ? body.honeypot.trim()
        : typeof body.website === 'string'
        ? body.website.trim()
        : '';
    if (honeypot) {
      res.status(400).json({
        ok: false,
        errorCode: 'SPAM_REJECTED',
        messageAr: 'تم رفض الطلب تلقائيًا.',
        messageEn: 'Request rejected by spam protection.',
      });
      return;
    }

    const clientIp = req.ip || 'local';
    if (isSupportRateLimited(clientIp)) {
      res.status(429).json({
        ok: false,
        errorCode: 'RATE_LIMITED',
        messageAr: 'تم إرسال عدد كبير من تذاكر الدعم. يرجى المحاولة بعد قليل.',
        messageEn: 'Too many support requests from this address. Please try again later.',
      });
      return;
    }

    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const subject = typeof body.subject === 'string' ? body.subject.trim().slice(0, 160) : '';
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    const category =
      body.category === 'enterprise' ||
      body.category === 'designs' ||
      body.category === 'abuse_report' ||
      body.category === 'billing' ||
      body.category === 'technical'
        ? body.category
        : 'general';
    const relatedItemSerial =
      typeof body.relatedItemSerial === 'string' ? body.relatedItemSerial.trim().slice(0, 60) : undefined;

    if (name.length < 2 || name.length > 100) {
      res.status(400).json({
        ok: false,
        errorCode: 'NAME_REQUIRED',
        messageAr: 'يرجى إدخال اسم صحيح.',
        messageEn: 'Please provide a valid name.',
      });
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({
        ok: false,
        errorCode: 'INVALID_EMAIL',
        messageAr: 'يرجى إدخال بريد إلكتروني صحيح.',
        messageEn: 'Please provide a valid email address.',
      });
      return;
    }
    if (message.length < 10 || message.length > 2000) {
      res.status(400).json({
        ok: false,
        errorCode: 'MESSAGE_TOO_SHORT',
        messageAr: 'يرجى كتابة تفاصيل الرسالة (١٠ أحرف على الأقل).',
        messageEn: 'Please write at least 10 characters describing your inquiry.',
      });
      return;
    }

    // Derive userId strictly from verified session token if authenticated — never trust body.userId
    let verifiedUserId: string | undefined;
    const rawToken = resolveRawToken(req);
    if (rawToken) {
      const sess = db.sessions[hashSessionToken(rawToken)];
      if (sess && Date.now() < Date.parse(sess.expiresAt) && db.users[sess.uid]) {
        verifiedUserId = sess.uid;
      }
    }

    const nowIso = new Date().toISOString();
    const id = `tkt-${crypto.randomBytes(6).toString('hex')}`;
    const ticket: SupportTicket = {
      id,
      ticketNumber: `SUP-${Math.floor(10000 + crypto.randomInt(89999))}`,
      userId: verifiedUserId,
      requesterName: name,
      requesterEmail: email,
      category,
      priority: category === 'abuse_report' ? 'high' : 'medium',
      status: 'open',
      subject: subject || `${category.toUpperCase()} Inquiry`,
      description: message,
      relatedItemSerial,
      replies: [],
      createdAt: nowIso,
      updatedAt: nowIso,
      closedAt: null,
    };

    db.supportTickets[id] = ticket;
    saveDatabase();

    res.status(201).json({
      ok: true,
      ticket,
      messageAr: `تم استلام طلبك بنجاح برقم متابعة (${ticket.ticketNumber}).`,
      messageEn: `Your request has been logged under ticket (${ticket.ticketNumber}).`,
    });
  });

  // ===========================================================================
  // B. AUTHENTICATED CUSTOMER COMMERCE, LICENSES, FAVORITES & TICKETS
  // ===========================================================================
  app.get('/api/workspace/commerce', requireAuth, (req: AuthenticatedServerRequest, res: Response) => {
    const uid = req.user!.uid;
    const orders = Object.values(db.orders)
      .filter((o) => o.userId === uid)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const licenses = Object.values(db.issuedLicenses)
      .filter((l) => l.userId === uid)
      .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
    const subscriptions = Object.values(db.subscriptions)
      .filter((s) => s.userId === uid)
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
    const favoriteTemplateIds = db.favorites[uid] || [];
    const tickets = Object.values(db.supportTickets)
      .filter((t) => t.userId === uid || t.requesterEmail === req.user!.email)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    res.json({
      ok: true,
      orders,
      licenses,
      subscriptions,
      favoriteTemplateIds,
      tickets,
      licenseTypes: Object.values(db.licenseTypes).filter((l) => l.isActive),
    });
  });

  app.post('/api/templates/:id/favorite', requireAuth, (req: AuthenticatedServerRequest, res: Response) => {
    const uid = req.user!.uid;
    const templateId = req.params.id;
    if (!db.templates[templateId]) {
      res.status(404).json({ ok: false, errorCode: 'TEMPLATE_NOT_FOUND' });
      return;
    }
    const list = new Set(db.favorites[uid] || []);
    if (list.has(templateId)) {
      list.delete(templateId);
    } else {
      list.add(templateId);
    }
    db.favorites[uid] = Array.from(list);
    saveDatabase();
    res.json({ ok: true, favoriteTemplateIds: db.favorites[uid] });
  });

  app.post('/api/orders', requireAuth, (req: AuthenticatedServerRequest, res: Response) => {
    const userRec = req.user!;
    const uid = userRec.uid;
    const body = (req.body || {}) as {
      orderType?: 'template_purchase' | 'subscription_upgrade';
      targetId?: string;
      quantity?: number;
      durationMonths?: 1 | 3 | 12;
      currency?: 'SAR' | 'USD';
      couponCode?: string;
      transferReference?: string;
      paymentProofUrl?: string;
      paymentNotes?: string;
    };

    const orderType = body.orderType === 'subscription_upgrade' ? 'subscription_upgrade' : 'template_purchase';
    const targetId = typeof body.targetId === 'string' ? body.targetId.trim() : '';
    const quantity = Math.max(1, Math.min(100, Math.round(Number(body.quantity) || 1)));
    const currency = body.currency === 'USD' ? 'USD' : 'SAR';

    if (body.paymentProofUrl && !isSafeHttpsUrl(body.paymentProofUrl, 500)) {
      res.status(400).json({
        ok: false,
        errorCode: 'INVALID_PROOF_URL',
        messageAr: 'يرجى إدخال رابط إثبات دفع صحيح يبدأ بـ https://.',
        messageEn: 'Please provide a valid https:// payment proof URL.',
      });
      return;
    }

    let subtotalSar = 0;
    let subtotalUsd = 0;
    let titleAr = '';
    let titleEn = '';
    let durationMonths: 1 | 3 | 12 | undefined;
    let templateRef: TagDesignTemplate | undefined;

    if (orderType === 'template_purchase') {
      templateRef = db.templates[targetId];
      if (!templateRef || (templateRef.status && templateRef.status !== 'published')) {
        res.status(404).json({
          ok: false,
          errorCode: 'TEMPLATE_NOT_FOUND',
          messageAr: 'القالب المطلوب غير متاح للشراء.',
          messageEn: 'Requested template is unavailable for purchase.',
        });
        return;
      }
      const isFreeTpl = Boolean(templateRef.isFree || templateRef.priceSar === 0);
      subtotalSar = isFreeTpl ? 0 : templateRef.priceSar * quantity;
      subtotalUsd = isFreeTpl ? 0 : templateRef.priceUsd * quantity;
      titleAr = templateRef.titleAr;
      titleEn = templateRef.titleEn;
    } else {
      const planRef = db.plans[targetId];
      if (!planRef || !planRef.isActive) {
        res.status(404).json({
          ok: false,
          errorCode: 'PLAN_NOT_FOUND',
          messageAr: 'الباقة المطلوبة غير متاحة.',
          messageEn: 'Requested plan is not active or found.',
        });
        return;
      }
      durationMonths = body.durationMonths === 3 || body.durationMonths === 12 ? body.durationMonths : 1;
      subtotalSar =
        durationMonths === 3
          ? planRef.quarterlySar
          : durationMonths === 12
          ? planRef.yearlySar
          : planRef.monthlySar;
      subtotalUsd =
        durationMonths === 3
          ? planRef.quarterlyUsd
          : durationMonths === 12
          ? planRef.yearlyUsd
          : planRef.monthlyUsd;
      titleAr = `ترقية الاشتراك: ${planRef.nameAr} (${durationMonths} شهر)`;
      titleEn = `Subscription Upgrade: ${planRef.nameEn} (${durationMonths} mo)`;
    }

    let matchedCoupon: CouponCode | null = null;
    if (typeof body.couponCode === 'string' && body.couponCode.trim()) {
      const normalizedCode = body.couponCode.trim().toUpperCase();
      matchedCoupon =
        Object.values(db.coupons).find((c) => c.code.toUpperCase() === normalizedCode) || null;
      if (!matchedCoupon) {
        res.status(400).json({
          ok: false,
          errorCode: 'COUPON_NOT_FOUND',
          messageAr: 'كود الخصم المدخل غير صحيح.',
          messageEn: 'Entered coupon code is invalid.',
        });
        return;
      }
    }

    const totals = calculateDiscountedOrderTotals({
      subtotalSar,
      subtotalUsd,
      coupon: matchedCoupon,
      orderScope: orderType === 'subscription_upgrade' ? 'plans' : 'templates',
    });

    if (totals.couponErrorCode) {
      res.status(400).json({
        ok: false,
        errorCode: totals.couponErrorCode,
        messageAr: 'كود الخصم منتهي الصلاحية أو غير صالح لهذا الطلب.',
        messageEn: 'Coupon is expired, maxed out, or inapplicable.',
      });
      return;
    }

    const nowIso = new Date().toISOString();
    const orderId = `ord-${crypto.randomBytes(6).toString('hex')}`;
    const isZeroCostFreeClaim =
      orderType === 'template_purchase' && totals.amountSar === 0 && totals.amountUsd === 0;

    // CRITICAL INTEGRITY RULE: Paid orders NEVER auto-approve without real admin payment confirmation!
    const initialStatus: ManagedOrderStatus = isZeroCostFreeClaim ? 'approved' : 'pending_review';

    const order: ManagedPurchaseOrder = {
      id: orderId,
      orderNumber: `FQR-${Math.floor(100000 + crypto.randomInt(899999))}`,
      userId: uid,
      userEmail: userRec.email,
      userName: userRec.profile.displayName,
      orderType,
      targetId,
      titleAr,
      titleEn,
      quantity,
      durationMonths,
      currency,
      subtotalSar,
      subtotalUsd,
      discountSar: totals.discountSar,
      discountUsd: totals.discountUsd,
      amountSar: totals.amountSar,
      amountUsd: totals.amountUsd,
      couponCode: totals.couponApplied || undefined,
      paymentMethod: isZeroCostFreeClaim ? 'free_claim' : 'manual_transfer',
      transferReference:
        typeof body.transferReference === 'string' ? body.transferReference.trim().slice(0, 120) : '',
      paymentProofUrl:
        typeof body.paymentProofUrl === 'string' ? body.paymentProofUrl.trim() : '',
      paymentNotes:
        typeof body.paymentNotes === 'string' ? body.paymentNotes.trim().slice(0, 500) : '',
      status: initialStatus,
      reviewedAt: isZeroCostFreeClaim ? nowIso : undefined,
      decisionReason: isZeroCostFreeClaim
        ? 'Free template license claim approved automatically'
        : undefined,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    db.orders[orderId] = order;

    if (isZeroCostFreeClaim && templateRef) {
      if (matchedCoupon) matchedCoupon.usedCount += 1;
      templateRef.salesCount = (templateRef.salesCount || 0) + 1;
      issueLicenseForApprovedOrder(order, templateRef);
      recordUserActivity(
        uid,
        'design_assigned',
        `الحصول على ترخيص قالب مجاني: ${templateRef.titleAr}`,
        `Issued Free Template License: ${templateRef.titleEn}`,
        `تم إصدار الترخيص رقم ${order.issuedLicenseId} لطلبك ${order.orderNumber}.`,
        `Issued license ${order.issuedLicenseId} for order ${order.orderNumber}.`
      );
    } else {
      recordUserNotification(
        uid,
        'system_architecture',
        'info',
        `تم تسجيل طلب الشراء ${order.orderNumber} بانتظار المراجعة`,
        `Order ${order.orderNumber} Pending Payment Review`,
        'سيتم تفعيل الترخيص أو الباقة فور مراجعة إثبات التحويل من فريق الإدارة.',
        'Your license or subscription will activate as soon as our admin team verifies your payment proof.'
      );
    }

    saveDatabase();
    res.status(201).json({
      ok: true,
      order,
      messageAr: isZeroCostFreeClaim
        ? 'تم إصدار الترخيص المجاني للطلب بنجاح!'
        : `تم تسجيل الطلب (${order.orderNumber}) بحالة «بانتظار مراجعة الدفع».`,
      messageEn: isZeroCostFreeClaim
        ? 'Free license issued and added to your account!'
        : `Order (${order.orderNumber}) created as pending payment review.`,
    });
  });

  app.post('/api/orders/:id/proof', requireAuth, (req: AuthenticatedServerRequest, res: Response) => {
    const order = db.orders[req.params.id];
    if (!order || order.userId !== req.user!.uid) {
      res.status(404).json({ ok: false, errorCode: 'ORDER_NOT_FOUND' });
      return;
    }
    if (order.status !== 'pending_review') {
      res.status(400).json({
        ok: false,
        errorCode: 'ORDER_NOT_PENDING',
        messageAr: 'لا يمكن تعديل إثبات الدفع لطلب تمت مراجعته بالفعل.',
        messageEn: 'Cannot modify payment proof after order review.',
      });
      return;
    }
    const body = (req.body || {}) as {
      transferReference?: string;
      paymentProofUrl?: string;
      paymentNotes?: string;
    };
    if (body.paymentProofUrl && !isSafeHttpsUrl(body.paymentProofUrl, 500)) {
      res.status(400).json({
        ok: false,
        errorCode: 'INVALID_PROOF_URL',
        messageAr: 'يرجى إدخال رابط إثبات صحيح يبدأ بـ https://.',
        messageEn: 'Payment proof URL must start with https://.',
      });
      return;
    }
    if (typeof body.transferReference === 'string') {
      order.transferReference = body.transferReference.trim().slice(0, 120);
    }
    if (typeof body.paymentProofUrl === 'string') {
      order.paymentProofUrl = body.paymentProofUrl.trim();
    }
    if (typeof body.paymentNotes === 'string') {
      order.paymentNotes = body.paymentNotes.trim().slice(0, 500);
    }
    order.updatedAt = new Date().toISOString();
    saveDatabase();
    res.json({ ok: true, order });
  });

  // ===========================================================================
  // C. ADMIN BOOTSTRAP, STATUS & SENSITIVE RE-AUTHENTICATION
  // ===========================================================================
  app.get('/api/admin/bootstrap-status', (req: AuthenticatedServerRequest, res: Response) => {
    const token = resolveRawToken(req);
    let currentUser: StoredUserRecord | undefined;
    let sessionVerified = false;
    if (token) {
      const session = db.sessions[hashSessionToken(token)];
      if (session && db.users[session.uid]) {
        currentUser = db.users[session.uid];
        sessionVerified = Boolean(
          session.adminVerifiedUntil && Date.now() < Date.parse(session.adminVerifiedUntil)
        );
      }
    }

    const superAdminBound = Object.values(db.users).some(
      (u) => resolveUserAuthority(u).role === 'super_admin'
    );

    const resolved = currentUser ? resolveUserAuthority(currentUser) : null;

    res.json({
      ok: true,
      adminEmailConfigured: Boolean(configuredAdminEmail),
      superAdminBound,
      authenticated: Boolean(currentUser),
      currentUserMatchesAdminEmail: currentUser
        ? Boolean(
            isSuperAdminEmailMatch(currentUser.email, configuredAdminEmail) ||
              resolved?.role === 'super_admin'
          )
        : false,
      currentUserEmailVerified: currentUser ? currentUser.profile.emailVerified : false,
      hasPassword: currentUser
        ? Boolean(currentUser.passwordHash && currentUser.passwordSalt)
        : false,
      hasGoogle: currentUser ? Boolean(currentUser.googleUid) : false,
      role: resolved ? resolved.role : null,
      permissions: resolved ? resolved.permissions : [],
      reauthActive: sessionVerified,
    });
  });

  app.post('/api/admin/bootstrap', requireAuth, (req: AuthenticatedServerRequest, res: Response) => {
    const userRec = req.user!;
    const body = (req.body || {}) as { password?: string };
    const password = typeof body.password === 'string' ? body.password : '';

    if (!configuredAdminEmail) {
      res.status(503).json({
        ok: false,
        errorCode: 'ADMIN_EMAIL_NOT_CONFIGURED',
        messageAr: 'متغير البيئة ADMIN_EMAIL غير مضبوط في الخادم حتى الآن.',
        messageEn: 'ADMIN_EMAIL environment variable is not configured on the server.',
      });
      return;
    }

    if (!isSuperAdminEmailMatch(userRec.email, configuredAdminEmail)) {
      recordSecurityEvent({
        uid: userRec.uid,
        email: userRec.email,
        path: req.originalUrl,
        method: req.method,
        reasonCode: 'UNAUTHORIZED_SUPER_ADMIN_BOOTSTRAP_ATTEMPT',
        ip: req.ip || 'local',
      });
      saveDatabase();
      res.status(403).json({
        ok: false,
        errorCode: 'FORBIDDEN_ADMIN_EMAIL_MISMATCH',
        messageAr: 'هذا الحساب غير مخوّل لأن يكون المدير الرئيسي وفق إعداد ADMIN_EMAIL.',
        messageEn: 'This account does not match the configured ADMIN_EMAIL.',
      });
      return;
    }

    const hasExistingPassword = Boolean(userRec.passwordHash && userRec.passwordSalt);
    if (hasExistingPassword) {
      if (!password || !timingSafeEqualHex(hashPassword(password, userRec.passwordSalt), userRec.passwordHash)) {
        db.loginLogs.unshift({
          id: `log-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
          email: userRec.email,
          uid: userRec.uid,
          success: false,
          reasonCode: 'ADMIN_BOOTSTRAP_INVALID_PASSWORD',
          portal: 'admin',
          ip: req.ip || 'local',
          createdAt: new Date().toISOString(),
        });
        saveDatabase();
        res.status(401).json({
          ok: false,
          errorCode: 'INVALID_PASSWORD',
          messageAr: 'كلمة المرور غير صحيحة لتفعيل صلاحية المدير الرئيسي.',
          messageEn: 'Incorrect password for Super Admin verification.',
        });
        return;
      }
    } else if (userRec.googleUid && password.length >= 8) {
      // Allow Google-only Super Admin to set an admin password during bootstrap
      const newSalt = crypto.randomBytes(16).toString('hex');
      userRec.passwordSalt = newSalt;
      userRec.passwordHash = hashPassword(password, newSalt);
      const providers = new Set<'password' | 'google'>(userRec.authProviders || ['google']);
      providers.add('password');
      userRec.authProviders = Array.from(providers);
    } else if (!userRec.googleUid) {
      res.status(401).json({
        ok: false,
        errorCode: 'INVALID_PASSWORD',
        messageAr: 'كلمة المرور غير صحيحة لتفعيل صلاحية المدير الرئيسي.',
        messageEn: 'Incorrect password for Super Admin verification.',
      });
      return;
    }

    const nowIso = new Date().toISOString();
    userRec.profile.emailVerified = true;
    userRec.profile.role = 'super_admin';
    userRec.profile.adminPermissions = [...ALL_ADMIN_PERMISSIONS];
    userRec.profile.updatedAt = nowIso;

    if (req.tokenHash && db.sessions[req.tokenHash]) {
      const winMins = db.platformSettings?.reauthWindowMinutes || 15;
      db.sessions[req.tokenHash].adminVerifiedUntil = new Date(
        Date.now() + winMins * 60_000
      ).toISOString();
    }

    recordAuditLog({
      actor: userRec,
      actorRole: 'super_admin',
      action: 'SUPER_ADMIN_BOOTSTRAPPED',
      targetType: 'security',
      targetId: userRec.uid,
      summaryAr: `تم تفعيل وربط حساب المدير الرئيسي (${userRec.email}) عبر ADMIN_EMAIL.`,
      summaryEn: `Bootstrapped and verified sole Super Admin (${userRec.email}) via ADMIN_EMAIL.`,
      ip: req.ip || 'local',
    });

    saveDatabase();
    res.json({
      ok: true,
      role: 'super_admin',
      permissions: ALL_ADMIN_PERMISSIONS,
      profile: userRec.profile,
    });
  });

  app.post('/api/admin/reauth', requireAdmin(), async (req: AuthenticatedServerRequest, res: Response) => {
    const userRec = req.user!;
    const body = (req.body || {}) as { password?: string; googleIdToken?: string };
    const password = typeof body.password === 'string' ? body.password : '';
    const googleIdToken = typeof body.googleIdToken === 'string' ? body.googleIdToken.trim() : '';

    let verifiedOk = false;
    let methodLabel = 'password';

    if (googleIdToken) {
      methodLabel = 'google';
      if (!verifyGoogleIdToken) {
        res.status(503).json({
          ok: false,
          errorCode: 'GOOGLE_VERIFY_UNAVAILABLE',
          messageAr: 'خدمة التحقق عبر Google غير متاحة حاليًا على الخادم.',
          messageEn: 'Google verification service is unavailable on the server.',
        });
        return;
      }
      const identity = await verifyGoogleIdToken(googleIdToken);
      if (
        identity &&
        identity.emailVerified &&
        identity.email.trim().toLowerCase() === userRec.email.trim().toLowerCase() &&
        (!userRec.googleUid || userRec.googleUid === identity.googleUid)
      ) {
        verifiedOk = true;
      }
    } else if (password && userRec.passwordHash && userRec.passwordSalt) {
      verifiedOk = timingSafeEqualHex(
        hashPassword(password, userRec.passwordSalt),
        userRec.passwordHash
      );
    }

    if (!verifiedOk) {
      db.loginLogs.unshift({
        id: `log-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
        email: userRec.email,
        uid: userRec.uid,
        success: false,
        reasonCode:
          methodLabel === 'google' ? 'ADMIN_REAUTH_GOOGLE_FAILED' : 'ADMIN_REAUTH_FAILED',
        portal: 'admin',
        ip: req.ip || 'local',
        createdAt: new Date().toISOString(),
      });
      saveDatabase();
      res.status(401).json({
        ok: false,
        errorCode: methodLabel === 'google' ? 'GOOGLE_REAUTH_FAILED' : 'INVALID_PASSWORD',
        messageAr:
          methodLabel === 'google'
            ? 'تعذر إعادة التحقق عبر حساب Google المطابق لهذا المدير.'
            : !userRec.passwordHash
            ? 'هذا الحساب مرتبط بـ Google ولا يملك كلمة مرور محلية بعد. استخدم زر إعادة التحقق عبر Google أو قم بتعيين كلمة مرور من إعدادات الحساب.'
            : 'كلمة المرور غير صحيحة لإعادة التحقق.',
        messageEn:
          methodLabel === 'google'
            ? 'Could not re-verify using the matching Google account for this admin.'
            : !userRec.passwordHash
            ? 'This account uses Google Sign-In and has no local password yet. Re-verify with Google or set a password in Account Settings.'
            : 'Incorrect password for re-authentication.',
      });
      return;
    }

    const winMins = db.platformSettings?.reauthWindowMinutes || 15;
    const untilIso = new Date(Date.now() + winMins * 60_000).toISOString();
    if (req.tokenHash && db.sessions[req.tokenHash]) {
      db.sessions[req.tokenHash].adminVerifiedUntil = untilIso;
    }

    db.loginLogs.unshift({
      id: `log-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      email: userRec.email,
      uid: userRec.uid,
      success: true,
      reasonCode:
        methodLabel === 'google' ? 'ADMIN_REAUTH_GOOGLE_SUCCESS' : 'ADMIN_REAUTH_SUCCESS',
      portal: 'admin',
      ip: req.ip || 'local',
      createdAt: new Date().toISOString(),
    });
    saveDatabase();
    res.json({ ok: true, adminVerifiedUntil: untilIso, reauthWindowMinutes: winMins });
  });

  // ===========================================================================
  // D. 1. ADMIN DASHBOARD
  // ===========================================================================
  app.get('/api/admin/dashboard', requireAdmin('dashboard'), (req: AuthenticatedServerRequest, res: Response) => {
    const p = req.query.period;
    const period: '7d' | '30d' | '90d' | 'all' =
      p === '7d' || p === '30d' || p === '90d' ? p : 'all';

    const analytics = computeAdminDashboardAnalytics({
      period,
      users: Object.values(db.users).map((u) => ({
        uid: u.uid,
        plan: u.profile.plan,
        accountStatus: u.profile.accountStatus,
        createdAt: u.profile.createdAt,
      })),
      items: Object.values(db.items),
      templates: Object.values(db.templates),
      orders: Object.values(db.orders),
      subscriptions: Object.values(db.subscriptions),
      tickets: Object.values(db.supportTickets),
      auditLogs: Object.values(db.auditLogs),
      activities: Object.values(db.activities),
    });

    res.json({ ok: true, analytics });
  });

  // ===========================================================================
  // D. 2. USERS MANAGEMENT
  // ===========================================================================
  app.get('/api/admin/users', requireAdmin('users'), (_req: AuthenticatedServerRequest, res: Response) => {
    const itemsByOwner = new Map<string, number>();
    for (const item of Object.values(db.items)) {
      itemsByOwner.set(item.ownerUid, (itemsByOwner.get(item.ownerUid) || 0) + 1);
    }
    const ordersByOwner = new Map<string, number>();
    for (const ord of Object.values(db.orders)) {
      ordersByOwner.set(ord.userId, (ordersByOwner.get(ord.userId) || 0) + 1);
    }

    const users: AdminUserSummary[] = Object.values(db.users)
      .map((u) => {
        recomputeUserActiveCount(u.uid);
        const { role, permissions } = resolveUserAuthority(u);
        return {
          uid: u.uid,
          email: u.email,
          displayName: u.profile.displayName,
          country: u.profile.country,
          preferredLanguage: u.profile.preferredLanguage,
          plan: u.profile.plan,
          accountStatus: u.profile.accountStatus,
          role,
          adminPermissions: permissions,
          adminNotes: u.profile.adminNotes || '',
          activeItemsCount: u.profile.activeItemsCount,
          activeItemsLimit: u.profile.activeItemsLimit,
          contactMethodsLimit: u.profile.contactMethodsLimit,
          totalItemsCount: itemsByOwner.get(u.uid) || 0,
          totalOrdersCount: ordersByOwner.get(u.uid) || 0,
          emailVerified: u.profile.emailVerified,
          createdAt: u.profile.createdAt,
          updatedAt: u.profile.updatedAt,
          lastActiveAt: u.profile.lastActiveAt || u.profile.updatedAt,
        };
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    res.json({ ok: true, users });
  });

  app.get('/api/admin/users/:uid', requireAdmin('users'), (req: AuthenticatedServerRequest, res: Response) => {
    const target = db.users[req.params.uid];
    if (!target) {
      res.status(404).json({ ok: false, errorCode: 'USER_NOT_FOUND' });
      return;
    }
    recomputeUserActiveCount(target.uid);
    const { role, permissions } = resolveUserAuthority(target);
    const items = Object.values(db.items).filter((i) => i.ownerUid === target.uid);
    const orders = Object.values(db.orders).filter((o) => o.userId === target.uid);
    const subscriptions = Object.values(db.subscriptions).filter((s) => s.userId === target.uid);
    const licenses = Object.values(db.issuedLicenses).filter((l) => l.userId === target.uid);
    const activities = Object.values(db.activities)
      .filter((a) => a.ownerUid === target.uid)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    res.json({
      ok: true,
      user: {
        ...target.profile,
        role,
        adminPermissions: permissions,
      },
      items,
      orders,
      subscriptions,
      licenses,
      activities,
    });
  });

  app.patch(
    '/api/admin/users/:uid',
    requireAdmin('users'),
    requireReauth,
    (req: AuthenticatedServerRequest, res: Response) => {
      const target = db.users[req.params.uid];
      if (!target) {
        res.status(404).json({ ok: false, errorCode: 'USER_NOT_FOUND' });
        return;
      }

      const actor = req.user!;
      const actorAuth = resolveUserAuthority(actor);
      const targetAuth = resolveUserAuthority(target);
      const body = (req.body || {}) as {
        accountStatus?: 'active' | 'suspended';
        plan?: UserPlanTier;
        adminNotes?: string;
      };

      if (targetAuth.role === 'super_admin' && body.accountStatus === 'suspended') {
        res.status(403).json({
          ok: false,
          errorCode: 'CANNOT_SUSPEND_SUPER_ADMIN',
          messageAr: 'لا يمكن تعليق حساب المدير الرئيسي من هذه اللوحة.',
          messageEn: 'The sole Super Admin account cannot be suspended.',
        });
        return;
      }

      const before = {
        accountStatus: target.profile.accountStatus,
        plan: target.profile.plan,
        adminNotes: target.profile.adminNotes || '',
      };

      if (body.accountStatus === 'active' || body.accountStatus === 'suspended') {
        target.profile.accountStatus = body.accountStatus;
        if (body.accountStatus === 'suspended') {
          for (const [tokenHash, sess] of Object.entries(db.sessions)) {
            if (sess.uid === target.uid) {
              delete db.sessions[tokenHash];
            }
          }
        }
      }

      if (typeof body.plan === 'string') {
        const matchedPlan = Object.values(db.plans).find((p) => p.quotaTier === body.plan);
        if (matchedPlan) {
          target.profile.plan = matchedPlan.quotaTier;
          target.profile.activeItemsLimit = matchedPlan.maxActiveItems;
          target.profile.contactMethodsLimit = matchedPlan.maxContactMethods;
        }
      }

      if (typeof body.adminNotes === 'string') {
        target.profile.adminNotes = body.adminNotes.trim().slice(0, 1000);
      }

      target.profile.updatedAt = new Date().toISOString();
      recomputeUserActiveCount(target.uid);

      recordAuditLog({
        actor,
        actorRole: actorAuth.role,
        action: 'ADMIN_USER_UPDATED',
        targetType: 'user',
        targetId: target.uid,
        summaryAr: `تحديث حساب المستخدم (${target.email}): الحالة=${target.profile.accountStatus}، الباقة=${target.profile.plan}`,
        summaryEn: `Updated user (${target.email}): status=${target.profile.accountStatus}, plan=${target.profile.plan}`,
        beforeSnapshot: before,
        afterSnapshot: {
          accountStatus: target.profile.accountStatus,
          plan: target.profile.plan,
          adminNotes: target.profile.adminNotes || '',
        },
        ip: req.ip || 'local',
      });

      saveDatabase();
      res.json({ ok: true, profile: target.profile });
    }
  );

  // ===========================================================================
  // D. 3. ITEMS & QR CODES MODERATION
  // ===========================================================================
  app.get('/api/admin/items', requireAdmin('items'), (_req: AuthenticatedServerRequest, res: Response) => {
    const items: AdminItemSummary[] = Object.values(db.items)
      .map((item) => {
        const owner = db.users[item.ownerUid];
        return {
          ...item,
          ownerEmail: owner?.email || 'unknown',
          ownerDisplayName: owner?.profile.displayName || item.ownerUid,
          ownerPlan: owner?.profile.plan || 'Free',
        };
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    res.json({ ok: true, items });
  });

  app.patch(
    '/api/admin/items/:id',
    requireAdmin('items'),
    (req: AuthenticatedServerRequest, res: Response) => {
      const item = db.items[req.params.id];
      if (!item) {
        res.status(404).json({ ok: false, errorCode: 'ITEM_NOT_FOUND' });
        return;
      }

      const actor = req.user!;
      const actorAuth = resolveUserAuthority(actor);
      const body = (req.body || {}) as {
        status?: RegisteredItem['status'];
        moderationFlag?: 'clean' | 'flagged' | 'restricted';
        moderationNote?: string;
      };

      const before = {
        status: item.status,
        moderationFlag: item.moderationFlag || 'clean',
        moderationNote: item.moderationNote || '',
      };

      if (
        body.status === 'Active' ||
        body.status === 'Lost' ||
        body.status === 'Found' ||
        body.status === 'Recovered' ||
        body.status === 'Archived'
      ) {
        item.status = body.status;
      }
      if (
        body.moderationFlag === 'clean' ||
        body.moderationFlag === 'flagged' ||
        body.moderationFlag === 'restricted'
      ) {
        item.moderationFlag = body.moderationFlag;
      }
      if (typeof body.moderationNote === 'string') {
        item.moderationNote = body.moderationNote.trim().slice(0, 500);
      }
      item.updatedAt = new Date().toISOString();
      recomputeUserActiveCount(item.ownerUid);

      recordAuditLog({
        actor,
        actorRole: actorAuth.role,
        action: 'ADMIN_ITEM_MODERATED',
        targetType: 'item',
        targetId: item.id,
        summaryAr: `تحديث حالة/رقابة الغرض (${item.codeSerial}): الحالة=${item.status}، الرقابة=${item.moderationFlag || 'clean'}`,
        summaryEn: `Moderated item (${item.codeSerial}): status=${item.status}, flag=${item.moderationFlag || 'clean'}`,
        beforeSnapshot: before,
        afterSnapshot: {
          status: item.status,
          moderationFlag: item.moderationFlag || 'clean',
          moderationNote: item.moderationNote || '',
        },
        ip: req.ip || 'local',
      });

      saveDatabase();
      res.json({ ok: true, item });
    }
  );

  app.post(
    '/api/admin/items/:id/transfer-owner',
    requireAdmin('items'),
    requireReauth,
    (req: AuthenticatedServerRequest, res: Response) => {
      const item = db.items[req.params.id];
      if (!item) {
        res.status(404).json({ ok: false, errorCode: 'ITEM_NOT_FOUND' });
        return;
      }
      const body = (req.body || {}) as { targetEmail?: string; reason?: string };
      const targetEmail = normalizeConfiguredAdminEmail(body.targetEmail);
      const newOwner = Object.values(db.users).find((u) => u.email === targetEmail);
      if (!newOwner) {
        res.status(404).json({
          ok: false,
          errorCode: 'TARGET_USER_NOT_FOUND',
          messageAr: 'لم يتم العثور على المستخدم المستهدف بالبريد الإلكتروني المدخل.',
          messageEn: 'Target owner email not found.',
        });
        return;
      }

      const actor = req.user!;
      const actorAuth = resolveUserAuthority(actor);
      const oldUid = item.ownerUid;
      item.ownerUid = newOwner.uid;
      item.updatedAt = new Date().toISOString();
      recomputeUserActiveCount(oldUid);
      recomputeUserActiveCount(newOwner.uid);

      recordAuditLog({
        actor,
        actorRole: actorAuth.role,
        action: 'ADMIN_ITEM_OWNERSHIP_TRANSFERRED',
        targetType: 'item',
        targetId: item.id,
        summaryAr: `نقل ملكية الكود (${item.codeSerial}) إلى ${newOwner.email} — السبب: ${body.reason || 'قرار إداري'}`,
        summaryEn: `Transferred ownership of (${item.codeSerial}) to ${newOwner.email}`,
        beforeSnapshot: { ownerUid: oldUid },
        afterSnapshot: { ownerUid: newOwner.uid, targetEmail: newOwner.email },
        ip: req.ip || 'local',
      });

      saveDatabase();
      res.json({ ok: true, item });
    }
  );

  // ===========================================================================
  // D. 4. TEMPLATES LIBRARY CRUD, SINGLE UPLOAD & SECURE ZIP BATCH UPLOAD
  // ===========================================================================
  app.get('/api/admin/templates', requireAdmin('templates'), (_req: AuthenticatedServerRequest, res: Response) => {
    const usageCounts = new Map<string, number>();
    for (const item of Object.values(db.items)) {
      usageCounts.set(item.designId, (usageCounts.get(item.designId) || 0) + 1);
    }
    const templates = Object.values(db.templates).map((t) => ({
      ...enrichTemplateDefaults(t),
      usageCount: usageCounts.get(t.id) || t.usageCount || 0,
    }));
    res.json({ ok: true, templates });
  });

  app.post('/api/admin/templates', requireAdmin('templates'), (req: AuthenticatedServerRequest, res: Response) => {
    const body = (req.body || {}) as Partial<TagDesignTemplate>;
    const titleAr = typeof body.titleAr === 'string' ? body.titleAr.trim() : '';
    const titleEn = typeof body.titleEn === 'string' ? body.titleEn.trim() : '';
    if (!titleAr && !titleEn) {
      res.status(400).json({
        ok: false,
        errorCode: 'TITLE_REQUIRED',
        messageAr: 'يرجى إدخال اسم القالب.',
        messageEn: 'Template title is required.',
      });
      return;
    }

    if (body.originalDesignUrl && !isSafeHttpsUrl(body.originalDesignUrl, 600)) {
      res.status(400).json({ ok: false, errorCode: 'INVALID_ORIGINAL_URL' });
      return;
    }
    if (body.printFileUrl && !isSafeHttpsUrl(body.printFileUrl, 600)) {
      res.status(400).json({ ok: false, errorCode: 'INVALID_PRINT_URL' });
      return;
    }

    const slug =
      (typeof body.slug === 'string' && body.slug.trim()) ||
      (titleEn || titleAr)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') ||
      `tpl-${Date.now()}`;

    const duplicateSlug = Object.values(db.templates).some((t) => t.slug === slug);
    const id = `design-${slug}-${crypto.randomBytes(2).toString('hex')}`;
    const nowIso = new Date().toISOString();

    const tpl = enrichTemplateDefaults({
      id,
      slug: duplicateSlug ? `${slug}-${crypto.randomBytes(2).toString('hex')}` : slug,
      titleAr: titleAr || titleEn,
      titleEn: titleEn || titleAr,
      subtitleAr: body.subtitleAr?.trim() || 'قالب QR مخصص جاهز للطباعة',
      subtitleEn: body.subtitleEn?.trim() || 'Print-ready custom QR tag template',
      category: body.category || 'sticker',
      domainCategory: body.domainCategory,
      templateScope: body.templateScope === 'specialized' ? 'specialized' : 'general',
      shapeSilhouette: body.shapeSilhouette || 'dome_sticker',
      specialtyBadgeAr: body.specialtyBadgeAr?.trim(),
      specialtyBadgeEn: body.specialtyBadgeEn?.trim(),
      materialAr: body.materialAr?.trim() || 'بولي كربونات مقاوم للماء',
      materialEn: body.materialEn?.trim() || 'Weatherproof Polycarbonate',
      dimensionsMm: body.dimensionsMm?.trim() || '50 × 50 × 2 mm',
      weatherproofRating: body.weatherproofRating?.trim() || 'IP67',
      primaryHex: body.primaryHex || '#2563EB',
      secondaryHex: body.secondaryHex || '#17243A',
      badgeColorHex: body.badgeColorHex || '#19B5A5',
      priceSar: Number(body.priceSar) >= 0 ? Number(body.priceSar) : 35,
      priceUsd: Number(body.priceUsd) >= 0 ? Number(body.priceUsd) : 9,
      includedInTier: body.includedInTier || 'plus',
      featuresAr:
        Array.isArray(body.featuresAr) && body.featuresAr.length > 0
          ? body.featuresAr
          : ['كود QR متجهي عالي التباين قابل للمسح'],
      featuresEn:
        Array.isArray(body.featuresEn) && body.featuresEn.length > 0
          ? body.featuresEn
          : ['High-contrast scannable vector QR frame'],
      recommendedForAr:
        Array.isArray(body.recommendedForAr) && body.recommendedForAr.length > 0
          ? body.recommendedForAr
          : ['الأغراض الشخصية'],
      recommendedForEn:
        Array.isArray(body.recommendedForEn) && body.recommendedForEn.length > 0
          ? body.recommendedForEn
          : ['Personal items'],
      status: body.status || 'draft',
      isFree: Boolean(body.isFree) || Number(body.priceSar) === 0,
      isFeatured: Boolean(body.isFeatured),
      isCoreProtected: false,
      purchaseMode: body.purchaseMode || 'both',
      customizationMode: body.customizationMode || 'mixed',
      allowEditAfterSave: Boolean(body.allowEditAfterSave),
      maxCopies: Number(body.maxCopies) >= 1 ? Number(body.maxCopies) : 5,
      tags: Array.isArray(body.tags) ? body.tags : [],
      licenseTypeId: body.licenseTypeId,
      originalDesignUrl: body.originalDesignUrl?.trim() || '',
      printFileUrl: body.printFileUrl?.trim() || '',
      previewImages: Array.isArray(body.previewImages) ? body.previewImages : [],
      publishedAt: body.status === 'published' ? nowIso : null,
      createdAt: nowIso,
      updatedAt: nowIso,
    });

    db.templates[id] = tpl;

    const actor = req.user!;
    recordAuditLog({
      actor,
      actorRole: resolveUserAuthority(actor).role,
      action: 'ADMIN_TEMPLATE_CREATED',
      targetType: 'template',
      targetId: id,
      summaryAr: `إنشاء قالب جديد: ${tpl.titleAr} (${tpl.status})`,
      summaryEn: `Created template: ${tpl.titleEn} (${tpl.status})`,
      afterSnapshot: { id: tpl.id, status: tpl.status, priceSar: tpl.priceSar },
      ip: req.ip || 'local',
    });

    saveDatabase();
    res.status(201).json({ ok: true, template: tpl });
  });

  app.patch('/api/admin/templates/:id', requireAdmin('templates'), (req: AuthenticatedServerRequest, res: Response) => {
    const existing = db.templates[req.params.id];
    if (!existing) {
      res.status(404).json({ ok: false, errorCode: 'TEMPLATE_NOT_FOUND' });
      return;
    }

    const body = (req.body || {}) as Partial<TagDesignTemplate>;
    if (body.originalDesignUrl && !isSafeHttpsUrl(body.originalDesignUrl, 600)) {
      res.status(400).json({ ok: false, errorCode: 'INVALID_ORIGINAL_URL' });
      return;
    }
    if (body.printFileUrl && !isSafeHttpsUrl(body.printFileUrl, 600)) {
      res.status(400).json({ ok: false, errorCode: 'INVALID_PRINT_URL' });
      return;
    }

    const before = {
      status: existing.status,
      priceSar: existing.priceSar,
      includedInTier: existing.includedInTier,
      customizationMode: existing.customizationMode,
    };

    const nowIso = new Date().toISOString();
    const updated: TagDesignTemplate = enrichTemplateDefaults({
      ...existing,
      ...body,
      id: existing.id,
      slug: existing.slug,
      isCoreProtected: existing.isCoreProtected,
      publishedAt:
        body.status === 'published' && !existing.publishedAt
          ? nowIso
          : existing.publishedAt,
      updatedAt: nowIso,
    });

    db.templates[existing.id] = updated;

    const actor = req.user!;
    recordAuditLog({
      actor,
      actorRole: resolveUserAuthority(actor).role,
      action: 'ADMIN_TEMPLATE_UPDATED',
      targetType: 'template',
      targetId: existing.id,
      summaryAr: `تعديل القالب: ${updated.titleAr} (${updated.status})`,
      summaryEn: `Updated template: ${updated.titleEn} (${updated.status})`,
      beforeSnapshot: before,
      afterSnapshot: {
        status: updated.status,
        priceSar: updated.priceSar,
        includedInTier: updated.includedInTier,
        customizationMode: updated.customizationMode,
      },
      ip: req.ip || 'local',
    });

    saveDatabase();
    res.json({ ok: true, template: updated });
  });

  app.delete(
    '/api/admin/templates/:id',
    requireAdmin('templates'),
    requireReauth,
    (req: AuthenticatedServerRequest, res: Response) => {
      const existing = db.templates[req.params.id];
      if (!existing) {
        res.status(404).json({ ok: false, errorCode: 'TEMPLATE_NOT_FOUND' });
        return;
      }

      const hasOrders = Object.values(db.orders).some((o) => o.targetId === existing.id);
      const hasLicenses = Object.values(db.issuedLicenses).some((l) => l.templateId === existing.id);
      const hasItems = Object.values(db.items).some((i) => i.designId === existing.id);

      if (existing.isCoreProtected || hasOrders || hasLicenses || hasItems) {
        res.status(409).json({
          ok: false,
          errorCode: 'TEMPLATE_IN_USE_OR_CORE',
          messageAr:
            'لا يمكن حذف هذا القالب نهائيًا لأنه من القوالب الأساسية المحمية أو مرتبط بمشتريات/أغراض عملاء. يمكنك أرشفته بدلًا من الحذف.',
          messageEn:
            'Cannot permanently delete a protected core template or one linked to existing orders/licenses/items. Archive it instead.',
        });
        return;
      }

      delete db.templates[existing.id];
      const actor = req.user!;
      recordAuditLog({
        actor,
        actorRole: resolveUserAuthority(actor).role,
        action: 'ADMIN_TEMPLATE_DELETED',
        targetType: 'template',
        targetId: existing.id,
        summaryAr: `حذف قالب غير مستخدم نهائيًا: ${existing.titleAr}`,
        summaryEn: `Deleted unused template: ${existing.titleEn}`,
        beforeSnapshot: { id: existing.id, slug: existing.slug },
        ip: req.ip || 'local',
      });
      saveDatabase();
      res.json({ ok: true });
    }
  );

  app.post(
    '/api/admin/templates/upload-zip',
    requireAdmin('templates'),
    async (req: AuthenticatedServerRequest, res: Response) => {
      const body = (req.body || {}) as { fileName?: string; base64Zip?: string };
      const b64 = typeof body.base64Zip === 'string' ? body.base64Zip.trim() : '';
      if (!b64) {
        res.status(400).json({
          ok: false,
          errorCode: 'ZIP_PAYLOAD_REQUIRED',
          messageAr: 'يرجى إرفاق ملف ZIP صحيح.',
          messageEn: 'Please provide a valid ZIP payload.',
        });
        return;
      }

      const cleanBase64 = b64.includes(',') ? b64.split(',').pop() || '' : b64;
      const buf = Buffer.from(cleanBase64, 'base64');
      if (buf.byteLength === 0 || buf.byteLength > 8 * 1024 * 1024) {
        res.status(400).json({
          ok: false,
          errorCode: 'ZIP_SIZE_EXCEEDED',
          messageAr: 'حجم ملف ZIP يتجاوز الحد المسموح (8MB).',
          messageEn: 'ZIP archive size exceeds the 8MB limit.',
        });
        return;
      }

      try {
        const zip = await JSZip.loadAsync(buf);
        const entries = Object.values(zip.files);
        if (entries.length > 150) {
          res.status(400).json({
            ok: false,
            errorCode: 'ZIP_TOO_MANY_FILES',
            messageAr: 'عدد الملفات داخل الأرشيف يتجاوز الحد الآمن (150 ملفًا).',
            messageEn: 'ZIP archive exceeds safe entry limit (150 files).',
          });
          return;
        }

        const unsafeEntries: string[] = [];
        for (const entry of entries) {
          const check = isSafeZipEntryPath(entry.name);
          if (!check.safe) {
            unsafeEntries.push(`${entry.name} (${check.reason})`);
          }
        }

        if (unsafeEntries.length > 0) {
          res.status(400).json({
            ok: false,
            errorCode: 'ZIP_SECURITY_VALIDATION_FAILED',
            messageAr: `تم رفض ملف ZIP لأسباب أمنية بسبب ملفات غير مصرح بها: ${unsafeEntries.slice(0, 3).join('، ')}`,
            messageEn: `ZIP rejected for security reasons due to disallowed entries: ${unsafeEntries.slice(0, 3).join(', ')}`,
            unsafeEntries,
          });
          return;
        }

        const warnings: string[] = [];
        const importedTemplates: TagDesignTemplate[] = [];
        let manifestItems: Array<Record<string, unknown>> = [];

        const manifestEntry = entries.find(
          (e) => !e.dir && /(^|\/)manifest\.json$/i.test(e.name)
        );
        if (manifestEntry) {
          const rawText = await manifestEntry.async('string');
          const parsed = JSON.parse(rawText) as unknown;
          if (Array.isArray(parsed)) {
            manifestItems = parsed as Array<Record<string, unknown>>;
          } else if (
            parsed &&
            typeof parsed === 'object' &&
            Array.isArray((parsed as { templates?: unknown[] }).templates)
          ) {
            manifestItems = (parsed as { templates: Array<Record<string, unknown>> }).templates;
          }
        } else {
          // Also inspect individual *.json template descriptors inside the ZIP
          const jsonEntries = entries.filter(
            (e) => !e.dir && e.name.toLowerCase().endsWith('.json') && !e.name.startsWith('__MACOSX/')
          );
          for (const je of jsonEntries) {
            try {
              const txt = await je.async('string');
              const parsed = JSON.parse(txt) as Record<string, unknown>;
              manifestItems.push(parsed);
            } catch {
              warnings.push(`Skipped malformed JSON: ${je.name}`);
            }
          }
        }

        // Security check: inspect any SVG inside ZIP for inline <script>
        for (const svgEntry of entries.filter((e) => !e.dir && e.name.toLowerCase().endsWith('.svg'))) {
          const svgStr = await svgEntry.async('string');
          if (/<script[\s>]/i.test(svgStr) || /on\w+\s*=/i.test(svgStr)) {
            res.status(400).json({
              ok: false,
              errorCode: 'ZIP_UNSAFE_SVG_SCRIPT',
              messageAr: `تم رفض ملف SVG (${svgEntry.name}) لاحتوائه على أكواد برمجية غير آمنة.`,
              messageEn: `Rejected SVG (${svgEntry.name}) containing unsafe script markup.`,
            });
            return;
          }
        }

        manifestItems.forEach((rawItem, idx) => {
          const built = buildTemplateFromZipManifestItem(rawItem, idx + 1);
          if (!built.valid || !built.template) {
            warnings.push(built.error || `Invalid item at index ${idx}`);
            return;
          }
          // Protect existing core/saved templates from accidental ZIP overwrite
          if (db.templates[built.template.id]) {
            built.template = {
              ...built.template,
              id: `${built.template.id}-${crypto.randomBytes(2).toString('hex')}`,
              slug: `${built.template.slug}-${crypto.randomBytes(2).toString('hex')}`,
            };
          }
          db.templates[built.template.id] = built.template;
          importedTemplates.push(built.template);
        });

        const actor = req.user!;
        recordAuditLog({
          actor,
          actorRole: resolveUserAuthority(actor).role,
          action: 'ADMIN_TEMPLATE_ZIP_IMPORTED',
          targetType: 'template',
          targetId: body.fileName || 'batch.zip',
          summaryAr: `استيراد حزمة قوالب ZIP (${body.fileName || 'archive.zip'}): تم استيراد ${importedTemplates.length} قالب كمسودة`,
          summaryEn: `Imported ZIP batch (${body.fileName || 'archive.zip'}): ${importedTemplates.length} draft templates added`,
          afterSnapshot: { importedIds: importedTemplates.map((t) => t.id), warnings },
          ip: req.ip || 'local',
        });

        saveDatabase();
        res.json({
          ok: true,
          fileCount: entries.filter((e) => !e.dir).length,
          importedCount: importedTemplates.length,
          importedTemplates,
          warnings,
        });
      } catch {
        res.status(400).json({
          ok: false,
          errorCode: 'ZIP_PARSE_FAILED',
          messageAr: 'تعذّر قراءة ملف ZIP؛ تأكد من سلامة الأرشيف وصحة ملف manifest.json.',
          messageEn: 'Failed to read ZIP archive; verify archive integrity and JSON syntax.',
        });
      }
    }
  );

  // ===========================================================================
  // D. 5. LICENSES & USAGE RIGHTS
  // ===========================================================================
  app.get('/api/admin/licenses', requireAdmin('licenses'), (_req: AuthenticatedServerRequest, res: Response) => {
    res.json({
      ok: true,
      licenseTypes: Object.values(db.licenseTypes),
      issuedLicenses: Object.values(db.issuedLicenses).sort((a, b) =>
        b.issuedAt.localeCompare(a.issuedAt)
      ),
    });
  });

  app.post('/api/admin/licenses/types', requireAdmin('licenses'), (req: AuthenticatedServerRequest, res: Response) => {
    const body = (req.body || {}) as Partial<LicenseType>;
    const nameAr = typeof body.nameAr === 'string' ? body.nameAr.trim() : '';
    const nameEn = typeof body.nameEn === 'string' ? body.nameEn.trim() : '';
    if (!nameAr && !nameEn) {
      res.status(400).json({ ok: false, errorCode: 'LICENSE_NAME_REQUIRED' });
      return;
    }
    const id = `lic-${crypto.randomBytes(4).toString('hex')}`;
    const nowIso = new Date().toISOString();
    const created: LicenseType = {
      id,
      nameAr: nameAr || nameEn,
      nameEn: nameEn || nameAr,
      descriptionAr: body.descriptionAr?.trim() || '',
      descriptionEn: body.descriptionEn?.trim() || '',
      allowPersonalUse: body.allowPersonalUse !== false,
      allowCommercialUse: Boolean(body.allowCommercialUse),
      durationDays:
        typeof body.durationDays === 'number' && body.durationDays > 0
          ? Math.round(body.durationDays)
          : null,
      maxCopies: typeof body.maxCopies === 'number' && body.maxCopies >= 1 ? Math.round(body.maxCopies) : 5,
      printRulesAr: body.printRulesAr?.trim() || 'الطباعة للاستخدام المصرح به فقط',
      printRulesEn: body.printRulesEn?.trim() || 'Printing permitted solely for licensed scope',
      transferable: Boolean(body.transferable),
      resaleAllowed: Boolean(body.resaleAllowed),
      redistributionAllowed: Boolean(body.redistributionAllowed),
      exceptionsAr: body.exceptionsAr?.trim() || 'لا توجد استثناءات إضافية',
      exceptionsEn: body.exceptionsEn?.trim() || 'No additional exceptions',
      isActive: body.isActive !== false,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    db.licenseTypes[id] = created;
    const actor = req.user!;
    recordAuditLog({
      actor,
      actorRole: resolveUserAuthority(actor).role,
      action: 'ADMIN_LICENSE_TYPE_CREATED',
      targetType: 'license',
      targetId: id,
      summaryAr: `إنشاء نوع ترخيص جديد: ${created.nameAr}`,
      summaryEn: `Created license type: ${created.nameEn}`,
      afterSnapshot: created,
      ip: req.ip || 'local',
    });
    saveDatabase();
    res.status(201).json({ ok: true, licenseType: created });
  });

  app.patch('/api/admin/licenses/types/:id', requireAdmin('licenses'), (req: AuthenticatedServerRequest, res: Response) => {
    const existing = db.licenseTypes[req.params.id];
    if (!existing) {
      res.status(404).json({ ok: false, errorCode: 'LICENSE_TYPE_NOT_FOUND' });
      return;
    }
    const body = (req.body || {}) as Record<string, unknown>;
    const updated: LicenseType = {
      ...existing,
      nameAr: typeof body.nameAr === 'string' && body.nameAr.trim() ? body.nameAr.trim().slice(0, 120) : existing.nameAr,
      nameEn: typeof body.nameEn === 'string' && body.nameEn.trim() ? body.nameEn.trim().slice(0, 120) : existing.nameEn,
      descriptionAr: typeof body.descriptionAr === 'string' ? body.descriptionAr.trim().slice(0, 600) : existing.descriptionAr,
      descriptionEn: typeof body.descriptionEn === 'string' ? body.descriptionEn.trim().slice(0, 600) : existing.descriptionEn,
      allowPersonalUse: typeof body.allowPersonalUse === 'boolean' ? body.allowPersonalUse : existing.allowPersonalUse,
      allowCommercialUse: typeof body.allowCommercialUse === 'boolean' ? body.allowCommercialUse : existing.allowCommercialUse,
      durationDays: body.durationDays === null ? null : typeof body.durationDays === 'number' && Number.isFinite(body.durationDays) ? Math.max(1, Math.floor(body.durationDays)) : existing.durationDays,
      maxCopies: typeof body.maxCopies === 'number' && Number.isFinite(body.maxCopies) ? Math.max(1, Math.min(10000, Math.floor(body.maxCopies))) : existing.maxCopies,
      printRulesAr: typeof body.printRulesAr === 'string' ? body.printRulesAr.trim().slice(0, 600) : existing.printRulesAr,
      printRulesEn: typeof body.printRulesEn === 'string' ? body.printRulesEn.trim().slice(0, 600) : existing.printRulesEn,
      transferable: typeof body.transferable === 'boolean' ? body.transferable : existing.transferable,
      resaleAllowed: typeof body.resaleAllowed === 'boolean' ? body.resaleAllowed : existing.resaleAllowed,
      redistributionAllowed: typeof body.redistributionAllowed === 'boolean' ? body.redistributionAllowed : existing.redistributionAllowed,
      exceptionsAr: typeof body.exceptionsAr === 'string' ? body.exceptionsAr.trim().slice(0, 600) : existing.exceptionsAr,
      exceptionsEn: typeof body.exceptionsEn === 'string' ? body.exceptionsEn.trim().slice(0, 600) : existing.exceptionsEn,
      isActive: typeof body.isActive === 'boolean' ? body.isActive : existing.isActive,
      id: existing.id,
      updatedAt: new Date().toISOString(),
    };
    db.licenseTypes[existing.id] = updated;
    const actor = req.user!;
    recordAuditLog({
      actor,
      actorRole: resolveUserAuthority(actor).role,
      action: 'ADMIN_LICENSE_TYPE_UPDATED',
      targetType: 'license',
      targetId: existing.id,
      summaryAr: `تعديل شروط الترخيص: ${updated.nameAr}`,
      summaryEn: `Updated license type: ${updated.nameEn}`,
      beforeSnapshot: existing,
      afterSnapshot: updated,
      ip: req.ip || 'local',
    });
    saveDatabase();
    res.json({ ok: true, licenseType: updated });
  });

  // ===========================================================================
  // D. 6. PLANS & SUBSCRIPTIONS
  // ===========================================================================
  app.get('/api/admin/plans', requireAdmin('plans'), (_req: AuthenticatedServerRequest, res: Response) => {
    res.json({
      ok: true,
      plans: Object.values(db.plans),
      subscriptions: Object.values(db.subscriptions).sort((a, b) =>
        b.startedAt.localeCompare(a.startedAt)
      ),
    });
  });

  app.post(
    '/api/admin/plans',
    requireAdmin('plans'),
    requireReauth,
    (req: AuthenticatedServerRequest, res: Response) => {
      const body = (req.body || {}) as Partial<ManagedPlanDefinition>;
      const id =
        (typeof body.id === 'string' && body.id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '')) ||
        `plan-${crypto.randomBytes(3).toString('hex')}`;
      if (db.plans[id]) {
        res.status(409).json({ ok: false, errorCode: 'PLAN_ID_EXISTS' });
        return;
      }
      const monthlySar = Math.max(0, Number(body.monthlySar) || 0);
      const monthlyUsd = Math.max(0, Number(body.monthlyUsd) || 0);
      const created: ManagedPlanDefinition = {
        id,
        quotaTier: body.quotaTier || 'Business',
        nameAr: body.nameAr?.trim() || 'باقة مخصصة',
        nameEn: body.nameEn?.trim() || 'Custom Plan',
        audienceAr: body.audienceAr?.trim() || 'للمستخدمين المتقدمين',
        audienceEn: body.audienceEn?.trim() || 'For scaling operations',
        monthlySar,
        monthlyUsd,
        quarterlySar: Number(body.quarterlySar) >= 0 ? Number(body.quarterlySar) : monthlySar * 3,
        quarterlyUsd: Number(body.quarterlyUsd) >= 0 ? Number(body.quarterlyUsd) : monthlyUsd * 3,
        yearlySar: Number(body.yearlySar) >= 0 ? Number(body.yearlySar) : monthlySar * 12,
        yearlyUsd: Number(body.yearlyUsd) >= 0 ? Number(body.yearlyUsd) : monthlyUsd * 12,
        maxActiveItems: Math.max(1, Number(body.maxActiveItems) || 50),
        maxContactMethods: Math.max(1, Math.min(7, Number(body.maxContactMethods) || 5)),
        maxTemplateCopies: Math.max(1, Number(body.maxTemplateCopies) || 25),
        includedTemplatesScope: body.includedTemplatesScope || 'all_templates',
        allowCustomBranding: body.allowCustomBranding !== false,
        allowSvgExport: body.allowSvgExport !== false,
        featured: Boolean(body.featured),
        accentHex: body.accentHex || '#2563EB',
        isActive: body.isActive !== false,
        featuresAr: Array.isArray(body.featuresAr) ? body.featuresAr : [],
        featuresEn: Array.isArray(body.featuresEn) ? body.featuresEn : [],
        updatedAt: new Date().toISOString(),
      };
      db.plans[id] = created;
      const actor = req.user!;
      recordAuditLog({
        actor,
        actorRole: resolveUserAuthority(actor).role,
        action: 'ADMIN_PLAN_CREATED',
        targetType: 'plan',
        targetId: id,
        summaryAr: `إنشاء باقة جديدة: ${created.nameAr}`,
        summaryEn: `Created new plan: ${created.nameEn}`,
        afterSnapshot: created,
        ip: req.ip || 'local',
      });
      saveDatabase();
      res.status(201).json({ ok: true, plan: created });
    }
  );

  app.patch(
    '/api/admin/plans/:id',
    requireAdmin('plans'),
    requireReauth,
    (req: AuthenticatedServerRequest, res: Response) => {
      const existing = db.plans[req.params.id];
      if (!existing) {
        res.status(404).json({ ok: false, errorCode: 'PLAN_NOT_FOUND' });
        return;
      }
      const body = (req.body || {}) as Record<string, unknown>;
      const updated: ManagedPlanDefinition = {
        ...existing,
        nameAr: typeof body.nameAr === 'string' && body.nameAr.trim() ? body.nameAr.trim().slice(0, 120) : existing.nameAr,
        nameEn: typeof body.nameEn === 'string' && body.nameEn.trim() ? body.nameEn.trim().slice(0, 120) : existing.nameEn,
        audienceAr: typeof body.audienceAr === 'string' ? body.audienceAr.trim().slice(0, 200) : existing.audienceAr,
        audienceEn: typeof body.audienceEn === 'string' ? body.audienceEn.trim().slice(0, 200) : existing.audienceEn,
        monthlySar: typeof body.monthlySar === 'number' && Number.isFinite(body.monthlySar) ? Math.max(0, body.monthlySar) : existing.monthlySar,
        monthlyUsd: typeof body.monthlyUsd === 'number' && Number.isFinite(body.monthlyUsd) ? Math.max(0, body.monthlyUsd) : existing.monthlyUsd,
        quarterlySar: typeof body.quarterlySar === 'number' && Number.isFinite(body.quarterlySar) ? Math.max(0, body.quarterlySar) : existing.quarterlySar,
        quarterlyUsd: typeof body.quarterlyUsd === 'number' && Number.isFinite(body.quarterlyUsd) ? Math.max(0, body.quarterlyUsd) : existing.quarterlyUsd,
        yearlySar: typeof body.yearlySar === 'number' && Number.isFinite(body.yearlySar) ? Math.max(0, body.yearlySar) : existing.yearlySar,
        yearlyUsd: typeof body.yearlyUsd === 'number' && Number.isFinite(body.yearlyUsd) ? Math.max(0, body.yearlyUsd) : existing.yearlyUsd,
        maxActiveItems: typeof body.maxActiveItems === 'number' && Number.isFinite(body.maxActiveItems) ? Math.max(1, Math.min(100000, Math.floor(body.maxActiveItems))) : existing.maxActiveItems,
        maxContactMethods: typeof body.maxContactMethods === 'number' && Number.isFinite(body.maxContactMethods) ? Math.max(1, Math.min(7, Math.floor(body.maxContactMethods))) : existing.maxContactMethods,
        maxTemplateCopies: typeof body.maxTemplateCopies === 'number' && Number.isFinite(body.maxTemplateCopies) ? Math.max(1, Math.min(10000, Math.floor(body.maxTemplateCopies))) : existing.maxTemplateCopies,
        includedTemplatesScope:
          body.includedTemplatesScope === 'free_only' ||
          body.includedTemplatesScope === 'plus_and_free' ||
          body.includedTemplatesScope === 'all_general' ||
          body.includedTemplatesScope === 'all_templates'
            ? body.includedTemplatesScope
            : existing.includedTemplatesScope,
        allowCustomBranding: typeof body.allowCustomBranding === 'boolean' ? body.allowCustomBranding : existing.allowCustomBranding,
        allowSvgExport: typeof body.allowSvgExport === 'boolean' ? body.allowSvgExport : existing.allowSvgExport,
        featured: typeof body.featured === 'boolean' ? body.featured : existing.featured,
        accentHex: typeof body.accentHex === 'string' && /^#[0-9a-fA-F]{6}$/.test(body.accentHex.trim()) ? body.accentHex.trim() : existing.accentHex,
        isActive: typeof body.isActive === 'boolean' ? body.isActive : existing.isActive,
        featuresAr: Array.isArray(body.featuresAr) ? body.featuresAr.filter((x): x is string => typeof x === 'string').slice(0, 20) : existing.featuresAr,
        featuresEn: Array.isArray(body.featuresEn) ? body.featuresEn.filter((x): x is string => typeof x === 'string').slice(0, 20) : existing.featuresEn,
        id: existing.id,
        quotaTier: existing.quotaTier,
        updatedAt: new Date().toISOString(),
      };
      db.plans[existing.id] = updated;

      // Propagate updated limits to existing users on this tier
      for (const userRec of Object.values(db.users)) {
        if (userRec.profile.plan === updated.quotaTier) {
          userRec.profile.activeItemsLimit = updated.maxActiveItems;
          userRec.profile.contactMethodsLimit = updated.maxContactMethods;
        }
      }

      const actor = req.user!;
      recordAuditLog({
        actor,
        actorRole: resolveUserAuthority(actor).role,
        action: 'ADMIN_PLAN_UPDATED',
        targetType: 'plan',
        targetId: existing.id,
        summaryAr: `تحديث إعدادات وحدود الباقة (${updated.nameAr}): ${updated.maxActiveItems} أغراض / ${updated.maxContactMethods} قنوات`,
        summaryEn: `Updated plan (${updated.nameEn}): ${updated.maxActiveItems} items / ${updated.maxContactMethods} channels`,
        beforeSnapshot: existing,
        afterSnapshot: updated,
        ip: req.ip || 'local',
      });
      saveDatabase();
      res.json({ ok: true, plan: updated });
    }
  );

  // ===========================================================================
  // D. 7. FINANCE, MANUAL PAYMENTS & ORDER REVIEW
  // ===========================================================================
  app.get('/api/admin/orders', requireAdmin('finance'), (_req: AuthenticatedServerRequest, res: Response) => {
    const orders = Object.values(db.orders).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    res.json({ ok: true, orders });
  });

  app.post(
    '/api/admin/orders/:id/review',
    requireAdmin('finance'),
    requireReauth,
    (req: AuthenticatedServerRequest, res: Response) => {
      const order = db.orders[req.params.id];
      if (!order) {
        res.status(404).json({ ok: false, errorCode: 'ORDER_NOT_FOUND' });
        return;
      }

      const body = (req.body || {}) as {
        decision?: 'approve' | 'reject' | 'refund';
        reason?: string;
      };
      const decision = body.decision;
      const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 400) : '';

      if (decision !== 'approve' && decision !== 'reject' && decision !== 'refund') {
        res.status(400).json({ ok: false, errorCode: 'INVALID_REVIEW_DECISION' });
        return;
      }

      const actor = req.user!;
      const actorAuth = resolveUserAuthority(actor);
      const nowIso = new Date().toISOString();
      const beforeStatus = order.status;

      if (decision === 'approve') {
        if (order.status !== 'pending_review') {
          res.status(400).json({
            ok: false,
            errorCode: 'ORDER_NOT_PENDING_REVIEW',
            messageAr: 'لا يمكن اعتماد إلا الطلبات التي في حالة انتظار المراجعة.',
            messageEn: 'Only pending_review orders can be approved.',
          });
          return;
        }
        order.status = 'approved';
        order.reviewedByUid = actor.uid;
        order.reviewedByEmail = actor.email;
        order.reviewedAt = nowIso;
        order.decisionReason = reason || 'Verified manual payment receipt';
        order.updatedAt = nowIso;

        if (order.couponCode) {
          const cp = Object.values(db.coupons).find(
            (c) => c.code.toUpperCase() === order.couponCode!.toUpperCase()
          );
          if (cp) cp.usedCount += 1;
        }

        if (order.orderType === 'template_purchase') {
          const tpl = db.templates[order.targetId];
          if (tpl) {
            tpl.salesCount = (tpl.salesCount || 0) + 1;
            issueLicenseForApprovedOrder(order, tpl);
          }
        } else if (order.orderType === 'subscription_upgrade') {
          const plan = db.plans[order.targetId];
          if (plan) {
            applyApprovedSubscriptionOrder(order, plan);
          }
        }

        recordUserNotification(
          order.userId,
          'system_architecture',
          'info',
          `تم تأكيد الدفع للطلب ${order.orderNumber}`,
          `Payment Approved for Order ${order.orderNumber}`,
          `تمت مراجعة الدفع والموافقة عليه وتفعيل ${order.titleAr}.`,
          `Payment verified and activated: ${order.titleEn}.`
        );
      } else if (decision === 'reject') {
        order.status = 'rejected';
        order.reviewedByUid = actor.uid;
        order.reviewedByEmail = actor.email;
        order.reviewedAt = nowIso;
        order.decisionReason = reason || 'Payment verification failed';
        order.updatedAt = nowIso;

        recordUserNotification(
          order.userId,
          'security_notice',
          'warning',
          `لم يتم قبول إثبات الدفع للطلب ${order.orderNumber}`,
          `Payment Rejected for Order ${order.orderNumber}`,
          `السبب: ${order.decisionReason}`,
          `Reason: ${order.decisionReason}`
        );
      } else if (decision === 'refund') {
        if (order.status !== 'approved') {
          res.status(400).json({ ok: false, errorCode: 'CAN_ONLY_REFUND_APPROVED' });
          return;
        }
        order.status = 'refunded';
        order.refundedAt = nowIso;
        order.refundReason = reason || 'Admin approved refund';
        order.reviewedByUid = actor.uid;
        order.reviewedByEmail = actor.email;
        order.updatedAt = nowIso;

        if (order.issuedLicenseId && db.issuedLicenses[order.issuedLicenseId]) {
          db.issuedLicenses[order.issuedLicenseId].status = 'revoked';
        }
        let cancelledSubscription = false;
        for (const sub of Object.values(db.subscriptions)) {
          if (sub.orderId === order.id) {
            sub.status = 'cancelled';
            sub.updatedAt = nowIso;
            cancelledSubscription = true;
          }
        }
        if (cancelledSubscription || order.orderType === 'subscription_upgrade') {
          const targetUser = db.users[order.userId];
          if (targetUser) {
            const nowMs = Date.now();
            const remainingActiveSubs = Object.values(db.subscriptions)
              .filter(
                (s) =>
                  s.userId === targetUser.uid &&
                  s.status === 'active' &&
                  (!s.expiresAt || Date.parse(s.expiresAt) > nowMs)
              )
              .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
            if (remainingActiveSubs.length > 0) {
              const latestPlan = db.plans[remainingActiveSubs[0].planId];
              targetUser.profile.plan = latestPlan ? latestPlan.quotaTier : 'Free';
            } else {
              targetUser.profile.plan = 'Free';
            }
            enforceAuthoritativePlanLimits(targetUser);
          }
        }
      }

      recordAuditLog({
        actor,
        actorRole: actorAuth.role,
        action: `ADMIN_ORDER_${decision.toUpperCase()}`,
        targetType: 'order',
        targetId: order.id,
        summaryAr: `مراجعة الطلب ${order.orderNumber}: ${beforeStatus} ← ${order.status} (${reason || '—'})`,
        summaryEn: `Reviewed order ${order.orderNumber}: ${beforeStatus} -> ${order.status}`,
        beforeSnapshot: { status: beforeStatus },
        afterSnapshot: { status: order.status, reason: order.decisionReason || order.refundReason },
        ip: req.ip || 'local',
      });

      saveDatabase();
      res.json({ ok: true, order });
    }
  );

  // ===========================================================================
  // D. 8. NOTIFICATIONS, ANNOUNCEMENTS, COUPONS & CAMPAIGNS
  // ===========================================================================
  app.get('/api/admin/marketing', requireAdmin('marketing'), (_req: AuthenticatedServerRequest, res: Response) => {
    res.json({
      ok: true,
      announcements: Object.values(db.announcements).sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt)
      ),
      coupons: Object.values(db.coupons).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      campaigns: Object.values(db.campaigns).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    });
  });

  app.post('/api/admin/announcements', requireAdmin('marketing'), (req: AuthenticatedServerRequest, res: Response) => {
    const body = (req.body || {}) as Partial<AnnouncementBanner>;
    const id = `ann-${crypto.randomBytes(4).toString('hex')}`;
    const created: AnnouncementBanner = {
      id,
      titleAr: body.titleAr?.trim() || 'إعلان إداري',
      titleEn: body.titleEn?.trim() || 'Platform Announcement',
      bodyAr: body.bodyAr?.trim() || '',
      bodyEn: body.bodyEn?.trim() || '',
      targetAudience: body.targetAudience || 'all',
      severity: body.severity || 'info',
      isActive: body.isActive !== false,
      createdAt: new Date().toISOString(),
      createdByUid: req.user!.uid,
    };
    db.announcements[id] = created;
    saveDatabase();
    res.status(201).json({ ok: true, announcement: created });
  });

  app.patch('/api/admin/announcements/:id', requireAdmin('marketing'), (req: AuthenticatedServerRequest, res: Response) => {
    const existing = db.announcements[req.params.id];
    if (!existing) {
      res.status(404).json({ ok: false });
      return;
    }
    const body = (req.body || {}) as Record<string, unknown>;
    db.announcements[existing.id] = {
      ...existing,
      titleAr: typeof body.titleAr === 'string' && body.titleAr.trim() ? body.titleAr.trim().slice(0, 160) : existing.titleAr,
      titleEn: typeof body.titleEn === 'string' && body.titleEn.trim() ? body.titleEn.trim().slice(0, 160) : existing.titleEn,
      bodyAr: typeof body.bodyAr === 'string' ? body.bodyAr.trim().slice(0, 1000) : existing.bodyAr,
      bodyEn: typeof body.bodyEn === 'string' ? body.bodyEn.trim().slice(0, 1000) : existing.bodyEn,
      targetAudience:
        body.targetAudience === 'all' ||
        body.targetAudience === 'free_users' ||
        body.targetAudience === 'paid_users'
          ? body.targetAudience
          : existing.targetAudience,
      severity:
        body.severity === 'info' || body.severity === 'success' || body.severity === 'warning'
          ? body.severity
          : existing.severity,
      isActive: typeof body.isActive === 'boolean' ? body.isActive : existing.isActive,
      id: existing.id,
    };
    saveDatabase();
    res.json({ ok: true, announcement: db.announcements[existing.id] });
  });

  app.delete('/api/admin/announcements/:id', requireAdmin('marketing'), (req: AuthenticatedServerRequest, res: Response) => {
    delete db.announcements[req.params.id];
    saveDatabase();
    res.json({ ok: true });
  });

  app.post('/api/admin/coupons', requireAdmin('marketing'), (req: AuthenticatedServerRequest, res: Response) => {
    const body = (req.body || {}) as Partial<CouponCode>;
    const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : '';
    if (!code || code.length < 3) {
      res.status(400).json({ ok: false, errorCode: 'COUPON_CODE_REQUIRED' });
      return;
    }
    const id = `cp-${crypto.randomBytes(4).toString('hex')}`;
    const coupon: CouponCode = {
      id,
      code,
      discountType: body.discountType === 'fixed_sar' ? 'fixed_sar' : 'percent',
      discountValue: Math.max(1, Number(body.discountValue) || 10),
      maxUses: Math.max(0, Number(body.maxUses) || 100),
      usedCount: 0,
      appliesTo: body.appliesTo || 'all',
      expiresAt: body.expiresAt || null,
      isActive: body.isActive !== false,
      createdAt: new Date().toISOString(),
    };
    db.coupons[id] = coupon;
    saveDatabase();
    res.status(201).json({ ok: true, coupon });
  });

  app.patch('/api/admin/coupons/:id', requireAdmin('marketing'), (req: AuthenticatedServerRequest, res: Response) => {
    const existing = db.coupons[req.params.id];
    if (!existing) {
      res.status(404).json({ ok: false });
      return;
    }
    const body = (req.body || {}) as Record<string, unknown>;
    db.coupons[existing.id] = {
      ...existing,
      code: typeof body.code === 'string' && body.code.trim().length >= 3 ? body.code.trim().toUpperCase().slice(0, 40) : existing.code,
      discountType: body.discountType === 'fixed_sar' || body.discountType === 'percent' ? body.discountType : existing.discountType,
      discountValue: typeof body.discountValue === 'number' && Number.isFinite(body.discountValue) ? Math.max(1, body.discountValue) : existing.discountValue,
      maxUses: typeof body.maxUses === 'number' && Number.isFinite(body.maxUses) ? Math.max(0, Math.floor(body.maxUses)) : existing.maxUses,
      appliesTo: body.appliesTo === 'all' || body.appliesTo === 'templates' || body.appliesTo === 'plans' ? body.appliesTo : existing.appliesTo,
      expiresAt: body.expiresAt === null ? null : typeof body.expiresAt === 'string' ? body.expiresAt : existing.expiresAt,
      isActive: typeof body.isActive === 'boolean' ? body.isActive : existing.isActive,
      id: existing.id,
    };
    saveDatabase();
    res.json({ ok: true, coupon: db.coupons[existing.id] });
  });

  app.post('/api/admin/campaigns/send', requireAdmin('marketing'), (req: AuthenticatedServerRequest, res: Response) => {
    const body = (req.body || {}) as Partial<MarketingCampaign>;
    const titleAr = body.titleAr?.trim() || 'إشعار إداري من FindIt QR';
    const titleEn = body.titleEn?.trim() || 'FindIt QR Admin Notice';
    const messageAr = body.messageAr?.trim() || '';
    const messageEn = body.messageEn?.trim() || messageAr;
    if (!messageAr && !messageEn) {
      res.status(400).json({ ok: false, errorCode: 'MESSAGE_REQUIRED' });
      return;
    }

    const audience = body.targetAudience || 'all';
    const recipients = Object.values(db.users).filter((u) => {
      if (audience === 'free_users') return u.profile.plan === 'Free' || u.profile.plan === 'Starter';
      if (audience === 'paid_users') return u.profile.plan !== 'Free' && u.profile.plan !== 'Starter';
      if (audience === 'specific_user') return u.uid === body.targetUid || u.email === body.targetUid;
      return true;
    });

    for (const u of recipients) {
      recordUserNotification(
        u.uid,
        'system_architecture',
        'info',
        titleAr,
        titleEn,
        messageAr || messageEn,
        messageEn || messageAr
      );
    }

    const nowIso = new Date().toISOString();
    const id = `cmp-${crypto.randomBytes(4).toString('hex')}`;
    const campaign: MarketingCampaign = {
      id,
      titleAr,
      titleEn,
      channel: 'in_app_notification',
      targetAudience: audience,
      targetUid: body.targetUid,
      messageAr,
      messageEn,
      status: 'sent',
      sentCount: recipients.length,
      sentAt: nowIso,
      createdAt: nowIso,
      createdByEmail: req.user!.email,
    };
    db.campaigns[id] = campaign;
    recordAuditLog({
      actor: req.user!,
      actorRole: resolveUserAuthority(req.user!).role,
      action: 'ADMIN_CAMPAIGN_SENT',
      targetType: 'marketing',
      targetId: id,
      summaryAr: `إرسال إشعار داخلي إلى ${recipients.length} مستخدم (${titleAr})`,
      summaryEn: `Delivered in-app broadcast to ${recipients.length} users (${titleEn})`,
      ip: req.ip || 'local',
    });
    saveDatabase();
    res.status(201).json({ ok: true, campaign });
  });

  // ===========================================================================
  // D. 9. CUSTOMER SUPPORT & TICKETS
  // ===========================================================================
  app.get('/api/admin/support', requireAdmin('support'), (_req: AuthenticatedServerRequest, res: Response) => {
    const tickets = Object.values(db.supportTickets).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    );
    res.json({ ok: true, tickets });
  });

  app.patch('/api/admin/support/:id', requireAdmin('support'), (req: AuthenticatedServerRequest, res: Response) => {
    const ticket = db.supportTickets[req.params.id];
    if (!ticket) {
      res.status(404).json({ ok: false, errorCode: 'TICKET_NOT_FOUND' });
      return;
    }
    const body = (req.body || {}) as Partial<SupportTicket> & {
      replyMessage?: string;
      isInternalNote?: boolean;
    };
    const nowIso = new Date().toISOString();
    if (body.status) {
      ticket.status = body.status;
      if (body.status === 'closed' || body.status === 'resolved') {
        ticket.closedAt = nowIso;
      }
    }
    if (body.priority) ticket.priority = body.priority;
    if (body.category) ticket.category = body.category;
    if (typeof body.assignedToEmail === 'string') {
      ticket.assignedToEmail = body.assignedToEmail;
    }
    if (typeof body.replyMessage === 'string' && body.replyMessage.trim()) {
      ticket.replies.push({
        id: `rep-${crypto.randomBytes(4).toString('hex')}`,
        authorUid: req.user!.uid,
        authorName: req.user!.profile.displayName,
        authorRole: 'admin',
        message: body.replyMessage.trim(),
        isInternalNote: Boolean(body.isInternalNote),
        createdAt: nowIso,
      });
    }
    ticket.updatedAt = nowIso;
    saveDatabase();
    res.json({ ok: true, ticket });
  });

  // ===========================================================================
  // D. 10. REPORTS & CSV EXPORTS
  // ===========================================================================
  app.get('/api/admin/reports', requireAdmin('reports'), (req: AuthenticatedServerRequest, res: Response) => {
    const p = req.query.period;
    const period: '7d' | '30d' | '90d' | 'all' =
      p === '7d' || p === '30d' || p === '90d' ? p : 'all';

    const analytics = computeAdminDashboardAnalytics({
      period,
      users: Object.values(db.users).map((u) => ({
        uid: u.uid,
        plan: u.profile.plan,
        accountStatus: u.profile.accountStatus,
        createdAt: u.profile.createdAt,
      })),
      items: Object.values(db.items),
      templates: Object.values(db.templates),
      orders: Object.values(db.orders),
      subscriptions: Object.values(db.subscriptions),
      tickets: Object.values(db.supportTickets),
      auditLogs: Object.values(db.auditLogs),
      activities: Object.values(db.activities),
    });

    res.json({ ok: true, analytics });
  });

  app.get('/api/admin/reports/export.csv', requireAdmin('reports'), (req: AuthenticatedServerRequest, res: Response) => {
    const scope = req.query.scope === 'users' ? 'users' : 'orders';
    let csv = '';
    if (scope === 'users') {
      csv = buildCsvString(
        ['UID', 'Email', 'Name', 'Plan', 'Status', 'ActiveItems', 'CreatedAt'],
        Object.values(db.users).map((u) => [
          u.uid,
          u.email,
          u.profile.displayName,
          u.profile.plan,
          u.profile.accountStatus,
          u.profile.activeItemsCount,
          u.profile.createdAt,
        ])
      );
    } else {
      csv = buildCsvString(
        ['OrderNumber', 'UserEmail', 'Type', 'Title', 'AmountSAR', 'AmountUSD', 'Status', 'CreatedAt'],
        Object.values(db.orders).map((o) => [
          o.orderNumber,
          o.userEmail,
          o.orderType,
          o.titleEn,
          o.amountSar,
          o.amountUsd,
          o.status,
          o.createdAt,
        ])
      );
    }
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="finditqr-${scope}-report.csv"`);
    res.send(csv);
  });

  // ===========================================================================
  // D. 11. PLATFORM SETTINGS CENTER
  // ===========================================================================
  app.get('/api/admin/settings', requireAdmin('settings'), (_req: AuthenticatedServerRequest, res: Response) => {
    res.json({ ok: true, settings: db.platformSettings });
  });

  app.patch(
    '/api/admin/settings',
    requireAdmin('settings'),
    requireReauth,
    (req: AuthenticatedServerRequest, res: Response) => {
      const body = (req.body || {}) as Record<string, unknown>;
      const before = {
        defaultCurrency: db.platformSettings.defaultCurrency,
        maintenanceMode: db.platformSettings.maintenanceMode,
        enablePublicRegistration: db.platformSettings.enablePublicRegistration,
      };
      const cur = db.platformSettings;
      db.platformSettings = {
        ...cur,
        platformNameAr: typeof body.platformNameAr === 'string' && body.platformNameAr.trim() ? body.platformNameAr.trim().slice(0, 120) : cur.platformNameAr,
        platformNameEn: typeof body.platformNameEn === 'string' && body.platformNameEn.trim() ? body.platformNameEn.trim().slice(0, 120) : cur.platformNameEn,
        slogan: typeof body.slogan === 'string' ? body.slogan.trim().slice(0, 200) : cur.slogan,
        primaryColorHex: typeof body.primaryColorHex === 'string' && /^#[0-9a-fA-F]{6}$/.test(body.primaryColorHex.trim()) ? body.primaryColorHex.trim() : cur.primaryColorHex,
        tealColorHex: typeof body.tealColorHex === 'string' && /^#[0-9a-fA-F]{6}$/.test(body.tealColorHex.trim()) ? body.tealColorHex.trim() : cur.tealColorHex,
        navyColorHex: typeof body.navyColorHex === 'string' && /^#[0-9a-fA-F]{6}$/.test(body.navyColorHex.trim()) ? body.navyColorHex.trim() : cur.navyColorHex,
        coralColorHex: typeof body.coralColorHex === 'string' && /^#[0-9a-fA-F]{6}$/.test(body.coralColorHex.trim()) ? body.coralColorHex.trim() : cur.coralColorHex,
        defaultLanguage: body.defaultLanguage === 'ar' || body.defaultLanguage === 'en' ? body.defaultLanguage : cur.defaultLanguage,
        enableArabic: typeof body.enableArabic === 'boolean' ? body.enableArabic : cur.enableArabic,
        enableEnglish: typeof body.enableEnglish === 'boolean' ? body.enableEnglish : cur.enableEnglish,
        defaultCurrency: body.defaultCurrency === 'SAR' || body.defaultCurrency === 'USD' ? body.defaultCurrency : cur.defaultCurrency,
        marketRegionAr: typeof body.marketRegionAr === 'string' ? body.marketRegionAr.trim().slice(0, 120) : cur.marketRegionAr,
        marketRegionEn: typeof body.marketRegionEn === 'string' ? body.marketRegionEn.trim().slice(0, 120) : cur.marketRegionEn,
        supportEmail: typeof body.supportEmail === 'string' && body.supportEmail.includes('@') ? body.supportEmail.trim().slice(0, 120) : cur.supportEmail,
        supportPhone: typeof body.supportPhone === 'string' ? body.supportPhone.trim().slice(0, 40) : cur.supportPhone,
        reportProblemUrl: typeof body.reportProblemUrl === 'string' ? body.reportProblemUrl.trim().slice(0, 300) : cur.reportProblemUrl,
        bankTransferInstructionsAr: typeof body.bankTransferInstructionsAr === 'string' ? body.bankTransferInstructionsAr.trim().slice(0, 1500) : cur.bankTransferInstructionsAr,
        bankTransferInstructionsEn: typeof body.bankTransferInstructionsEn === 'string' ? body.bankTransferInstructionsEn.trim().slice(0, 1500) : cur.bankTransferInstructionsEn,
        enablePublicRegistration: typeof body.enablePublicRegistration === 'boolean' ? body.enablePublicRegistration : cur.enablePublicRegistration,
        enableDesignStore: typeof body.enableDesignStore === 'boolean' ? body.enableDesignStore : cur.enableDesignStore,
        enableManualBankTransfer: typeof body.enableManualBankTransfer === 'boolean' ? body.enableManualBankTransfer : cur.enableManualBankTransfer,
        enableZipTemplateImport: typeof body.enableZipTemplateImport === 'boolean' ? body.enableZipTemplateImport : cur.enableZipTemplateImport,
        enableTemplateFavorites: typeof body.enableTemplateFavorites === 'boolean' ? body.enableTemplateFavorites : cur.enableTemplateFavorites,
        enableReportProblemButton: typeof body.enableReportProblemButton === 'boolean' ? body.enableReportProblemButton : cur.enableReportProblemButton,
        maintenanceMode: typeof body.maintenanceMode === 'boolean' ? body.maintenanceMode : cur.maintenanceMode,
        sessionTtlHours: typeof body.sessionTtlHours === 'number' && Number.isFinite(body.sessionTtlHours) ? Math.max(1, Math.min(720, Math.floor(body.sessionTtlHours))) : cur.sessionTtlHours,
        reauthWindowMinutes: typeof body.reauthWindowMinutes === 'number' && Number.isFinite(body.reauthWindowMinutes) ? Math.max(5, Math.min(120, Math.floor(body.reauthWindowMinutes))) : cur.reauthWindowMinutes,
        maxLoginAttemptsPerWindow: typeof body.maxLoginAttemptsPerWindow === 'number' && Number.isFinite(body.maxLoginAttemptsPerWindow) ? Math.max(3, Math.min(50, Math.floor(body.maxLoginAttemptsPerWindow))) : cur.maxLoginAttemptsPerWindow,
        updatedAt: new Date().toISOString(),
      };
      const actor = req.user!;
      recordAuditLog({
        actor,
        actorRole: resolveUserAuthority(actor).role,
        action: 'ADMIN_PLATFORM_SETTINGS_UPDATED',
        targetType: 'settings',
        targetId: 'platformSettings',
        summaryAr: `تحديث إعدادات المنصة العامة والعملة (${db.platformSettings.defaultCurrency})`,
        summaryEn: `Updated platform settings (currency: ${db.platformSettings.defaultCurrency})`,
        beforeSnapshot: before,
        afterSnapshot: {
          defaultCurrency: db.platformSettings.defaultCurrency,
          maintenanceMode: db.platformSettings.maintenanceMode,
          enablePublicRegistration: db.platformSettings.enablePublicRegistration,
        },
        ip: req.ip || 'local',
      });
      saveDatabase();
      res.json({ ok: true, settings: db.platformSettings });
    }
  );

  // ===========================================================================
  // D. 12. SECURITY, STAFF RBAC, SESSIONS & IMMUTABLE AUDIT LOGS
  // ===========================================================================
  app.get('/api/admin/security', requireAdmin('security'), (_req: AuthenticatedServerRequest, res: Response) => {
    const sessions: AdminSessionSummary[] = Object.entries(db.sessions).map(([tokenHash, s]) => {
      const u = db.users[s.uid];
      const auth = u ? resolveUserAuthority(u) : { role: 'user' as UserRole, permissions: [] };
      return {
        tokenHash,
        tokenHashPrefix: tokenHash.slice(0, 12),
        uid: s.uid,
        email: u?.email || 'unknown',
        role: auth.role,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
        lastUsedAt: s.lastUsedAt,
        adminVerifiedUntil: s.adminVerifiedUntil || null,
      };
    });

    const staffAndAdmins = Object.values(db.users)
      .map((u) => {
        const auth = resolveUserAuthority(u);
        return {
          uid: u.uid,
          email: u.email,
          displayName: u.profile.displayName,
          role: auth.role,
          adminPermissions: auth.permissions,
          accountStatus: u.profile.accountStatus,
        };
      })
      .filter((u) => u.role === 'super_admin' || u.role === 'staff_admin');

    const qrItems = Object.values(db.items);
    const qrIntegritySummary = {
      totalItems: qrItems.length,
      individualModeCount: qrItems.filter((i) => !i.qrMode || i.qrMode === 'individual').length,
      sharedModeCount: qrItems.filter((i) => i.qrMode === 'shared').length,
      unassignedModeCount: qrItems.filter((i) => i.qrMode === 'unassigned').length,
      sharedGroupsCount: Object.keys(db.sharedQrGroups || {}).length,
    };

    res.json({
      ok: true,
      staffAndAdmins,
      sessions,
      qrIntegritySummary,
      loginLogs: db.loginLogs.slice(0, 150),
      securityEvents: db.securityEvents.slice(0, 150),
      auditLogs: Object.values(db.auditLogs)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 200),
    });
  });

  app.post(
    '/api/admin/staff',
    requireAdmin('security'),
    requireReauth,
    (req: AuthenticatedServerRequest, res: Response) => {
      const actor = req.user!;
      const actorAuth = resolveUserAuthority(actor);
      if (actorAuth.role !== 'super_admin') {
        res.status(403).json({
          ok: false,
          errorCode: 'SUPER_ADMIN_ONLY_RBAC',
          messageAr: 'المدير الرئيسي فقط يملك صلاحية تعيين أو تعديل صلاحيات الموظفين.',
          messageEn: 'Only the Super Admin can assign or modify staff permissions.',
        });
        return;
      }

      const body = (req.body || {}) as {
        email?: string;
        role?: 'staff_admin' | 'user';
        permissions?: AdminPermissionKey[];
      };
      const email = normalizeConfiguredAdminEmail(body.email);
      const target = Object.values(db.users).find((u) => u.email === email);
      if (!target) {
        res.status(404).json({
          ok: false,
          errorCode: 'USER_NOT_FOUND',
          messageAr: 'لا يوجد حساب مسجل بهذا البريد الإلكتروني.',
          messageEn: 'No registered user found with this email.',
        });
        return;
      }

      if (isSuperAdminEmailMatch(target.email, configuredAdminEmail)) {
        res.status(403).json({
          ok: false,
          errorCode: 'CANNOT_MODIFY_SUPER_ADMIN',
          messageAr: 'لا يمكن تعديل أو خفض صلاحية حساب المدير الرئيسي.',
          messageEn: 'Super Admin role and permissions cannot be modified.',
        });
        return;
      }

      const validSet = new Set<AdminPermissionKey>(ALL_ADMIN_PERMISSIONS);
      const nextRole = body.role === 'user' ? 'user' : 'staff_admin';
      const nextPerms =
        nextRole === 'user'
          ? []
          : (body.permissions || []).filter((p) => validSet.has(p));

      const before = {
        role: target.profile.role || 'user',
        permissions: target.profile.adminPermissions || [],
      };
      target.profile.role = nextRole;
      target.profile.adminPermissions = nextPerms;
      target.profile.updatedAt = new Date().toISOString();

      recordAuditLog({
        actor,
        actorRole: actorAuth.role,
        action: 'ADMIN_STAFF_RBAC_UPDATED',
        targetType: 'security',
        targetId: target.uid,
        summaryAr: `تحديث صلاحيات الموظف (${target.email}): الدور=${nextRole} (${nextPerms.length} صلاحيات)`,
        summaryEn: `Updated staff RBAC (${target.email}): role=${nextRole}`,
        beforeSnapshot: before,
        afterSnapshot: { role: nextRole, permissions: nextPerms },
        ip: req.ip || 'local',
      });

      saveDatabase();
      res.json({
        ok: true,
        staff: {
          uid: target.uid,
          email: target.email,
          displayName: target.profile.displayName,
          role: nextRole,
          adminPermissions: nextPerms,
        },
      });
    }
  );

  app.delete(
    '/api/admin/sessions/:tokenHash',
    requireAdmin('security'),
    requireReauth,
    (req: AuthenticatedServerRequest, res: Response) => {
      const targetHash = req.params.tokenHash;
      if (!db.sessions[targetHash]) {
        res.status(404).json({ ok: false, errorCode: 'SESSION_NOT_FOUND' });
        return;
      }
      const victimUid = db.sessions[targetHash].uid;
      delete db.sessions[targetHash];
      recordAuditLog({
        actor: req.user!,
        actorRole: resolveUserAuthority(req.user!).role,
        action: 'ADMIN_SESSION_REVOKED',
        targetType: 'security',
        targetId: targetHash.slice(0, 12),
        summaryAr: `إنهاء جلسة مستخدم نشطة (${victimUid}) عن بُعد.`,
        summaryEn: `Revoked active session for user ${victimUid}.`,
        ip: req.ip || 'local',
      });
      saveDatabase();
      res.json({ ok: true });
    }
  );
}
