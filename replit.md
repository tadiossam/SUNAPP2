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

### Phase 3 - AI Part Recognition (In Progress)
⏳ OpenAI Vision integration for image-based part identification
⏳ "Identify Part" page with camera/upload functionality
⏳ AI-powered part matching with confidence scores

## Equipment Data
Initial data seeded from user's spreadsheet includes:
- CAT Dozers (D8R models)
- KOMATSU Dozers (D155A-5)
- CAT Wheel Loaders (L-90C, 938F, 966G)
- VOLVO Wheel Loaders (L-90C)
- CATERPILLAR Wheel Loaders (966G)

## Development Notes
- Using design_guidelines.md for consistent UI implementation
- Object storage configured for 3D model files (GLB/GLTF preferred)
- PostgreSQL database provisioned and ready
- All components follow accessibility best practices with data-testid attributes

## Known Limitations
- **3D Model Rendering**: The 3D viewer currently displays a demonstration wireframe. Production implementation would require Three.js (@react-three/fiber) which had peer dependency conflicts with the current React 18 setup. The infrastructure is in place (model paths, upload system, viewer component) - only the Three.js renderer needs to be integrated when dependency conflicts are resolved.

## Recent Changes  
- 2025-10-05: Complete implementation with database relations, server-side search, interactive UI, and 3D viewer infrastructure
- 2025-10-05: Updated branding to "PartFinder SSC"
- 2025-10-05: Fixed database schema with proper foreign key relationships via join tables
- 2025-10-05: Implemented server-side search endpoints for scalability
