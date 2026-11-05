# Skill: Facebook Content Sync — Diagnose, Fix, Validate

## Purpose

Use this skill for Facebook Page Content Sync errors, especially Graph API `(#10)` errors involving `pages_read_engagement` or `Page Public Content Access`.

Workflow:

```text
Plan → Inspect → Reproduce → Identify Root Cause → Minimal Fix → Validate
```

Never stop at diagnostics if the evidence is sufficient to continue fixing.

---

## Confirmed Current Evidence

The current incident has already ruled out the common token/config mismatch.

Runtime Page Access Token was verified with `/debug_token`:

```text
type = PAGE
is_valid = true
pages_read_engagement = granted
granular_scopes.pages_read_engagement.target_ids includes FACEBOOK_PAGE_ID
```

Runtime diagnostics also confirmed:

```text
pageId = 104329042363053
tokenPrefix = EAAarbZBNJ
tokenLength = 244
debugType = PAGE
debugScopes includes pages_read_engagement
debugAppId = 1877346903222947
debugUserId = 122093593647389704
```

The runtime token matches the manually verified token.

Therefore:

> Do NOT treat this as an invalid Page Access Token or `.env` mismatch unless new evidence contradicts this.

---

## Confirmed Failing Request

The failing request is:

```http
GET https://graph.facebook.com/v26.0/{pageId}/posts?limit=1
```

The failure is:

```text
(#10) This endpoint requires the 'pages_read_engagement' permission
or the 'Page Public Content Access' feature.
```

The failure happens in a **pre-flight permission check** before the real content fetch.

Current flow:

```text
syncFacebookContentFromApi()
        ↓
resolvePageAccessTokenForPage()
        ↓
debug_token
        ↓
/me
        ↓
pre-flight GET /{pageId}/posts?limit=1
        ↓
❌ Graph API #10
        ↓
Content Sync stops
```

Do not assume the token is invalid.

---

## Known Correct Code Paths

`getFacebookPagePosts()` currently constructs the request as:

```ts
export async function getFacebookPagePosts(
  pageId: string,
  pageAccessToken: string
): Promise<FacebookPostRow[]> {
  const url = new URL(
    `${config.facebook.baseUrl}/${config.facebook.apiVersion}/${pageId}/posts`
  );

  url.searchParams.set("fields", POST_FIELDS);
  url.searchParams.set("access_token", pageAccessToken);
  url.searchParams.set("limit", "100");

  return fetchFacebookGraphList<FacebookPostRow>(url);
}
```

The generic Graph client:

```ts
export async function fetchFacebookGraphList<T>(
  url: URL
): Promise<T[]> {
  const results: T[] = [];
  let nextUrl: string | undefined = url.toString();

  while (nextUrl) {
    const response = await fetch(nextUrl, { cache: "no-store" });
    await ensureSuccessful(response);

    const body = (await response.json()) as GraphListResponse<T>;

    if (body.error) {
      throw new Error(
        body.error.message ?? "Facebook Graph API error"
      );
    }

    results.push(...body.data);
    nextUrl = body.paging?.next;
  }

  return results;
}
```

Do not rewrite these functions unless the investigation proves a concrete defect.

---

# Required Plan Before Editing

Before modifying any file, output:

```text
## Plan

1. Inspect the pre-flight permission check.
2. Trace resolvePageAccessTokenForPage() and identify why it rejects the request.
3. Verify the exact Graph API v26.0 behavior for /{pageId}/posts.
4. Check Page Public Content Access / Pages API configuration requirements.
5. Determine whether the pre-flight validation itself is misleading or incorrect.
6. Identify the confirmed root cause.
7. Apply the smallest possible fix.
8. Run TypeScript/build.
9. Run Content Sync.
10. Verify posts are persisted.
```

Then execute the plan.

---

# Investigation Priorities

## 1. Inspect the pre-flight validation

Find:

```text
resolvePageAccessTokenForPage()
```

and the code that performs:

```text
GET /{pageId}/posts?limit=1
```

Determine:

- why this check exists
- what error it catches
- whether it assumes `#10` means the token is invalid
- whether it converts a Facebook API error into a misleading custom error
- whether the check is actually required

If the token is already verified as a valid Page token, do not use the pre-flight check as proof that the token is invalid.

---

## 2. Investigate Facebook Page Content access

Because the runtime token is confirmed valid, investigate the actual API access requirement for:

```http
GET /{pageId}/posts
```

Check:

