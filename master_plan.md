# **Oorah Admissions Management System — Full Product, UX, Architecture, Database, Permissions, and Implementation Specification**

You are an expert product architect, UX designer, full-stack engineer, database architect, security engineer, and DevOps engineer. Build a production-quality web application for **Oorah Admissions**.

The application is an admissions-management system used by multiple staff members to manage applications for individual children ("kids"), communicate about each child, collect application materials, manage transcripts and voice notes, and conduct a formal VAAD review and voting process.

The system must be designed to be easy for non-technical staff to use, highly organized, auditable, permission-aware, and inexpensive to operate.

Do not build a generic CRM. Build the application specifically around the workflow described below.

---

# **1\. Core Technology Direction**

Use the following architecture unless there is a compelling technical reason to make a change.

## **Frontend and application**

Use:

* **Next.js**  
* React  
* TypeScript  
* App Router  
* Responsive web design  
* Deploy on **Vercel**

The application should be a single modern web application with authenticated pages, server-side logic/API routes where appropriate, and a clean component architecture.

## **Database**

Use a relational database.

Preferred option:

* **Supabase Postgres**

The system should be designed to work within the free/lowest-cost Supabase tier wherever practical.

Do not assume that Supabase Storage must be used.

The large files in this application are primarily:

* pictures  
* voice recordings  
* uploaded forms/documents  
* transcripts

The application should minimize database storage usage by keeping actual large files in Google Drive where feasible and keeping only metadata/file references in the database.

## **Authentication**

Use:

* Supabase Auth  
* Google OAuth / "Sign in with Google"  
* Email-based sign in as an alternative

Authentication determines who the user is.

Authorization determines what the user is allowed to see or do.

Never rely solely on frontend permission checks. Enforce important access-control rules on the server/database as well.

## **Large-file storage**

Use **Google Drive as the external file storage location** for large application assets.

Google Drive is an asset repository/export destination rather than the application's primary database.

Store files such as:

* photographs  
* voice notes  
* application forms  
* transcripts  
* other uploaded documents

The application database should store metadata and Google Drive file IDs/identifiers rather than embedding large files directly into database rows.

Prefer an organization-controlled Google Drive/Google Workspace account rather than personal employee drives.

## **Google Sheets**

Google Sheets should be available as an **export/reporting destination**.

Do not use Google Sheets as the primary database.

The relational database is the source of truth.

The system should be able to export appropriate application data into Google Sheets.

---

# **2\. Main Product Goal**

The goal is to give Oorah staff one central website where they can:

1. Create and manage an account for each child.  
2. Search and browse all children.  
3. See each child's current admissions status.  
4. Open a dedicated page for each child.  
5. Upload forms and other documents.  
6. Upload photographs.  
7. Upload multiple voice notes.  
8. Add captions to voice notes.  
9. See who uploaded every file or voice note.  
10. Maintain a shared, permanent conversation/chat for each child.  
11. Allow multiple authorized users to contribute to that chat.  
12. Preserve the identity of the person who posted each message.  
13. Preserve timestamps and audit history.  
14. Support formatting in chat.  
15. Potentially support voice notes directly inside chat.  
16. Upload and manage transcripts.  
17. Manage VAAD membership.  
18. Give VAAD members separate contribution and voting permissions.  
19. Allow three VAAD members to vote on an application.  
20. Automatically accept a child when two of the three VAAD members vote to accept.  
21. Allow administrators to define and change application statuses.  
22. Allow administrators to add and remove users.  
23. Allow administrators to change user permissions.  
24. Maintain an audit history of important actions.  
25. Export application data/files to Google Drive.  
26. Export structured information to Google Sheets.  
27. Make all of this easy enough for non-technical admissions staff to use.

---

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

# **4\. Overall User Experience**

The interface should feel like a modern internal admissions management application.

Priorities:

1. Extremely simple navigation.  
2. Minimal clutter.  
3. Large clear actions.  
4. Obvious statuses.  
5. Easy search.  
6. Easy file upload.  
7. Clear attribution of all activity.  
8. Strong auditability.  
9. Responsive design.  
10. Fast loading.  
11. Accessibility.  
12. Excellent empty states and error messages.

The UI should look professional and trustworthy rather than like an engineering dashboard.

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

# **6\. Homepage / Kids Dashboard**

The homepage is the main admissions dashboard.

It should contain:

## **Header**

Large page title:

**Oorah Admissions**

Provide a prominent green button:

**\+ New Kid**

The user specifically wants the New Account/New Kid action to be easy to find.

Use a strong green primary action.

## **Search**

Provide a prominent search bar:

**Search kids...**

Search should be able to search at least:

* kid name  
* application/kid ID  
* possibly email/contact information where appropriate

Search should be fast and support partial matches.

## **Kid list**

Display all kids in a table/list/card layout.

At minimum show:

* Kid name  
* ID  
* current status  
* last activity  
* optionally assigned users  
* optionally VAAD progress

The status should be visually prominent.

Example:

John Smith                     VAAD Review  
Sarah Cohen                    Accepted  
David Levy                     Incomplete  
Rachel Katz                    Interview

Allow the administrator to configure status options.

Clicking a kid opens that kid's dedicated page.

---

# **7\. Creating a New Kid**

The main page should have a highly visible green:

**\+ New Kid**

button.

Clicking it opens a simple form.

At minimum, collect:

* kid name  
* unique application/kid ID  
* any basic identifying/application information required by the organization

The system should automatically:

1. Create the kid record.  
2. Assign a unique internal ID.  
3. Create the kid's application page.  
4. Initialize default status.  
5. Create associated records needed for chat/files/VAAD.  
6. Make the kid appear on the homepage.

Do not require users to manually create a webpage.

A new kid record automatically gets its own URL/page.

Example:

/kids/1042

---

# **8\. Dedicated Kid Page**

Every kid must have a dedicated application workspace.

Design the page as a central hub for all information about that kid.

Suggested layout:

## **Header**

Show:

* kid name  
* application ID  
* current status  
* status history/control where permitted  
* key actions

Example:

John Smith  
Application \#1042

Status: VAAD Review

\[ Change Status \] \[ Export \] 

## **Main sections/tabs**

Use tabs or clearly separated sections such as:

* Overview  
* Chat  
* Documents  
* Photos  
* Voice Notes  
* Transcript  
* VAAD  
* Activity / Audit History

Keep navigation intuitive.

---

# **9\. Overview Section**

Show a concise summary of the application.

Include:

* basic information  
* current status  
* date created  
* last activity  
* assigned/authorized users  
* document completion indicators  
* transcript status  
* VAAD status  
* recent activity

Use clear visual indicators.

---

# **10\. Documents / Forms**

The application must support uploading forms and documents.

Users with appropriate permissions should be able to:

* upload a file  
* see filename  
* see file type  
* see upload date/time  
* see uploader  
* download/open the document  
* export/copy it to Google Drive  
* optionally replace/update the document where permitted

Database stores file metadata.

Google Drive stores the actual large file where applicable.

Do not store the entire binary file inside PostgreSQL.

Possible database record:

document\_id  
kid\_id  
uploaded\_by  
filename  
mime\_type  
drive\_file\_id  
drive\_url\_or\_reference  
created\_at  
updated\_at  
document\_type

Document types may include:

* Application Form  
* Parent Form  
* Medical/other organizational form  
* Transcript  
* Other

Allow administrators to customize document categories if appropriate.

---

# **11\. Photos**

Users should be able to upload one or multiple pictures.

The UI should display photos as a gallery.

For every photo show:

* image  
* filename if useful  
* uploader  
* date/time  
* optional caption  
* file status/location

Store the actual image externally rather than using the relational database as blob storage.

The application should maintain the Google Drive file ID.

When a photo needs to be displayed, use a secure mechanism to retrieve/display it.

Do not depend on making sensitive application photos public on the internet.

Avoid using permanent public "anyone with the link" URLs for sensitive material unless explicitly required and approved.

Prefer authenticated retrieval/access.

---

# **12\. Voice Notes**

This is one of the major features.

A kid may have **multiple voice notes**.

Each voice note must contain:

