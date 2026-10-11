# Google Cloud Integration Setup

## OAuth Scopes & Brand Verification Policy
The application uses the non-sensitive **`https://www.googleapis.com/auth/drive.file`** scope instead of the full `https://www.googleapis.com/auth/drive` scope:
- **Scope**: `https://www.googleapis.com/auth/drive.file`
- **Why**: Under Google API Services User Data Policy, `drive.file` is classified as a non-sensitive / per-file permission scope. It gives the application access only to files created or opened by this application.
- **Brand Verification Avoidance**: Because `drive.file` is not a restricted or broad sensitive scope, you **do not** need Google OAuth brand verification or CASA Tier-2 security assessments.

### Google Cloud Console OAuth Consent Screen Setup:
1. In the **Google Cloud Console**, navigate to **APIs & Services > OAuth consent screen**.
2. Under **Scopes for Google APIs**, add:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `openid`
   - `https://www.googleapis.com/auth/drive.file`
3. **Do not** add `https://www.googleapis.com/auth/drive` (the full scope).
4. Save and continue. The app will not trigger the "Google hasn't verified this app" blocking screen for authorized domains.

## Service Account Setup
1. Create a Google Cloud Project and enable Google Drive API and Google Sheets API.
2. Create a Service Account with role `Editor` on the shared admissions Google Drive folder.
3. Generate a JSON Key and extract `client_email` and `private_key`.
4. Share the root Drive folder (`GOOGLE_DRIVE_ROOT_FOLDER_ID`) with the service account email.
