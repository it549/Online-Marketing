# Skill: Facebook Content Sync — Final Diagnose, Fix & Validate

## Purpose

Use this skill when working on Facebook Page Content Sync.

This skill contains the **latest confirmed runtime evidence** for the current Facebook Content Sync incident.

Follow this workflow:

```text
Plan
→ Inspect
→ Use Confirmed Evidence
→ Identify Root Cause
→ Minimal Fix
→ TypeScript Validation
→ End-to-End Sync
→ Database Validation
```

Do not repeat investigations that have already been conclusively ruled out.

---

# IMPORTANT — CURRENT INCIDENT STATE

This is the **highest-priority and latest state** of the investigation.

Do not revert to previous hypotheses unless new runtime evidence directly contradicts the evidence below.

---

# 1. CONFIRMED TOKEN STATE

The Facebook Page Access Token has been verified at runtime.

Confirmed:

```text
debugType = PAGE
is_valid = true
pages_read_engagement = granted
```

The granular scope entry confirms:

```text
scope = pages_read_engagement
target_ids = [FACEBOOK_PAGE_ID]
```

Runtime diagnostics also showed:

```text
pageId = 104329042363053
tokenPrefix = EAAarbZBNJ
tokenLength = 239
debugType = PAGE

debugScopes:
- pages_show_list
- ads_management
- ads_read
- business_management
- leads_retrieval
- pages_read_engagement
- pages_manage_ads
- public_profile

debugAppId = 1877346903222947
debugUserId = 122093593647389704
```

The same Page Access Token was used for:

```text
/debug_token
```

and:

```text
/{pageId}/posts
```

Therefore:

* Page Access Token is valid.
* Token is Page-scoped.
* Page ID is correct.
* `pages_read_engagement` is granted.
* `pages_read_engagement.target_ids` contains the Page ID.
* `.env` token mismatch is ruled out.
* Token resolution mismatch is ruled out.

## DO NOT

Do NOT:

* regenerate the token
* replace it with `META_ACCESS_TOKEN`
* repeatedly investigate `.env`
* repeat token resolution investigation
* claim the token is invalid
* add permissions blindly

---

# 2. IMPORTANT CORRECTION — DO NOT REQUIRE pages_read_user_content

The previous investigation incorrectly concluded that:

```text
pages_read_user_content
```

must be required for Content Sync.

For this project, **do not require `pages_read_user_content` in Content Sync token validation.**

The application must NOT block Content Sync because this permission is absent.

Do NOT:

```text
require pages_read_user_content
```

Do NOT:

```text
throw an error because pages_read_user_content is missing
```

Do NOT:

```text
ask the user to regenerate/re-authorize the token for pages_read_user_content
```

Do NOT add this permission back into the required-scope validation.

The current token has:

```text
pages_read_engagement
```

and the Page `/posts` endpoint is demonstrably usable with this Page Access Token.

Therefore the Content Sync validation should require:

```text
pages_read_engagement
```

plus the existing:

```text
granular_scopes.target_ids
```

check for the target Page.

---

# 3. CONFIRMED DIRECT META API EVIDENCE

The following requests were actually executed against Meta Graph API using the same verified Page Access Token.

These are confirmed runtime results, not hypothetical examples.

## PASS — Basic fields

```http
GET /v26.0/{pageId}/posts?fields=id,message,created_time,permalink_url&limit=1
```

Result:

```text
PASS
Actual post data returned
```

---

## PASS — attachments

```http
GET /v26.0/{pageId}/posts?fields=id,message,created_time,permalink_url,attachments&limit=1
```

Result:

```text
PASS
Actual post data returned
```

---

## PASS — shares

```http
GET /v26.0/{pageId}/posts?fields=id,message,shares&limit=1
```

Result:

```text
PASS
Actual post data returned
```

---

# 4. CONFIRMED FAIL — likes.summary(true)

The following request was actually executed:

```http
GET /v26.0/{pageId}/posts?fields=id,message,likes.summary(true)&limit=1
```

Result:

```text
FAIL
Graph API error #10
```