* audio file  
* uploader's name  
* uploader's user ID  
* timestamp  
* caption  
* duration if available  
* storage/file ID  
* associated kid  
* optional source/context

Example display:

Sarah Cohen  
August 18, 2026 · 4:42 PM

"Call with parents regarding transportation"

▶ Play  
2:14

The voice note must clearly identify who uploaded it.

Users should be able to:

* upload a voice note  
* optionally record directly in the browser if feasible  
* add/edit a caption if permitted  
* play it  
* see who uploaded it  
* see when it was uploaded  
* download/export it  
* export it to Google Drive

Support multiple voice notes without imposing an arbitrary small limit.

Use an HTML audio player or equivalent accessible audio control.

Because audio files are relatively large, do not store the audio binary directly in database text fields.

---

# **13\. Chat System**

Every kid should have a shared chat area.

The chat must be persistent and stored in the database.

It is NOT a temporary messaging box.

Any authorized user assigned/accessing that kid should be able to participate according to their role.

Every message must retain:

* message ID  
* kid ID  
* user ID  
* display name  
* timestamp  
* content  
* edit timestamp if edited  
* deletion state if applicable  
* attachment references  
* voice-note references

The chat must preserve traceability.

Users must always be able to see who posted a message.

Example:

David Cohen  
Today, 4:32 PM

I spoke with the family. They will send the remaining form tomorrow.

Never display a message anonymously.

---

# **14\. Chat Formatting**

The chat composer should support useful formatting.

At minimum consider:

* bold  
* italic  
* underline  
* bullet lists  
* numbered lists  
* links  
* attachments  
* images  
* voice notes

Example toolbar:

B   I   U   • List   1\. List   Link   📎   🎤

Use a safe rich-text implementation.

Never render unsanitized HTML from users directly.

Sanitize content before storage/rendering where necessary.

---

# **15\. Chat Voice Notes**

Potentially allow users to send a voice note directly into chat.

A chat voice note should appear as:

Sarah Cohen  
Today, 5:02 PM

🎤 Voice note  
"Follow-up call with parent"

▶ 1:34

It should have the same attribution and auditability as regular chat messages.

Store the audio externally and store only the metadata/reference in the database.

---

# **16\. Realtime Chat**

Multiple people may have the same kid page open simultaneously.

When one user posts a chat message, other authorized users should see it without manually refreshing the browser.

Use an appropriate realtime technology, preferably Supabase Realtime if using Supabase.

The realtime layer should not bypass authorization.

Only users who are authorized to access that kid should receive the corresponding chat data/events.

---

# **17\. Chat Search / Extraction**

All chat messages must be stored in a structured way so they can easily be:

* searched  
* exported  
* archived  
* audited  
* copied to Google Sheets  
* exported to Google Drive as a readable transcript

Provide an export option such as:

**Export Chat**

Possible formats:

* CSV  
* plain text  
* PDF if practical  
* Google Sheets  
* Google Drive document

A chat export should preserve:

* date/time  
* poster  
* message  
* attachments/voice notes where possible  
* relevant metadata

Do not lose authorship information during export.

---

# **18\. Transcript Page**

Create a dedicated Transcript section/page.

Users should be able to upload transcript documents.

Support common document formats.

The page should show:

* current transcript  
* upload date  
* uploader  
* filename  
* document type  
* version/history if implemented  
* Google Drive export/reference  
* download/open action

Allow replacing or adding a transcript according to permissions.

---

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

# **30\. Google Drive Architecture**

Use Google Drive as the external asset storage/export mechanism.

The system should maintain a mapping between application records and Google Drive files.

Example:

Database

document\_id: 781  
kid\_id: 1042  
drive\_file\_id: "abc123..."  
filename: "Transcript.pdf"

Google Drive might contain:

Oorah Admissions/  
    Kid 1042 \- John Smith/  
        Photos/  
        Voice Notes/  
        Forms/  
        Transcript/  
        Chat Export/

Do not assume users should manually create folders.

Where feasible, have the application create or identify the appropriate folder structure automatically during export.

---

# **31\. Google Drive Export**

Add an export feature.

Possible actions:

**Export Kid to Google Drive**

The export should gather relevant assets and place/copy them into a logical folder.

Possible exported material:

* application forms  
* photos  
* voice notes  
* transcripts  
* chat transcript  
* status information  
* VAAD voting summary  
* important metadata

Do not duplicate huge amounts of data unnecessarily.

Track whether an export has succeeded and when.

Record export failures.

Allow retry.

---

# **32\. Google Drive File Access**

Do not make sensitive files public by default.

Prefer authenticated Google Drive/API access.

If the browser needs to display an image from Drive, use a secure approach.

Possible implementation strategies include:

* authenticated server-side retrieval  
* controlled API proxy  
* temporary/signed access mechanism where appropriate  
* Google Drive API retrieval

Do not expose organization-wide Google credentials in browser code.

---

# **33\. Google Sheets Export**

Provide structured Google Sheets exports.

At minimum support a sheet containing:

* Kid ID  
* Name  
* Status  
* Date created  
* Last activity  
* Transcript status  
* VAAD vote count  
* document completeness

Additional sheets may include:

### **Kids**

One row per kid.

### **Users**

One row per user.

### **Status History**

One row per status change.

### **Chat**

One row per message.

Columns:

Timestamp  
Kid  
User  
Message

### **VAAD Votes**

One row per vote.

Columns:

Kid  
VAAD Member  
Vote  
Timestamp

### **Documents**

One row per uploaded document.

### **Audit Log**

One row per audit event.

The database remains authoritative even if the Sheet is outdated.

---

# **34\. Cost Optimization**

The system should be intentionally designed to minimize recurring costs.

Important principles:

1. Do not store large audio/photo binaries in Postgres.  
2. Keep database records text/metadata oriented.  
3. Use Google Drive for large assets.  
4. Avoid unnecessary realtime traffic.  
5. Avoid unnecessary polling.  
6. Use pagination for large lists.  
7. Optimize images.  
8. Avoid loading all voice notes/photos at once.  
9. Use lazy loading.  
10. Use a low-cost/free database tier where feasible.  
11. Do not require paid storage merely to implement the application.

Design the app so that increasing text records does not significantly increase storage costs.

---

# **35\. Database Schema**

Design a proper relational schema.

At minimum consider these tables:

users  
kids  
kid\_memberships  
roles  
statuses  
status\_history  
documents  
photos  
voice\_notes  
messages  
message\_attachments  
vaad\_members  
vaad\_votes  
audit\_log  
exports

You may add supporting tables where appropriate.

Suggested concepts:

## **users**

id  
auth\_user\_id  
name  
email  
active  
created\_at  
updated\_at

## **kids**

id  
application\_number  
name  
status\_id  
created\_at  
updated\_at

## **kid\_memberships**

kid\_id  
user\_id  
access\_level  
created\_at

## **statuses**

id  
name  
description  
display\_order  
active  
is\_default

## **status\_history**

id  
kid\_id  
old\_status\_id  
new\_status\_id  
changed\_by  
change\_type  
reason  
created\_at

## **documents**

id  
kid\_id  
uploaded\_by  
document\_type  
filename  
mime\_type  
drive\_file\_id  
created\_at  
updated\_at

## **photos**

id  
kid\_id  
uploaded\_by  
filename  
caption  
drive\_file\_id  
created\_at

## **voice\_notes**

id  
kid\_id  
uploaded\_by  
filename  
caption  
duration  
drive\_file\_id  
created\_at

## **messages**

id  
kid\_id  
user\_id  
body  
created\_at  
updated\_at  
deleted\_at

## **message\_attachments**

id  
message\_id  
attachment\_type  
drive\_file\_id  
filename  
created\_at

## **vaad\_members**

id  
user\_id  
is\_active  
can\_contribute  
can\_vote  
created\_at  
updated\_at

## **vaad\_votes**

id  
kid\_id  
vaad\_member\_id  
vote  
created\_at  
updated\_at

## **audit\_log**

id  
user\_id  
action  
entity\_type  
entity\_id  
metadata  
created\_at

## **exports**

id  
kid\_id  
export\_type  
destination  
status  
started\_at  
completed\_at  
error\_message  
created\_by

Modify the schema as necessary to produce the best relational design.

---

