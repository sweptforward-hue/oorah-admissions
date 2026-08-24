# Oorah Admissions Management System — Architecture

## Overview
Production-ready full-stack admissions management platform for Oorah, built with Next.js App Router, PostgreSQL (Supabase), and Google Workspace integrations (Google Drive, Google Sheets).

## Architecture Highlights
- **Framework**: Next.js 15+ (App Router), React 19, TypeScript
- **Database**: PostgreSQL on Supabase with 19 canonical tables, atomic stored procedures, and least-privilege Row Level Security (RLS).
- **Authentication**: Session-aware SSR client via `@supabase/ssr` reading encrypted cookie JWTs, with edge middleware protecting `/admin/*`, `/kids/*`, `/vaad/*`, and `/dashboard`.
- **External Storage**: Google Drive API connector organizing files hierarchically (`Oorah Admissions / Kid {ID} - {Name} / [Photos, Voice Notes, Documents, Transcripts, Chat]`) and authenticated HTTP 206 streaming proxy.
- **Reporting Engine**: 7-tab Google Sheets exporter with frozen headers and styling, plus streaming RFC 4180 CSV export service.
- **Media Pipeline**: In-browser audio recorder, custom accessible HTML5 player, lightbox gallery viewer, and MIME/size validation.
- **Audit & Attribution**: Append-only database audit log table with soft user deactivation to preserve historical attribution.
