import {
  IndividualQrInactiveReason,
  ItemQrMode,
  QrRecord,
  RegisteredItem,
  SharedQrGroup,
} from '../types/domain';
import { resolveItemPrivacySettings } from './qrLogic';

export interface QrIntegrityIssue {
  code:
    | 'DUPLICATE_SHARED_MEMBERSHIP'
    | 'DANGLING_SHARED_LINK'
    | 'MODE_MISMATCH'
    | 'CROSS_OWNER_LINK';
  itemId?: string;
  groupId?: string;
  detail: string;
}

export interface ItemQrAvailability {
  active: boolean;
  qrMode: ItemQrMode;
  reason: IndividualQrInactiveReason | null;
}

/**
 * Resolves the authoritative QR mode for an item.
 * Defaults gracefully to 'individual' for legacy items created before qrMode existed.
 */
export function normalizeItemQrMode(item: Pick<RegisteredItem, 'qrMode' | 'sharedQrGroupId'>): ItemQrMode {
  if (item.qrMode === 'shared' || item.qrMode === 'unassigned' || item.qrMode === 'individual') {
    return item.qrMode;
  }
  if (item.sharedQrGroupId) {
    return 'shared';
  }
  return 'individual';
}

/**
 * Evaluates whether an item's INDIVIDUAL QR (/found/<codeSerial>) is publicly active.
 * Enforces the strict non-conflict invariant:
 * - An item in 'shared' mode NEVER has an active individual recovery page.
 * - An item in 'unassigned' mode (after its shared group was deleted) stays safely inactive
 *   until the owner explicitly restores its individual QR.
 * - Restricted, archived, or privacy-disabled items remain inactive.
 */
export function evaluateIndividualQrAvailability(
  item: RegisteredItem,
  qr?: Pick<QrRecord, 'isActive'>
): ItemQrAvailability {
  const qrMode = normalizeItemQrMode(item);

  if (item.moderationFlag === 'restricted') {
    return { active: false, qrMode, reason: 'restricted' };
  }
  if (item.status === 'Archived') {
    return { active: false, qrMode, reason: 'archived' };
  }
  if (qrMode === 'shared') {
    return {
      active: false,
      qrMode,
      reason: item.sharedQrGroupPaused ? 'shared_group_paused' : 'shared_mode',
    };
  }
  if (qrMode === 'unassigned') {
    return { active: false, qrMode, reason: 'unassigned_from_shared' };
  }

  const privacy = resolveItemPrivacySettings(item);
  const isQrActive = qr ? qr.isActive : true;
  if (!privacy.publicPageEnabled || !isQrActive) {
    return { active: false, qrMode, reason: 'public_disabled' };
  }

  return { active: true, qrMode, reason: null };
}

/**
 * Checks whether an item is already linked to another Shared QR Group.
 * Enforces that an item can belong to at most ONE Shared QR Group at a time
 * (preventing both immediate dual-active conflicts and future conflicts if a paused group resumes).
 */
export function findConflictingSharedGroup(
  itemId: string,
  sharedGroups: Iterable<SharedQrGroup>,
  excludeGroupId?: string
): SharedQrGroup | null {
  for (const group of sharedGroups) {
    if (excludeGroupId && group.id === excludeGroupId) continue;
    if ((group.items || []).some((entry) => entry.itemId === itemId)) {
      return group;
    }
  }
  return null;
}

/**
 * Hydrates an item with live shared-group status fields (non-destructive projection for API responses).
 */
export function decorateItemQrModeMetadata(
  item: RegisteredItem,
  sharedGroupsById: Record<string, SharedQrGroup>
): RegisteredItem {
  const mode = normalizeItemQrMode(item);
  if (mode === 'shared' && item.sharedQrGroupId) {
    const grp = sharedGroupsById[item.sharedQrGroupId];
    if (grp && grp.ownerUid === item.ownerUid) {
      return {
        ...item,
        qrMode: 'shared',
        sharedQrGroupId: grp.id,
        sharedQrGroupName: grp.name,
        sharedQrGroupPaused: !grp.isActive,
      };
    }
    // Group no longer exists -> treat as unassigned safely until owner restores individual QR
    return {
      ...item,
      qrMode: 'unassigned',
      sharedQrGroupId: null,
      sharedQrGroupName: null,
      sharedQrGroupPaused: false,
    };
  }

  return {
    ...item,
    qrMode: mode,
    sharedQrGroupId: mode === 'shared' ? item.sharedQrGroupId || null : null,
    sharedQrGroupName: mode === 'shared' ? item.sharedQrGroupName || null : null,
    sharedQrGroupPaused: mode === 'shared' ? Boolean(item.sharedQrGroupPaused) : false,
  };
}

