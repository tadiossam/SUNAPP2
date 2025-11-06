# Heavy Equipment Spare Parts Management System

## Overview
A comprehensive web application designed for industrial equipment maintenance teams to efficiently manage heavy equipment inventory and spare parts. The system features a detailed parts catalog with 3D models and compatibility information, streamlines searching, browsing, and visualization of spare parts, and incorporates robust garage, equipment reception, and multi-level approval workflows to enhance maintenance operations and tracking. The project's vision is to significantly improve efficiency in heavy equipment maintenance.

## User Preferences
I prefer iterative development with clear communication at each stage. Please ask for confirmation before implementing significant architectural changes or adding new external dependencies. I also prefer detailed explanations for complex technical decisions. Ensure all solutions are mobile-compatible, especially for iOS Safari.

## System Architecture

### UI/UX Decisions
The system employs an Industrial Material Design 3 theme, supporting light/dark modes with professional blue primary colors and Inter/JetBrains Mono typography. It features sidebar navigation, responsive data-dense layouts, comprehensive accessibility, and an interactive 3D viewer. Technical engineering drawings with millimeter-accurate dimensions, ISO 2768 tolerance standards, SVG annotations, and CAD export badges are provided via a CNC Milling Precision Viewer.

### Technical Implementations
The frontend uses React 18, TypeScript, Vite, Shadcn UI, Tailwind CSS, Wouter for routing, and TanStack Query. The backend is built with Express.js and Node.js, utilizing PostgreSQL (Neon) with Drizzle ORM. Three.js powers 3D rendering. 

**Authentication & Access Control**: JWT-based authentication with comprehensive role-based access control (RBAC) using a single `employees` table. Available roles: ceo, admin, supervisor, mechanic, technician, electrician, painter, body_worker, wash_employee, user, verifier, store_manager. Passwords are secured using bcrypt hashing. The system implements:
- **Case-Insensitive Role Checks**: All role comparisons use `.toLowerCase()` for consistent matching regardless of case
- **Admin Superuser Access**: The `admin` role has unrestricted access to all endpoints and features, automatically bypassing all role-based restrictions via the `hasRole()` helper function in `server/auth.ts`. Admin users see unfiltered datasets across all dashboards.
- **Helper Functions**: `hasRole(user, ...roles)` provides centralized role checking with admin bypass; `isAdmin(user)` checks for admin role specifically
- **Endpoints Protected by Role**: 
  - Store Manager endpoints (`/api/item-requisitions/store-manager`, approval/reject actions) - accessible by store_manager or admin
  - Verifier endpoints (`/api/work-orders/verifier/pending`, approval/reject actions) - accessible by verifier, ceo, or admin
  - Supervisor endpoints (`/api/work-orders/supervisor/pending`, approval/reject actions) - accessible by supervisor, ceo, or admin
  - Foreman endpoints (`/api/work-orders/foreman/pending`, `/api/work-orders/foreman/active`, `/api/item-requisitions/foreman`) - accessible by workshop foremen or admin (admin sees ALL data)
  - Team Member endpoints (`/api/work-orders/my-assignments`, `/api/item-requisitions`) - accessible by all employees (admin sees ALL data, regular users see only their assignments)
- **Admin Full Visibility**: When logged in as admin, all dashboard endpoints return complete datasets without filtering:
  - Foreman Dashboard: Shows ALL foreman pending/active work orders and requisitions
  - Team Member "My Work": Shows ALL work orders with team assignments and ALL requisitions
  - Store Manager Dashboard: Shows ALL store manager requisitions and purchase orders
- **Admin Credentials**: Username: `RPAdmin`, Password: `RPAdmin` (full system access)

