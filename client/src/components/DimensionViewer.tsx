interface ManufacturingSpecs {
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    diameter?: number;
    threadSize?: string;
  };
  material?: string;
  tolerance?: string;
  weight?: string;
  surfaceFinish?: string;
  hardness?: string;
  cadFormats?: string[];
}

import { useState } from "react";

interface DimensionViewerProps {
  partNumber: string;
  partName: string;
  specs: ManufacturingSpecs;
  imageUrl?: string;
}

export function DimensionViewer({ partNumber, partName, specs, imageUrl }: DimensionViewerProps) {
  const [rotationAngle, setRotationAngle] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const dims = specs.dimensions || {};
  const hasDimensions = dims.length || dims.width || dims.height || dims.diameter;

  // Rotation interaction handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - startX;
    setRotationAngle((prev) => prev + deltaX * 0.5);
    setStartX(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault(); // Prevent page scrolling while rotating
    const deltaX = e.touches[0].clientX - startX;
    setRotationAngle((prev) => prev + deltaX * 0.5);
    setStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  if (!hasDimensions) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No dimension data available for this part
      </div>
    );
  }

  // Determine part shape based on available dimensions
  const isCylindrical = !!dims.diameter;
  const isBox = !!(dims.length && dims.width && dims.height);

  return (
    <div className="space-y-6">
      {/* Technical Drawing Header */}
      <div className="border-b pb-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-semibold font-mono">{partNumber}</h3>
            <p className="text-sm text-muted-foreground mt-1">{partName}</p>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <p className="font-semibold">CNC MILLING SPECIFICATIONS</p>
            <p>CATERPILLAR D8R GENUINE PARTS</p>
            <p className="mt-1">TOLERANCE: {specs.tolerance || 'ISO 2768-m'}</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Technical Drawing Visualization */}
        <div className="border rounded-lg p-6 bg-background">
          <div className="aspect-square flex items-center justify-center relative">
            <svg 
              viewBox="0 0 400 400" 
              className="w-full h-full cursor-grab active:cursor-grabbing"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Grid background */}
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.1"/>
                </pattern>
              </defs>
              <rect width="400" height="400" fill="url(#grid)" />

              {/* Main drawing group with rotation */}
              <g transform={`rotate(${rotationAngle}, 200, 200)`}>
              {/* Draw based on part type */}
              {isCylindrical ? (
                <>
                  {/* Cylinder front view */}
                  <ellipse cx="200" cy="150" rx="80" ry="20" fill="none" stroke="currentColor" strokeWidth="2"/>
                  <line x1="120" y1="150" x2="120" y2="280" stroke="currentColor" strokeWidth="2"/>
                  <line x1="280" y1="150" x2="280" y2="280" stroke="currentColor" strokeWidth="2"/>
                  <ellipse cx="200" cy="280" rx="80" ry="20" fill="none" stroke="currentColor" strokeWidth="2"/>
                  
                  {/* Diameter dimension */}
                  <g className="dimension-line">
                    <line x1="120" y1="320" x2="280" y2="320" stroke="hsl(var(--primary))" strokeWidth="1.5" markerEnd="url(#arrowhead-end)" markerStart="url(#arrowhead-start)"/>
                    <text x="200" y="340" textAnchor="middle" className="fill-primary text-xs font-mono">
                      Ø{dims.diameter}mm
                    </text>
                  </g>
                  
                  {/* Height/Length dimension */}
                  {(dims.length || dims.height) && (
                    <g className="dimension-line">
                      <line x1="300" y1="150" x2="300" y2="280" stroke="hsl(var(--primary))" strokeWidth="1.5" markerEnd="url(#arrowhead-end)" markerStart="url(#arrowhead-start)"/>
                      <text x="330" y="215" textAnchor="middle" className="fill-primary text-xs font-mono">
                        {dims.length || dims.height}mm
                      </text>
                    </g>
                  )}
                </>
              ) : isBox ? (
                <>
                  {/* 3D Box isometric view */}
                  <path d="M 150 180 L 250 180 L 280 150 L 180 150 Z" fill="none" stroke="currentColor" strokeWidth="2"/>
                  <path d="M 250 180 L 250 280 L 280 250 L 280 150 Z" fill="none" stroke="currentColor" strokeWidth="2"/>
                  <path d="M 150 180 L 150 280 L 250 280 L 250 180 Z" fill="none" stroke="currentColor" strokeWidth="2"/>
                  
                  {/* Length dimension */}
                  <g className="dimension-line">
                    <line x1="150" y1="300" x2="250" y2="300" stroke="hsl(var(--primary))" strokeWidth="1.5" markerEnd="url(#arrowhead-end)" markerStart="url(#arrowhead-start)"/>
                    <text x="200" y="320" textAnchor="middle" className="fill-primary text-xs font-mono">
                      L: {dims.length}mm
                    </text>
                  </g>
                  
                  {/* Width dimension */}
                  <g className="dimension-line">
                    <line x1="270" y1="280" x2="300" y2="250" stroke="hsl(var(--primary))" strokeWidth="1.5" markerEnd="url(#arrowhead-end)" markerStart="url(#arrowhead-start)"/>
                    <text x="310" y="270" textAnchor="start" className="fill-primary text-xs font-mono">
                      W: {dims.width}mm
                    </text>
                  </g>
                  
                  {/* Height dimension */}
                  <g className="dimension-line">
                    <line x1="130" y1="180" x2="130" y2="280" stroke="hsl(var(--primary))" strokeWidth="1.5" markerEnd="url(#arrowhead-end)" markerStart="url(#arrowhead-start)"/>
                    <text x="90" y="235" textAnchor="middle" className="fill-primary text-xs font-mono">
                      H: {dims.height}mm
                    </text>
                  </g>
                </>
              ) : (
                <>
                  {/* Simple rectangular representation for parts with limited dimensions */}
                  <rect x="150" y="150" width="100" height="100" fill="none" stroke="currentColor" strokeWidth="2"/>
                  
                  {dims.length && (
                    <g className="dimension-line">
                      <line x1="150" y1="280" x2="250" y2="280" stroke="hsl(var(--primary))" strokeWidth="1.5" markerEnd="url(#arrowhead-end)" markerStart="url(#arrowhead-start)"/>
                      <text x="200" y="300" textAnchor="middle" className="fill-primary text-xs font-mono">
                        {dims.length}mm
                      </text>
                    </g>
                  )}
                  
                  {dims.width && (
                    <g className="dimension-line">
                      <line x1="270" y1="150" x2="270" y2="250" stroke="hsl(var(--primary))" strokeWidth="1.5" markerEnd="url(#arrowhead-end)" markerStart="url(#arrowhead-start)"/>
                      <text x="300" y="205" textAnchor="middle" className="fill-primary text-xs font-mono">
                        {dims.width}mm
                      </text>
                    </g>
                  )}
                </>
              )}

              {/* Arrow markers for dimension lines */}
              <defs>
                <marker id="arrowhead-end" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                  <polygon points="0 0, 10 3, 0 6" fill="hsl(var(--primary))"/>
                </marker>
                <marker id="arrowhead-start" markerWidth="10" markerHeight="10" refX="1" refY="3" orient="auto">
                  <polygon points="10 0, 0 3, 10 6" fill="hsl(var(--primary))"/>
                </marker>
              </defs>
              </g>
            </svg>
            
            {/* Rotation indicator */}
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-background/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs text-muted-foreground">
              🔄 Drag to rotate 360°
            </div>
          </div>
          
          <div className="mt-4 space-y-1">
            <p className="text-center text-xs font-semibold text-primary">
              PRECISION ENGINEERING DRAWING
            </p>
            <p className="text-center text-xs text-muted-foreground">
              All dimensions in millimeters (mm) • Decimal precision: ±{specs.tolerance?.includes('±') ? specs.tolerance.split('±')[1] : '0.1mm'}
            </p>
            <p className="text-center text-xs text-muted-foreground">
              Suitable for: CNC Milling • 3D Printing • Manual Machining
            </p>
          </div>
        </div>

        {/* Specifications Table */}
        <div className="space-y-4">
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted px-4 py-2 border-b">
              <h4 className="font-semibold text-sm">CRITICAL DIMENSIONS</h4>
            </div>
            <div className="divide-y">
              {dims.length && (
                <div className="px-4 py-3 grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium">Length:</span>
                  <span className="text-sm font-mono text-right">{dims.length} mm</span>
                </div>
              )}
              {dims.width && (
                <div className="px-4 py-3 grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium">Width:</span>
                  <span className="text-sm font-mono text-right">{dims.width} mm</span>
                </div>
              )}
              {dims.height && (
                <div className="px-4 py-3 grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium">Height:</span>
                  <span className="text-sm font-mono text-right">{dims.height} mm</span>
                </div>
              )}
              {dims.diameter && (
                <div className="px-4 py-3 grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium">Diameter:</span>
                  <span className="text-sm font-mono text-right">Ø {dims.diameter} mm</span>
                </div>
              )}
              {dims.threadSize && (
                <div className="px-4 py-3 grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium">Thread Size:</span>
                  <span className="text-sm font-mono text-right">{dims.threadSize}</span>
                </div>
              )}
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted px-4 py-2 border-b">
              <h4 className="font-semibold text-sm">MANUFACTURING SPECS</h4>
            </div>
            <div className="divide-y">
              {specs.material && (
                <div className="px-4 py-3 grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium">Material:</span>
                  <span className="text-sm text-right">{specs.material}</span>
                </div>
              )}
              {specs.tolerance && (
                <div className="px-4 py-3 grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium">Tolerance:</span>
                  <span className="text-sm font-mono text-right">{specs.tolerance}</span>
                </div>
              )}
              {specs.weight && (
                <div className="px-4 py-3 grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium">Weight:</span>
                  <span className="text-sm text-right">{specs.weight}</span>
                </div>
              )}
              {specs.surfaceFinish && (
                <div className="px-4 py-3 grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium">Surface Finish:</span>
                  <span className="text-sm text-right">{specs.surfaceFinish}</span>
                </div>
              )}
              {specs.hardness && (
                <div className="px-4 py-3 grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium">Hardness:</span>
                  <span className="text-sm text-right">{specs.hardness}</span>
                </div>
              )}
            </div>
          </div>

          {/* CAD Format Availability */}
          {specs.cadFormats && specs.cadFormats.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted px-4 py-2 border-b">
                <h4 className="font-semibold text-sm">CAD EXPORT FORMATS</h4>
              </div>
              <div className="p-4">
                <div className="flex flex-wrap gap-2">
                  {specs.cadFormats.map((format) => (
                    <div key={format} className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-md">
                      <span className="text-xs font-mono font-semibold text-primary">{format}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Compatible with: AutoCAD • SolidWorks • Fusion 360 • Mastercam
                </p>
              </div>
            </div>
          )}

          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-primary">CNC MACHINING READY</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Millimeter Precision</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>ISO 2768 Tolerance</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>3-Axis Compatible</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>CAD Export Ready</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reference Image if available */}
      {imageUrl && (
        <div className="border rounded-lg p-4">
          <h4 className="font-semibold text-sm mb-3">REFERENCE IMAGE</h4>
          <img 
            src={imageUrl} 
            alt={partName}
            className="w-full max-w-md mx-auto rounded-lg"
          />
        </div>
      )}
    </div>
  );
}
