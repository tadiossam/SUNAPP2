# Heavy Equipment Spare Parts Management System

## Overview
A comprehensive web application for industrial equipment maintenance teams to manage heavy equipment inventory and spare parts. It features a detailed parts catalog with 3D models, compatibility information, and manufacturing specifications. The system streamlines searching, browsing, and visualizing spare parts and includes robust garage, equipment reception, and multi-level approval workflows to enhance maintenance operations and tracking. The project aims to improve efficiency in heavy equipment maintenance.

## User Preferences
I prefer iterative development with clear communication at each stage. Please ask for confirmation before implementing significant architectural changes or adding new external dependencies. I also prefer detailed explanations for complex technical decisions. Ensure all solutions are mobile-compatible, especially for iOS Safari.

## System Architecture

### UI/UX Decisions
The system uses an Industrial Material Design 3 theme with light/dark mode, professional blue primary colors, Inter and JetBrains Mono typography. It features sidebar navigation, responsive data-dense layouts, and comprehensive accessibility. A 3D viewer supports interactive rotation, zoom, and loading states. A CNC Milling Precision Viewer provides technical engineering drawings with millimeter-accurate dimensions, ISO 2768 tolerance standards, SVG annotations, and CAD export badges.

### Technical Implementations
The frontend is built with React 18, TypeScript, Vite, Shadcn UI, Tailwind CSS, Wouter for routing, and TanStack Query for state management. The backend uses Express.js with Node.js, and the database is PostgreSQL (Neon) with Drizzle ORM. Three.js is used for 3D viewing. Authentication is JWT-based with role-based access control (CEO, Admin, User) and bcrypt for password hashing. The application is a Progressive Web App (PWA) with service workers for offline support and is optimized for mobile compatibility, including iOS. Manufacturing specifications include millimeter-precision dimensions, material, tolerance, weight, CAD formats (STL, STEP, GLTF, GLB), surface finish, and hardness data. Object storage is handled by Replit Object Storage via Google Cloud Storage using presigned URLs for secure image, video, and 3D model uploads. **Performance**: Database queries are optimized with batch fetching using `inArray()` to eliminate N+1 query problems - work orders and equipment receptions endpoints reduced from 1.5-2s to sub-second response times by consolidating 325+ queries into 7-8 bulk queries per request.

### Feature Specifications
- **Dashboard**: Dynamic analytics dashboard with real-time data filtering. Features include: 
  - **Filters**: Time period (daily, weekly, monthly, Q1-Q4, annual), workshop selection, and year selection
  - **KPI Cards**: Total work orders, accomplishment rate, total cost, and active workshops
  - **Charts**: Quarterly performance (bar), accomplishment trend (line), workshop comparison (horizontal bar), cost trend (line), cost distribution (pie), workshop cost analysis (progress bars)
  - **Auto-calculated Costs**: Direct maintenance cost, overtime cost, outsource cost, and overhead (30%) from work order data
  - **Workshop Performance**: Real-time comparison across all maintenance workshops with quarterly accomplishment rates
  - **Data Source**: Dynamically calculated from work_orders table based on selected filters, with fallback cost estimation when detailed breakdown not available
- **Equipment Inventory**: CRUD for equipment categories, flexible equipment assignment (categories vs. types), simplified forms, and real-time UI updates. Category-based grouping with clickable cards and dedicated category pages.
- **Equipment Category Pages**: Full-screen banners with category details, unit display in a 2-column grid, search, and equipment detail modals with maintenance history, parts used, and operating reports.
- **Spare Parts Catalog**: Advanced filtering, detailed part modals with specifications, compatibility, media, and maintenance guides.
- **3D Models Library**: Interactive viewer with upload and 360-degree rotation.
- **Maintenance Information System**: Instructions, tutorials, tools lists, and time estimates.
- **CEO Access Control**: CEO-only access for equipment management.
- **Garage Management**: Garages serve as main categories. Each garage has a name, location, and capacity. Garages can contain multiple workshops. Workshop management includes workshop creation with name, foreman (boss) selection, optional description, and member selection (team members). Workshop cards display foreman name and total member count. Full CRUD operations for both garages and workshops with proper dependency checks.
- **Employee Management & Authentication**: Employee login with system roles (CEO, Admin, User), bcrypt for password hashing, and dual authentication checking user and employee tables.
- **Work Order Management**: Full CRUD, auto-generated numbers (WO-YYYY-XXX), equipment/garage/employee assignment, priority levels, work types, multi-person team assignment via dialog, spare parts selection via catalog dialog, automatic cost calculation, and required parts persistence.
- **Equipment Reception/Check-in**: Driver drop-off workflow with equipment unit selection, driver selection, arrival date, kilometrage, fuel level, reason for maintenance, reported issues, and auto-generated reception numbers (REC-YYYY-XXX). Tracking of check-ins with status badges.
- **Equipment Maintenances Workflow**: Admin review page for driver check-ins, allowing updates to reception details (service type, admin issues, inspection officer assignment) with status updates. Admin-only access.
- **Equipment Inspection**: View of all equipment receptions with assigned inspection officers. Auto-generated inspection numbers (INS-YYYY-XXX). Service-type-based checklists (Long Term/Short Term) in Amharic with interactive columns for status and comments. Save and submit functionality. **Inspection-to-Work-Order Workflow**: When inspection is completed, the system automatically creates an approval request. When the approval is approved by a supervisor, a work order is auto-created with linked inspection and reception data. Work orders display "View Inspection" and "View Maintenance" buttons to show related details.
- **Approval System**: Multi-level approval workflow for job orders, completions, parts requests, and inspections, with department hierarchy, approval limits, and a pending approvals dashboard. Inspection approvals trigger automatic work order creation upon approval.
- **Currency Conversion**: Dynamic USD/ETB conversion in the parts catalog.
- **Attendance Device Integration**: Integration with ZKTeco iFace990 Plus biometric device for employee user management. Features include device configuration, connection testing, one-time import, ongoing sync of new users, employee mapping, import history, and status monitoring via LAN-based TCP/IP communication.

## External Dependencies
- **Replit Object Storage**: For 3D models, images, and videos.
- **Neon**: PostgreSQL database hosting.
- **Resend**: Email notification service.
- **ZKTeco Biometric Device**: iFace990 Plus attendance device for employee user management, utilizing the `zkteco-js` library.

## Windows Compatibility
The application can run locally on Windows with the following setup:
- **Node.js**: Version 18+ required
- **Port Configuration**: Uses port 3000 (port 6000 is blocked by Chrome as unsafe)
- **Network Access**: Server accessible at http://192.168.0.34:3000 from any device on the local network
- **Database**: Connects to remote Neon PostgreSQL database (no local database needed)
- **Environment Variables**: Loaded via dotenv with cross-env for Windows compatibility
- **Platform-Specific Fixes**: 
  - `reusePort` option disabled on Windows (not supported)
  - `cross-env` package ensures NODE_ENV is set correctly
  - Server binds to 0.0.0.0 for network accessibility
  - Batch files provided: `SETUP-FIRST-TIME.bat`, `START-WINDOWS.bat`, `ALLOW-FIREWALL.bat`, `CHECK-IP.bat`
- **Firewall**: Windows Firewall must allow port 3000 for network access (use `ALLOW-FIREWALL.bat`)
- **Known Issues**: bcrypt requires native compilation on Windows (automatically handled by npm install)