# **36\. Database Constraints**

Implement strong constraints.

Examples:

* application/kid ID should be unique  
* email should be unique where appropriate  
* a VAAD member should not be able to submit duplicate votes for the same kid  
* required foreign keys should exist  
* status IDs must be valid  
* deleted/deactivated users should not lose historical attribution  
* invalid permissions should be rejected server-side

Use transactions for important multi-step operations.

---

# **37\. VAAD Voting Transaction Logic**

Implement the acceptance workflow safely.

Conceptually:

BEGIN TRANSACTION

Record vote

Count valid Accept votes  
for this kid

IF count \>= 2:  
    set kid.status \= Accepted  
    create status\_history record  
    create audit\_log record

COMMIT

Protect this against concurrent requests.

Two simultaneous votes must not result in inconsistent data.

---

# **38\. File Upload Architecture**

When a user uploads a file:

1. Authenticate user.  
2. Verify authorization for the kid.  
3. Validate file type.  
4. Validate file size.  
5. Upload/transfer to Google Drive using a secure server-side process.  
6. Obtain Drive file ID.  
7. Save metadata in database.  
8. Add audit-log entry.  
9. Update activity timestamp.  
10. Show the file in the kid page.

Do not trust filename extensions alone.

Validate MIME types and reasonable size limits.

Provide user-friendly upload errors.

---

# **39\. Image Handling**

For uploaded images:

* validate type  
* optimize/resize where useful  
* generate thumbnails where useful  
* avoid downloading original full-resolution files repeatedly  
* lazy-load gallery images  
* preserve the original where required  
* maintain metadata separately

The UI should remain fast even with many photos.

---

# **40\. Voice Note Handling**

For audio:

* support common browser-compatible formats  
* validate MIME types  
* store duration when possible  
* display duration  
* provide playback controls  
* avoid automatically downloading the entire audio file just to render a list  
* support export to Google Drive

If browser recording is implemented, use modern browser audio APIs where available.

Gracefully handle unsupported browsers/devices.

---

# **41\. Error Handling**

The application should gracefully handle:

* failed uploads  
* lost internet connection  
* expired sessions  
* Google OAuth errors  
* Google Drive API failures  
* database errors  
* unauthorized actions  
* invalid files  
* duplicate votes  
* status conflicts

Use clear messages.

Do not expose raw stack traces to users.

Log technical details safely on the server.

---

# **42\. Loading States**

Every asynchronous action needs an appropriate loading state.

Examples:

* Uploading...  
* Saving...  
* Sending...  
* Exporting...  
* Loading messages...  
* Loading photos...  
* Loading VAAD results...

Disable duplicate submissions where necessary.

---

# **43\. Empty States**

Create useful empty states.

Examples:

No kids:

No applications yet.

Create your first kid application.

\[ \+ New Kid \]

No voice notes:

No voice notes yet.

\[ Upload Voice Note \]

No documents:

No documents uploaded yet.

\[ Upload Document \]

No chat messages:

No messages yet.

Start the conversation below.

No VAAD votes:

No VAAD votes have been submitted.

---

# **44\. Security**

Treat all application information as sensitive.

Implement:

* secure authentication  
* server-side authorization  
* database row-level security where applicable  
* protected API routes  
* input validation  
* file validation  
* sanitized rich text  
* CSRF-safe patterns as appropriate  
* secure Google OAuth handling  
* secure secret management  
* no service-account keys in client code  
* audit logging  
* least-privilege access

Never expose:

* database service-role keys  
* Google private keys  
* OAuth client secrets  
* administrator credentials

to browser code.

---

# **45\. Privacy**

Avoid making files public by default.

A photo or audio file belonging to a kid should not automatically be accessible to anyone who discovers a URL.

Access should be mediated by authenticated authorization.

Design the storage/export process with confidentiality in mind.

---

# **46\. Responsive Design**

The system should work on:

* desktop  
* laptop  
* tablet  
* phone

The primary staff workflow may be desktop-first, but uploads such as voice notes and photos may occur from mobile devices.

Therefore mobile experience is important.

---

# **47\. Accessibility**

Follow good accessibility practices:

* keyboard navigation  
* adequate color contrast  
* labels for form controls  
* accessible buttons  
* accessible status indicators  
* screen-reader-friendly forms  
* accessible audio controls  
* focus management  
* no color-only indication of status

Do not rely solely on red/green colors.

---

# **48\. Status UI**

Statuses should be visually clear.

For example:

● New  
● Incomplete  
● Under Review  
● Interview  
● VAAD Review  
● Accepted  
● Rejected

Allow admin-configurable colors/styles.

The status must also be understandable without color.

---

# **49\. Kid Page Activity**

Provide a recent activity feed.

Examples:

5:18 PM — Sarah uploaded a transcript  
5:02 PM — David posted a voice note  
4:42 PM — Michael posted in chat  
4:30 PM — VAAD vote submitted by Sarah  
4:30 PM — Status changed to Accepted

This makes the application easier to understand and improves traceability.

---

# **50\. Export Behavior**

Export should not destroy or alter source data.

Exports are copies/snapshots.

The database remains authoritative.

Every export should have:

* requested by  
* requested at  
* destination  
* success/failure state  
* error if failed

---

# **51\. Search**

Implement fast search.

Initially search:

* kid name  
* application ID

Optionally expand to:

* uploader  
* email  
* status  
* date  
* assigned user

Support filtering by status.

Example:

Search: Cohen

Status:  
\[All\]  
\[New\]  
\[Review\]  
\[VAAD\]  
\[Accepted\]

---

# **52\. Sorting**

The kids table should support sorting by:

* name  
* status  
* created date  
* last activity  
* application ID

---

# **53\. Pagination**

Do not load every message, photo, or kid record at once.

Use:

* pagination  
* infinite scrolling  
* lazy loading  
* virtualized lists

where appropriate.

Chat can use newest/oldest pagination.

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

# **60\. AI/Generated Code Quality Requirements**

Do not simply generate one giant file.

Use a maintainable project structure.

Separate:

* UI components  
* pages  
* server actions/API  
* database queries  
* authorization  
* validation  
* file services  
* Google Drive integration  
* Google Sheets integration  
* audit logic  
* VAAD voting logic  
* reusable hooks/utilities  
* types

Use TypeScript types throughout.

Avoid duplicated business logic.

Create shared validation schemas.

Keep secrets in environment variables.

---

# **61\. Suggested Project Structure**

Use a structure similar to:

app/  
  (auth)/  
  kids/  
  admin/  
  vaad/  
  api/

components/  
  kids/  
  chat/  
  documents/  
  photos/  
  voice-notes/  
  vaad/  
  admin/  
  common/

lib/  
  auth/  
  db/  
  permissions/  
  validation/  
  google-drive/  
  google-sheets/  
  audit/  
  vaad/

types/

Adjust to whatever project structure best matches modern Next.js conventions.

---

# **62\. Testing**

Include meaningful tests.

At minimum test:

## **Authentication**

* unauthorized user cannot access protected pages  
* inactive user cannot access application  
* admin can access admin page

## **Permissions**

* standard user cannot manage users  
* non-voter cannot vote  
* non-admin cannot modify system statuses  
* unauthorized user cannot access another kid's private data

## **Chat**

* message saved  
* author stored  
* timestamp stored  
* authorized users receive realtime updates  
* unauthorized users do not receive them

## **Files**

* upload stored successfully  
* metadata recorded  
* uploader recorded  
* invalid file rejected

## **VAAD**

* voter can vote  
* non-voter cannot vote  
* duplicate vote blocked  
* 1 Accept does not accept  
* 2 Accept votes automatically accept  
* 3 Accept votes remain accepted  
* audit log created  
* status history created

## **Exports**

* export starts  
* success recorded  
* failure recorded  
* retry possible

---

# **63\. Seed Data / Demo Mode**

Create realistic seed/demo data for development.

Example:

John Smith  
Status: VAAD Review

Sarah Cohen  
Status: Accepted

David Levy  
Status: Incomplete

Create sample:

* users  
* chat messages  
* statuses  
* VAAD members  
* votes

Do not hardcode production credentials.

---

# **64\. Design Language**

