# Heavy Equipment Spare Parts Management System

## Overview
A comprehensive web application designed for industrial equipment maintenance teams to efficiently manage heavy equipment inventory and spare parts. The system features a detailed parts catalog with 3D models and compatibility information, streamlines searching, browsing, and visualization of spare parts, and incorporates robust garage, equipment reception, and multi-level approval workflows to enhance maintenance operations and tracking. The project's vision is to significantly improve efficiency in heavy equipment maintenance.

## User Preferences
I prefer iterative development with clear communication at each stage. Please ask for confirmation before implementing significant architectural changes or adding new external dependencies. I also prefer detailed explanations for complex technical decisions. Ensure all solutions are mobile-compatible, especially for iOS Safari.

## System Architecture

### UI/UX Decisions
The system employs an Industrial Material Design 3 theme, supporting light/dark modes with professional blue primary colors and Inter/JetBrains Mono typography. It features sidebar navigation, responsive data-dense layouts, comprehensive accessibility, and an interactive 3D viewer. Technical engineering drawings with millimeter-accurate dimensions, ISO 2768 tolerance standards, SVG annotations, and CAD export badges are provided via a CNC Milling Precision Viewer.

### Technical Implementations
The frontend uses React 18, TypeScript, Vite, Shadcn UI, Tailwind CSS, Wouter for routing, and TanStack Query. The backend is built with Express.js and Node.js, utilizing PostgreSQL (Neon) with Drizzle ORM. Three.js powers 3D rendering. Authentication is JWT-based with role-based access control using a single `employees` table (roles: ceo, admin, supervisor, mechanic, technician, electrician, painter, body_worker, wash_employee, user), with passwords secured by bcrypt. The application is a Progressive Web App (PWA) optimized for mobile. Manufacturing specifications include detailed dimensions, material, tolerance, weight, CAD formats (STL, STEP, GLTF, GLB), surface finish, and hardness data. Object storage for media and 3D models is handled by Replit Object Storage via Google Cloud Storage using presigned URLs. Database queries are optimized with batch fetching (`inArray()`) to prevent N+1 issues. Work Order numbers are generated using MAX suffix extraction with a flexible regex (`/WO-\d{4}-(\d+)/`) to prevent duplicates.

### Feature Specifications
- **Dashboard**: Dynamic analytics with real-time filtering, KPI cards (total work orders, accomplishment rate, cost), and various charts (quarterly performance, trends, cost distribution, workshop comparison). Auto-calculates direct, overtime, outsource, and overhead costs.
- **Equipment Inventory**: CRUD operations for equipment categories and units, flexible assignment, and real-time UI updates. Category pages include banners, unit display, search, and detailed modals.
- **Spare Parts Catalog**: Advanced filtering, detailed part modals with specs, compatibility, and media.
- **3D Models Library**: Interactive viewer with upload and 360-degree rotation.
- **Maintenance Information System**: Comprehensive guides, tutorials, tools lists, and time estimates.
- **Garage & Workshop Management**: CRUD for garages (main categories) and workshops within them, including foreman and team member assignments.
- **Employee Management**: Single-table authentication via `employees` table, role-based access control, and bcrypt password hashing.
- **Work Order Management**: Full CRUD, auto-generated numbers, assignment (equipment, garage, employee), priority levels, work types, multi-person teams, spare parts selection, automatic cost calculation, and required parts persistence.
- **Equipment Reception/Check-in**: Driver drop-off workflow with equipment selection, driver details, arrival info, issues, and auto-generated reception numbers.
- **Equipment Maintenances Workflow**: Admin review page for driver check-ins, allowing updates and status changes.
- **Equipment Inspection**: View of receptions, auto-generated inspection numbers, service-type checklists (Amharic), and an Inspection-to-Work-Order workflow where completed inspections trigger approval, leading to auto-created work orders.
- **Approval System**: Multi-level workflow for job orders, completions, parts requests, and inspections, with department hierarchy and approval dashboards.
- **Currency Conversion**: Dynamic USD/ETB conversion in the parts catalog.
- **Attendance Device Integration**: Integration with ZKTeco iFace990 Plus via LAN-based TCP/IP for employee user management, including configuration, import, sync, and mapping.

## External Dependencies
- **Replit Object Storage**: For 3D models, images, and videos.
- **Neon**: PostgreSQL database hosting.
- **Resend**: Email notification service.
- **ZKTeco Biometric Device**: iFace990 Plus attendance device, utilizing the `zkteco-js` library.