The application is a Progressive Web App (PWA) optimized for mobile. Manufacturing specifications include detailed dimensions, material, tolerance, weight, CAD formats (STL, STEP, GLTF, GLB), surface finish, and hardness data. Object storage for media and 3D models is handled by Replit Object Storage via Google Cloud Storage using presigned URLs. Database queries are optimized with batch fetching (`inArray()`) to prevent N+1 issues. Work Order numbers are generated using MAX suffix extraction with a flexible regex (`/WO-\d{4}-(\d+)/`) to prevent duplicates. Requisition numbers follow pattern REQ-YYYY-XXX and purchase order numbers follow PO-YYYY-XXX.

### Feature Specifications
- **Dashboard**: Dynamic analytics with real-time filtering, KPI cards (total work orders, accomplishment rate, cost), and various charts (quarterly performance, trends, cost distribution, workshop comparison). Auto-calculates direct, overtime, outsource, and overhead costs.
- **Equipment Inventory**: CRUD operations for equipment categories and units, flexible assignment, and real-time UI updates. Category pages include banners, unit display, search, and detailed modals.
- **Spare Parts Catalog**: Advanced filtering, detailed part modals with specs, compatibility, and media.
- **3D Models Library**: Interactive viewer with upload and 360-degree rotation.
- **Maintenance Information System**: Comprehensive guides, tutorials, tools lists, and time estimates.
- **Garage & Workshop Management**: CRUD for garages (main categories) and workshops within them, including foreman and team member assignments. Garages page displays workshops hierarchically within each garage card.
- **Employee Management**: Single-table authentication via `employees` table, role-based access control, and bcrypt password hashing.
- **Work Order Management (REDESIGNED WORKFLOW)**: Complete redesign with multi-level approval system and multi-workshop assignment:
  - **Multi-Workshop Assignment**: Work orders can be assigned to multiple garages and workshops simultaneously using checkbox selection dialog showing hierarchical garage→workshop relationships. Frontend sends garageIds and workshopIds arrays; backend stores in work_order_garages and work_order_workshops junction tables.
  - **Work Order Form (Redesigned)**: Removed all deprecated fields (assignedToIds, estimatedHours, estimatedCost, scheduledDate, notes). Implements multi-garage/workshop selection dialog with real-time garage/workshop loading when editing existing work orders via `/api/work-orders/:id/assignments` endpoint.
  - **Team Workflow**: Workshop foreman receives work orders → assigns to team members → team requests parts → completion verification
  - **Item Requisition System**: Bilingual (Amharic/English) parts request form with multi-level approval (Team Member → Foreman → Store Manager)
  - **Purchase Order Integration**: Automatic purchase request creation for out-of-stock items with "waiting for purchase" status
  - **Approval Chain**: Team Member completes → Foreman → Verifier (quality control) → Supervisor → Final completion
  - **Work Order Status Flow**: draft → pending_foreman_assignment → pending_team_acceptance → active → awaiting_parts → waiting_purchase → in_progress → pending_verification → pending_supervisor → completed
  - **Participant Tracking**: Comprehensive tracking of all foremen, team members, verifiers, and store managers involved in each work order
  - **Status History**: Complete audit trail of all status changes with timestamps and responsible employees
  - **Work Timer Tracking System**: Automatic work duration tracking with intelligent pause/resume:
    - **Timer Start**: Automatically starts when foreman assigns team members (status → "active")
    - **Automatic Pause**: Timer pauses when work order enters "awaiting_parts" or "waiting_purchase" status
    - **Automatic Resume**: Timer resumes when store manager approves parts and changes status to "in_progress"
    - **Elapsed Time Calculation**: Total work time = (completed or current time) - start time - sum of paused durations
    - **Database Tracking**: `work_order_time_tracking` table logs all timer events (start, pause, resume, complete) with timestamps and triggering employees
    - **UI Display**: Elapsed time shown in **bold red** on TeamDashboard and ForemanDashboard work order cards with "(Paused)" indicator when timer is stopped
    - **Accurate Labor Hours**: Excludes time spent waiting for parts to provide true active work duration for performance metrics
  - **Role-Specific Dashboards**: 
    - **Store Manager Dashboard** (`/store-manager`): Pending parts requisitions with approve/reject actions, recent activity feed, quick stats
    - **Foreman Dashboard** (`/foreman`): Work orders pending team assignment, team member selection, assignment tracking
    - **Verifier Dashboard** (`/verifier`): Work orders pending quality verification, approval/rejection with notes
    - **Team Performance Page** (`/team-performance`): Daily/Monthly/Yearly leaderboards with performance scores, top performers displayed without emoji (using Lucide icons only per design guidelines)
