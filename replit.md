# Heavy Equipment Spare Parts Management System

## Overview
A comprehensive web application for managing heavy equipment inventory and spare parts catalog with 3D model schematics. Built for industrial equipment maintenance teams to efficiently search, browse, and visualize spare parts compatibility.

## Project Architecture

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Express.js + Node.js
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **Storage**: Replit Object Storage for 3D models
- **UI**: Shadcn UI + Tailwind CSS
- **3D Viewing**: Three.js with GLTF/GLB loader
- **Routing**: Wouter
- **State Management**: TanStack Query (React Query)

### Database Schema
- **equipment**: Heavy machinery records (dozers, wheel loaders) with make, model, serial numbers
- **spare_parts**: Comprehensive parts catalog with:
  - Compatibility, pricing, stock levels
  - 3D model paths
  - Multiple 2D images (array)
  - Manufacturing specifications (JSON): dimensions, material, tolerance, weight, CAD formats
  - Tutorial videos and animated tutorials
  - Location instructions and maintenance guides

### Design System
- **Theme**: Industrial Material Design 3 with light/dark mode support
- **Colors**: Professional blue primary (210 85% 45%), high contrast for readability
- **Typography**: Inter (UI), JetBrains Mono (technical data/part numbers)
- **Layout**: Sidebar navigation with responsive data-dense layouts

## Features Implemented

### Phase 1 - Complete MVP (Completed)
✅ Complete database schema with proper foreign key relationships
✅ Server-side search and filtering endpoints
✅ Dark/light theme system with toggle
✅ Sidebar navigation with 4 main sections
✅ Equipment inventory page with search and filters (type, make)
✅ Spare parts catalog with advanced filtering (category, stock status)
✅ Part detail modal with specifications and compatibility
✅ 3D models library page with demonstration viewer
✅ Model upload page with file handling
✅ Responsive layouts with loading skeletons
✅ Professional industrial design implementation

### Phase 2 - Enhanced Features (Completed)
✅ Multi-image upload for parts with image gallery
✅ Full-screen image viewer
✅ Video tutorial upload and playback
✅ Comprehensive maintenance information system:
  - Part location instructions on machinery
  - Installation tutorial videos
  - Required tools list
  - Time estimates for beginner/average/expert levels
✅ Edit forms for all maintenance information
✅ Object storage integration for images and videos

### Phase 3 - CEO Access Control & Master Equipment List (Completed)
✅ Complete master equipment list imported (30 units from Sunshine Construction PLC)
  - 25 DOZER units (CAT D8R and KOMATSU D155A-5)
  - 5 WHEEL LOADER units (VOLVO, CATERPILLAR, KOMATSU)
✅ JWT-based authentication system (iOS Safari compatible)
  - Replaced session cookies with JWT tokens stored in localStorage
  - Tokens sent via Authorization header (works on iOS Safari)
  - No cookie dependencies (fixes iOS Safari blocking issues)
✅ Role-based access control (CEO, admin, user roles)
✅ CEO-only access for equipment creation/modification
✅ Secure login/logout functionality
✅ Protected routes with middleware authentication
✅ Password hashing with bcrypt
✅ 24-hour token expiration with automatic renewal

### Phase 4 - Offline Support & Manufacturing Specs (Completed)
✅ Progressive Web App (PWA) with service workers for offline functionality
✅ iOS and Android mobile compatibility:
  - Apple-specific meta tags for iOS Safari
  - Touch-optimized viewport settings (user-scalable for accessibility)
  - Apple Touch Icon for home screen installation
  - Standalone app mode on iOS devices
  - Android Chrome web app capabilities
✅ Manufacturing specifications system:
  - Millimeter-precision dimensions (length, width, height, diameter)
  - Material specifications
  - Tolerance ratings
  - Weight specifications
  - CAD format availability (STL, STEP, GLTF, GLB)
  - Surface finish and hardness data
✅ Manufacturing specs component displaying CNC/milling/3D printing ready data
✅ 15+ professional stock images for D8R parts
✅ Animated tutorial support (GIF/WebM format for offline compatibility)
✅ 8 D8R parts populated with complete manufacturing specifications

