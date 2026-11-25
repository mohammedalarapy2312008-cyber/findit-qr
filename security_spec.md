# FindIt QR — Phase 2 Security Specification (`security_spec.md`)

## 1. Data Invariants & Relationship Mapping

1. **Master Identity Ownership (`/users/{userId}`)**:
   - Every user profile document ID `{userId}` must strictly match `request.auth.uid` and `data.uid == userId`.
   - No authenticated or unauthenticated user can read (`get`, `list`) or write (`create`, `update`, `delete`) another user's `/users/{userId}` document (PII isolation).
   - Client-side profile creation must initialize `plan == 'Free'`, `accountStatus == 'active'`, `activeItemsCount == 0`, and `activeItemsLimit == 2`.
   - Clients can never escalate `plan`, `accountStatus`, or `activeItemsLimit` via `update`.

2. **Item Ownership & Lifecycle (`/items/{itemId}`)**:
   - Every item document must have `ownerUid == request.auth.uid` and `id == itemId`.
   - Only the item's `ownerUid` can `get`, `list`, `create`, `update`, or `delete` the item.
   - `allow list` on `/items/{itemId}` strictly enforces `resource.data.ownerUid == request.auth.uid` (no blanket `isSignedIn()` reads).
   - Allowed item statuses are strictly `['Active', 'Lost', 'Found', 'Recovered', 'Archived']`.
   - No raw base64/binary blobs are permitted in `imageUrl` (`imageUrl.size() <= 500`).

3. **Server-Enforced Free Plan Quota (Bi-Directional Atomic Invariant)**:
   - Non-archived items (`status in ['Active', 'Lost', 'Found', 'Recovered']`) consume 1 active quota slot; `'Archived'` items consume 0 active quota slots.
   - Creating a non-archived item, archiving an item, reactivating an archived item, or deleting a non-archived item MUST execute atomically in a batch alongside `/users/$(request.auth.uid)`:
     - `activeItemsCount` on `/users/$(request.auth.uid)` must remain within `0 <= activeItemsCount <= activeItemsLimit` (where `activeItemsLimit == 2` on the `Free` plan).
     - `/users/$(request.auth.uid)` can only increment `activeItemsCount` by `+1` if `lastQuotaItemId` transitions from non-existent/Archived to non-archived in the same batch (`getAfter`).
     - `/users/$(request.auth.uid)` can only decrement `activeItemsCount` by `-1` if `lastQuotaItemId` was previously non-archived and is either deleted (`!existsAfter`) or set to `'Archived'` (`getAfter`) in the same batch.

4. **User Activity Subcollection (`/users/{userId}/activities/{activityId}`)**:
   - Governed by the Master Gate: parent `/users/{userId}` must exist (`exists(...)`), and `userId == request.auth.uid`.
   - Activity logs are immutable once created (`allow update: if false;`).

---

## 2. The "Dirty Dozen" Adversarial Payloads

1. **Payload 1 (Identity Spoofing on Item Create)**: Authenticated user `uid_A` attempts to create `/items/item_1` with `ownerUid: "uid_B"`. -> **REJECTED** (`data.ownerUid == request.auth.uid` fails).
2. **Payload 2 (Cross-User Item Read/Update/Delete)**: Authenticated user `uid_A` attempts `get`, `update`, or `delete` on `/items/item_owned_by_B`. -> **REJECTED** (`existing().ownerUid == request.auth.uid` fails).
3. **Payload 3 (Unbounded Query Scraping on `/items`)**: Authenticated user `uid_A` runs `getDocs(collection(db, 'items'))` without `where('ownerUid', '==', 'uid_A')`. -> **REJECTED** (`allow list` requires `resource.data.ownerUid == request.auth.uid`).
4. **Payload 4 (Quota Bypass — Direct 3rd Active Item Creation)**: User `uid_A` (who already has `activeItemsCount == 2` and `activeItemsLimit == 2`) attempts to create a 3rd item with `status: "Active"`. -> **REJECTED** (`getAfter` quota check `activeItemsCount <= activeItemsLimit` fails).
5. **Payload 5 (Quota Bypass — Unpaired Item Create Without Updating User Counter)**: User `uid_A` attempts `setDoc(doc(db, 'items', 'item_3'), ...)` without updating `/users/uid_A` in the same batch. -> **REJECTED** (`getAfter(userDoc).data.activeItemsCount == get(userDoc).data.activeItemsCount + 1` fails).
6. **Payload 6 (Quota Forgery — Resetting `activeItemsCount` on User Doc)**: User `uid_A` sends `updateDoc(doc(db, 'users', 'uid_A'), { activeItemsCount: 0, lastQuotaItemId: 'fake' })` while their items are still active. -> **REJECTED** (`get(itemDoc)` / `getAfter(itemDoc)` state transition check fails).
7. **Payload 7 (Privilege Escalation — Self-Upgrading Plan or Limit)**: User `uid_A` sends `updateDoc(doc(db, 'users', 'uid_A'), { plan: 'Business', activeItemsLimit: 250 })`. -> **REJECTED** (`plan` and `activeItemsLimit` are immutable by client).
8. **Payload 8 (Shadow Field Injection)**: User `uid_A` updates `/items/item_1` including an undeclared field `{ isVerifiedAdmin: true }`. -> **REJECTED** (`hasOnly` key allowlist in `isValidItem` and `affectedKeys().hasOnly(...)` fails).
9. **Payload 9 (Denial of Wallet — 1MB Base64 Image or ID Poisoning)**: User `uid_A` sends a 500KB string in `imageUrl` or a 500-char poisoned ID. -> **REJECTED** (`isValidId` and `imageUrl.size() <= 500` fail).
10. **Payload 10 (Client Timestamp Forgery)**: User `uid_A` creates an item with a backdated `createdAt` instead of `serverTimestamp()`. -> **REJECTED** (`incoming().createdAt == request.time` fails).
11. **Payload 11 (Cross-User PII Profile Read)**: User `uid_A` attempts `getDoc(doc(db, 'users', 'uid_B'))`. -> **REJECTED** (`userId == request.auth.uid` fails).
12. **Payload 12 (Reactivating Archived Item When Quota Full)**: User `uid_A` (with 2 active items and 1 archived item) attempts to change the archived item's `status` from `'Archived'` to `'Active'`. -> **REJECTED** (requires `activeItemsCount + 1 <= activeItemsLimit`, which fails at `3 <= 2`).

---

## 3. Red Team Conflict & Audit Report

- **Shadow Update Test**: Passed. Every collection enforces strict `.keys().hasAll(...)` and `.keys().hasOnly(...)` in `isValidUserProfile`, `isValidItem`, and `isValidActivityLog`, plus `affectedKeys().hasOnly(...)` on every update branch.
- **PII Blanket Test**: Passed. `/users/{userId}` and `/items/{itemId}` strictly restrict `get` and `list` to `request.auth.uid == userId` / `resource.data.ownerUid == request.auth.uid`.
- **Query Trust Test**: Passed. All `allow list` rules evaluate `resource.data.ownerUid == request.auth.uid` directly without delegating filtering to the client.
- **Value Poisoning & Immortal Fields**: Passed. `isValid[Entity](incoming())` wraps the entire `allow update` block, and `uid`, `ownerUid`, `id`, `plan`, `accountStatus`, `activeItemsLimit`, and `createdAt` are enforced as immutable.
