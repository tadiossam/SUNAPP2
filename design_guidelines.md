# Design Guidelines: Industrial Parts Management System

## Design Approach
**System-Based: Material Design 3** - Selected for its robust data presentation patterns, enterprise reliability, and excellent support for complex interactions needed in B2B technical applications.

## Core Design Principles
1. **Information Clarity**: Technical data must be immediately scannable and comprehensible
2. **Functional Precision**: Every element serves the technician's workflow
3. **Professional Credibility**: Visual design reflects industrial quality standards
4. **Spatial Efficiency**: Maximize viewport usage for parts catalog and 3D viewer

## Color Palette

**Light Mode:**
- Primary: 210 85% 45% (Industrial Blue - trustworthy, technical)
- Surface: 0 0% 98% (Clean workspace background)
- On-Surface: 220 15% 20% (Dark text for readability)
- Border: 220 10% 85% (Subtle divisions)
- Success: 145 65% 45% (In-stock indicators)
- Warning: 35 90% 55% (Low stock alerts)

**Dark Mode:**
- Primary: 210 75% 55% (Brighter blue for visibility)
- Surface: 220 15% 12% (Deep workspace)
- On-Surface: 0 0% 92% (Light text)
- Border: 220 10% 22% (Subtle contrast)

## Typography
- **Primary Font**: Inter (Google Fonts) - exceptional readability for technical data
- **Monospace**: JetBrains Mono - part numbers, SKUs, specifications
- **Heading Hierarchy**: text-3xl/font-bold (H1), text-xl/font-semibold (H2), text-lg/font-medium (H3)
- **Body Text**: text-base with increased line-height (1.6) for spec sheets

## Layout System
**Spacing Primitives**: Use Tailwind units of 2, 4, 6, and 8 consistently
- Component padding: p-4, p-6
- Section spacing: space-y-6, gap-8
- Container margins: mx-4, mx-6

**Grid Strategy**:
- Main Layout: 70/30 split (Parts List / Details Panel) on desktop
- Mobile: Stacked single column with expandable details
- 3D Viewer: Full-width modal or dedicated view panel

## Component Library

**Navigation Header**:
- Logo + Equipment selector dropdown (CAT, KOMATSU, VOLVO filters)
- Search bar with autocomplete for part numbers/descriptions
- User account, cart icon, dark mode toggle
- Breadcrumb navigation below header

**Parts Catalog (Left Panel)**:
- Filterable list with Equipment Type > Model > Category hierarchy
- Each part card displays: thumbnail, part number (monospace), name, price, stock status
- Quick-add to cart button
- Hover reveals "View 3D" action

**3D Viewer Panel (Right/Modal)**:
- Three.js/React Three Fiber integration for GLB model rendering
- Rotation controls, zoom, pan gestures
- Part annotations with exploded view option
- Download spec sheet button
- Related parts sidebar within viewer

**Data Tables**:
- Specifications table: alternating row backgrounds, fixed header
- Compatibility matrix showing equipment models
- Sortable columns with clear indicators

**Search & Filters**:
- Multi-select dropdowns for manufacturer, equipment type, part category
- Price range slider
- Stock availability toggles (In Stock, Low Stock, Backorder)
- Applied filters shown as dismissible chips

**Shopping Features**:
- Persistent mini-cart sidebar
- Quote request form for bulk orders
- Save to favorites list

## Images
No hero image required - this is a utility application. Use:
- Equipment category icons (custom industrial line icons)
- Part thumbnail images (256x256px) in catalog
- 3D model previews as primary visual content
- Manufacturer logos in filters

## Visual Enhancements
**Minimal Animations**:
- Smooth panel transitions (300ms ease)
- 3D model loading skeleton
- Filter collapse/expand

**Status Indicators**:
- Color-coded stock badges (green/yellow/red)
- Visual "New Arrival" tags
- Compatibility checkmarks

## Accessibility
- High contrast in both modes for technical drawings
- Keyboard navigation through parts catalog
- Screen reader labels for 3D controls
- Focus indicators on interactive elements

## Page Structure
1. **Dashboard/Home**: Equipment overview grid, recent searches, quick access
2. **Parts Catalog**: Main split-view interface with filters
3. **Part Detail**: Dedicated page with comprehensive specs, 3D viewer, related parts
4. **Cart/Quote**: Standard checkout flow

This is a data-rich, function-first application where clarity and efficiency trump aesthetic flourishes.