- **Equipment Reception/Check-in**: Driver drop-off workflow with equipment selection, driver details, arrival info, issues, and auto-generated reception numbers.
- **Equipment Maintenances Workflow**: Admin review page for driver check-ins, allowing updates and status changes.
- **Equipment Inspection**: View of receptions, auto-generated inspection numbers, service-type checklists (Amharic). Inspections can be completed and approved independently. Work orders must be created manually from the Work Orders page by selecting approved or completed inspections.
- **Approval System**: Multi-level workflow for job orders, completions, parts requests, and inspections, with department hierarchy and approval dashboards.
- **Item Requisition Forms**: Matches the official Sunshine Construction PLC requisition form (translated from Amharic) with:
  - Requisition number (REQ-YYYY-XXX format)
  - Requesting workshop/department
  - Line items: Description, Unit of Measure, Quantity, Remarks
  - Multi-level signatures: Requester → Foreman → Store Manager
  - **Individual Line-Item Approval System** (Store Manager):
    - Per-line action selection: Approve / Backorder / Reject
    - **Automatic Partial Fulfillment**: If stock insufficient, system automatically issues available quantity and creates purchase order for remainder
    - Example: 11 items requested, 8 in stock → Issues 8, creates PO for 3
    - Real-time stock status indicators with color coding
    - Line-level status tracking: pending, approved, rejected, backordered, fulfilled
    - Automatic stock deduction upon approval
    - Purchase order generation (PO-YYYY-NNN format) using advisory locks to prevent collisions
    - Work order status transitions: `waiting_purchase` when items backordered, `in_progress` when all items issued
  - **Purchase Orders Tab**: Store Manager dashboard displays all pending purchase requests with detailed tracking
- **Employee Performance Tracking**: Gamification system with daily/monthly/yearly leaderboards:
  - **Performance Score Calculation**: Formula = (workOrdersCompleted × 100) / (avgCompletionTime + 1)
    - Rewards both speed and quantity: higher scores for more completed work orders and faster completion times
    - Average completion time calculated from work_order_time_tracking table for accurate active work duration
    - Automatic exclusion of paused time (waiting for parts) to measure true performance
  - **API Endpoints**: `/api/performance/daily`, `/api/performance/monthly`, `/api/performance/yearly`
  - **Team Performance Page** (`/team-performance`): 
    - Three tabs for different time periods (Daily/Monthly/Yearly)
    - Ranked leaderboards with performance cards showing:
      - Rank badge with icons (Trophy/Medal/Award/TrendingUp)
      - Employee name and role
      - Work orders completed count
      - Average completion time (formatted as hours/minutes)
      - Performance score
    - Current logged-in user highlighted with green "You" badge and distinct styling
    - Empty state display when no performance data available
  - Employee of the Month/Year awards
  - Login page displays top performers with achievement details
  - Metrics tracked: work orders completed, average completion time, total labor hours, requisitions processed
- **Currency Conversion**: Dynamic USD/ETB conversion in the parts catalog.
- **Attendance Device Integration**: Integration with ZKTeco iFace990 Plus via LAN-based TCP/IP for employee user management, including configuration, import, sync, and mapping.

## External Dependencies
- **Replit Object Storage**: For 3D models, images, and videos.
- **Neon**: PostgreSQL database hosting.
- **Resend**: Email notification service.
- **ZKTeco Biometric Device**: iFace990 Plus attendance device, utilizing the `zkteco-js` library.