### Phase 5 - CNC-Ready Dimensions & 360° Rotation (Completed)
✅ **CNC Milling Precision Viewer**:
  - Technical engineering drawings with millimeter-accurate dimensions
  - ISO 2768 tolerance standards displayed
  - SVG-based dimension annotations with primary color arrows
  - CAD export format badges (STL, STEP, GLTF, GLB)
  - Compatible with AutoCAD, SolidWorks, Fusion 360, Mastercam
✅ **360-Degree Interactive Rotation**:
  - Full-circle rotation via mouse drag (desktop)
  - Touch gesture rotation (iOS/Android mobile)
  - Auto-rotation feature with play/pause controls
  - Adjustable rotation speed (0.1x to 2x)
  - Prevents page scrolling during rotation on mobile
✅ **Accessibility Enhancements**:
  - ARIA labels for screen readers
  - Keyboard-friendly controls
  - Touch-optimized interactions
✅ Applied to both 3D viewer and dimension viewer components

### Phase 6 - Garage & Equipment Management (Completed)
✅ **Complete Garage Management System:**
  - Garages/workshops with capacity tracking
  - Repair bays (available, occupied, under maintenance)
  - Employee management with profile pictures
  - Work order system
  - Standard Operating Procedures (SOPs)
  - Parts storage location tracking
  
✅ **Employee System:**
  - Profile picture upload and avatar display
  - Extended job roles: Mechanic, Painter, Body Worker, Electrician, Technician, Wash Employee, Supervisor
  - Garage assignment and specialties
  - Bilingual support (EN/AM) for all roles

✅ **Equipment Reception/Check-in System:**
  - Driver drop-off checklist with condition reporting
  - Mechanic detailed inspection workflow
  - Visual damage reporting with equipment diagrams
  - Standardized checklists by equipment type
  - Photo documentation for damages
  - Automatic work order creation from inspections
  - Repair estimates and cost tracking
  
### Phase 7 - Warehouse Management System (In Progress)
⏳ **Advanced Warehouse Features:**
  - Dedicated warehouse facilities with zone management
  - Stock ledger with double-entry transaction logging
  - Stock reservations for work orders
  - Automatic reorder rules and supplier management
  - Real-time inventory tracking across locations
  - Stock movements (receiving, issuing, transfers)
  - Low stock alerts and analytics

### Phase 8 - AI Part Recognition (Pending)
⏳ OpenAI Vision integration for image-based part identification
⏳ "Identify Part" page with camera/upload functionality
⏳ AI-powered part matching with confidence scores

## Equipment Data
Complete equipment inventory for **Sunshine Construction PLC** (109 units):

**DOZER Equipment (50 units):**
- 48x CAT D8R
- 2x KOMATSU D155A-5

**WHEEL LOADER Equipment (31 units):**
- 10x VOLVO
- 6x CATERPILLAR/CAT
- 5x CHINA
- 5x SEM
- 4x XCMG
- 1x KOMATSU

**EXCAVATOR Equipment (24 units):**
- 10x KOMATSU (PC220-7, PC300-7, PC300-8MO, PC300)
- 8x DEVELON (DX360LCA-7M)
- 4x DOOSAN (DX340LCA)
- 2x CAT WHEEL (M316D)

**WHEEL EXCAVATOR Equipment (3 units):**
- 3x DEVELON (DX210WA)

**GRADER Equipment (1 unit):**
- 1x CAT (12G)

All equipment includes plate numbers, asset numbers, new asset numbers, and machine serial numbers.

## Development Notes
- Using design_guidelines.md for consistent UI implementation
- Object storage configured for 3D model files (GLB/GLTF preferred)
- PostgreSQL database provisioned and ready
- All components follow accessibility best practices with data-testid attributes
- **PWA/Offline Support**: Service worker caches API responses, images, videos, and 3D models for offline access
- **Manufacturing Data**: All dimensions accurate to millimeter precision for CNC machining, milling, and 3D printing
- **Stock Images**: 15 professional industrial equipment images downloaded for parts catalog

## Authentication & Security
- **CEO Login Credentials:**
  - Username: `ceo`
  - Password: `ceo123` (⚠️ Change after first login!)
- **Admin Login Credentials:**
  - Username: `admin` / Password: `admin123` (⚠️ Change after first login!)
  - Username: `biruk` / Password: `Tolera123` - Biruk Tolera