Use a calm, professional, friendly internal-operations design.

Primary CTA:

**Green**

Use green for the "New Kid" button.

Avoid an overly flashy SaaS aesthetic.

Prioritize:

* readability  
* clarity  
* whitespace  
* obvious controls  
* useful hierarchy

Use status badges and cards where appropriate.

---

# **65\. Homepage Example**

Conceptually:

┌─────────────────────────────────────────────────────────┐  
│ OORAH ADMISSIONS                         Admin ▼       │  
├─────────────────────────────────────────────────────────┤  
│                                                         │  
│ Admissions                                             │  
│                                                         │  
│ \[ Search kids...                         \] \[ \+ New Kid \]│  
│                                                         │  
│ ┌─────────────────────────────────────────────────────┐ │  
│ │ Kid               ID        Status        Activity  │ │  
│ ├─────────────────────────────────────────────────────┤ │  
│ │ John Smith        1042      VAAD Review   Today     │ │  
│ │ Sarah Cohen       1043      Accepted      Yesterday │ │  
│ │ David Levy        1044      Incomplete    Today     │ │  
│ └─────────────────────────────────────────────────────┘ │  
│                                                         │  
└─────────────────────────────────────────────────────────┘

---

# **66\. Kid Page Example**

Conceptually:

John Smith  
Application \#1042

Status: VAAD Review

\[ Overview \] \[ Chat \] \[ Documents \] \[ Photos \]  
\[ Voice Notes \] \[ Transcript \] \[ VAAD \] \[ Activity \]

\----------------------------------------------------------

Recent Activity

Today, 5:02 PM  
Sarah uploaded a voice note

Today, 4:42 PM  
David posted in chat

Yesterday  
Transcript uploaded

\----------------------------------------------------------

---

# **67\. Chat Example**

Conceptually:

CHAT

Sarah Cohen  
Today, 4:32 PM

I spoke with the family. They will send the  
remaining form tomorrow.

David Levy  
Today, 4:45 PM

Thanks. I will follow up tomorrow morning.

Michael Klein  
Today, 4:51 PM

🎤 Voice note  
▶ 1:12

\---------------------------------------------------

B  I  U   • List   Link   📎   🎤

\[ Type a message...                         \]  
                                      \[ Send \]

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

# **70\. Important Product Decisions**

Keep these architectural rules in place:

1. **Postgres is the system of record.**  
2. **Google Drive stores/receives large files and exports.**  
3. **Google Sheets is for export/reporting, not transactional storage.**  
4. **Chat messages are structured database records.**  
5. **Every user-created action has attribution.**  
6. **The VAAD acceptance rule is server-side.**  
7. **Admins control statuses.**  
8. **Admins control VAAD permissions.**  
9. **Users cannot bypass permission checks through APIs.**  
10. **Large files should not be stored directly in database rows.**  
11. **Sensitive files should not be publicly accessible by default.**  
12. **Audit history should be preserved.**

---

# **71\. Do Not Build These as Shortcuts**

Do NOT:

* use Google Sheets as the primary database  
* store all chat in one giant text field  
* store voice notes as database blobs unnecessarily  
* expose Google credentials to the browser  
* use client-side-only authorization  
* allow duplicate VAAD votes  
* use a frontend-only 2-of-3 acceptance mechanism  
* delete audit history just because a user is deactivated  
* make sensitive documents public by default  
* hardcode the three VAAD members  
* hardcode the application statuses  
* require manual webpage creation for each kid

---

# **72\. Deliverables**

Produce the application in a way that is ready for deployment.

Include:

1. Full Next.js application.  
2. TypeScript.  
3. Responsive UI.  
4. Supabase database schema/migrations.  
5. Row Level Security policies where appropriate.  
6. Authentication setup.  
7. Role/permission system.  
8. Admin interface.  
9. Kid dashboard.  
10. Kid detail page.  
11. Chat.  
12. Voice notes.  
13. Photo uploads.  
14. Document uploads.  
15. Transcript interface.  
16. VAAD management.  
17. VAAD voting.  
18. Automatic 2-of-3 acceptance.  
19. Status management.  
20. Audit log.  
21. Google Drive integration/export.  
22. Google Sheets export.  
23. Error handling.  
24. Loading/empty states.  
25. Tests for important business rules.  
26. Environment-variable documentation.  
27. Deployment instructions for Vercel.  
28. Database setup instructions.  
29. Google OAuth configuration instructions.  
30. Google Drive/Sheets integration setup instructions.

---

# **73\. Environment Variables**

Use environment variables for sensitive configuration.

Document all required variables, for example:

NEXT\_PUBLIC\_SUPABASE\_URL  
NEXT\_PUBLIC\_SUPABASE\_ANON\_KEY  
SUPABASE\_SERVICE\_ROLE\_KEY

GOOGLE\_CLIENT\_ID  
GOOGLE\_CLIENT\_SECRET  
GOOGLE\_REDIRECT\_URI

GOOGLE\_DRIVE\_ROOT\_FOLDER\_ID  
GOOGLE\_SHEETS\_EXPORT\_ID

Do not commit secrets to source control.

Use Vercel environment variables in production.

---

# **74\. Deployment**

The application should be deployable to Vercel.

Provide a clear sequence:

1. Create Supabase project.  
2. Configure database.  
3. Apply migrations.  
4. Configure Supabase Auth.  
5. Configure Google OAuth.  
6. Configure Google Drive/Sheets integration.  
7. Add Vercel environment variables.  
8. Deploy Next.js app.  
9. Configure production domain.  
10. Test authentication.  
11. Test uploads.  
12. Test chat.  
13. Test VAAD voting.  
14. Test exports.  
15. Test authorization.

---

# **75\. Acceptance Criteria**

The finished system should satisfy all of the following.

## **Kid management**

* Admin can create a new kid.  
* A kid gets a dedicated page automatically.  
* Kids appear on the homepage.  
* Kids can be searched.  
* Status is visible.

## **Authentication**

* Users can sign in using Google.  
* Email login is supported if configured.  
* Only authorized users can access the application.  
* Admin controls users.

## **Chat**

* Each kid has a persistent chat.  
* Multiple authorized users can post.  
* Each message shows author and timestamp.  
* Formatting works.  
* Voice-note messages can be supported.  
* Chat is stored in the database.  
* Chat can be exported.

## **Files**

* Forms can be uploaded.  
* Photos can be uploaded.  
* Multiple voice notes can be uploaded.  
* Each voice note shows uploader.  
* Voice notes can have captions.  
* Transcript can be uploaded.  
* Large assets are not unnecessarily stored in Postgres.

## **VAAD**

* Admin can designate VAAD members.  
* Admin can enable/disable contribution.  
* Admin can enable/disable voting.  
* There are normally three members.  
* Vote records are persistent.  
* Duplicate votes are prevented.  
* Two Accept votes automatically set status to Accepted.  
* Acceptance is recorded in audit history.

## **Statuses**

* Admin can create/edit/deactivate statuses.  
* Status changes are tracked.  
* Admin can manually override status when permitted.

## **Exports**

* Assets can be exported to Google Drive.  
* Structured data can be exported to Google Sheets.  
* Export activity is recorded.  
* Export failures can be retried.

## **Audit**

* Important changes are logged.  
* Historical authorship remains visible.  
* User deactivation does not erase historical attribution.

---

# **76\. Final Implementation Guidance**

Make reasonable engineering decisions without repeatedly asking for clarification.

Where the specification does not define a detail, choose a secure, maintainable, user-friendly default.

Prioritize the core workflow over unnecessary features.

Build the application so that future additions can be made easily, such as:

* additional status types  
* additional application fields  
* additional document types  
* more sophisticated VAAD decisions  
* notifications  
* email integration  
* reminders  
* reporting dashboards  
* additional exports

Do not over-engineer the first version.

The primary objective is a reliable, inexpensive, easy-to-use admissions application with:

**Kids \+ documents \+ photos \+ voice notes \+ shared traceable chat \+ transcripts \+ VAAD voting \+ statuses \+ admin controls \+ audit history \+ Google Drive/Google Sheets exports.**

Before writing production code, produce a concise implementation summary, database schema, authorization model, and route/page map. Then implement the system according to this specification.

