import {
  ActivityLogEntry,
  FinderMessageEntry,
  ItemGroup,
  RegisteredItem,
  SharedQrGroup,
} from '../types/domain';

export type AnalyticsTimeframe = '7d' | '30d' | '90d' | 'all';

export interface WorkspaceAnalyticsSummary {
  timeframe: AnalyticsTimeframe;
  totalIndividualScans: number;
  totalSharedGroupScans: number;
  totalCombinedScans: number;
  recoveryPageEventsInPeriod: number;
  finderMessagesInPeriod: number;
  foundReportsInPeriod: number;
  activeItemsCount: number;
  lostItemsCount: number;
  recoveredItemsCount: number;
  topItems: Array<{
    id: string;
    name: string;
    codeSerial: string;
    category: string;
    status: string;
    scans: number;
    messagesCount: number;
    lastScanAt: string | null;
  }>;
  sharedGroupsPerformance: Array<{
    id: string;
    name: string;
    shareCode: string;
    isActive: boolean;
    linkedItemsCount: number;
    scans: number;
    lastScanAt: string | null;
  }>;
  orgGroupsBreakdown: Array<{
    id: string;
    name: string;
    colorHex: string;
    itemsCount: number;
    combinedScans: number;
  }>;
  coarseCityDistribution: Array<{
    city: string;
    itemsCount: number;
    scansCount: number;
  }>;
  dailyActivitySeries: Array<{
    date: string;
    eventsCount: number;
    messagesCount: number;
  }>;
}

function getCutoffTimestamp(timeframe: AnalyticsTimeframe, nowMs: number): number | null {
  if (timeframe === 'all') return null;
  const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
  return nowMs - days * 24 * 60 * 60 * 1000;
}

function isWithinTimeframe(iso: string | null | undefined, cutoffMs: number | null): boolean {
  if (cutoffMs === null) return true;
  if (!iso) return false;
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed)) return false;
  return parsed >= cutoffMs;
}

/**
 * Computes strictly real, privacy-safe analytics from actual account records.
 * Never fabricates scans, never exposes or invents GPS coordinates (coarse city only).
 */
