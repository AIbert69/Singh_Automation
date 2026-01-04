# Singh Automation - Proposal Data Verification Workflow

## Purpose
This document defines the practical steps to verify proposal data before submission. Every proposal must pass this checklist to ensure accuracy and defensibility.

---

## 🔴 CRITICAL: Data That Must Be Verified Before Every Proposal

### 1. Past Performance Verification

For **each past performance reference** included in a proposal, verify:

| Field | Verification Method | Source Documents |
|-------|---------------------|------------------|
| **Contract Value** | Cross-reference against invoice totals or PO | Invoices, Purchase Orders, Signed Contract |
| **Period of Performance** | Confirm start/end dates match records | Contract, First/Last Invoice dates, Project folder timestamps |
| **Customer Name** | Ensure legal entity name is correct | Contract, Purchase Order header |
| **Scope/Deliverables** | Match what was actually delivered | Final project report, Acceptance documents, SOW |
| **Outcomes/Metrics** | Must have documented evidence | Customer emails, Test reports, Acceptance sign-off |
| **Reference Contact** | Confirm person still at company & willing to be called | Direct outreach - email or call |

#### Verification Steps:

```
□ Step 1: Pull project folder from archive
□ Step 2: Locate original contract or PO
□ Step 3: Sum all invoices to verify contract value
□ Step 4: Check first and last invoice dates against stated POP
□ Step 5: Review final deliverables list against what proposal claims
□ Step 6: Find documented outcomes (customer email, test data, final report)
□ Step 7: Contact reference POC to confirm they're available and willing
□ Step 8: Document verification in database with date and verifier name
```

#### Red Flags to Watch For:

- ⚠️ **Value mismatch**: Invoice total differs from contract value stated
- ⚠️ **Date conflicts**: Project folder dates don't match stated POP
- ⚠️ **Scope drift**: Final deliverables different from original SOW
- ⚠️ **Duplicate names**: Same project listed under different names
- ⚠️ **Missing metrics**: Outcomes claimed without documented evidence
- ⚠️ **Stale reference**: POC has left company or changed roles

---

### 2. Key Personnel Verification

For **each person** listed in a proposal:

| Field | Verification Method | Source |
|-------|---------------------|--------|
| **Current Employment** | Confirm still employed at Singh | HR/Payroll records |
| **Title** | Match current title | Org chart, HR system |
| **Certifications** | Verify cert is current and on file | Certificate copy, Issuing org verification |
| **Experience Claims** | Can be documented | Resume, LinkedIn, Project records |

#### Verification Steps:

```
□ Step 1: Confirm person is currently employed
□ Step 2: Verify current title matches proposal
□ Step 3: Check that resume is on file and current (updated within 12 months)
□ Step 4: Verify any certifications claimed are valid and not expired
□ Step 5: Confirm person is available for this contract (not overcommitted)
```

---

### 3. Certification Verification

**Current Verified Status (as of January 2026):**

| Certification | Status | Expiration | Can Claim? |
|--------------|--------|------------|------------|
| FANUC Authorized System Integrator | ✅ ACTIVE | March 31, 2026 | **YES** |
| Universal Robots CSP | ❌ LAPSED | December 2024 | **NO - DO NOT CLAIM** |
| SAM.gov Registration | ✅ ACTIVE | Check annually | **YES** |
| Small Business | ✅ ACTIVE | Per SAM.gov | **YES** |
| ISO 9001 | ❌ NOT HELD | N/A | **NO** |

⚠️ **CRITICAL**: Do NOT claim Universal Robots CSP in proposals - certification lapsed December 2024.

#### Before Each Proposal:

```
□ Check FANUC ASI expiration date (currently 3/31/2026)
□ Verify SAM.gov registration is active
□ Confirm any other certs claimed are current
```

---

### 4. Opportunity Submission Verification

For **each opportunity**, document and verify:

| Field | Where to Find It | Verification |
|-------|------------------|--------------|
| **Posting URL** | SAM.gov, Grants.gov, etc. | Click link to confirm still active |
| **Solicitation Number** | Posting header | Copy exactly - no typos |
| **Submission Email** | Section L or Instructions | Verify email format is valid |
| **Submission Portal** | Instructions to Offerors | Create account, test login |
| **Deadline** | Cover page or Section L | Note timezone - usually Eastern |
| **Page Limits** | Section L | Highlight in instructions |
| **File Format** | Section L | PDF? Word? Separate volumes? |
| **Contracting Officer** | Posting | Name, email, phone |

