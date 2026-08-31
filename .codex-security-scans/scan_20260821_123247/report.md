# Security Review: Onoja217/career-care-center

## Scope

Repository-wide static security review of tracked application source, Supabase functions and migrations, deployment configuration, and security-sensitive client flows.

- Scan mode: repository
- Target kind: git_worktree
- Target ID: career-care-center-f946ed45
- Revision: f946ed4586aa05b8d804ccbff1a5e651b7d7b232
- Snapshot digest: codex-security-snapshot/v1:sha256:878b366f5596a00cf0371748ad076368e913f6a9cffc3e47b9f1e57fc487ebf0
- Inventory strategy: repository
- Included paths: .
- Excluded paths: .git/, node_modules/, dist/, .env, .env.local, career-care-center
- Runtime or test status: not recorded

Limitations and exclusions:
- No runtime penetration testing or external service probing was performed.
- Worker capacity was three usable slots rather than the recommended six.
- Excluded node_modules/: Vendored dependencies were excluded from source audit; lockfile and manifest were reviewed structurally.
- Excluded .env\*: Local secret-bearing environment files were intentionally not read.
- Excluded public/\*.png: Binary brand and media assets have no executable security surface.

### Scan Summary

| Field | Value |
| --- | --- |
| Reportable findings | 7 |
| Severity mix | high: 2, medium: 4, low: 1 |
| Confidence mix | high: 7 |
| Coverage | partial |
| Validation mode | Independent static source validation |

Canonical artifacts: `scan-manifest.json`, `findings.json`, and `coverage.json`. This report is a deterministic projection of those files.

## Threat Model

A public Vite application uses Supabase Auth, PostgREST/RLS, Storage, and service-role Edge Functions for career applications, donations, contact intake, administration, and email workflows.

### Assets

- User and administrator identities
- Donor and partnership PII
- Applications and contact messages
- Authorization roles and suspension state
- Payment-provider and email-provider capacity
- Supabase service-role authority

### Trust Boundaries

- Internet caller to browser application
- Browser/anonymous key to Supabase RLS
- Public request to Edge Function
- Edge Function to service-role database client
- Edge Function to Paystack and Resend

### Attacker Capabilities

- Unauthenticated requests using the public project credentials
- Ordinary authenticated account
- Suspended administrator retaining an unexpired session
- Automation of public submission endpoints

### Security Objectives

- Enforce suspension and role authorization server-side
- Keep operational PII staff-only
- Prevent automated resource amplification
- Require consent for subscriptions
- Protect payment and email workflows

### Assumptions

- Tracked Supabase migrations represent the production policy state
- Configured JWT verification is enabled for functions marked verify_jwt=true
- Public anonymous keys are available to browser users by design

## Findings

