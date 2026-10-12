---
name: Dedicated CRM Portal (crm.aassaybiz.com)
description: Future implementation architecture for a standalone CRM sales portal on crm.aassaybiz.com integrated in real-time with the main portal, featuring role-based lead visibility and centralized management oversight.
type: feature
status: planned
---

## Objective
Design and deploy a dedicated, high-speed sales portal at `crm.aassaybiz.com` that connects directly with the existing enterprise database, enforcing strict role-based access control (RBAC), real-time updates, and centralized oversight for company leadership.

## Architecture & Implementation Specifications

### 1. Subdomain & Hosting Structure
- **Subdomain**: `crm.aassaybiz.com`
- **Deployment Pattern**: Independent, lightweight Vite frontend bundle (similar to `attendance-portal` on `attendance.aassaybiz.com`), served via Nginx reverse proxy on EC2.
- **Focus**: Dedicated to sales operations (Leads, Kanban Pipeline, Deals, Follow-up Calendar, Call Logs, WhatsApp/Email outreach, Support Escalation). Excludes accounting, invoicing, payroll, and sensitive corporate finances.

### 2. Unified Database & Zero-Lag Real-Time Sync
- **Single Source of Truth**: Both `aassaybiz.com` and `crm.aassaybiz.com` connect to the same Supabase database with multi-tenant `org_id` isolation.
- **Instant Two-Way Synchronization**:
  - Activities, notes, and call logs recorded on the CRM portal write directly to the `activities` table.
  - Lead status and deal stage changes update `leads` and `opportunities` tables immediately.
  - Support issues and follow-ups raised within the CRM portal write directly to `tickets` and notify central support in the main portal.
  - Supabase Realtime listeners (`supabase.channel('leads_changes')`, `supabase.channel('activities_changes')`) keep management dashboards on the main portal live without requiring page reloads.

### 3. Role-Based Access Control (RBAC) & Lead Visibility
- **Sales Executive Role**:
  - Filtered View: Executives only query and view leads where `assigned_to = current_user_id`.
  - Restricted Action Scope: Full CRM action toolkit (status updates, notes, call logs, WhatsApp, quotation links) is functional, but strictly sandboxed to their assigned leads.
  - Data Protection: Cannot view unassigned leads or leads belonging to other sales representatives.
- **Sales Manager / Administrator Role (Main Portal)**:
  - Universal Visibility: Full access to view, filter, and analyze all leads and deals across the organization.
  - Reassignment Engine: Ability to assign and re-assign leads between sales representatives based on territory, workload, or performance.

### 4. Centralized Management Oversight (Main Portal)
- **Live Activity Feed**: Management sees live timestamped updates of every sales representative's calls, notes, and follow-ups.
- **Agent Performance Metrics**: Daily call logs, completed follow-ups, deal progression, and conversion rates per sales rep.
- **Audit Logging**: Immutable historical audit trail for every lead status transition.
