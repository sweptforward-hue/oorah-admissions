# 06 — VAAD Workstream

Read `AGENTS.md` and `SPEC.md` first. Own VAAD voting UX/business logic while preserving the existing server-side transactional rules.

## Additional user requirement — configurable voting choices

The existing example choices in `SPEC.md` must become configurable through Admin.

The VAAD implementation must:

- read available active choices from the database/configuration
- prevent voting on deactivated choices for new votes
- preserve historical vote labels/identity
- keep authorization and duplicate-vote protection
- keep the existing 2-of-3 Accept behavior exactly as required unless the product specification explicitly says otherwise

Do not implement configurable choices as frontend-only state.

# **19\. VAAD System**

The VAAD consists of exactly three members in the normal workflow.

Administrators manage VAAD membership.

The system should support:

* adding a user as a VAAD member  
* removing VAAD membership  
* enabling/disabling contribution  
* enabling/disabling voting

Each VAAD member should have two separate toggles:

VAAD Member        \[ ON/OFF \]  
Can Contribute     \[ ON/OFF \]  
Can Vote           \[ ON/OFF \]

The permissions are independent.

For example:

VAAD Member \= ON  
Can Contribute \= ON  
Can Vote \= OFF

means the person is part of the VAAD but is not permitted to cast formal votes.

---

# **20\. VAAD Admin Interface**

On the Admin page, provide a VAAD management area.

Example:

VAAD MEMBERS

David Cohen  
VAAD Member       ON  
Can Contribute    ON  
Can Vote          ON

Sarah Levy  
VAAD Member       ON  
Can Contribute    ON  
Can Vote          ON

Michael Klein  
VAAD Member       ON  
Can Contribute    OFF  
Can Vote          ON

Ensure the interface prevents accidental permission changes.

Use confirmation where appropriate for high-impact changes.

---

# **21\. VAAD Voting**

Each kid should have a VAAD section.

Display the three VAAD members and their vote states.

For example:

VAAD REVIEW

David Cohen       ✓ Accept  
Sarah Levy        ✓ Accept  
Michael Klein     Pending

Votes: 2 / 3

STATUS: ACCEPTED

Voting options should be clearly defined.

At minimum the system needs an "Accept" decision.

If the organization later requires additional decisions, make the vote system extensible.

Possible choices:

* Accept  
* Reject  
* Abstain  
* Pending

Do not invent additional business rules without making them configurable.

---

# **22\. Automatic 2-of-3 Acceptance**

This is a critical business rule.

When two of the three authorized VAAD members have voted **Accept**, the system must automatically change the kid's status to:

**Accepted**

This must happen server-side.

Do not rely on a frontend JavaScript function alone.

Example:

Member 1 \= Accept  
Member 2 \= Accept  
Member 3 \= Pending

\=\> Automatically set status \= Accepted

The system should also:

1. Record the votes.  
2. Record the exact timestamps.  
3. Record the voters.  
4. Record the automatic status transition.  
5. Write an audit-log entry.  
6. Update the homepage/status display.  
7. Update any relevant Google Sheets export.  
8. Prevent duplicate votes by the same VAAD member for the same kid.  
9. Enforce voting permissions.

Make the vote count transactional so two simultaneous votes cannot cause inconsistent state.

---

# **23\. Status System**

Statuses must be configurable.

Administrators should be able to:

* add statuses  
* remove/deactivate statuses  
* rename statuses  
* reorder statuses  
* optionally change display color  
* define default status  
* determine whether a status is active  
* configure which status follows certain workflow events where appropriate

Possible defaults:

* New  
* Incomplete  
* Under Review  
* Interview  
* VAAD Review  
* Accepted  
* Rejected  
* Waitlisted  
* Withdrawn

These are examples, not requirements. Make status values configurable.

---

# **24\. Status History**

Every important status change must be recorded.

For each transition store:

* kid  
* previous status  
* new status  
* changed by  
* timestamp  
* reason/notes if applicable  
* whether the change was manual or automatic

Example:

August 18, 2026  
VAAD Review → Accepted  
Automatically triggered by 2/3 Accept votes

This is important for auditability.

---

# **55\. User Experience for VAAD Members**

A VAAD member should be able to quickly see:

* kids awaiting VAAD review  
* current votes  
* their own voting permissions  
* other members' vote completion state  
* supporting documents  
* transcript  
* chat  
* photos  
* voice notes

Make voting very clear.

Before submitting a vote, show an explicit confirmation.

After submission:

Your vote has been recorded.

Do not allow an unauthorized user to vote by directly calling an API endpoint.

---

# **56\. Vote Visibility**

Use a deliberate privacy model.

The application should display enough information for the VAAD process to function while avoiding unnecessary exposure.

At minimum authorized VAAD users should be able to see:

* member names  
* whether each member has voted  
* vote result according to configured policy  
* final status

Make the implementation easy to modify later if Oorah wants secret ballots.

---

# **57\. Automatic Acceptance UI**

When the second Accept vote is recorded:

Display a clear notification:

Application Accepted

Two of three VAAD members have voted to Accept this application.

Status has automatically changed to Accepted.

Add an audit record.

Do not require an administrator to manually press "Accept."

---

# **58\. Admin Status Override**

Admins should have the ability to manually change status.

However, when an Admin overrides an automatically generated status, preserve that fact in the audit log.

Example:

Automatic:  
VAAD Review → Accepted  
Reason: 2/3 Accept votes

Later manual override:  
Accepted → Waitlisted  
Changed by: Admin  
Reason: ...

Do not erase the historical event.

---

# **68\. VAAD Page Example**

VAAD REVIEW

John Smith  
Application \#1042

David Cohen  
Can Contribute: YES  
Can Vote: YES  
Vote: ACCEPT

Sarah Levy  
Can Contribute: YES  
Can Vote: YES  
Vote: ACCEPT

Michael Klein  
Can Contribute: YES  
Can Vote: YES  
Vote: PENDING

\----------------------------------  
2 / 3 Accept votes

STATUS: ACCEPTED

---

# **69\. Admin VAAD Example**

VAAD MEMBERS

┌─────────────────────────────────────────────┐  
│ David Cohen                                 │  
│                                             │  
│ VAAD Member       \[ ON \]                    │  
│ Can Contribute    \[ ON \]                    │  
│ Can Vote          \[ ON \]                    │  
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐  
│ Sarah Levy                                  │  
│                                             │  
│ VAAD Member       \[ ON \]                    │  
│ Can Contribute    \[ ON \]                    │  
│ Can Vote          \[ ON \]                    │  
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐  
│ Michael Klein                               │  
│                                             │  
│ VAAD Member       \[ ON \]                    │  
│ Can Contribute    \[ OFF \]                   │  
│ Can Vote          \[ ON \]                    │  
└─────────────────────────────────────────────┘

---

