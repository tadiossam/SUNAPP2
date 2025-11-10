# Heavy Equipment Spare Parts Management System

## Overview
A comprehensive web application for managing heavy equipment inventory and spare parts within an industrial maintenance context. The system aims to enhance maintenance operations and tracking through a detailed parts catalog with 3D models, streamlined searching, and robust workflows for garage management, equipment reception, and multi-level approvals. It supports efficient management of industrial equipment maintenance.

## User Preferences
I prefer iterative development with clear communication at each stage. Please ask for confirmation before implementing significant architectural changes or adding new external dependencies. I also prefer detailed explanations for complex technical decisions. Ensure all solutions are mobile-compatible, especially for iOS Safari.

## System Architecture

### UI/UX Decisions
The system features an Industrial Material Design 3 theme with light/dark modes, professional blue colors, and Inter/JetBrains Mono typography. It includes sidebar navigation, responsive data-dense layouts, accessibility features, and an interactive 3D viewer for technical drawings with accurate dimensions and SVG annotations. Logo customization is supported. The design is mobile-first, optimized for all devices and iOS Safari, using responsive patterns like horizontal scrolling tabs and adaptive grids.

### Technical Implementations
The frontend is built with React 18, TypeScript, Vite, Shadcn UI, Tailwind CSS, Wouter, and TanStack Query. The backend uses Express.js and Node.js with PostgreSQL (Neon) and Drizzle ORM. Three.js is used for 3D rendering. Authentication is JWT-based with comprehensive Role-Based Access Control (RBAC) and bcrypt for password hashing. Granular page-level access control is implemented via a dedicated table. The application is a PWA. Object storage utilizes presigned URLs. Database query optimization includes batch fetching and `inArray` queries to mitigate N+1 problems. Work order, requisition, and purchase order numbers follow specific formats. Local media storage is organized under `public/uploads/`. The system uses an Ethiopian calendar-based fiscal year for all reporting and analytics.

**Labor Cost Calculation**: Minute-based entry system where users enter time in minutes (UI), which is converted to hours for storage (database stores decimal hours). Server-side recalculates totalCost using formula: `(minutesWorked / 60) × hourlyRateSnapshot × overtimeFactor`. Per-minute rate is 250 ETB/hour ÷ 60 = 4.17 ETB/minute. This ensures accurate cost tracking and prevents client-side calculation manipulation.

**Workshop Filtering**: Dashboard analytics properly filter work orders through the `work_order_workshops` junction table (multi-workshop assignments). Queries safely handle undefined predicates and fetch the primary workshop for display.

### Feature Specifications
Key features include a dynamic Dashboard with analytics, CRUD operations for Equipment Inventory (supporting D365 import) and Spare Parts Catalog (with D365 import, stock status logic, and statistics). A 3D Models Library provides interactive viewing. Maintenance Information System manages guides and tools. Garage & Workshop Management supports hierarchical structures and uses a full-page workflow for adding/editing workshops with a paginated employee selection interface. Employee Management handles authentication and RBAC. Work Order Management features a multi-level approval system, multi-workshop assignment, an Item Requisition System with multi-level approval and partial fulfillment, automated purchase requests, a comprehensive approval chain with status tracking, and a Work Timer Tracking System. Role-specific Dashboards are provided. Equipment Reception/Check-in and Equipment Inspection processes are managed. A multi-level Approval System is central to workflows. Item Requisition Forms match official forms, supporting individual line-item approval. Employee Performance Tracking uses gamification. Maintenance History provides a comprehensive view of equipment service records. Currency conversion for USD/ETB is included. Integration with ZKTeco iFace990 Plus for attendance and MellaTech for Fleet Tracking (GPS data auto-fill for equipment reception) are present. Ethiopian Year Management includes automatic year detection, a transactional year closure workflow with work order archiving, planning targets reset, and audit logging. Cost Tracking & Reporting offers comprehensive cost management (labor, lubricants, outsource), dashboard analytics, detailed reports with advanced filtering, period comparison, and interactive visualizations.

## External Dependencies
- **Replit Object Storage**: For 3D models, images, and videos.
- **Neon**: PostgreSQL database hosting.
- **Resend**: Email notification service.
- **ZKTeco Biometric Device**: iFace990 Plus (via `zkteco-js` library).
- **Dynamics 365 Business Central**: For importing Fixed Assets and Items.
- **MellaTech Fleet Tracking**: GPS vehicle tracking platform (mellatech.et).