# MaxPromo Digital — Social Automation

n8n workflows for automated content publishing and comment engagement across Facebook, Instagram, and YouTube.

---

## Active vs Disabled

| Platform | Publishing | Engagement |
|----------|-----------|------------|
| Facebook | ACTIVE | ACTIVE |
| Instagram | ACTIVE (2-step publish) | ACTIVE |
| YouTube | ACTIVE (community posts) | — |
| LinkedIn | DISABLED (placeholder ready) | DISABLED (placeholder ready) |

---

## Environment Variables Required

Add all of these to your n8n environment (Settings → Variables) before activating.

### Meta (Facebook + Instagram)
| Variable | Description |
|----------|-------------|
| `MAXPROMO_FB_PAGE_ID` | Facebook Page numeric ID (from Page settings or Graph API Explorer) |
| `MAXPROMO_META_TOKEN` | Long-lived Page Access Token from Meta Developer Console |
| `MAXPROMO_IG_USER_ID` | Instagram Business Account ID (retrieve via `GET /me/accounts` then IG account linked) |

### YouTube
| Variable | Description |
|----------|-------------|
| `MAXPROMO_YOUTUBE_TOKEN` | OAuth 2.0 access token for YouTube channel — set up via Google Cloud Console |

### Claude AI
| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Anthropic API key from console.anthropic.com |

### Neon DB
Configure a Postgres credential in n8n named **MaxPromo Neon DB** using your Neon connection string. Then replace `NEON_CREDENTIAL_ID` in both workflow files with the actual credential ID from n8n.

### LinkedIn (when ready)
| Variable | Description |
|----------|-------------|
| `MAXPROMO_LINKEDIN_TOKEN` | LinkedIn OAuth 2.0 access token (requires LinkedIn Page admin) |
| `MAXPROMO_LINKEDIN_ORG_ID` | LinkedIn Organization URN numeric ID |

---

## Setup Steps (in order)

1. **Run Neon schema** — execute `neon-schema.sql` against your Neon database to create the three tables.

2. **Create Neon credential in n8n** — add a Postgres credential with your Neon connection string. Note the credential ID and update both workflow JSON files (replace `NEON_CREDENTIAL_ID`).

3. **Set env vars** — add all Meta, YouTube, and Anthropic variables to n8n environment.

4. **Import workflows** — import both JSON files via n8n → Workflows → Import from file.

5. **Test content publishing** — insert a test row into `social_posts` with `status = 'approved'` and trigger the workflow manually.

6. **Test comment engagement** — trigger manually and verify Facebook and Instagram comments are fetched and replied to.

7. **Activate both workflows** — toggle Active once testing passes.

---

## Content Schedule

The trigger runs at **08:00** and **19:00** daily.

Intended publishing cadence: **Mon / Wed / Fri at 8am, 12pm, 5pm**.

To match exactly, update the Schedule Trigger node to add a 12:00 interval and restrict to Mon/Wed/Fri using a Time Window Filter condition. Current setup publishes any approved post within the time window that matches `scheduled_window` (MORNING / EVENING / ANY).

---

## How to Enable LinkedIn

1. Create a LinkedIn Developer App with `w_member_social` and `r_organization_social` scopes.
2. Generate an Organization Page access token.
3. Add `MAXPROMO_LINKEDIN_TOKEN` and `MAXPROMO_LINKEDIN_ORG_ID` to n8n env.
4. In **workflow-content-publishing**: find node `Post to LinkedIn (DISABLED — setup pending)`, remove `"disabled": true`, save.
5. In **workflow-comment-engagement**: find node `Send LinkedIn Reply (DISABLED — setup pending)`, remove `"disabled": true`, update the URL with the actual `ugcPost` URN format for your page, save.

---

## DRIMP Fixes Baked In

These bugs from the original DRIMP workflows are corrected in the MaxPromo versions:

| Issue | Fix applied |
|-------|-------------|
| OpenAI dependency | Replaced with Anthropic Claude API (HTTP Request) |
| Claude response parsing | `Merge Caption` and `Merge Reply` nodes parse `content[].text` array correctly |
| Google Sheets as queue | Replaced with Neon Postgres `executeQuery` nodes |
| Instagram disabled | Instagram is now active with proper 2-step publish flow (create container → publish) |
| Hardcoded page IDs and tokens | All replaced with `$env.*` references |
| Google Sheets field names (Approved, Posted, Platform) | Replaced with Neon column names (`status`, `platform`) throughout |
| Filter node field mismatch | Removed Sheets-specific filter node — SQL query handles filtering at source |

---

## Database Tables

- **social_posts** — content queue. Insert rows with `status = 'approved'` to schedule posts.
- **social_comments** — engagement log. Auto-populated by comment engagement workflow.
- **social_rotation** — sector rotation tracker for future content generation automation.