- current Graph API version: `v26.0`
- Page content API requirements
- `pages_read_engagement`
- Page Public Content Access
- App mode
- App configuration
- whether the app is allowed to access the Page content endpoint
- whether the Page belongs to the app-authorized account/context

Do not blindly add permissions.

Do not regenerate the token unless new evidence proves it is required.

---

## 3. Compare direct API vs backend

Using the same verified Page Access Token, compare:

```http
GET /{pageId}?fields=id,name
```

and:

```http
GET /{pageId}/posts
?fields=id,message,created_time,permalink_url,attachments
```

with the backend's request.

If direct API succeeds but backend fails:

> Investigate backend request construction/pre-flight logic.

If direct API also fails:

> Investigate Facebook App/Page access configuration and API requirements.

---

# Minimal Fix Principle

Only change code after confirming the root cause.

Potential valid fixes include:

### Misleading pre-flight validation

If the pre-flight check incorrectly interprets a valid Page token/API response as a token problem:

- redesign or remove the misleading validation
- allow the real Content Sync request to be the source of truth
- preserve useful error information

### Incorrect API configuration

If the root cause is App/Page API configuration:

- fix the relevant app configuration
- do not alter unrelated application code

### Incorrect Graph API version

If v26.0 behavior/requirements are the cause:

- make the smallest version/configuration change supported by the project
- document why the change is required

---

# Error Handling Requirements

Do not throw this message when the token has already been verified:

```text
FACEBOOK_PAGE_ACCESS_TOKEN ต้องเป็น Page-scoped token ที่มี
permission pages_read_engagement...
```

unless the application has actually proven that condition is false.

Prefer an error that reflects the actual failure:

```text
Facebook Content Sync failed:
Graph API rejected the Page posts request with error #10.
Verify Page content access, App configuration, API version, and endpoint requirements.
```

Include when useful:

```text
Facebook error code
Facebook error subcode
endpoint
Graph API version
Page ID
```

Never include the full token.

---

# Token Security

Never log:

```text
FULL_ACCESS_TOKEN
```

Only safe diagnostics are allowed:

```text
tokenPrefix
tokenLength
tokenConfigured
debugType
debugScopes
debugAppId
debugUserId
```

Never hardcode tokens or Page IDs.

If a real token is exposed in source control/logs/chat, recommend rotation.

---

# Do Not Do

Do NOT:

- regenerate tokens repeatedly
- replace `FACEBOOK_PAGE_ACCESS_TOKEN` with `META_ACCESS_TOKEN`
- remove required permissions blindly
- rewrite the ETL layer
- rewrite database persistence
- rewrite pagination
- hardcode credentials
- claim success based only on TypeScript passing
- stop after adding diagnostics
- claim Facebook is the root cause without reproducing/comparing the exact request

---

# Validation

A fix is NOT complete until all applicable checks pass:

```text
1. TypeScript/build: PASS
2. Runtime config: PASS
3. Page token validation: PASS
4. Page endpoint: PASS
5. Posts endpoint: PASS
6. POST /api/dashboard/facebook/content-sync: HTTP 200
7. ContentPost records persisted: PASS
8. ContentPostMetric records persisted if applicable: PASS
9. Repeated sync does not create unintended duplicates: PASS
```

If any required step fails, do not report the issue as fixed.

---

# Required Final Report

After the work:

```text
## Root Cause

<confirmed root cause>

## Evidence

- ...
- ...
- ...

## Changes Made

- ...
- ...

## Validation

- Runtime token: PASS/FAIL
- Page endpoint: PASS/FAIL
- Posts endpoint: PASS/FAIL
- Content Sync: PASS/FAIL
- Database persistence: PASS/FAIL
- TypeScript/build: PASS/FAIL
```

If the root cause cannot be proven:

```text
Root cause not yet confirmed.
```

Never invent a diagnosis.

---

# Recommended VS Code Chat Command

When this skill is available, keep the chat prompt short:

```text
Use the Facebook Content Sync skill. Continue from the confirmed evidence, diagnose the root cause, make the minimal fix, and validate end-to-end.
```

Do not paste the full investigation context into chat again unless new evidence needs to be added.

---

# Latest Investigation State — Token Flow Confirmed

The previous token mismatch hypothesis is resolved.

## Confirmed Runtime Evidence

Latest runtime logs confirm:

- `debugType = PAGE`
- `tokenLength = 239`
- request `tokenLength = 239`
- `tokenPrefix` matches
- `pages_read_engagement` is granted
- `granular_scopes.pages_read_engagement.target_ids` includes `FACEBOOK_PAGE_ID`
- The same Page Access Token is used for `/debug_token` and `/{pageId}/posts`
- `GET /v26.0/{pageId}/posts?limit=1` still returns Graph API `#10`

Therefore:

- Token resolution is confirmed correct.
- `.env` mismatch is ruled out.
- Token mismatch is ruled out.
- Page-specific `pages_read_engagement` is confirmed.
- Do not regenerate tokens.
- Do not repeat token diagnostics unless new evidence contradicts this state.

## Next Investigation

Continue from the confirmed evidence above.

### 1. Verify official Meta API requirements

Check the current official Meta documentation for Graph API `v26.0`:

```http
GET /{pageId}/posts


# FINAL CURRENT STATE — DO NOT REPEAT PREVIOUS INVESTIGATION

This section contains the latest and highest-priority evidence for the current incident.

## Confirmed Working

Using the SAME verified Facebook Page Access Token and Graph API v26.0:

GET /v26.0/{pageId}/posts?fields=id,message,created_time,permalink_url&limit=1
→ PASS

GET /v26.0/{pageId}/posts?fields=id,message,created_time,permalink_url,attachments&limit=1
→ PASS

GET /v26.0/{pageId}/posts?fields=id,message,shares&limit=1
→ PASS

## Confirmed Failing

GET /v26.0/{pageId}/posts?fields=id,message,likes.summary(true)&limit=1
→ FAIL with Graph API #10

GET /v26.0/{pageId}/posts?fields=id,message,comments.summary(true)&limit=1
→ FAIL with Graph API #10

## Current Conclusion

The following are already proven:

- Page Access Token works.
- Page ID is correct.
- Token is Page-scoped.
- pages_read_engagement is granted.
- granular target_ids includes the Page ID.
- Graph API v26.0 works.
- /posts works.
- Basic post fields work.
- attachments works.
- shares works.

The failure is isolated to:

- likes.summary(true)
- comments.summary(true)

Do NOT reopen the following investigations unless new evidence contradicts the above:

- token mismatch
- .env loading
- Page Access Token generation
- pages_read_engagement
- META_ACCESS_TOKEN
- API version
- basic /posts endpoint

Do NOT regenerate the token.

Do NOT add permissions based only on the generic #10 error.

Do NOT modify ETL/database code.

---

## Required Next Action

Plan first.

1. Inspect the current `POST_FIELDS`.
2. Remove `likes.summary(true)` and `comments.summary(true)` from the base `/posts` request.
3. Keep only fields confirmed to work:

```text
id
message
created_time
permalink_url
attachments
shares

# FINAL ACTION — IMPLEMENT NOW

The following are CONFIRMED RUNTIME RESULTS from direct Meta Graph API calls.

These requests were actually executed using the SAME verified Facebook Page Access Token.
They are NOT hypothetical examples and NOT merely documentation.

## Confirmed Runtime Results

```text
GET /v26.0/{pageId}/posts?fields=id,message,likes.summary(true)&limit=1
→ FAIL
→ Graph API error #10

GET /v26.0/{pageId}/posts?fields=id,message,comments.summary(true)&limit=1
→ FAIL
→ Graph API error #10

GET /v26.0/{pageId}/posts?fields=id,message,created_time,permalink_url&limit=1
→ PASS

GET /v26.0/{pageId}/posts?fields=id,message,created_time,permalink_url,attachments&limit=1
→ PASS

GET /v26.0/{pageId}/posts?fields=id,message,shares&limit=1
→ PASS

# FINAL CURRENT STATE — DO NOT REQUIRE pages_read_user_content

This section overrides any previous investigation state in this skill regarding
pages_read_user_content.

## Important Correction

Do NOT require `pages_read_user_content` for Facebook Content Sync.

Confirmed runtime evidence shows that the current Page Access Token can successfully
call:

GET /{pageId}/posts

and return actual post data without `pages_read_user_content`.

Therefore:

- Do NOT require `pages_read_user_content`.
- Do NOT regenerate the Page Access Token.
- Do NOT ask the user to re-authorize the token for this permission.
- Do NOT add `pages_read_user_content` to required scopes.
- Do NOT block Content Sync because this permission is absent.

The previous `pages_read_user_content` requirement was an incorrect validation assumption
and must be removed from the Content Sync token validation logic.

---

## Confirmed Token Requirements

For the current Facebook Content Sync implementation, keep:

```text
pages_read_engagement