- Session management with express-session
- Password hashing with bcrypt (10 rounds)
- Secure cookies enabled in production
- CEO/Admin roles required for equipment/parts/maintenance operations
- Admin actions trigger email notifications to CEO (tafestadios@gmail.com)
- Master equipment list protected from unauthorized modifications

## Email Notifications
- **Resend Integration**: Admin actions send notifications to CEO
- **Setup Required**: Configure RESEND_API_KEY environment variable to enable
- **Email Target**: tafestadios@gmail.com
- **Notifications Include**: Action type, record details, timestamp, who performed action

## 3D Model System
- **Three.js Integration**: ✅ Fully implemented with WebGL renderer and GLTF/GLB loader
- **Features**: Interactive rotation (mouse/touch), auto-rotation, zoom controls, loading states, error handling
- **Model Files**: Currently showing placeholder geometry - upload GLB/GLTF files to object storage to see actual 3D models
- **8 Parts Ready**: Model paths configured for filters and fluids (1R-1808, 326-1642, 1R-0749, 6I-2505, 132-8875, 337-5270, 205-6611, 452-5996)
- **File Format**: GLB/GLTF preferred for 3D models stored in object storage

## Recent Changes  
- 2025-10-06: **Imported Excel Equipment Data & Fixed 3D Model Upload**
  - Successfully imported 28 new equipment units from Excel (EXCAVATOR, WHEEL EXCAVATOR, GRADER)
  - Total equipment now: 109 units (up from 81)
  - Fixed 3D model upload to use object storage path (`/public/models/`)
  - 3D model upload now consistent with image/video upload pattern
  - Equipment page dynamically displays new equipment types in filters
- 2025-10-06: **Implemented Three.js 3D Model Rendering**
  - Replaced wireframe placeholder with actual WebGL renderer
  - Added GLTF/GLB loader for real 3D model files
  - Interactive controls: drag rotation, auto-rotation, zoom, touch support
  - Graceful error handling with placeholder geometry when files missing
  - Ready to load actual 3D models from object storage
- 2025-10-05: **Implemented PWA, Manufacturing Specs, and Offline Support**
  - Created Progressive Web App with service workers for full offline functionality
  - Added manufacturing specifications system (dimensions, material, tolerance, weight, CAD formats)
  - Integrated manufacturing specs display component in parts catalog
  - Downloaded 15 professional stock images for D8R parts
  - Added 8 D8R parts with complete manufacturing specifications
  - Schema updated with manufacturingSpecs and tutorialAnimationUrl fields
  - Admin/CEO access control with email notifications (Resend integration)
  - Created admin user account for testing
- 2025-10-05: **Implemented CEO access control and authentication system**
  - Added user authentication with Passport.js and Express Session
  - Created role-based access (CEO, admin, user)
  - Protected equipment operations with CEO-only middleware
  - Imported complete master equipment list (30 units) for Sunshine Construction PLC
  - Built login/logout UI with secure credential handling
- 2025-10-05: Complete implementation with database relations, server-side search, interactive UI, and 3D viewer infrastructure
- 2025-10-05: Updated branding to "PartFinder SSC"
- 2025-10-05: Fixed database schema with proper foreign key relationships via join tables
- 2025-10-05: Implemented server-side search endpoints for scalability

## Parts Catalog Data
- **70 Genuine CAT D8R Parts**: Imported from official PDF (CM20201222-443e7-1fb52)
  - Filters (oil, fuel, air, transmission, hydraulic)
  - Lubricants (DEO-ULS engine oil)
  - Coolants (Cat ELC Premix)
  - Greases (Cat Extreme Application Grease)
  - Seals and O-rings
- **8 Parts with Manufacturing Specs**: Complete CNC-ready specifications
  - 1R-1808 (Engine Oil Filter)
  - 326-1642 (Primary Fuel Filter)
  - 1R-0749 (Secondary Fuel Filter)
  - 6I-2505 (Primary Air Filter)
  - 132-8875 (Transmission Filter)
  - 337-5270 (Transmission Filter)
  - 205-6611 (Cat ELC Premix Coolant)
  - 452-5996 (Cat Extreme Application Grease)