export function computeWorkspaceAnalytics(params: {
  items: RegisteredItem[];
  groups: ItemGroup[];
  sharedQrGroups: SharedQrGroup[];
  messages: FinderMessageEntry[];
  activities: ActivityLogEntry[];
  timeframe: AnalyticsTimeframe;
  nowMs?: number;
}): WorkspaceAnalyticsSummary {
  const nowMs = params.nowMs ?? Date.now();
  const cutoffMs = getCutoffTimestamp(params.timeframe, nowMs);

  const messagesInPeriod = params.messages.filter((m) =>
    isWithinTimeframe(m.createdAt, cutoffMs)
  );
  const activitiesInPeriod = params.activities.filter((a) =>
    isWithinTimeframe(a.timestamp, cutoffMs)
  );

  const recoveryEventsInPeriod = activitiesInPeriod.filter(
    (a) =>
      a.actionType === 'qr_scan' ||
      a.actionType === 'finder_message' ||
      a.actionType === 'found_report'
  ).length;

  const foundReportsInPeriod = messagesInPeriod.filter(
    (m) => m.type === 'found_report'
  ).length;

  const totalIndividualScans = params.items.reduce(
    (sum, item) => sum + (Number(item.totalScans) || 0),
    0
  );
  const totalSharedGroupScans = params.sharedQrGroups.reduce(
    (sum, g) => sum + (Number(g.totalScans) || 0),
    0
  );

  const messagesByItem = new Map<string, number>();
  for (const m of messagesInPeriod) {
    messagesByItem.set(m.itemId, (messagesByItem.get(m.itemId) || 0) + 1);
  }

  const topItems = [...params.items]
    .map((item) => ({
      id: item.id,
      name: item.name || item.nameAr || item.nameEn,
      codeSerial: item.codeSerial,
      category: item.category,
      status: item.status,
      scans: Number(item.totalScans) || 0,
      messagesCount: messagesByItem.get(item.id) || 0,
      lastScanAt: item.lastScanAt || null,
    }))
    .sort((a, b) => b.scans - a.scans || b.messagesCount - a.messagesCount);

  const sharedGroupsPerformance = [...params.sharedQrGroups]
    .map((g) => ({
      id: g.id,
      name: g.name,
      shareCode: g.shareCode,
      isActive: g.isActive,
      linkedItemsCount: (g.items || []).length,
      scans: Number(g.totalScans) || 0,
      lastScanAt: g.lastScanAt || null,
    }))
    .sort((a, b) => b.scans - a.scans);

  const orgGroupsBreakdown = params.groups.map((g) => {
    const members = params.items.filter((i) => i.groupId === g.id);
    return {
      id: g.id,
      name: g.name,
      colorHex: g.colorHex,
      itemsCount: members.length,
      combinedScans: members.reduce((s, it) => s + (Number(it.totalScans) || 0), 0),
    };
  });

  // Privacy-safe coarse city aggregation ONLY from items where showCity is enabled
  const cityMap = new Map<string, { itemsCount: number; scansCount: number }>();
  for (const item of params.items) {
    if (item.privacySettings && item.privacySettings.showCity === false) continue;
    const city = (item.city || item.cityAr || item.cityEn || '').trim();
    if (!city) continue;
    const prev = cityMap.get(city) || { itemsCount: 0, scansCount: 0 };
    prev.itemsCount += 1;
    prev.scansCount += Number(item.totalScans) || 0;
    cityMap.set(city, prev);
  }
  const coarseCityDistribution = Array.from(cityMap.entries())
    .map(([city, stats]) => ({ city, ...stats }))
    .sort((a, b) => b.scansCount - a.scansCount || b.itemsCount - a.itemsCount);

  // Daily series from real activities + finder messages
  const dayMap = new Map<string, { eventsCount: number; messagesCount: number }>();
  for (const act of activitiesInPeriod) {
    const day = (act.timestamp || '').slice(0, 10);
    if (!day) continue;
    const entry = dayMap.get(day) || { eventsCount: 0, messagesCount: 0 };
    entry.eventsCount += 1;
    dayMap.set(day, entry);
  }
  for (const msg of messagesInPeriod) {
    const day = (msg.createdAt || '').slice(0, 10);
    if (!day) continue;
    const entry = dayMap.get(day) || { eventsCount: 0, messagesCount: 0 };
    entry.messagesCount += 1;
    dayMap.set(day, entry);
  }
  const dailyActivitySeries = Array.from(dayMap.entries())
    .map(([date, counts]) => ({ date, ...counts }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14);

  return {
    timeframe: params.timeframe,
    totalIndividualScans,
    totalSharedGroupScans,
    totalCombinedScans: totalIndividualScans + totalSharedGroupScans,
    recoveryPageEventsInPeriod: recoveryEventsInPeriod,
    finderMessagesInPeriod: messagesInPeriod.length,
    foundReportsInPeriod,
    activeItemsCount: params.items.filter((i) => i.status !== 'Archived').length,
    lostItemsCount: params.items.filter((i) => i.status === 'Lost').length,
    recoveredItemsCount: params.items.filter(
      (i) => i.status === 'Found' || i.status === 'Recovered'
    ).length,
    topItems,
    sharedGroupsPerformance,
    orgGroupsBreakdown,
    coarseCityDistribution,
    dailyActivitySeries,
  };
}

export function buildAnalyticsCsvReport(summary: WorkspaceAnalyticsSummary): string {
  const escape = (val: string | number | null | undefined) => {
    const str = String(val ?? '');
    if (/[",\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [
    ['Item Name', 'QR Serial', 'Category', 'Status', 'Total Scans', 'Messages In Period', 'Last Scan At'].join(','),
    ...summary.topItems.map((it) =>
      [
        escape(it.name),
        escape(it.codeSerial),
        escape(it.category),
        escape(it.status),
        escape(it.scans),
        escape(it.messagesCount),
        escape(it.lastScanAt || ''),
      ].join(',')
    ),
  ];

  return lines.join('\n');
}
