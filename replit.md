# Heavy Equipment Spare Parts Management System

## Overview
A comprehensive web application designed for industrial equipment maintenance teams to efficiently manage heavy equipment inventory and spare parts. It features a detailed parts catalog with 3D model schematics, compatibility information, and manufacturing specifications, aiming to streamline searching, browsing, and visualizing spare parts. The system also includes robust garage, equipment reception, and multi-level approval workflows to enhance maintenance operations and tracking.

## User Preferences
I prefer iterative development with clear communication at each stage. Please ask for confirmation before implementing significant architectural changes or adding new external dependencies. I also prefer detailed explanations for complex technical decisions. Ensure all solutions are mobile-compatible, especially for iOS Safari.

## System Architecture

### UI/UX Decisions
- **Theme**: Industrial Material Design 3 with light/dark mode.
- **Colors**: Professional blue primary (210 85% 45%) with high contrast for readability.
- **Typography**: Inter for UI text and JetBrains Mono for technical data/part numbers.
- **Layout**: Sidebar navigation with responsive, data-dense layouts.
- **Accessibility**: ARIA labels, keyboard-friendly controls, touch-optimized interactions.
- **3D Viewer**: Interactive rotation (mouse/touch), auto-rotation, zoom controls, loading states.
- **CNC Milling Precision Viewer**: Technical engineering drawings with millimeter-accurate dimensions, ISO 2768 tolerance standards, SVG-based dimension annotations, CAD export format badges.

### Technical Implementations
- **Frontend**: React 18 with TypeScript, Vite, Shadcn UI, Tailwind CSS, Wouter for routing, TanStack Query for state management.
- **Backend**: Express.js with Node.js.
- **Database**: PostgreSQL (Neon) with Drizzle ORM.
- **3D Viewing**: Three.js with GLTF/GLB loader.
- **Authentication**: JWT-based authentication stored in localStorage as 'auth_token' for iOS Safari compatibility, role-based access control (CEO, Admin, User), password hashing with bcrypt, protected routes with Authorization header.
- **Offline Support**: Progressive Web App (PWA) with service workers for caching API responses, images, videos, and 3D models.
- **Mobile Compatibility**: Apple-specific meta tags, touch-optimized viewport, Apple Touch Icon, standalone app mode for iOS and Android.
- **Manufacturing Specifications**: Millimeter-precision dimensions, material, tolerance, weight, CAD format availability (STL, STEP, GLTF, GLB), surface finish, and hardness data.
- **Object Storage**: Replit Object Storage via Google Cloud Storage with presigned URL pattern for secure uploads. ObjectStorageService (server/objectStorage.ts) handles upload URL generation and ACL policies (server/objectAcl.ts).
- **Image/Video/3D Model Handling**: Tutorial video and part image uploads both use 3-step presigned URL flow (get uploadURL + objectPath, upload to GCS, save permanent path). Image upload supports multiple files in parallel. 3D model upload functional.

### Feature Specifications
- **Equipment Inventory**: 
  - Category-based grouping by Equipment Type with clickable category cards
  - Category cards show background image, type name, unit count, and navigation arrow
  - No unit list on main page - units displayed on dedicated category pages
  - Search and filter by type/make on main page
- **Equipment Category Pages** (/equipment/category/:type):
  - Full-screen background banner with category name (text-7xl) and total unit count (top-right corner)
  - Configurable background images per category via CATEGORY_BACKGROUNDS mapping
  - Displays all units in 2-column grid below search bar
  - Search functionality to filter units within category
  - Equipment detail modal with statistics (Maintenance Records, Total Cost, Labor Hours, Avg Performance)
  - Tabs for Maintenance History, Parts Used, and Operating Reports
- **Spare Parts Catalog**: Advanced filtering (category, stock status), part detail modal with specifications, compatibility, images, videos, animated tutorials, and maintenance guides.
- **3D Models Library**: Demonstration viewer, model upload, 360-degree interactive rotation, auto-rotation with speed controls.
- **Maintenance Information System**: Part location instructions, installation tutorials, required tools list, time estimates.
- **CEO Access Control**: CEO-only access for equipment creation/modification, secure login/logout.
- **Garage Management**: Garages/workshops with capacity, repair bays, employee management (mechanic, painter, electrician, etc., with bilingual support), work order system, SOPs, parts storage location tracking.
- **Work Order Management**: 
  - **Full CRUD Operations**: Create, edit, update, and delete work orders with confirmation dialogs
  - **Auto-generated Work Order Numbers**: Format WO-YYYY-XXX (e.g., WO-2025-001)
  - Complete work order creation with equipment selection, garage/employee assignment
  - Priority levels (Low, Medium, High, Critical), work types (Repair, Maintenance, Inspection, Overhaul, Replacement, Diagnostics)
  - **Multi-Person Team Assignment (Dialog-Based)**:
    - Simple text input field "Assign To (Team)" - click to open team selection dialog
    - Dialog features: search filter by name/role, checkboxes for multi-select, selection summary
    - Click row or checkbox to toggle selection (stopPropagation prevents double-toggle)
    - Selected employees displayed as cards with name, role, and remove button
    - Work order cards display all assigned team members as badges
    - Database uses assignedToIds array field, populated with assignedToList on fetch
  - **Spare Parts Selection (Dialog-Based)**:
    - Required Spare Parts field positioned after "Assign To" field in form
    - "Select Spare Parts" button opens full-screen dialog showing entire spare parts catalog
    - Dialog features: search filter by name/number, checkboxes for multi-select, stock status badges, price display
    - Click row or checkbox to toggle selection (stopPropagation prevents double-toggle)
    - Temporary selection state in dialog, committed on "Confirm Selection"
    - Selected parts displayed as badges with part name, number, stock status, and remove button
    - Request Purchase button for out-of-stock parts with toast notifications
    - Functional state setters prevent stale state issues
  - **Automatic Cost Calculation**: Estimated Cost field automatically calculates total from selected spare parts prices
  - **Required Parts Persistence**: 
    - Junction table `work_order_required_parts` stores parts with denormalized data (partName, partNumber, stockStatus)
    - Parts automatically populate when editing work orders
    - Full replacement strategy on update (delete old parts, insert new ones)
    - Cascade delete removes parts when work order is deleted
  - Work order submission includes required parts array with partId, partName, partNumber, and stockStatus
  - **Edit Functionality**: All fields preserve correctly (equipmentId, garageId, assignedToIds, priority, workType, description, estimatedHours, estimatedCost, scheduledDate, notes, requiredParts)
  - **Delete with Confirmation**: AlertDialog confirmation before deletion
  - Cost estimation (string format), scheduling (datetime-local), and comprehensive notes
  - Filterable work order list by status, priority, and search
  - Enter key in spare parts search prevented from submitting form
- **Equipment Reception/Check-in**: Driver drop-off checklist, mechanic inspection workflow, visual damage reporting, photo documentation, automatic work order creation, repair estimates.
- **Approval System**: Multi-level approval workflow for job orders, completions, parts requests based on department hierarchy, approval limit controls, pending approvals dashboard, escalation.
- **Currency Conversion**: Dynamic USD/ETB conversion in the parts catalog.

## External Dependencies
- **Replit Object Storage**: For 3D models, images, and videos.
- **Neon**: PostgreSQL database hosting.
- **Resend**: Email notification service for admin actions (requires `RESEND_API_KEY`).
- **OpenAI Vision**: (Planned) For AI part recognition.