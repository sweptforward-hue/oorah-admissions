# 01 — Database Workstream

Read `AGENTS.md` and `SPEC.md` first. Own the relational data model, migrations, constraints, RLS, and persistence contracts. The existing specification calls for Postgres as the system of record and a maintainable relational schema.

## Additional user requirements

Add persistence for:

- configurable VAAD voting choices, including ordering and active/inactive state
- historical preservation of the selected choice on existing votes
- camper contracts and their metadata/references
- separate Campers/Staff domain separation where needed without breaking existing `kids`/`users` compatibility

Do not hardcode voting choices into the database seed as the only supported implementation; seed defaults may exist, but the Admin UI must be able to change them.

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