# **Oorah Admissions Management System — Full Product, UX, Architecture, Database, Permissions, and Implementation Specification**

You are an expert product architect, UX designer, full-stack engineer, database architect, security engineer, and DevOps engineer. Build a production-quality web application for **Oorah Admissions**.

The application is an admissions-management system used by multiple staff members to manage applications for individual children ("kids"), communicate about each child, collect application materials, manage transcripts and voice notes, and conduct a formal VAAD review and voting process.

The system must be designed to be easy for non-technical staff to use, highly organized, auditable, permission-aware, and inexpensive to operate.

Do not build a generic CRM. Build the application specifically around the workflow described below.

---

# **1\. Core Technology Direction**

Use the following architecture unless there is a compelling technical reason to make a change.

## **Frontend and application**

Use:

* **Next.js**  
* React  
* TypeScript  
* App Router  
* Responsive web design  
* Deploy on **Vercel**

The application should be a single modern web application with authenticated pages, server-side logic/API routes where appropriate, and a clean component architecture.

## **Database**

Use a relational database.

Preferred option:

* **Supabase Postgres**

The system should be designed to work within the free/lowest-cost Supabase tier wherever practical.

Do not assume that Supabase Storage must be used.

The large files in this application are primarily:

* pictures  
* voice recordings  
* uploaded forms/documents  
* transcripts

The application should minimize database storage usage by keeping actual large files in Google Drive where feasible and keeping only metadata/file references in the database.

## **Authentication**

Use:

* Supabase Auth  
* Google OAuth / "Sign in with Google"  
* Email-based sign in as an alternative

Authentication determines who the user is.

Authorization determines what the user is allowed to see or do.

Never rely solely on frontend permission checks. Enforce important access-control rules on the server/database as well.

## **Large-file storage**

Use **Google Drive as the external file storage location** for large application assets.

Google Drive is an asset repository/export destination rather than the application's primary database.

Store files such as:

* photographs  
* voice notes  
* application forms  
* transcripts  
* other uploaded documents

The application database should store metadata and Google Drive file IDs/identifiers rather than embedding large files directly into database rows.

Prefer an organization-controlled Google Drive/Google Workspace account rather than personal employee drives.

## **Google Sheets**

Google Sheets should be available as an **export/reporting destination**.

Do not use Google Sheets as the primary database.

The relational database is the source of truth.

The system should be able to export appropriate application data into Google Sheets.

---

# **2\. Main Product Goal**

The goal is to give Oorah staff one central website where they can:

1. Create and manage an account for each child.  
2. Search and browse all children.  
3. See each child's current admissions status.  
4. Open a dedicated page for each child.  
5. Upload forms and other documents.  
6. Upload photographs.  
7. Upload multiple voice notes.  
8. Add captions to voice notes.  
9. See who uploaded every file or voice note.  
10. Maintain a shared, permanent conversation/chat for each child.  
11. Allow multiple authorized users to contribute to that chat.  
12. Preserve the identity of the person who posted each message.  
13. Preserve timestamps and audit history.  
14. Support formatting in chat.  
15. Potentially support voice notes directly inside chat.  
16. Upload and manage transcripts.  
17. Manage VAAD membership.  
18. Give VAAD members separate contribution and voting permissions.  
19. Allow three VAAD members to vote on an application.  
20. Automatically accept a child when two of the three VAAD members vote to accept.  
21. Allow administrators to define and change application statuses.  
22. Allow administrators to add and remove users.  
23. Allow administrators to change user permissions.  
24. Maintain an audit history of important actions.  
25. Export application data/files to Google Drive.  
26. Export structured information to Google Sheets.  
27. Make all of this easy enough for non-technical admissions staff to use.

---

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

# **4\. Overall User Experience**

The interface should feel like a modern internal admissions management application.

Priorities:

1. Extremely simple navigation.  
2. Minimal clutter.  
3. Large clear actions.  
4. Obvious statuses.  
5. Easy search.  
6. Easy file upload.  
7. Clear attribution of all activity.  
8. Strong auditability.  
9. Responsive design.  
10. Fast loading.  
11. Accessibility.  
12. Excellent empty states and error messages.

The UI should look professional and trustworthy rather than like an engineering dashboard.

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

# **6\. Homepage / Kids Dashboard**

The homepage is the main admissions dashboard.

It should contain:

## **Header**

Large page title:

**Oorah Admissions**

Provide a prominent green button:

**\+ New Kid**

The user specifically wants the New Account/New Kid action to be easy to find.

Use a strong green primary action.

## **Search**

Provide a prominent search bar:

**Search kids...**

Search should be able to search at least:

* kid name  
* application/kid ID  
* possibly email/contact information where appropriate

Search should be fast and support partial matches.

## **Kid list**

Display all kids in a table/list/card layout.

At minimum show:

* Kid name  
* ID  
* current status  
* last activity  
* optionally assigned users  
* optionally VAAD progress

The status should be visually prominent.

Example:

John Smith                     VAAD Review  
Sarah Cohen                    Accepted  
David Levy                     Incomplete  
Rachel Katz                    Interview

Allow the administrator to configure status options.

Clicking a kid opens that kid's dedicated page.

---

# **7\. Creating a New Kid**

The main page should have a highly visible green:

**\+ New Kid**

button.

Clicking it opens a simple form.

At minimum, collect:

* kid name  
* unique application/kid ID  
* any basic identifying/application information required by the organization

The system should automatically:

1. Create the kid record.  
2. Assign a unique internal ID.  
3. Create the kid's application page.  
4. Initialize default status.  
5. Create associated records needed for chat/files/VAAD.  
6. Make the kid appear on the homepage.

Do not require users to manually create a webpage.

A new kid record automatically gets its own URL/page.

Example:

/kids/1042

---

# **8\. Dedicated Kid Page**

Every kid must have a dedicated application workspace.

Design the page as a central hub for all information about that kid.

Suggested layout:

## **Header**

Show:

* kid name  
* application ID  
* current status  
* status history/control where permitted  
* key actions

Example:

John Smith  
Application \#1042

Status: VAAD Review

\[ Change Status \] \[ Export \] 

## **Main sections/tabs**

Use tabs or clearly separated sections such as:

* Overview  
* Chat  
* Documents  
* Photos  
* Voice Notes  
* Transcript  
* VAAD  
* Activity / Audit History

Keep navigation intuitive.

---

# **9\. Overview Section**

Show a concise summary of the application.

Include:

* basic information  
* current status  
* date created  
* last activity  
* assigned/authorized users  
* document completion indicators  
* transcript status  
* VAAD status  
* recent activity

Use clear visual indicators.

---

# **10\. Documents / Forms**

The application must support uploading forms and documents.

Users with appropriate permissions should be able to:

* upload a file  
* see filename  
* see file type  
* see upload date/time  
* see uploader  
* download/open the document  
* export/copy it to Google Drive  
* optionally replace/update the document where permitted

Database stores file metadata.

Google Drive stores the actual large file where applicable.

Do not store the entire binary file inside PostgreSQL.

Possible database record:

document\_id  
kid\_id  
uploaded\_by  
filename  
mime\_type  
drive\_file\_id  
drive\_url\_or\_reference  
created\_at  
updated\_at  
document\_type

Document types may include:

* Application Form  
* Parent Form  
* Medical/other organizational form  
* Transcript  
* Other

Allow administrators to customize document categories if appropriate.

---

# **11\. Photos**

Users should be able to upload one or multiple pictures.

The UI should display photos as a gallery.

For every photo show:

* image  
* filename if useful  
* uploader  
* date/time  
* optional caption  
* file status/location

Store the actual image externally rather than using the relational database as blob storage.

The application should maintain the Google Drive file ID.

When a photo needs to be displayed, use a secure mechanism to retrieve/display it.

Do not depend on making sensitive application photos public on the internet.

Avoid using permanent public "anyone with the link" URLs for sensitive material unless explicitly required and approved.

Prefer authenticated retrieval/access.

---

# **12\. Voice Notes**

This is one of the major features.

A kid may have **multiple voice notes**.

Each voice note must contain:

* audio file  
* uploader's name  
* uploader's user ID  
* timestamp  
* caption  
* duration if available  
* storage/file ID  
* associated kid  
* optional source/context