Meta returned:

```json
{
  "error": {
    "message": "(#10) This endpoint requires the 'pages_read_engagement' permission or the 'Page Public Content Access' feature.",
    "type": "OAuthException",
    "code": 10
  }
}
```

Important:

The token already has:

```text
pages_read_engagement
```

and the Page ID is included in the granular target IDs.

Therefore, for this application, the runtime evidence isolates the failure to requesting:

```text
likes.summary(true)
```

Do not interpret this as evidence that the entire `/posts` endpoint is unavailable.

---

# 5. CONFIRMED FAIL — comments.summary(true)

The following request was actually executed:

```http
GET /v26.0/{pageId}/posts?fields=id,message,comments.summary(true)&limit=1
```

Result:

```text
FAIL
Graph API error #10
```

Therefore the failure is also isolated to requesting:

```text
comments.summary(true)
```

---

# 6. CONFIRMED CONCLUSION ABOUT POST_FIELDS

The current base Page `/posts` request must NOT request:

```text
likes.summary(true)
comments.summary(true)
```

The confirmed working field set is:

```text
id
message
created_time
permalink_url
attachments
shares
```

Therefore the Page Content Sync field set should be:

```ts
const PAGE_POST_FIELDS =
  "id,message,created_time,permalink_url,attachments,shares";
```

Do not add:

```text
likes.summary(true)
comments.summary(true)
```

back into the Page Content Sync request unless new runtime evidence proves they are supported.

---

# 7. IMPORTANT SCOPE OF THE POST_FIELDS CHANGE

The field change applies specifically to:

```text
Facebook Page Content Sync
```

Do not unnecessarily modify the shared fields used by other Facebook ETL functionality.

If the project currently has:

```text
POST_FIELDS
```

used by Ads ETL or other flows, preserve those flows unless a concrete defect is found.

Prefer:

```ts
PAGE_POST_FIELDS
```

for:

```text
getFacebookPagePosts()
```

while leaving unrelated Ads ETL field definitions unchanged.

---

# 8. EXPECTED getFacebookPagePosts() BEHAVIOR

The Page Content Sync request should effectively construct:

```http
GET /v26.0/{pageId}/posts
    ?fields=id,message,created_time,permalink_url,attachments,shares
    &access_token=<PAGE_ACCESS_TOKEN>
    &limit=100
```

The token must never be logged.

The existing pagination implementation should remain unchanged unless a concrete pagination defect is discovered.

---

# 9. DO NOT MODIFY THESE WITHOUT A CONCRETE DEFECT

Do NOT rewrite:

```text
getFacebookPagePosts()
```

Do NOT rewrite:

```text
fetchFacebookGraphList()
```

Do NOT rewrite:

```text
saveContentImportResult()
```

Do NOT modify:

```text
ETL/database persistence
```

unless the investigation discovers an actual independent defect.

The current issue is an invalid field combination in the Page Content Sync request and an incorrect `pages_read_user_content` validation assumption.

---

# 10. REQUIRED TOKEN VALIDATION

The Content Sync token validation should verify:

### Required

```text
pages_read_engagement
```

### Required Page targeting

```text
granular_scopes
    ↓
pages_read_engagement
    ↓
target_ids includes FACEBOOK_PAGE_ID
```

### NOT required

```text
pages_read_user_content
```

The absence of:

```text
pages_read_user_content
```

must NOT cause Content Sync to fail before the `/posts` request.

---

# 11. REMOVE THE INCORRECT VALIDATION

If code currently contains logic similar to:

```ts
const REQUIRED_PAGE_SCOPES = [
  "pages_read_engagement",
  "pages_read_user_content",
];
```

change it so that Content Sync only requires:

```ts
const REQUIRED_PAGE_SCOPES = [
  "pages_read_engagement",
];
```

Do not introduce another permission requirement without runtime evidence.

If the application currently throws an error such as:

```text
FACEBOOK_PAGE_ACCESS_TOKEN ต้องเป็น Page-scoped token ที่มี permission
pages_read_engagement และ pages_read_user_content ทั้งคู่
```

