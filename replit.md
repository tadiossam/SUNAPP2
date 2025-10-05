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

### Phase 1 - Schema & Frontend (Completed)
✅ Complete database schema for equipment and spare parts
✅ Dark/light theme system with toggle
✅ Sidebar navigation with 4 main sections
✅ Equipment inventory page with search and filters (type, make)
✅ Spare parts catalog with advanced filtering (category, stock status)
✅ Part detail modal with specifications and compatibility
✅ 3D models library page
✅ Model upload page with file handling
✅ Responsive layouts with loading skeletons
✅ Professional industrial design implementation

### Phase 2 - Backend (In Progress)
- API endpoints for equipment CRUD
- API endpoints for spare parts CRUD
- Database storage implementation
- 3D model path management
- Search and filter logic

### Phase 3 - Integration & Polish (Pending)
- Connect frontend to backend APIs
- Add error handling and validation
- Implement actual 3D model uploads with object storage
- Final UX polish and testing

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

## Recent Changes
- 2025-10-05: Initial project setup, complete frontend implementation with all pages and components
