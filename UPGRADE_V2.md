# Sprout v2.0 Upgrade Plan

**Legacy Version:** v1.0.0-legacy (tagged 2026-11-06)  
**Target Release:** v2.0.0 (Q1 2027)  
**Status:** In Development

---

## What's New in v2.0

### 🔄 Cloud Sync (Phase 1 - Critical)
- **End-to-end encrypted cloud storage** via Supabase
- **Real-time multi-device sync** across all family devices
- **Automatic conflict resolution** for multi-parent updates
- **Offline-first architecture** with sync queue
- **Secure authentication** (passwordless email/magic link)

### 📱 Push Notifications (Phase 1)
- Job approved/declined notifications
- Allowance day reminders
- Goal milestone celebrations
- Parent approval queue alerts
- Configurable notification preferences

### 🎯 Enhanced Onboarding (Phase 1)
- Interactive tutorial with sandbox mode
- Pre-filled example family (deletable)
- Video walkthrough (30s)
- Progressive disclosure by child tier
- Success metrics and social proof

### 💰 Monetization (Phase 1)
- **Free Tier:** 1 child, 4 weeks history, 5 rewards
- **Plus ($4.99/mo):** Unlimited children, history, rewards, insights
- **Family ($9.99/mo):** Multi-parent, advanced features
- In-app subscription management
- 14-day free trial

### 🍎 iOS Support (Phase 2)
- Native iOS app with Capacitor
- SwiftUI components for native feel
- Face ID/Touch ID authentication
- iOS design guidelines compliance

### 📊 Advanced Insights (Phase 2)
- Month-over-month trend charts
- Behavioral pattern detection
- Goal completion predictions
- Weekly digest emails/notifications
- CSV/PDF export

### 🎨 Enhanced Child Experience (Phase 2)
- Multi-goal support (tier 3)
- Avatar customization system
- Streak tracking (visual, not rewards)
- Voice commands ("How many coins?")
- Haptic feedback on coin earn

### 🔒 Compliance & Safety (Phase 1)
- COPPA compliance framework
- GDPR data rights implementation
- Privacy dashboard
- Data export/deletion tools
- Terms of Service + Privacy Policy

---

## Technical Architecture Changes

### Backend Infrastructure
```
Supabase Stack:
├── PostgreSQL (family data, ledger entries)
├── Row Level Security (RLS policies)
├── Realtime subscriptions
├── Edge Functions (business logic)
├── Auth (magic links, social)
└── Storage (photos, avatars)
```

### Data Migration Strategy
```typescript
// Local → Cloud migration flow
1. Detect existing localStorage data
2. Prompt user: "Upgrade to cloud sync?"
3. Create Supabase account (email)
4. Encrypt & upload family data
5. Keep local backup for 30 days
6. Switch to cloud-first mode
```

### Encryption Strategy
```typescript
// Client-side encryption keys
- Master key derived from user password (PBKDF2)
- Family data encrypted with AES-GCM-256
- Keys never leave client
- Server stores encrypted blobs only
```

---

## Implementation Phases

### Phase 1: Foundation (Weeks 1-6) ✅ Current
**Goal:** Cloud sync + monetization + compliance

- [x] Tag legacy version
- [ ] Supabase project setup
- [ ] Database schema design
- [ ] Authentication system
- [ ] Sync engine (offline-first)
- [ ] Subscription infrastructure (RevenueCat)
- [ ] Push notifications (Firebase Cloud Messaging)
- [ ] Enhanced onboarding flow
- [ ] Privacy policy + Terms
- [ ] Testing & QA

### Phase 2: Growth Features (Weeks 7-12)
**Goal:** Advanced insights + iOS + marketing

- [ ] iOS app development
- [ ] Advanced analytics dashboard
- [ ] Trend charts & predictions
- [ ] Multi-goal support
- [ ] Voice features
- [ ] Template library (jobs/rewards)
- [ ] Marketing website
- [ ] App Store optimization

### Phase 3: Scale (Weeks 13+)
**Goal:** Community + localization + partnerships

- [ ] Co-parent coordination features
- [ ] Shared family calendar
- [ ] Spanish localization
- [ ] Parent community (moderated)
- [ ] Expert content library
- [ ] School/therapist integrations

---

## Breaking Changes from v1.0

### Data Storage
- **Before:** localStorage only
- **After:** Supabase with localStorage cache

### Authentication
- **Before:** Device-local 4-digit PIN
- **After:** Email-based accounts + device PIN for child protection

### Device Pairing
- **Before:** Manual join codes + encrypted snapshots
- **After:** Automatic sync via account (join codes for invite-only)

### Offline Behavior
- **Before:** Always offline, manual sync
- **After:** Offline-first with automatic sync when online

---

## Migration Guide for v1 Users