/**
 * Non-destructive startup & runtime integrity scanner and safe metadata normalizer.
 * - NEVER deletes items or groups.
 * - Detects duplicate memberships, cross-owner links, dangling shared references, and mode mismatches.
 * - Safely aligns missing qrMode fields for legacy records where unambiguous.
 */
export function auditAndNormalizeQrIntegrity(
  items: Record<string, RegisteredItem>,
  sharedGroups: Record<string, SharedQrGroup>
): {
  issues: QrIntegrityIssue[];
  normalizedCount: number;
} {
  const issues: QrIntegrityIssue[] = [];
  let normalizedCount = 0;

  const membershipsByItem = new Map<string, SharedQrGroup[]>();

  for (const group of Object.values(sharedGroups)) {
    for (const entry of group.items || []) {
      const item = items[entry.itemId];
      if (!item) {
        issues.push({
          code: 'DANGLING_SHARED_LINK',
          itemId: entry.itemId,
          groupId: group.id,
          detail: `Shared group ${group.id} references missing item ${entry.itemId}`,
        });
        continue;
      }
      if (item.ownerUid !== group.ownerUid) {
        issues.push({
          code: 'CROSS_OWNER_LINK',
          itemId: item.id,
          groupId: group.id,
          detail: `Shared group ${group.id} (${group.ownerUid}) references item ${item.id} owned by ${item.ownerUid}`,
        });
        continue;
      }
      const list = membershipsByItem.get(item.id) || [];
      list.push(group);
      membershipsByItem.set(item.id, list);
    }
  }

  for (const [itemId, groups] of membershipsByItem.entries()) {
    if (groups.length > 1) {
      issues.push({
        code: 'DUPLICATE_SHARED_MEMBERSHIP',
        itemId,
        groupId: groups.map((g) => g.id).join(','),
        detail: `Item ${itemId} is listed in ${groups.length} shared QR groups simultaneously`,
      });
    }
    const primaryGroup = groups.find((g) => g.isActive) || groups[0];
    const item = items[itemId];
    if (
      item &&
      (item.qrMode !== 'shared' ||
        item.sharedQrGroupId !== primaryGroup.id ||
        item.sharedQrGroupName !== primaryGroup.name ||
        Boolean(item.sharedQrGroupPaused) !== !primaryGroup.isActive)
    ) {
      if (item.qrMode && item.qrMode !== 'shared') {
        issues.push({
          code: 'MODE_MISMATCH',
          itemId,
          groupId: primaryGroup.id,
          detail: `Item ${itemId} was in shared group ${primaryGroup.id} with qrMode=${item.qrMode}; aligned to 'shared'`,
        });
      }
      item.qrMode = 'shared';
      item.sharedQrGroupId = primaryGroup.id;
      item.sharedQrGroupName = primaryGroup.name;
      item.sharedQrGroupPaused = !primaryGroup.isActive;
      normalizedCount += 1;
    }
  }

  for (const item of Object.values(items)) {
    const groups = membershipsByItem.get(item.id) || [];
    if (groups.length === 0) {
      if (item.qrMode === 'shared' || item.sharedQrGroupId) {
        issues.push({
          code: 'DANGLING_SHARED_LINK',
          itemId: item.id,
          groupId: item.sharedQrGroupId || undefined,
          detail: `Item ${item.id} pointed to missing shared group ${item.sharedQrGroupId}; moved safely to 'unassigned'`,
        });
        item.qrMode = 'unassigned';
        item.sharedQrGroupId = null;
        item.sharedQrGroupName = null;
        item.sharedQrGroupPaused = false;
        normalizedCount += 1;
      } else if (!item.qrMode) {
        item.qrMode = 'individual';
        item.sharedQrGroupId = null;
        item.sharedQrGroupName = null;
        item.sharedQrGroupPaused = false;
        normalizedCount += 1;
      }
    }
  }

  return { issues, normalizedCount };
}