| Finding | Severity | Confidence | Detailed write-up |
| --- | --- | --- | --- |
| [Anonymous users can read all donor records and financial metadata](#finding-1) | high | high | inline below |
| [Suspended administrators retain broad privileged access](#finding-2) | high | high | inline below |
| [Public application endpoint bypasses the account requirement and leaks application status](#finding-3) | medium | high | inline below |
| [Donation initialization is an unmetered database and payment-provider operation](#finding-4) | medium | high | inline below |
| [Public contact intake permits unbounded database and notification amplification](#finding-5) | medium | high | inline below |
| [Anonymous users can read all partnership inquiries](#finding-6) | medium | high | inline below |
| [Newsletter endpoint can reactivate unsubscribed addresses without consent](#finding-7) | low | high | inline below |

### Confidence Scale

| Label | Meaning |
| --- | --- |
| high | Direct evidence supports the finding with no material unresolved blocker. |
| medium | Evidence supports a plausible issue, but material runtime or reachability proof remains. |
| low | Evidence is incomplete and the item is retained only for explicit follow-up. |

<a id="finding-1"></a>

### [1] Anonymous users can read all donor records and financial metadata

| Field | Value |
| --- | --- |
| Severity | high |
| Confidence | high |
| Confidence rationale | The effective migration sequence explicitly grants anon SELECT USING (true), and later hardening changes only INSERT. |
| Category | sensitive-data-exposure |
| CWE | CWE-862, CWE-200 |
| Affected lines | supabase/migrations/20260626052737_create_ccc_schema.sql:372-383, supabase/migrations/20260628001529_fix_rls_infinite_recursion.sql:269-270, supabase/migrations/20260701000851_security_rls_policy_hardening.sql:18-29 |

#### Summary

An unconditional anon SELECT policy exposes names, emails, phones, organizations, donation amounts, frequency, status, and messages through PostgREST.

#### Root Cause

A permissive public SELECT policy was introduced for an operational table containing donor PII and never removed.

#### Validation

PostgreSQL permissive policies are OR-combined, so the admin-read policy cannot narrow the unconditional public policy.

Validation method: Effective migration-order analysis

- **Status:** confirmed

#### Dataflow

Public anon key -\> donations SELECT -\> USING (true) -\> PII response

- **Source:** Anonymous database request

- **Sink:** Donations table

- **Outcome:** Donor PII disclosure

#### Reachability

No authentication is required.

- **Attacker:** Internet user

- **Entry point:** Supabase REST API

- **Sink:** donations SELECT

- **Outcome:** Bulk disclosure

#### Severity

**High** — Unauthenticated, low-complexity enumeration exposes sensitive donor PII and financial relationships across all records.

Additional runtime or deployment evidence could raise or lower this severity.

#### Remediation

Drop donations_select_public. Allow SELECT only to authenticated administrators through a suspension-aware admin check; expose only de-identified aggregates through a separate narrow view if public totals are needed.

<a id="finding-2"></a>

### [2] Suspended administrators retain broad privileged access

| Field | Value |
| --- | --- |
| Severity | high |
| Confidence | high |
| Confidence rationale | Direct source review shows is_admin reads only app metadata and admin-update-user-role omits the suspension check used by a sibling privileged function. |
| Category | broken-access-control |
| CWE | CWE-284 |
| Affected lines | supabase/migrations/20260807041000_add_super_admin_and_assign_roles.sql:9-27, supabase/functions/admin-update-user-role/index.ts:23-40, supabase/functions/send-contact-reply/index.ts:53-59 |

#### Summary

The central admin authorization helper and role-management endpoint trust signed role metadata without enforcing profiles.is_suspended, allowing a suspended admin with a live session to retain database and role-management privileges.

#### Root Cause

Administrative authorization is derived from role metadata without consulting the account suspension state.

#### Validation

The same suspended identity remains accepted by is_admin-backed RLS and can reach auth.admin.updateUserById through the role endpoint.

Validation method: Static source trace

- **Status:** confirmed

Counterevidence and remaining uncertainty:
- send-contact-reply correctly checks is_suspended, demonstrating the intended control, but that check is not centralized.

#### Dataflow

Valid suspended-admin JWT -\> app_metadata role check -\> service-role user update

- **Source:** Bearer token

- **Sink:** auth.admin.updateUserById

- **Outcome:** Durable role modification

#### Reachability

Directly reachable while the suspended administrator session remains valid.

- **Attacker:** Suspended administrator

- **Entry point:** admin-update-user-role

- **Sink:** Role mutation

- **Outcome:** Continued privileged access

#### Severity

**High** — A constrained attacker who previously held admin access can create durable replacement admins and continue accessing admin-protected data after suspension.

Additional runtime or deployment evidence could raise or lower this severity.

#### Remediation

Make the central authorization check require an unsuspended profile and agreement between profile and signed metadata roles. Apply it consistently to every admin RLS policy and privileged Edge Function; revoke sessions when suspending an account.

<a id="finding-3"></a>

### [3] Public application endpoint bypasses the account requirement and leaks application status

| Field | Value |
| --- | --- |
| Severity | medium |
| Confidence | high |
| Confidence rationale | Invalid authentication explicitly falls through to userId=null and the duplicate response embeds existing.status. |
| Category | missing-authentication |
| CWE | CWE-306, CWE-203, CWE-770 |
| Affected lines | src/App.tsx:101-109, supabase/functions/submit-application/index.ts:28-35, supabase/functions/submit-application/index.ts:62-73, supabase/functions/submit-application/index.ts:76-104 |

#### Summary

The UI requires signup, but the service-role endpoint accepts missing or invalid authentication, creates two rows per application, and reveals whether a supplied email/program pair exists plus its workflow status.

#### Root Cause

The account requirement exists only in client routing; the privileged backend treats authentication as optional and returns distinguishable private duplicate state.

#### Validation

A direct caller bypasses React routing; duplicate checks and inserts use service-role authority.

Validation method: Client-to-function source trace

- **Status:** confirmed

#### Dataflow

Unauthenticated request -\> optional auth fallthrough -\> service-role duplicate query/insert

- **Source:** Public HTTP request

- **Sink:** Applications and status logs

- **Outcome:** Unauthorized submission, flooding, and status disclosure

#### Reachability

Directly reachable without using the guarded UI.

- **Attacker:** Internet user

- **Entry point:** submit-application

- **Sink:** Service-role application operations

- **Outcome:** Account-control bypass

#### Severity

**Medium** — The public path defeats the intended registration control, supports review-workflow flooding, and leaks limited applicant state to an attacker who knows an email and public program ID.

Additional runtime or deployment evidence could raise or lower this severity.

#### Remediation

Require and validate a user bearer token, derive applicant identity and email from that user/profile, return a generic duplicate response without status, add rate limits and bot controls, and replace permissive direct INSERT policies with authenticated owner-only policies.

<a id="finding-4"></a>

### [4] Donation initialization is an unmetered database and payment-provider operation

| Field | Value |
| --- | --- |
| Severity | medium |
| Confidence | high |
| Confidence rationale | The service-role insert and Paystack call are directly reachable with no rate, challenge, quota, or idempotency control. |
| Category | resource-exhaustion |
| CWE | CWE-770 |
| Affected lines | supabase/functions/process-donation/index.ts:33-68, supabase/functions/process-donation/index.ts:95-99, supabase/functions/process-donation/index.ts:134-145 |

#### Summary

Anonymous callers can create unlimited pending donation records and Paystack transaction initializations; failed or abandoned initializations retain records.

#### Root Cause

A public request triggers privileged persistence and a paid external-provider operation without abuse controls or idempotency.

#### Validation

Per-request amount and field validation do not restrict request volume; no completion webhook or pending-record expiry was found.

Validation method: Static source trace

- **Status:** confirmed

#### Dataflow

Anonymous JSON -\> service-role donation insert -\> Paystack secret-backed initialization

- **Source:** Public HTTP request

- **Sink:** Database and Paystack API

- **Outcome:** Resource consumption and reporting pollution

#### Reachability

Reachable with public browser credentials.

- **Attacker:** Internet bot

- **Entry point:** process-donation

- **Sink:** Paystack initialization

- **Outcome:** Unbounded provider operations

#### Severity

**Medium** — Automation consumes database, function, provider, and operational capacity without compromising payment completion integrity.

Additional runtime or deployment evidence could raise or lower this severity.

#### Remediation

Apply edge rate limits and bot proof before insertion, use idempotency keys and pending-row expiry, monitor provider volume, revoke redundant direct public donation INSERT, and implement signed server-side Paystack reconciliation.

<a id="finding-5"></a>

### [5] Public contact intake permits unbounded database and notification amplification

| Field | Value |
| --- | --- |
| Severity | medium |
| Confidence | high |
| Confidence rationale | The source contains no application-level abuse control before either privileged write. |
| Category | resource-exhaustion |
| CWE | CWE-770 |
| Affected lines | supabase/functions/contact-form/index.ts:17-47, supabase/functions/contact-form/index.ts:61-72, supabase/migrations/20260701000851_security_rls_policy_hardening.sql:8-17 |

#### Summary

Every unauthenticated request can create a service-role contact row and one attacker-controlled notification per active administrator without rate limiting, bot proof, or deduplication.

#### Root Cause

Anonymous intake is unmetered and privileged writes amplify each request; direct public INSERT also bypasses any future function-only control.

#### Validation

Basic field limits bound each row but do not bound request count or fan-out.

Validation method: Static source trace

- **Status:** confirmed

#### Dataflow

Anonymous JSON -\> service-role contact insert -\> admin query -\> notification fan-out

- **Source:** Public HTTP request

- **Sink:** contact_messages and notifications

- **Outcome:** Storage and workflow exhaustion

#### Reachability

Reachable with public browser credentials.

- **Attacker:** Internet bot

- **Entry point:** contact-form

- **Sink:** Service-role writes

- **Outcome:** Amplified spam

#### Severity

**Medium** — Low-complexity automation can consume storage and make the administrator inbox unusable.

Additional runtime or deployment evidence could raise or lower this severity.

#### Remediation

Add edge rate limits, bot challenges, burst/deduplication controls, and monitoring before service-role work. Revoke direct public table INSERT and funnel submissions through the controlled endpoint; aggregate admin notifications.

<a id="finding-6"></a>

### [6] Anonymous users can read all partnership inquiries

| Field | Value |
| --- | --- |
| Severity | medium |
| Confidence | high |
| Confidence rationale | The schema and unconditional anon SELECT policy directly establish exposure. |
| Category | sensitive-data-exposure |
| CWE | CWE-862, CWE-200 |
| Affected lines | supabase/migrations/20260626052737_create_ccc_schema.sql:401-410, supabase/migrations/20260628001529_fix_rls_infinite_recursion.sql:291-292 |

#### Summary

The partners table mixes public presentation data with private inquiry names, emails, organizations, interests, and messages, then exposes every row publicly.

#### Root Cause

Public partner profiles and private partnership submissions share one table protected by an unconditional public SELECT policy.

#### Validation

No later migration removes or filters partners_select_public.

Validation method: Effective migration-order analysis

- **Status:** confirmed

#### Dataflow

Public anon key -\> partners SELECT -\> USING (true) -\> inquiry response

- **Source:** Anonymous database request

- **Sink:** Partners table

- **Outcome:** Inquiry disclosure

#### Reachability

No authentication is required.

- **Attacker:** Internet user

- **Entry point:** Supabase REST API

- **Sink:** partners SELECT

- **Outcome:** Bulk disclosure

#### Severity

**Medium** — Unauthenticated bulk disclosure exposes business contact information and private proposal content.

Additional runtime or deployment evidence could raise or lower this severity.

#### Remediation

Separate submitted inquiries from approved public partner profiles. Remove public SELECT from the inquiry table and expose only reviewed publication fields from a dedicated table or filtered view.

<a id="finding-7"></a>

### [7] Newsletter endpoint can reactivate unsubscribed addresses without consent

| Field | Value |
| --- | --- |
| Severity | low |
| Confidence | high |
| Confidence rationale | The endpoint sets is_active=true based solely on a syntactically valid email string. |
| Category | missing-authorization |
| CWE | CWE-862 |
| Affected lines | supabase/functions/newsletter-subscribe/index.ts:32-39, supabase/functions/newsletter-subscribe/index.ts:44-60 |

#### Summary

Any anonymous caller who supplies another person's email can create an active subscription or reverse an inactive state without proving mailbox control.

#### Root Cause

Subscription activation does not require a single-use confirmation proving control of the target mailbox.

#### Validation

Possession of the email string is the only requirement for initial activation or reactivation.

Validation method: Static source trace

- **Status:** confirmed

#### Dataflow

Victim email -\> public endpoint -\> service-role insert/update is_active=true

- **Source:** Public HTTP request

- **Sink:** newsletter_subscribers

- **Outcome:** Consent-state corruption

#### Reachability

No authentication or mailbox proof is required.

- **Attacker:** Internet user

- **Entry point:** newsletter-subscribe

- **Sink:** Subscription state

- **Outcome:** Unauthorized enrollment/reactivation

#### Severity

**Low** — The issue corrupts consent state and enables list pollution; no active campaign sender was established in repository source.

Additional runtime or deployment evidence could raise or lower this severity.

#### Remediation

Implement confirmed opt-in with single-use expiring tokens. Store new requests as pending and never reactivate an unsubscribed address without fresh mailbox confirmation; add rate limiting and non-enumerating responses.

## Reviewed Surfaces

| Surface | Risk Area | Outcome | Notes |
| --- | --- | --- | --- |
| Supabase RLS and database authorization | authorization and privacy | Reported | No additional canonical notes were recorded. |
| Administrator identity, roles, and suspension | privilege management | Reported | No additional canonical notes were recorded. |
| Public and privileged Edge Functions | abuse and service-role boundary | Reported | No additional canonical notes were recorded. |
| Donation and Paystack initialization | resource amplification | Reported | No additional canonical notes were recorded. |
| Resend webhooks and contact replies | webhook integrity and injection | No issue found | No additional canonical notes were recorded. |
| Supabase media storage and uploads | object ownership and file validation | No issue found | No additional canonical notes were recorded. |
| React rendering, route guards, and redirects | XSS and client-side access control | No issue found | No additional canonical notes were recorded. |
| Committed credentials and security headers | configuration | No issue found | No additional canonical notes were recorded. |
| Third-party dependency advisories | supply chain | Needs follow-up | Offline source review did not query current vulnerability databases. |

## Open Questions And Follow Up

- Are platform-level rate limits or bot controls configured outside this repository?
  - Follow-up prompt: Review Supabase/Vercel firewall, rate-limit, and challenge configuration.
- Current advisory lookup requires network-backed package intelligence and was outside the offline source-review phase.
  - Follow-up prompt: Review deferred unit dependency-advisory-lookup and close its stated proof gap. Paths: package.json, package-lock.json. Surfaces: surface_dependencies.
- No production penetration testing was authorized; findings rely on the tracked effective migration sequence.
  - Follow-up prompt: Review deferred unit runtime-policy-verification and close its stated proof gap. Paths: supabase/migrations/. Surfaces: surface_rls, surface_admin_auth.
