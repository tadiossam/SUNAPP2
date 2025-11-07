# Heavy Equipment Spare Parts Management System

## Overview
A comprehensive web application for industrial equipment maintenance, focusing on efficient management of heavy equipment inventory and spare parts. It features a detailed parts catalog with 3D models, streamlines searching and visualization, and integrates robust garage, equipment reception, and multi-level approval workflows to enhance maintenance operations and tracking. The project aims to significantly improve efficiency in heavy equipment maintenance.

## User Preferences
I prefer iterative development with clear communication at each stage. Please ask for confirmation before implementing significant architectural changes or adding new external dependencies. I also prefer detailed explanations for complex technical decisions. Ensure all solutions are mobile-compatible, especially for iOS Safari.

## System Architecture

### UI/UX Decisions
The system utilizes an Industrial Material Design 3 theme with light/dark modes, professional blue primary colors, and Inter/JetBrains Mono typography. It features sidebar navigation, responsive data-dense layouts, comprehensive accessibility, and an interactive 3D viewer for technical engineering drawings with millimeter-accurate dimensions, ISO 2768 tolerance standards, SVG annotations, and CAD export badges. Logo customization allows for company logo display on login and in the sidebar.

### Technical Implementations
The frontend is built with React 18, TypeScript, Vite, Shadcn UI, Tailwind CSS, Wouter for routing, and TanStack Query. The backend uses Express.js and Node.js, with PostgreSQL (Neon) and Drizzle ORM. Three.js is used for 3D rendering.

**Authentication & Access Control**: Employs JWT-based authentication and comprehensive Role-Based Access Control (RBAC) via a single `employees` table. Passwords are secured with bcrypt. The system includes case-insensitive role checks, admin superuser access, and helper functions for centralized role checking. Endpoints are protected based on roles such as `store_manager`, `verifier`, `supervisor`, `foreman`, and `team_member`. **Page-Level Access Control**: Granular employee page permissions via the `employee_page_permissions` table allow CEO/Admin users to restrict which pages individual employees can access through the "User Control" tab in Admin Settings. The sidebar navigation filters menu items based on user permissions; CEO and Admin users bypass all restrictions and always have full access. Permissions default to allowed when no explicit rule exists to prevent accidental lockouts. The application is a PWA optimized for mobile. Object storage for media and 3D models uses presigned URLs. Database queries are optimized with batch fetching. Work Order numbers use `WO-YYYY-XXX` format, Requisition numbers `REQ-YYYY-XXX`, and Purchase Order numbers `PO-YYYY-XXX`. Local media storage is organized under `public/uploads/` for employees, spare parts, and equipment.

### Feature Specifications
- **Dashboard**: Dynamic analytics with real-time filtering, KPI cards, and charts.
- **Equipment Inventory**: CRUD operations for equipment categories and units. Includes D365 Fixed Asset import with intelligent description parsing.
- **Spare Parts Catalog**: Full CRUD operations for parts, advanced filtering, detailed information, and D365 BC Item import. Statistics cards show total, low, and out of stock items.
- **3D Models Library**: Interactive viewer with upload and 360-degree rotation.
- **Maintenance Information System**: Guides, tutorials, tools lists, and time estimates.
- **Garage & Workshop Management**: CRUD for hierarchical structures, including foreman and team assignments.
- **Employee Management**: Single-table authentication, RBAC, and bcrypt hashing.
- **Work Order Management**: Multi-level approval system and multi-workshop assignment. Features a redesigned form, team workflow (Foreman assigns → Team requests parts → Verification), and an Item Requisition System with multi-level approval (Team Member → Foreman → Store Manager) and per-line foreman approval. Automated purchase request creation for out-of-stock items. Includes a comprehensive approval chain (Team Member → Foreman → Verifier → Supervisor → Final Completion) and a detailed status flow, with participant tracking and status history. A Work Timer Tracking System automatically tracks work duration, pauses for waiting periods, and resumes when work continues. Automatic `parts_receipts` creation upon requisition approval.
- **Work Order Status Flow**: `pending_allocation` → `pending_foreman_assignment` → `pending_team_acceptance` → `in_progress` → `pending_verification` → `verified` → `completed`. Status may also transition to `awaiting_parts` or `waiting_purchase`.
- **Role-Specific Dashboards**: Dedicated dashboards for Store Managers, Foremen, Verifiers, and Team Performance pages with leaderboards.
- **Equipment Reception/Check-in**: Driver drop-off workflow with auto-generated reception numbers.
- **Equipment Maintenances Workflow**: Admin review for driver check-ins.
- **Equipment Inspection**: View of receptions, auto-generated inspection numbers, and service-type checklists.
- **Approval System**: Multi-level workflow for job orders, completions, parts requests, and inspections.
- **Item Requisition Forms**: Matches official forms with line-item descriptions, quantities, and multi-level signatures, including individual line-item approval for Store Managers with partial fulfillment and PO generation.
- **Employee Performance Tracking**: Gamification system with daily/monthly/yearly leaderboards based on completed work orders and average completion time.
- **Maintenance History**: Comprehensive equipment maintenance tracking page with searchable equipment selection, statistics cards, and clickable maintenance cards showing work order details.
- **Currency Conversion**: Dynamic USD/ETB conversion in the parts catalog.
- **Attendance Device Integration**: Integration with ZKTeco iFace990 Plus for employee management.
- **Deployment Tool**: Admin settings for server host/port configuration, saved to the database. Includes database schema export functionality.
- **Fleet Tracking System**: Real-time GPS tracking integration with MellaTech platform. Features include vehicle location tracking, trip history, fleet alerts monitoring, automatic data synchronization, and comprehensive fleet management dashboard. Credentials stored securely as environment variables.

## External Dependencies
- **Replit Object Storage**: For 3D models, images, and videos.
- **Neon**: PostgreSQL database hosting.
- **Resend**: Email notification service.
- **ZKTeco Biometric Device**: iFace990 Plus attendance device, utilizing the `zkteco-js` library.
- **Dynamics 365 Business Central**: For importing Fixed Assets and Items (equipment and spare parts).
- **MellaTech Fleet Tracking**: GPS vehicle tracking platform (mellatech.et) for real-time fleet monitoring, trip history, and alerts. Authentication credentials stored as environment variables (MELLATECH_USERNAME, MELLATECH_PASSWORD).