#### Submission Checklist (Day Before Deadline):

```
□ Re-click posting URL - confirm opportunity still open
□ Verify deadline hasn't changed (check for amendments)
□ Test submission method:
   - If email: send test to yourself with same attachments
   - If portal: log in and review upload interface
□ Confirm file sizes under any limits
□ Verify all volumes/attachments are named correctly
□ Screenshot submission confirmation
```

---

## 📋 Pre-Submission Verification Checklist

### Final Review (Required Before Every Submission)

```
PAST PERFORMANCE
□ All contract values verified against invoices/POs
□ All periods of performance verified against project records
□ All outcomes have documented evidence
□ All references contacted and confirmed available
□ No expired or lapsed certifications claimed

KEY PERSONNEL
□ All personnel currently employed
□ All titles current and accurate
□ All certifications current
□ Resumes on file and updated

CERTIFICATIONS
□ FANUC ASI status confirmed current
□ NO Universal Robots CSP claimed (lapsed)
□ SAM.gov active

SUBMISSION
□ Posting URL verified active today
□ Submission method confirmed
□ Deadline/timezone confirmed
□ File format requirements met
□ Page limits respected

SIGNOFF
□ Verified by: _____________
□ Date: _____________
□ Any exceptions noted: _____________
```

---

## 🗂️ Document Location Reference

### Where to Find Verification Documents:

| Document Type | Location |
|--------------|----------|
| Project Folders | `[Define your archive location]` |
| Invoices | `[Accounting system / folder]` |
| Contracts/POs | `[Contracts folder]` |
| Certifications | `[Certs folder]` |
| Resumes | `[HR folder]` |
| Customer Correspondence | `[CRM / Email archive]` |

---

## 🚨 What To Do When Data Is Missing or Conflicting

### Missing Data:
1. **Do not guess** - leave field blank or mark as "TBD"
2. Document what's missing in the verification notes
3. Attempt to obtain from original source
4. If cannot verify before deadline, consider:
   - Omitting that reference entirely
   - Using different, verifiable reference
   - Noting uncertainty in internal records

### Conflicting Data:
1. Document both values and sources
2. Determine which source is authoritative:
   - Signed contract > PO > Quote
   - Final invoice > Interim invoices
   - Customer acceptance doc > Internal records
3. Use the authoritative value
4. Note the conflict for future reference

### Reference Unavailable:
1. Try alternate contacts at same company
2. Check LinkedIn for current role
3. If cannot reach, consider different reference
4. **Never list a reference you haven't contacted**

---

## 📊 Current Data Status: Lippert Window Automation Project

**Project**: Window Automation - 5-Robot Manufacturing Cell
**Customer**: Lippert Components
**Status**: PARTIALLY VERIFIED

| Field | Value | Verified? | Action Needed |
|-------|-------|-----------|---------------|
| Contract Value | $1,600,000 | ❌ NO | Verify against invoices/PO |
| Period of Performance | Jan 2024 - Sept 2024 | ✅ YES | Confirmed in source doc |
| Location | Bristol, Indiana | ✅ YES | Confirmed |
| Scope | 5-robot cell | ✅ YES | Confirmed |
| Outcomes | Productivity, quality, cost efficiency | ❌ NO | Need specific metrics |
| Reference: Tim Widner | VP Glass, Twidner@lci1.com | ❓ PENDING | Need to confirm he'll take calls |

**Before using in next proposal:**
```
□ Pull Lippert invoices - verify $1.6M total
□ Document specific outcomes (cycle time, throughput, etc.)
□ Email/call Tim Widner to confirm reference approval
```

---

## 📝 Key Personnel Current Status

| Name | Role | Resume on File? | Action Needed |
|------|------|-----------------|---------------|
| Aditya Kurde | Controls Engineer | ❌ NO | Collect resume |
| Bhargav Nandan Gali | Vision Engineer | ❌ NO | Collect resume |
| Mayur Joshi | Machine Builder | ❌ NO | Collect resume |
| Sonny Singh | Machine Builder | ❌ NO | Collect resume |
| Mangay Peram | Project Manager | ❌ NO | Collect resume |

**Action**: Collect current resumes from all key personnel before next proposal.

---

*Last Updated: January 3, 2026*
