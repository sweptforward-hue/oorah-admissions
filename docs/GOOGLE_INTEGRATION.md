# Google Cloud Integration Setup

## Service Account Setup
1. Create a Google Cloud Project and enable Google Drive API and Google Sheets API.
2. Create a Service Account with role `Editor` on the shared admissions Google Drive folder.
3. Generate a JSON Key and extract `client_email` and `private_key`.
4. Share the root Drive folder (`GOOGLE_DRIVE_ROOT_FOLDER_ID`) with the service account email.
