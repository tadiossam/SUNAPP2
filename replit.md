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
- **3D Viewing**: Placeholder for Three.js integration
- **Routing**: Wouter
- **State Management**: TanStack Query (React Query)

### Database Schema
- **equipment**: Heavy machinery records (dozers, wheel loaders) with make, model, serial numbers
- **spare_parts**: Comprehensive parts catalog with compatibility, pricing, stock levels, and 3D model paths

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
✅ User authentication system with Passport.js and Express Session
✅ Role-based access control (CEO, admin, user roles)
✅ CEO-only access for equipment creation/modification
✅ Secure login/logout functionality
✅ Protected routes with middleware authentication
✅ Password hashing with bcrypt
✅ Session management with secure cookies

### Phase 4 - AI Part Recognition (Pending)
⏳ OpenAI Vision integration for image-based part identification
⏳ "Identify Part" page with camera/upload functionality
⏳ AI-powered part matching with confidence scores

## Equipment Data
Master equipment list for **Sunshine Construction PLC** (30 units):

**DOZER Equipment (25 units):**
- 24x CAT D8R
- 1x KOMATSU D155A-5

**WHEEL LOADER Equipment (5 units):**
- 2x VOLVO (L-90C, L-120E)
- 2x CATERPILLAR (938F)
- 1x KOMATSU (938E-2)

All equipment includes plate numbers, asset numbers, new asset numbers, and machine serial numbers.

## Development Notes
- Using design_guidelines.md for consistent UI implementation
- Object storage configured for 3D model files (GLB/GLTF preferred)
- PostgreSQL database provisioned and ready
- All components follow accessibility best practices with data-testid attributes

## Authentication & Security
- **CEO Login Credentials:**
  - Username: `ceo`
  - Password: `ceo123` (⚠️ Change after first login!)
- Session management with express-session
- Password hashing with bcrypt (10 rounds)
- Secure cookies enabled in production
- CEO role required for equipment create/edit/delete operations
- Master equipment list protected from unauthorized modifications

## Known Limitations
- **3D Model Rendering**: The 3D viewer currently displays a demonstration wireframe. Production implementation would require Three.js (@react-three/fiber) which had peer dependency conflicts with the current React 18 setup. The infrastructure is in place (model paths, upload system, viewer component) - only the Three.js renderer needs to be integrated when dependency conflicts are resolved.

## Recent Changes  
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