Example display:

Sarah Cohen  
August 18, 2026 · 4:42 PM

"Call with parents regarding transportation"

▶ Play  
2:14

The voice note must clearly identify who uploaded it.

Users should be able to:

* upload a voice note  
* optionally record directly in the browser if feasible  
* add/edit a caption if permitted  
* play it  
* see who uploaded it  
* see when it was uploaded  
* download/export it  
* export it to Google Drive

Support multiple voice notes without imposing an arbitrary small limit.

Use an HTML audio player or equivalent accessible audio control.

Because audio files are relatively large, do not store the audio binary directly in database text fields.

---

# **13\. Chat System**

Every kid should have a shared chat area.

The chat must be persistent and stored in the database.

It is NOT a temporary messaging box.

Any authorized user assigned/accessing that kid should be able to participate according to their role.

Every message must retain:

* message ID  
* kid ID  
* user ID  
* display name  
* timestamp  
* content  
* edit timestamp if edited  
* deletion state if applicable  
* attachment references  
* voice-note references

The chat must preserve traceability.

Users must always be able to see who posted a message.

Example:

David Cohen  
Today, 4:32 PM

I spoke with the family. They will send the remaining form tomorrow.

Never display a message anonymously.

---

# **14\. Chat Formatting**

The chat composer should support useful formatting.

At minimum consider:

* bold  
* italic  
* underline  
* bullet lists  
* numbered lists  
* links  
* attachments  
* images  
* voice notes

Example toolbar:

B   I   U   • List   1\. List   Link   📎   🎤

Use a safe rich-text implementation.

Never render unsanitized HTML from users directly.

Sanitize content before storage/rendering where necessary.

---

# **15\. Chat Voice Notes**

Potentially allow users to send a voice note directly into chat.

A chat voice note should appear as:

Sarah Cohen  
Today, 5:02 PM

🎤 Voice note  
"Follow-up call with parent"

▶ 1:34

It should have the same attribution and auditability as regular chat messages.

Store the audio externally and store only the metadata/reference in the database.

---

# **16\. Realtime Chat**

Multiple people may have the same kid page open simultaneously.

When one user posts a chat message, other authorized users should see it without manually refreshing the browser.

Use an appropriate realtime technology, preferably Supabase Realtime if using Supabase.

The realtime layer should not bypass authorization.

Only users who are authorized to access that kid should receive the corresponding chat data/events.

---

# **17\. Chat Search / Extraction**

All chat messages must be stored in a structured way so they can easily be:

* searched  
* exported  
* archived  
* audited  
* copied to Google Sheets  
* exported to Google Drive as a readable transcript

Provide an export option such as:

**Export Chat**

Possible formats:

* CSV  
* plain text  
* PDF if practical  
* Google Sheets  
* Google Drive document

A chat export should preserve:

* date/time  
* poster  
* message  
* attachments/voice notes where possible  
* relevant metadata

Do not lose authorship information during export.

---

# **18\. Transcript Page**

Create a dedicated Transcript section/page.

Users should be able to upload transcript documents.

Support common document formats.

The page should show:

* current transcript  
* upload date  
* uploader  
* filename  
* document type  
* version/history if implemented  
* Google Drive export/reference  
* download/open action

Allow replacing or adding a transcript according to permissions.

---

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

# **30\. Google Drive Architecture**

Use Google Drive as the external asset storage/export mechanism.

The system should maintain a mapping between application records and Google Drive files.

Example:

Database

document\_id: 781  
kid\_id: 1042  
drive\_file\_id: "abc123..."  
filename: "Transcript.pdf"

Google Drive might contain:

Oorah Admissions/  
    Kid 1042 \- John Smith/  
        Photos/  
        Voice Notes/  
        Forms/  
        Transcript/  
        Chat Export/

Do not assume users should manually create folders.

Where feasible, have the application create or identify the appropriate folder structure automatically during export.

---

# **31\. Google Drive Export**

Add an export feature.

Possible actions:

**Export Kid to Google Drive**

The export should gather relevant assets and place/copy them into a logical folder.

Possible exported material:

* application forms  
* photos  
* voice notes  
* transcripts  
* chat transcript  
* status information  
* VAAD voting summary  
* important metadata

Do not duplicate huge amounts of data unnecessarily.

Track whether an export has succeeded and when.

Record export failures.

Allow retry.

---

# **32\. Google Drive File Access**

Do not make sensitive files public by default.

Prefer authenticated Google Drive/API access.

If the browser needs to display an image from Drive, use a secure approach.

Possible implementation strategies include:

* authenticated server-side retrieval  
* controlled API proxy  
* temporary/signed access mechanism where appropriate  
* Google Drive API retrieval

Do not expose organization-wide Google credentials in browser code.

---

# **33\. Google Sheets Export**

Provide structured Google Sheets exports.

At minimum support a sheet containing:

* Kid ID  
* Name  
* Status  
* Date created  
* Last activity  
* Transcript status  
* VAAD vote count  
* document completeness

Additional sheets may include:

### **Kids**

One row per kid.

### **Users**

One row per user.

### **Status History**

One row per status change.

### **Chat**

One row per message.

Columns:

Timestamp  
Kid  
User  
Message

### **VAAD Votes**

One row per vote.

Columns:

Kid  
VAAD Member  
Vote  
Timestamp

### **Documents**

One row per uploaded document.

### **Audit Log**

One row per audit event.

The database remains authoritative even if the Sheet is outdated.

---

# **34\. Cost Optimization**

The system should be intentionally designed to minimize recurring costs.

Important principles:

1. Do not store large audio/photo binaries in Postgres.  
2. Keep database records text/metadata oriented.  
3. Use Google Drive for large assets.  
4. Avoid unnecessary realtime traffic.  
5. Avoid unnecessary polling.  
6. Use pagination for large lists.  
7. Optimize images.  
8. Avoid loading all voice notes/photos at once.  
9. Use lazy loading.  
10. Use a low-cost/free database tier where feasible.  
11. Do not require paid storage merely to implement the application.

Design the app so that increasing text records does not significantly increase storage costs.

---

# **35\. Database Schema**

Design a proper relational schema.

At minimum consider these tables:

users  
kids  
kid\_memberships  
roles  
statuses  
status\_history  
documents  
photos  
voice\_notes  
messages  
message\_attachments  
vaad\_members  
vaad\_votes  
audit\_log  
exports

You may add supporting tables where appropriate.

Suggested concepts:

## **users**

id  
auth\_user\_id  
name  
email  
active  
created\_at  
updated\_at

## **kids**

id  
application\_number  
name  
status\_id  
created\_at  
updated\_at

## **kid\_memberships**

kid\_id  
user\_id  
access\_level  
created\_at

## **statuses**

id  
name  
description  
display\_order  
active  
is\_default

## **status\_history**

id  
kid\_id  
old\_status\_id  
new\_status\_id  
changed\_by  
change\_type  
reason  
created\_at

## **documents**

id  
kid\_id  
uploaded\_by  
document\_type  
filename  
mime\_type  
drive\_file\_id  
created\_at  
updated\_at

## **photos**

id  
kid\_id  
uploaded\_by  
filename  
caption  
drive\_file\_id  
created\_at

## **voice\_notes**

id  
kid\_id  
uploaded\_by  
filename  
caption  
duration  
drive\_file\_id  
created\_at

## **messages**

id  
kid\_id  
user\_id  
body  
created\_at  
updated\_at  
deleted\_at

## **message\_attachments**

id  
message\_id  
attachment\_type  
drive\_file\_id  
filename  
created\_at

## **vaad\_members**

id  
user\_id  
is\_active  
can\_contribute  
can\_vote  
created\_at  
updated\_at

## **vaad\_votes**

id  
kid\_id  
vaad\_member\_id  
vote  
created\_at  
updated\_at

## **audit\_log**

id  
user\_id  
action  
entity\_type  
entity\_id  
metadata  
created\_at

## **exports**

id  
kid\_id  
export\_type  
destination  
status  
started\_at  
completed\_at  
error\_message  
created\_by

Modify the schema as necessary to produce the best relational design.

---

