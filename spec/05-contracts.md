# 05 — Contracts Workstream

Read `AGENTS.md` and `SPEC.md` first. Own the new Camper Contract capability using the same secure file/document architecture already required by the product specification.

## Additional user requirement — Camper Contract

Every Camper must have a dedicated **Contract** section/tab.

Support:

- upload a contract
- view/open the contract securely
- download where permitted
- replace/update where permitted
- contract status/metadata
- uploader attribution
- created/updated timestamps
- Google Drive file reference where applicable
- audit-log entries
- permission checks and RLS/server authorization

Do not create a parallel storage architecture. Reuse the existing document/file services and secure Google Drive approach from `SPEC.md`.

Contracts are sensitive application materials and must not become public by default.

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