remove the `pages_read_user_content` requirement from that validation and error message.

---

# 12. ACTUAL GRAPH API REQUEST IS THE SOURCE OF TRUTH

Once token validation has passed, allow the real request:

```text
GET /{pageId}/posts
```

to determine whether Facebook accepts the Content Sync request.

Do not use an artificial permission assumption to block the request.

If Meta rejects the actual request:

* preserve the actual Graph API error
* report the endpoint
* report Graph API version
* report error code/subcode when available
* never expose the access token

---

# 13. CURRENT KNOWN FLOW

The desired flow is:

```text
POST /api/dashboard/facebook/content-sync
        ↓
syncFacebookContentFromApi()
        ↓
resolvePageAccessTokenForPage()
        ↓
debug_token
        ↓
verify PAGE token
        ↓
verify pages_read_engagement
        ↓
verify granular target_ids contains Page ID
        ↓
getFacebookPagePosts()
        ↓
GET /v26.0/{pageId}/posts
        ↓
fields:
id
message
created_time
permalink_url
attachments
shares
        ↓
fetchFacebookGraphList()
        ↓
normalize content
        ↓
saveContentImportResult()
        ↓
ContentPost persistence
```

There must NOT be an artificial:

```text
pages_read_user_content
```

gate between token validation and the `/posts` request.

---

# 14. REQUIRED PLAN BEFORE EDITING

Before modifying any code, output:

```text
## Plan

1. Inspect the current Content Sync scope validation.
2. Remove pages_read_user_content from the required scope list.
3. Preserve pages_read_engagement validation.
4. Preserve granular target_ids validation.
5. Inspect PAGE_POST_FIELDS and confirm it excludes likes.summary(true) and comments.summary(true).
6. Do not modify unrelated ETL/database code.
7. Run npx tsc --noEmit.
8. Run POST /api/dashboard/facebook/content-sync.
9. Verify HTTP 200.
10. Verify ContentPost records are persisted.
```

Then execute the plan.

Do not ask the user to repeat the already-confirmed API tests.

---

# 15. MINIMAL FIX PRINCIPLE

Make only these changes if the code still contains the old behavior:

### Fix A — Remove incorrect scope requirement

Remove:

```text
pages_read_user_content
```

from Content Sync required scopes.

Keep:

```text
pages_read_engagement
```

and the granular Page target check.

### Fix B — Keep Page post fields safe

Use:

```text
id,message,created_time,permalink_url,attachments,shares
```

for Page Content Sync.

Remove:

```text
likes.summary(true)
comments.summary(true)
```

from that request.

Do not modify unrelated Facebook Ads ETL fields.

---

# 16. TYPESCRIPT VALIDATION

Run:

```bash
npx tsc --noEmit
```

Expected:

```text
PASS
```

If TypeScript fails:

* fix only errors related to the change
* do not rewrite unrelated code

---

# 17. END-TO-END VALIDATION

A code change is NOT considered complete after TypeScript passes.

Run:

```http
POST /api/dashboard/facebook/content-sync
```

Expected:

```text
HTTP 200
```

Then verify that posts were actually persisted.

Check:

```text
ContentPost
```

and, where applicable:

```text
ContentPostMetric
```

The final result must distinguish:

```text
TypeScript PASS
```

from:

```text
Content Sync PASS
```

---

# 18. DATABASE VALIDATION

Do not claim success merely because:

```text
POST /api/dashboard/facebook/content-sync → 200
```

Also verify:

```text
ContentPost rows persisted
```

If the implementation creates metrics:

```text
ContentPostMetric rows persisted
```

Also verify repeated sync does not unintentionally duplicate existing posts.

Do not modify the database schema unless a concrete database defect is discovered.

---

# 19. TOKEN SECURITY

Never log:

```text
FULL_ACCESS_TOKEN
```

Allowed diagnostics:

```text
tokenPrefix
tokenLength
tokenConfigured
debugType
debugScopes
debugAppId
debugUserId
```

