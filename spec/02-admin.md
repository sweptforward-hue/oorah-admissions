# 02 — Admin Workstream

Read `AGENTS.md` and `SPEC.md` first. Own Admin UX and server-side operations for administrative configuration and management.

## Additional user requirements

### Configurable voting choices

Admin must be able to:

- add a voting choice
- rename/edit a voting choice
- deactivate/reactivate a voting choice
- reorder voting choices
- preserve historical votes when choices change
- see clear confirmation/warnings for high-impact changes

The vote UI must consume the configured choices. Do not hardcode the complete choice list.

### Staff section

Support a distinct Staff administration experience, while preserving the existing role, permission, VAAD, and audit requirements in `SPEC.md`.

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

# **25\. Admin Page**

Create an administrator control center.

Suggested sections:

* Users  
* Roles  
* VAAD  
* Statuses  
* Permissions  
* Audit Log  
* Google Drive export/configuration  
* Google Sheets export/configuration  
* System settings

Only administrators can access these sections.

---

# **26\. User Management**

Admins must be able to:

* add users  
* remove/deactivate users  
* change roles  
* assign permissions  
* manage VAAD membership  
* enable/disable contributor permission  
* enable/disable voting permission

When possible, prefer deactivation over destructive deletion so historical audit records remain meaningful.

When a user is removed/deactivated, do not erase historical chat attribution.

Past messages should continue to display the original user's name.

---

# **27\. Roles and Permissions**

At minimum support these conceptual roles:

## **Admin**

Full access.

Can:

* create/delete/deactivate users  
* configure statuses  
* manage VAAD  
* manage permissions  
* view all kids  
* modify statuses  
* access audit logs  
* export data\\  
* manage application configuration

## **Staff / Standard User**

Can be configured by the Admin.

May:

* view assigned/authorized kids  
* upload files  
* upload voice notes  
* participate in chat  
* view documents

## **VAAD Member**

A user flagged as VAAD.

May have:

* contribution permission  
* voting permission

independently.

Create a flexible permission structure instead of hardcoding every possible behavior.

---

# **29\. Audit Log**

Create a comprehensive audit log.

Record important events including:

* account/kid creation  
* account deletion/deactivation  
* user creation  
* user deactivation  
* role changes  
* permission changes  
* document uploads  
* photo uploads  
* voice-note uploads  
* chat messages  
* edits  
* deletions  
* status changes  
* VAAD votes  
* automatic acceptance  
* exports  
* administrator configuration changes

Each audit record should include at minimum:

timestamp  
user  
action  
entity type  
entity ID  
metadata/context

Make audit records append-oriented.

Do not allow ordinary users to rewrite audit history.

---

# **54\. User Experience for the Admin**

An Admin should be able to understand system configuration quickly.

Admin page should clearly separate:

USER MANAGEMENT  
VAAD MANAGEMENT  
STATUS MANAGEMENT  
EXPORTS  
AUDIT LOG  
SYSTEM SETTINGS

Do not bury important controls several layers deep.

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

