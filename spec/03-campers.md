# 03 — Campers Workstream

Read `AGENTS.md` and `SPEC.md` first. Own the Campers-facing navigation, dashboard/list, creation flow, camper detail page, and integration of existing application features.

## Additional user requirements

- Rename/label the operational section as **Campers** while preserving compatibility with the existing `Kid`/`kids` model where required.
- Provide a prominent `+ Create New Camper` button.
- New Camper creation should preserve the existing automatic record/page initialization behavior from `SPEC.md`.
- Add a `Contract` section/tab to every camper detail page. The Contract workstream owns the deeper document behavior.

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