If a full token appears in logs, source control, or chat, recommend rotation separately.

Do not print the token in error messages.

---

# 20. DO NOT

Do NOT:

* regenerate the token
* ask for `pages_read_user_content`
* require `pages_read_user_content`
* replace the Page token with `META_ACCESS_TOKEN`
* modify unrelated ETL logic
* modify database schema
* rewrite pagination
* rewrite Graph client behavior without evidence
* hardcode credentials
* hardcode Page IDs
* add permissions blindly
* reopen `.env` debugging
* reopen token mismatch debugging
* reopen API version debugging
* reopen the basic `/posts` endpoint investigation
* claim success because TypeScript passes
* claim success before Content Sync returns HTTP 200
* claim success before persistence is verified

---

# 21. FINAL REPORT FORMAT

After implementation and validation, report:

```text
## Root Cause

<confirmed root cause>

## Evidence

- Page Access Token is valid and Page-scoped.
- pages_read_engagement is granted.
- granular target_ids includes the Page ID.
- Basic /posts request succeeds.
- attachments succeeds.
- shares succeeds.
- likes.summary(true) returns Graph API #10.
- comments.summary(true) returns Graph API #10.
- pages_read_user_content is NOT required by the application's Content Sync validation.

## Changes Made

- Removed pages_read_user_content from Content Sync required scopes.
- Preserved pages_read_engagement validation.
- Preserved granular target_ids validation.
- Page Content Sync uses:
  id,message,created_time,permalink_url,attachments,shares
- Removed likes.summary(true) and comments.summary(true) from Page Content Sync.
- Left unrelated ETL/database code unchanged.

## Validation

- Runtime token: PASS/FAIL
- Page endpoint: PASS/FAIL
- Posts endpoint: PASS/FAIL
- TypeScript/build: PASS/FAIL
- Content Sync HTTP 200: PASS/FAIL
- ContentPost persistence: PASS/FAIL
- ContentPostMetric persistence: PASS/FAIL
- Duplicate protection: PASS/FAIL
```

If Content Sync has not been run successfully, explicitly state:

```text
Root cause/fix identified, but end-to-end validation is not yet complete.
```

Never claim the issue is fixed until:

```text
POST /api/dashboard/facebook/content-sync
→ HTTP 200
```

and persistence has been verified.

---

# 22. SHORT VS CODE COMMAND

After this skill is installed, use:

```text
Use the Facebook Content Sync Final skill. Read the confirmed evidence, make the minimal fix, and validate Content Sync end-to-end.
```

Do not paste the old investigation history again.

---

# 23. EVIDENCE PRIORITY

When investigating this incident, use the following evidence priority:

```text
1. Fresh runtime API response
2. Fresh application runtime log
3. Existing confirmed runtime evidence in this skill
4. Current source code
5. Official Meta documentation
6. Hypotheses
```

Do not override confirmed runtime evidence with a generic interpretation of a Graph API error message.

Do not treat a permission error message as proof that a permission is missing when runtime evidence demonstrates that the same token can successfully access the relevant endpoint.

When evidence conflicts:

```text
STOP
→ identify the conflict
→ reproduce the smallest test needed
→ do not make a speculative code change
```

---

# 24. CURRENT STATUS

At the beginning of the next investigation:

```text
Token: VERIFIED
Page ID: VERIFIED
pages_read_engagement: VERIFIED
granular target_ids: VERIFIED
Basic /posts: VERIFIED
attachments: VERIFIED
shares: VERIFIED
likes.summary(true): FAILED
comments.summary(true): FAILED
pages_read_user_content: NOT REQUIRED
PAGE_POST_FIELDS: SHOULD EXCLUDE LIKES/COMMENTS SUMMARIES
Content Sync HTTP 200: NOT YET VERIFIED
ContentPost persistence: NOT YET VERIFIED
```

The next task is therefore:

```text
Remove incorrect pages_read_user_content validation
+
keep the safe PAGE_POST_FIELDS
+
run TypeScript
+
run Content Sync
+
verify persistence
```

Do not restart the investigation from the beginning.
