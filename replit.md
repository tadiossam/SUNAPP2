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
- **Authentication**: JWT-based authentication stored in localStorage for iOS Safari compatibility, role-based access control (CEO, Admin, User), password hashing with bcrypt, protected routes.
- **Offline Support**: Progressive Web App (PWA) with service workers for caching API responses, images, videos, and 3D models.
- **Mobile Compatibility**: Apple-specific meta tags, touch-optimized viewport, Apple Touch Icon, standalone app mode for iOS and Android.
- **Manufacturing Specifications**: Millimeter-precision dimensions, material, tolerance, weight, CAD format availability (STL, STEP, GLTF, GLB), surface finish, and hardness data.
- **Image/Video/3D Model Handling**: Multi-image upload, video tutorial upload/playback, 3D model upload to object storage.

### Feature Specifications
- **Equipment Inventory**: Search, filter by type/make.
- **Spare Parts Catalog**: Advanced filtering (category, stock status), part detail modal with specifications, compatibility, images, videos, animated tutorials, and maintenance guides.
- **3D Models Library**: Demonstration viewer, model upload, 360-degree interactive rotation, auto-rotation with speed controls.
- **Maintenance Information System**: Part location instructions, installation tutorials, required tools list, time estimates.
- **CEO Access Control**: CEO-only access for equipment creation/modification, secure login/logout.
- **Garage Management**: Garages/workshops with capacity, repair bays, employee management (mechanic, painter, electrician, etc., with bilingual support), work order system, SOPs, parts storage location tracking.
- **Equipment Reception/Check-in**: Driver drop-off checklist, mechanic inspection workflow, visual damage reporting, photo documentation, automatic work order creation, repair estimates.
- **Approval System**: Multi-level approval workflow for job orders, completions, parts requests based on department hierarchy, approval limit controls, pending approvals dashboard, escalation.
- **Currency Conversion**: Dynamic USD/ETB conversion in the parts catalog.

## External Dependencies
- **Replit Object Storage**: For 3D models, images, and videos.
- **Neon**: PostgreSQL database hosting.
- **Resend**: Email notification service for admin actions (requires `RESEND_API_KEY`).
- **OpenAI Vision**: (Planned) For AI part recognition.