# **36\. Database Constraints**

Implement strong constraints.

Examples:

* application/kid ID should be unique  
* email should be unique where appropriate  
* a VAAD member should not be able to submit duplicate votes for the same kid  
* required foreign keys should exist  
* status IDs must be valid  
* deleted/deactivated users should not lose historical attribution  
* invalid permissions should be rejected server-side

Use transactions for important multi-step operations.

---

# **37\. VAAD Voting Transaction Logic**

Implement the acceptance workflow safely.

Conceptually:

BEGIN TRANSACTION

Record vote

Count valid Accept votes  
for this kid

IF count \>= 2:  
    set kid.status \= Accepted  
    create status\_history record  
    create audit\_log record

COMMIT

Protect this against concurrent requests.

Two simultaneous votes must not result in inconsistent data.

---

# **38\. File Upload Architecture**

When a user uploads a file:

1. Authenticate user.  
2. Verify authorization for the kid.  
3. Validate file type.  
4. Validate file size.  
5. Upload/transfer to Google Drive using a secure server-side process.  
6. Obtain Drive file ID.  
7. Save metadata in database.  
8. Add audit-log entry.  
9. Update activity timestamp.  
10. Show the file in the kid page.

Do not trust filename extensions alone.

Validate MIME types and reasonable size limits.

Provide user-friendly upload errors.

---

# **39\. Image Handling**

For uploaded images:

* validate type  
* optimize/resize where useful  
* generate thumbnails where useful  
* avoid downloading original full-resolution files repeatedly  
* lazy-load gallery images  
* preserve the original where required  
* maintain metadata separately

The UI should remain fast even with many photos.

---

# **40\. Voice Note Handling**

For audio:

* support common browser-compatible formats  
* validate MIME types  
* store duration when possible  
* display duration  
* provide playback controls  
* avoid automatically downloading the entire audio file just to render a list  
* support export to Google Drive

If browser recording is implemented, use modern browser audio APIs where available.

Gracefully handle unsupported browsers/devices.

---

# **41\. Error Handling**

The application should gracefully handle:

* failed uploads  
* lost internet connection  
* expired sessions  
* Google OAuth errors  
* Google Drive API failures  
* database errors  
* unauthorized actions  
* invalid files  
* duplicate votes  
* status conflicts

Use clear messages.

Do not expose raw stack traces to users.

Log technical details safely on the server.

---

# **42\. Loading States**

Every asynchronous action needs an appropriate loading state.

Examples:

* Uploading...  
* Saving...  
* Sending...  
* Exporting...  
* Loading messages...  
* Loading photos...  
* Loading VAAD results...

Disable duplicate submissions where necessary.

---

# **43\. Empty States**

Create useful empty states.

Examples:

No kids:

No applications yet.

Create your first kid application.

\[ \+ New Kid \]

No voice notes:

No voice notes yet.

\[ Upload Voice Note \]

No documents:

No documents uploaded yet.

\[ Upload Document \]

No chat messages:

No messages yet.

Start the conversation below.

No VAAD votes:

No VAAD votes have been submitted.

---

# **44\. Security**

Treat all application information as sensitive.

Implement:

* secure authentication  
* server-side authorization  
* database row-level security where applicable  
* protected API routes  
* input validation  
* file validation  
* sanitized rich text  
* CSRF-safe patterns as appropriate  
* secure Google OAuth handling  
* secure secret management  
* no service-account keys in client code  
* audit logging  
* least-privilege access

Never expose:

* database service-role keys  
* Google private keys  
* OAuth client secrets  
* administrator credentials

to browser code.

---

# **45\. Privacy**

Avoid making files public by default.

A photo or audio file belonging to a kid should not automatically be accessible to anyone who discovers a URL.

Access should be mediated by authenticated authorization.

Design the storage/export process with confidentiality in mind.

---

# **46\. Responsive Design**

The system should work on:

* desktop  
* laptop  
* tablet  
* phone

The primary staff workflow may be desktop-first, but uploads such as voice notes and photos may occur from mobile devices.

Therefore mobile experience is important.

---

# **47\. Accessibility**

Follow good accessibility practices:

* keyboard navigation  
* adequate color contrast  
* labels for form controls  
* accessible buttons  
* accessible status indicators  
* screen-reader-friendly forms  
* accessible audio controls  
* focus management  
* no color-only indication of status

Do not rely solely on red/green colors.

---

# **48\. Status UI**

Statuses should be visually clear.

For example:

● New  
● Incomplete  
● Under Review  
● Interview  
● VAAD Review  
● Accepted  
● Rejected

Allow admin-configurable colors/styles.

The status must also be understandable without color.

---

# **49\. Kid Page Activity**

Provide a recent activity feed.

Examples:

5:18 PM — Sarah uploaded a transcript  
5:02 PM — David posted a voice note  
4:42 PM — Michael posted in chat  
4:30 PM — VAAD vote submitted by Sarah  
4:30 PM — Status changed to Accepted

This makes the application easier to understand and improves traceability.

---

# **50\. Export Behavior**

Export should not destroy or alter source data.

Exports are copies/snapshots.

The database remains authoritative.

Every export should have:

* requested by  
* requested at  
* destination  
* success/failure state  
* error if failed

---

# **51\. Search**

Implement fast search.

Initially search:

* kid name  
* application ID

Optionally expand to:

* uploader  
* email  
* status  
* date  
* assigned user

Support filtering by status.

Example:

Search: Cohen

Status:  
\[All\]  
\[New\]  
\[Review\]  
\[VAAD\]  
\[Accepted\]

---

# **52\. Sorting**

The kids table should support sorting by:

* name  
* status  
* created date  
* last activity  
* application ID

---

# **53\. Pagination**

Do not load every message, photo, or kid record at once.

Use:

* pagination  
* infinite scrolling  
* lazy loading  
* virtualized lists

where appropriate.

Chat can use newest/oldest pagination.

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

# **60\. AI/Generated Code Quality Requirements**

Do not simply generate one giant file.

Use a maintainable project structure.

Separate:

* UI components  
* pages  
* server actions/API  
* database queries  
* authorization  
* validation  
* file services  
* Google Drive integration  
* Google Sheets integration  
* audit logic  
* VAAD voting logic  
* reusable hooks/utilities  
* types

Use TypeScript types throughout.

Avoid duplicated business logic.

Create shared validation schemas.

Keep secrets in environment variables.

---

# **61\. Suggested Project Structure**

Use a structure similar to:

app/  
  (auth)/  
  kids/  
  admin/  
  vaad/  
  api/

components/  
  kids/  
  chat/  
  documents/  
  photos/  
  voice-notes/  
  vaad/  
  admin/  
  common/

lib/  
  auth/  
  db/  
  permissions/  
  validation/  
  google-drive/  
  google-sheets/  
  audit/  
  vaad/

types/

Adjust to whatever project structure best matches modern Next.js conventions.

---

# **62\. Testing**

Include meaningful tests.

At minimum test:

## **Authentication**

* unauthorized user cannot access protected pages  
* inactive user cannot access application  
* admin can access admin page

## **Permissions**

* standard user cannot manage users  
* non-voter cannot vote  
* non-admin cannot modify system statuses  
* unauthorized user cannot access another kid's private data

## **Chat**

* message saved  
* author stored  
* timestamp stored  
* authorized users receive realtime updates  
* unauthorized users do not receive them

## **Files**

* upload stored successfully  
* metadata recorded  
* uploader recorded  
* invalid file rejected

## **VAAD**

* voter can vote  
* non-voter cannot vote  
* duplicate vote blocked  
* 1 Accept does not accept  
* 2 Accept votes automatically accept  
* 3 Accept votes remain accepted  
* audit log created  
* status history created

## **Exports**

* export starts  
* success recorded  
* failure recorded  
* retry possible

---

# **63\. Seed Data / Demo Mode**

Create realistic seed/demo data for development.

Example:

John Smith  
Status: VAAD Review

Sarah Cohen  
Status: Accepted

David Levy  
Status: Incomplete

Create sample:

* users  
* chat messages  
* statuses  
* VAAD members  
* votes

Do not hardcode production credentials.

---

# **64\. Design Language**

Use a calm, professional, friendly internal-operations design.