### Automatic Migration
1. Update app from Play Store
2. Open app → "Upgrade to Cloud Sync" banner
3. Enter email → receive magic link
4. Confirm migration → data uploads
5. Install on other devices → auto-syncs

### Manual Export (Fallback)
1. Settings → Export Family Data
2. Downloads JSON file
3. Install v2 → Import during setup

---

## Database Schema

```sql
-- Core tables
families (id, name, code, created_at, premium_tier)
parents (id, family_id, email, label, name, avatar_url)
children (id, family_id, name, age, tier, avatar, picture_key, prefs, limits)
devices (id, family_id, name, kind, child_id, last_seen)

-- Ledger & transactions
entries (id, child_id, at, kind, coins, from_bucket, to_bucket, label, icon, by_parent_id, note, ref_id)
jobs (id, child_id, title, icon, coins, detail, status, auto_approve, repeat_days, submitted_at, decided_at, decided_by, photo_url, reason_id, parent_note, dispute, decline_count, seen_by_child)
spend_requests (id, child_id, coins, category, said, voice_note_url, status, created_at, decided_at, decided_by, reason_id, parent_note, next_step, seen_by_child)
rewards (id, family_id, shelf, name, emoji, coins, tiers, real_world_hint, stock, active)
redemptions (id, child_id, reward_id, coins, status, created_at, decided_at, decided_by, reason_id, parent_note, seen_by_child)
goals (id, child_id, name, emoji, target, created_at, reached_at)
badges (id, child_id, key, earned_at)

-- New v2 tables
subscriptions (id, family_id, tier, status, current_period_end)
notifications (id, user_id, type, title, body, data, read_at, sent_at)
sync_queue (id, device_id, action, payload, created_at, synced_at)
```

---

## Security Model

### Row Level Security Policies
```sql
-- Parents can only access their family's data
CREATE POLICY "Parents access own family"
ON families FOR ALL
USING (id IN (
  SELECT family_id FROM parents WHERE auth.uid() = user_id
));

-- Children never access database directly (app-only)
-- All child actions go through parent-authenticated edge functions
```

---

## Performance Targets

### Load Times
- Initial load: < 2s (cached), < 4s (fresh)
- Sync latency: < 500ms (p95)
- Offline → Online sync: < 3s for 100 entries

### Bundle Size
- Web build: < 500KB gzipped (currently 119KB ✅)
- Android APK: < 8MB (currently 3.4MB ✅)
- iOS IPA: < 12MB (target)

---

## Rollout Strategy

### Beta Testing (Week 5-6)
- 50 families (TestFlight + Play Store Beta)
- Feedback surveys after 1 week, 2 weeks
- Monitor sync errors, crash reports

### Soft Launch (Week 7)
- Release to existing v1 users
- "Upgrade to v2" in-app prompt
- Monitor migration success rate (target: 90%+)

### Public Launch (Week 8)
- App Store featured request
- Product Hunt launch
- Parenting blog outreach
- Paid acquisition ($5K initial budget)

---

## Success Metrics

### Adoption
- v1 → v2 upgrade rate: 75%+ in 30 days
- New user signup completion: 60%+
- Time to first child added: < 3 minutes

### Engagement
- DAU/MAU: 40%+ (parents), 60%+ (children)
- Weekly active families: 70%+
- Jobs completed per week: 5+ per child

### Revenue
- Free → Trial conversion: 25%+
- Trial → Paid conversion: 40%+
- Churn (monthly): < 8%
- LTV:CAC: 3:1 minimum

---

## Risk Mitigation

### Data Loss Risk
- **Mitigation:** Dual-write to localStorage + Supabase for 30 days
- **Rollback:** Revert to localStorage-only if sync fails

### Migration Failures
- **Mitigation:** Keep v1.0 available as "Sprout Classic" on Play Store
- **Support:** In-app chat + manual migration assistance

### Server Costs
- **Budget:** $100/mo (1000 families), $500/mo (5000 families)
- **Break-even:** 50 paying families ($250 MRR)

---

## Questions for Product Decision

1. **Freemium limits:** 1 child or 2 children in free tier?
2. **Trial length:** 7 days or 14 days?
3. **Legacy app:** Keep v1.0 available indefinitely or sunset in 6 months?
4. **Data residency:** US-only or EU compliance from day 1?
5. **Social features:** Parent community in v2 or v3?

---

## Resources

- **Supabase Docs:** https://supabase.com/docs
- **RevenueCat Docs:** https://docs.revenuecat.com
- **COPPA Compliance:** https://www.ftc.gov/business-guidance/resources/childrens-online-privacy-protection-rule-six-step-compliance-plan-your-business
- **Capacitor iOS:** https://capacitorjs.com/docs/ios

---

**Last Updated:** 2026-11-06  
**Author:** Sprout Team  
**Review Status:** Draft → needs product review
