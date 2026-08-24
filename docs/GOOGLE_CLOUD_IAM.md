# Google Cloud Platform IAM & Service Account Configuration Runbook

This runbook describes how to configure Google Cloud Platform (GCP), provision Google Service Account credentials, and set up Google Drive and Google Sheets integrations for **Oorah Admissions**.

---

## ☁️ Step 1: Create GCP Project & Enable APIs

1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Click **Select a Project** > **New Project**.
3. Name the project `oorah-admissions-prod` and select your organization.
4. Navigate to **APIs & Services > Library**.
5. Search for and enable the following APIs:
   - **Google Drive API**
   - **Google Sheets API**

---

## 🔑 Step 2: Create Service Account & Generate Keys

1. Navigate to **IAM & Admin > Service Accounts**.
2. Click **+ Create Service Account**.
   - **Name:** `oorah-admissions-service-account`
   - **ID:** `oorah-admissions-sa`
   - **Description:** Application service account for uploading files to Google Drive and syncing data to Google Sheets.
3. Click **Create and Continue**.
4. Grant the Service Account the following project roles:
   - **Viewer** (or custom minimal role with Drive/Sheets file access).
5. Click **Done**.
6. Select the newly created service account and go to the **Keys** tab.
7. Click **Add Key > Create New Key**.
8. Select **JSON** format and click **Create**.
9. Download the JSON key file securely.

---

## 📁 Step 3: Configure Google Drive Shared Folder Permissions

To ensure uploaded applicant files (photos, voice notes, forms, transcripts) land in the organization's Google Drive:

1. Log into your Organization Google Workspace Google Drive account.
2. Create a root folder named `Oorah Admissions Applications`.
3. Right-click the folder and select **Share**.
4. Paste the Service Account email address (e.g. `oorah-admissions-sa@oorah-admissions-prod.iam.gserviceaccount.com`).
5. Set permission level to **Editor**.
6. Uncheck "Notify people" and click **Share**.
7. Copy the Root Folder ID from the Drive URL (`https://drive.google.com/drive/folders/<FOLDER_ID>`) and store it if configured in environment variables.

---

## 📝 Step 4: Map Service Account Credentials to Environment Variables

Extract credentials from the downloaded JSON key file and set the corresponding environment variables in Vercel:

```json
{
  "project_id": "GOOGLE_PROJECT_ID",
  "client_email": "GOOGLE_SERVICE_ACCOUNT_EMAIL",
  "private_key": "GOOGLE_PRIVATE_KEY"
}
```

> 🔐 **Security Policy:** Never commit raw Google Service Account JSON key files into Git. Always inject key values via Vercel / environment secrets.
