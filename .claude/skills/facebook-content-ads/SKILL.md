---
name: facebook-content-ads
description: Reference for how Facebook posts, ads, campaigns, and content-analytics data relate in this codebase (Prisma schema, key files, env vars). Load this before touching Facebook Content tab, Campaigns detail, or post/ad linkage code, instead of re-deriving the data model from scratch.
---

# Facebook Content ↔ Ads Data Model

## Relation shape (Prisma)
- `Campaign` 1—N `Ad` (via `Ad.campaignId`)
- `Ad` N—1 `AdPost` (via `Ad.postId`, nullable — not every ad boosts a post; `AdPost.ads` is the reverse list, multiple ads can share one post)
- `AdInsight` (`entityLevel: "AD"`, `entityId` = `Ad.id`) — daily spend/reach/clicks/impressions per ad, ETL-populated
- `ContentPost` / `ContentPostMetric` — separate table, populated by CSV import (`content-import.*`) or live sync (`facebookContentSync.service.ts`). Cross-referenced against `AdPost` by **value** (`ContentPost.externalPostId == AdPost.externalPostId`), no shared FK — both key on Facebook's real post id via different pipelines.

## Key files
| Concern | File |
|---|---|
| Graph API transport (pagination, error parsing) | `src/server/modules/facebook/facebookGraph.client.ts` |
| Ad-account entity/insight fetchers, post-by-id, page-posts-list | `src/server/modules/facebook/facebookEtl.repository.ts` |
| Row → Prisma-shape normalizers (ads/campaigns/insights) | `src/server/modules/facebook/facebookEtl.adapter.ts` |
| Post ↔ ad ↔ campaign join for Content tab | `src/server/modules/facebook/content/facebookContent.repository.ts` (`getAdvertisingAdsByExternalPostId`, `getCampaignDetailByExternalCampaignId`) |
| Content tab read path | `src/server/modules/facebook/content/facebookContentAnalytics.service.ts` |
| CSV → ContentPost normalizer | `src/server/modules/facebook/content/facebookContent.adapter.ts` (`normalizeFacebookContentRow` for CSV, `normalizeFacebookPagePost` for live sync) |
| Shared upsert into ContentPost/ContentPostMetric (both CSV and live sync call this) | `src/server/core/content-import/content-import-database.service.ts` (`saveContentImportResult`) |
| Live Content sync from Graph API | `src/server/modules/facebook/content/facebookContentSync.service.ts` |
| Campaigns list (live API, not Prisma) | `src/server/modules/campaigns/campaigns.service.ts` — `CampaignRow.id` (`facebook-${externalCampaignId}`) matches Prisma `Campaign.externalCampaignId` |

## Env vars (`src/server/configurations/config.ts` → `config.facebook.*`)
- `META_ACCESS_TOKEN`/`META_AD_ACCOUNT_ID` — required by zod but **not read anywhere in the multi-tenant flow** (vestigial; per-company `Company.facebookAccessToken`/`facebookAdAccountId` is what's actually used).
- `FACEBOOK_APP_ID`/`FACEBOOK_APP_SECRET`/`FACEBOOK_REDIRECT_URL` — OAuth connect flow.
- `FACEBOOK_PAGE_ID`/`FACEBOOK_PAGE_ACCESS_TOKEN` (optional) — Page-scoped, NOT the ad-account token above. Powers the live Content sync (`/{page-id}/posts`). Unset → Content tab falls back to CSV import only.
  - The token **must** be generated with the `pages_read_engagement` permission (Graph API Explorer → select the Page, not User → Permissions → add `pages_read_engagement` + `pages_show_list` → Generate Access Token). Without it, sync fails with `(#10) This endpoint requires the 'pages_read_engagement' permission...` — confirmed empirically, not a code bug.
  - Explorer-generated Page tokens are short-lived (~1h). For a durable one: exchange for a long-lived User token (`GET /oauth/access_token?grant_type=fb_exchange_token&...`), then pull the Page token from `/me/accounts` using that.

## Known gaps
- No post-level `/insights` call exists (reach/views/saves/avgSecondsViewed). Live sync only gets likes/comments/shares via `POST_FIELDS`; those metric fields stay `null` until a future `/insights` edge is built and verified against the app's actual Graph API version/permissions.
- CSV import (`ImportCsvButton` in `FacebookImportedAnalytics.tsx`) is kept as a fallback alongside the live sync button since the Page token's permissions are unverified in this environment.
