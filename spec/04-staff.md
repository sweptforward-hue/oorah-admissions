# 04 — Staff Workstream

Read `AGENTS.md` and `SPEC.md` first. Own the dedicated Staff section and staff-management UX while preserving the existing permissions model.

## Additional user requirements

Create a dedicated **Staff** section separate from Campers.

The Staff section should expose the existing staff/user management concepts from `SPEC.md`, including active/deactivated state, roles, permissions, VAAD membership, Can Contribute, and Can Vote. Preserve historical attribution when a staff user is deactivated.

# **3\. Terminology**

Use these terms consistently throughout the interface:

* **Kid** \= an individual child/application  
* **Admin** \= user with full administrative privileges  
* **VAAD** \= the three-member review/voting board  
* **VAAD Member** \= a user designated by an Admin as a VAAD member  
* **Can Contribute** \= VAAD permission allowing the user to contribute to the VAAD process/discussion  
* **Can Vote** \= VAAD permission allowing the user to cast a formal VAAD vote  
* **Status** \= current stage of the admissions process  
* **Chat** \= shared conversation attached to a kid/application  
* **Voice Note** \= uploaded audio associated with a kid or chat  
* **Transcript** \= uploaded transcript document associated with a kid

Use "VAAD" exactly as spelled: V-A-A-D.

---

# **5\. Main Navigation**

Create a primary navigation structure similar to:

* Home / Kids  
* VAAD  
* Admin  
* optionally Reports / Exports if useful  
* User profile/account menu

Do not expose Admin functionality to ordinary users.

The navigation should adapt according to permissions.

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

# **28\. Access Control**

A major requirement is that this application may contain sensitive admissions data.

Implement authorization carefully.

A user must only be able to access kids they are authorized to access.

At minimum distinguish:

* authenticated user  
* admin  
* ordinary staff  
* VAAD member  
* contributor  
* voter

Enforce authorization server-side and at the database layer where possible.

Do not expose unrestricted database credentials to the browser.

Do not trust user-supplied kid IDs, user IDs, or role claims without validating them.

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

# **59\. Data Model for Attribution**

Every user-created object must identify its creator/uploader when appropriate.

Examples:

* chat message → user  
* document → uploader  
* photo → uploader  
* voice note → uploader  
* vote → VAAD member  
* status change → actor  
* export → requester

Historical attribution must survive user deactivation.

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