Primary CTA:

**Green**

Use green for the "New Kid" button.

Avoid an overly flashy SaaS aesthetic.

Prioritize:

* readability  
* clarity  
* whitespace  
* obvious controls  
* useful hierarchy

Use status badges and cards where appropriate.

---

# **65\. Homepage Example**

Conceptually:

┌─────────────────────────────────────────────────────────┐  
│ OORAH ADMISSIONS                         Admin ▼       │  
├─────────────────────────────────────────────────────────┤  
│                                                         │  
│ Admissions                                             │  
│                                                         │  
│ \[ Search kids...                         \] \[ \+ New Kid \]│  
│                                                         │  
│ ┌─────────────────────────────────────────────────────┐ │  
│ │ Kid               ID        Status        Activity  │ │  
│ ├─────────────────────────────────────────────────────┤ │  
│ │ John Smith        1042      VAAD Review   Today     │ │  
│ │ Sarah Cohen       1043      Accepted      Yesterday │ │  
│ │ David Levy        1044      Incomplete    Today     │ │  
│ └─────────────────────────────────────────────────────┘ │  
│                                                         │  
└─────────────────────────────────────────────────────────┘

---

# **66\. Kid Page Example**

Conceptually:

John Smith  
Application \#1042

Status: VAAD Review

\[ Overview \] \[ Chat \] \[ Documents \] \[ Photos \]  
\[ Voice Notes \] \[ Transcript \] \[ VAAD \] \[ Activity \]

\----------------------------------------------------------

Recent Activity

Today, 5:02 PM  
Sarah uploaded a voice note

Today, 4:42 PM  
David posted in chat

Yesterday  
Transcript uploaded

\----------------------------------------------------------

---

# **67\. Chat Example**

Conceptually:

CHAT

Sarah Cohen  
Today, 4:32 PM

I spoke with the family. They will send the  
remaining form tomorrow.

David Levy  
Today, 4:45 PM

Thanks. I will follow up tomorrow morning.

Michael Klein  
Today, 4:51 PM

🎤 Voice note  
▶ 1:12

\---------------------------------------------------

B  I  U   • List   Link   📎   🎤

\[ Type a message...                         \]  
                                      \[ Send \]

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

# **70\. Important Product Decisions**

Keep these architectural rules in place:

1. **Postgres is the system of record.**  
2. **Google Drive stores/receives large files and exports.**  
3. **Google Sheets is for export/reporting, not transactional storage.**  
4. **Chat messages are structured database records.**  
5. **Every user-created action has attribution.**  
6. **The VAAD acceptance rule is server-side.**  
7. **Admins control statuses.**  
8. **Admins control VAAD permissions.**  
9. **Users cannot bypass permission checks through APIs.**  
10. **Large files should not be stored directly in database rows.**  
11. **Sensitive files should not be publicly accessible by default.**  
12. **Audit history should be preserved.**

---

# **71\. Do Not Build These as Shortcuts**

Do NOT:

* use Google Sheets as the primary database  
* store all chat in one giant text field  
* store voice notes as database blobs unnecessarily  
* expose Google credentials to the browser  
* use client-side-only authorization  
* allow duplicate VAAD votes  
* use a frontend-only 2-of-3 acceptance mechanism  
* delete audit history just because a user is deactivated  
* make sensitive documents public by default  
* hardcode the three VAAD members  
* hardcode the application statuses  
* require manual webpage creation for each kid

---

# **72\. Deliverables**

Produce the application in a way that is ready for deployment.

Include:

1. Full Next.js application.  
2. TypeScript.  
3. Responsive UI.  
4. Supabase database schema/migrations.  
5. Row Level Security policies where appropriate.  
6. Authentication setup.  
7. Role/permission system.  
8. Admin interface.  
9. Kid dashboard.  
10. Kid detail page.  
11. Chat.  
12. Voice notes.  
13. Photo uploads.  
14. Document uploads.  
15. Transcript interface.  
16. VAAD management.  
17. VAAD voting.  
18. Automatic 2-of-3 acceptance.  
19. Status management.  
20. Audit log.  
21. Google Drive integration/export.  
22. Google Sheets export.  
23. Error handling.  
24. Loading/empty states.  
25. Tests for important business rules.  
26. Environment-variable documentation.  
27. Deployment instructions for Vercel.  
28. Database setup instructions.  
29. Google OAuth configuration instructions.  
30. Google Drive/Sheets integration setup instructions.

---

# **73\. Environment Variables**

Use environment variables for sensitive configuration.

Document all required variables, for example:

NEXT\_PUBLIC\_SUPABASE\_URL  
NEXT\_PUBLIC\_SUPABASE\_ANON\_KEY  
SUPABASE\_SERVICE\_ROLE\_KEY

GOOGLE\_CLIENT\_ID  
GOOGLE\_CLIENT\_SECRET  
GOOGLE\_REDIRECT\_URI

GOOGLE\_DRIVE\_ROOT\_FOLDER\_ID  
GOOGLE\_SHEETS\_EXPORT\_ID

Do not commit secrets to source control.

Use Vercel environment variables in production.

---

# **74\. Deployment**

The application should be deployable to Vercel.

Provide a clear sequence:

1. Create Supabase project.  
2. Configure database.  
3. Apply migrations.  
4. Configure Supabase Auth.  
5. Configure Google OAuth.  
6. Configure Google Drive/Sheets integration.  
7. Add Vercel environment variables.  
8. Deploy Next.js app.  
9. Configure production domain.  
10. Test authentication.  
11. Test uploads.  
12. Test chat.  
13. Test VAAD voting.  
14. Test exports.  
15. Test authorization.

---

# **75\. Acceptance Criteria**

The finished system should satisfy all of the following.

## **Kid management**

* Admin can create a new kid.  
* A kid gets a dedicated page automatically.  
* Kids appear on the homepage.  
* Kids can be searched.  
* Status is visible.

## **Authentication**

* Users can sign in using Google.  
* Email login is supported if configured.  
* Only authorized users can access the application.  
* Admin controls users.

## **Chat**

* Each kid has a persistent chat.  
* Multiple authorized users can post.  
* Each message shows author and timestamp.  
* Formatting works.  
* Voice-note messages can be supported.  
* Chat is stored in the database.  
* Chat can be exported.

## **Files**

* Forms can be uploaded.  
* Photos can be uploaded.  
* Multiple voice notes can be uploaded.  
* Each voice note shows uploader.  
* Voice notes can have captions.  
* Transcript can be uploaded.  
* Large assets are not unnecessarily stored in Postgres.

## **VAAD**

* Admin can designate VAAD members.  
* Admin can enable/disable contribution.  
* Admin can enable/disable voting.  
* There are normally three members.  
* Vote records are persistent.  
* Duplicate votes are prevented.  
* Two Accept votes automatically set status to Accepted.  
* Acceptance is recorded in audit history.

## **Statuses**

* Admin can create/edit/deactivate statuses.  
* Status changes are tracked.  
* Admin can manually override status when permitted.

## **Exports**

* Assets can be exported to Google Drive.  
* Structured data can be exported to Google Sheets.  
* Export activity is recorded.  
* Export failures can be retried.

## **Audit**

* Important changes are logged.  
* Historical authorship remains visible.  
* User deactivation does not erase historical attribution.

---

# **76\. Final Implementation Guidance**

Make reasonable engineering decisions without repeatedly asking for clarification.

Where the specification does not define a detail, choose a secure, maintainable, user-friendly default.

Prioritize the core workflow over unnecessary features.

Build the application so that future additions can be made easily, such as:

* additional status types  
* additional application fields  
* additional document types  
* more sophisticated VAAD decisions  
* notifications  
* email integration  
* reminders  
* reporting dashboards  
* additional exports

Do not over-engineer the first version.

The primary objective is a reliable, inexpensive, easy-to-use admissions application with:

**Kids \+ documents \+ photos \+ voice notes \+ shared traceable chat \+ transcripts \+ VAAD voting \+ statuses \+ admin controls \+ audit history \+ Google Drive/Google Sheets exports.**

Before writing production code, produce a concise implementation summary, database schema, authorization model, and route/page map. Then implement the system according to this specification.

