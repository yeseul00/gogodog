# Firestore Security Specification (Payload-First TDD)

## 1. Data Invariants
1. **PII Isolation**: Public `/rankings/{entryId}` documents contain strictly non-PII gameplay metrics (`userId`, `characterName`, `stageId`, `score`, `distance`, `outcome`, `treatsCollected`, `maxCombo`, `isPublic`, `createdAt`). Email addresses or account details are never written to Firestore.
2. **Identity Integrity**: Every `/rankings/{entryId}` creation must come from a verified Firebase Auth user (`request.auth != null && request.auth.token.email_verified == true`) with `incoming().userId == request.auth.uid`.
3. **Immutable Leaderboard Runs**: Ranking entries cannot be updated or deleted from client SDKs once submitted.
4. **Strict Counter Monotonicity**: Only `/counters/defaultName` may be accessed by verified users, initialized with `count == 1`, and updated strictly by `+1` (`incoming().count == existing().count + 1`) with server timestamp `request.time`.
5. **Path & Size Hardening**: Every document ID matches `^[a-zA-Z0-9_\-]+$` (<= 128 chars), `characterName` is 1..12 chars, and every numeric metric is bounded.

## 2. The "Dirty Dozen" Malicious Payloads (All MUST Return `PERMISSION_DENIED`)
1. **Unauthenticated Write**: Create `/rankings/run_1` without `request.auth`.
2. **Unverified Email Spoof**: Create `/rankings/run_2` with `request.auth.token.email_verified == false`.
3. **UID Impersonation**: Create `/rankings/run_3` with `userId: "victim_uid"` while signed in as `"attacker_uid"`.
4. **Shadow Ghost Field**: Create `/rankings/run_4` containing valid fields plus `"isAdmin": true` or `"email": "leak@example.com"`.
5. **Oversized Character Name**: Create `/rankings/run_5` with `characterName` of 50 characters (> 12 max).
6. **Out-of-Bounds Score Poisoning**: Create `/rankings/run_6` with `score: 999999999` or negative `score: -10`.
7. **Invalid Stage Enum**: Create `/rankings/run_7` with `stageId: 99`.
8. **Client-Forged Timestamp**: Create `/rankings/run_8` where `createdAt` is a backdated client timestamp instead of `request.time`.
9. **Path ID Poisoning**: Create `/rankings/bad..id$poison` violating `isValidId`.
10. **Post-Submit Score Tampering**: Update an existing `/rankings/run_ok` document to raise `score`.
11. **Counter Jump Attack**: Update `/counters/defaultName` from `count: 5` to `count: 500` (skipping +1 invariant) or reset to `0`.
12. **Arbitrary Counter Creation**: Create `/counters/arbitraryCounter` where `counterId != 'defaultName'`.
