# Oorah Admissions Management System — Jules Issue Tracking & Remediation Register

This register documents all issues created, monitored, and maintained under the `@jules` issue tracking system for the production transformation of the Oorah Admissions platform.

## Issue Summary Matrix

| Issue ID | Module / Area | Priority | Status | Description |
| :--- | :--- | :---: | :---: | :--- |
| **JULES-101** | Security / Auth | **P0 (Critical)** | `RESOLVED` | Service-Role key bypass in server path replaced with session/cookie-aware Supabase client. |
| **JULES-102** | Security / Auth | **P0 (Critical)** | `RESOLVED` | Global route authorization middleware & decentralized caller role checks implemented. |
| **JULES-103** | Database / Schema | **P0 (Critical)** | `RESOLVED` | Duplicate `kids` definitions and competing `vaad_choices` / `vaad_voting_choices` unified into canonical schema. |
| **JULES-104** | VAAD Engine / RPC | **P0 (Critical)** | `RESOLVED` | Atomic `submit_vaad_vote` RPC with `SELECT ... FOR UPDATE` locking and automatic 2-of-3 status change. |
| **JULES-105** | Security / RLS | **P0 (Critical)** | `RESOLVED` | Redesigned least-privilege PostgreSQL Row Level Security across all 19 database tables. |
| **JULES-106** | Google Connectors | **P0 (Critical)** | `RESOLVED` | Real Google Drive API connector for hierarchical storage and secure authenticated streaming proxy. |
| **JULES-107** | Reporting / Exports | **P1 (High)** | `RESOLVED` | Real 7-tab Google Sheets export engine and streaming RFC 4180 CSV generator with retry queue. |
| **JULES-108** | Media Pipeline | **P1 (High)** | `RESOLVED` | In-browser MediaRecorder audio capture, custom captions, gallery viewer, and document manager. |
| **JULES-109** | Real-Time Chat | **P1 (High)** | `RESOLVED` | Persistent, traceable admissions chat with rich text formatting, author attribution, and in-chat audio notes. |
| **JULES-110** | UI/UX & Dead Links | **P1 (High)** | `RESOLVED` | Replaced all mock dashboards, hardcoded metric cards, dead links, and browser `alert()`/`prompt()` dialogs. |
| **JULES-111** | Audit & Attribution | **P1 (High)** | `RESOLVED` | Append-only audit trail logging system with historical attribution preservation on user deactivation. |
| **JULES-112** | Ops & Hardening | **P1 (High)** | `RESOLVED` | Strict environment schema validation, unified test harness, and Vercel/Supabase deployment runbooks. |
