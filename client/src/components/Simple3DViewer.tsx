import { useEffect, useRef, useState } from "react";
import { RotateCcw, ZoomIn, ZoomOut, Move } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Simple3DViewerProps {
  modelPath?: string;
  className?: string;
}

export function Simple3DViewer({ modelPath, className = "" }: Simple3DViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState({ x: 0.5, y: 0.5 });
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = "hsl(var(--muted))";
    ctx.fillRect(0, 0, width, height);

    // Draw a simple 3D wireframe box as placeholder
    const centerX = width / 2;
    const centerY = height / 2;
    const size = 80 * zoom;

    // Simple 3D projection
    const points3D = [
      [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], // front face
      [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1], // back face
    ];

    const rotateX = (point: number[], angle: number) => {
      const [x, y, z] = point;
      return [
        x,
        y * Math.cos(angle) - z * Math.sin(angle),
        y * Math.sin(angle) + z * Math.cos(angle),
      ];
    };

    const rotateY = (point: number[], angle: number) => {
      const [x, y, z] = point;
      return [
        x * Math.cos(angle) + z * Math.sin(angle),
        y,
        -x * Math.sin(angle) + z * Math.cos(angle),
      ];
    };

    const project = (point: number[]) => {
      const [x, y, z] = point;
      const scale = 200 / (200 + z * 50);
      return {
        x: centerX + x * size * scale,
        y: centerY + y * size * scale,
      };
    };

    // Rotate and project points
    const projectedPoints = points3D.map((p) => {
      let rotated = rotateX(p, rotation.x);
      rotated = rotateY(rotated, rotation.y);
      return project(rotated);
    });

    // Draw edges
    ctx.strokeStyle = "hsl(var(--primary))";
    ctx.lineWidth = 2;

    const edges = [
      [0, 1], [1, 2], [2, 3], [3, 0], // front face
      [4, 5], [5, 6], [6, 7], [7, 4], // back face
      [0, 4], [1, 5], [2, 6], [3, 7], // connecting edges
    ];

    edges.forEach(([start, end]) => {
      ctx.beginPath();
      ctx.moveTo(projectedPoints[start].x, projectedPoints[start].y);
      ctx.lineTo(projectedPoints[end].x, projectedPoints[end].y);
      ctx.stroke();
    });

    // Draw vertices
    ctx.fillStyle = "hsl(var(--primary))";
    projectedPoints.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw info text
    ctx.fillStyle = "hsl(var(--muted-foreground))";
    ctx.font = "14px var(--font-sans)";
    ctx.textAlign = "center";
    ctx.fillText("Interactive 3D Viewer - Demonstration Mode", centerX, height - 40);
    ctx.font = "11px var(--font-sans)";
    if (modelPath) {
      ctx.fillText(`Model Path: ${modelPath}`, centerX, height - 22);
      ctx.fillText("(Production: Would load GLTF/GLB from object storage)", centerX, height - 8);
    } else {
      ctx.fillText("No 3D model path provided", centerX, height - 15);
    }
  }, [rotation, zoom, modelPath]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setLastPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - lastPos.x;
    const deltaY = e.clientY - lastPos.y;

    setRotation((prev) => ({
      x: prev.x + deltaY * 0.01,
      y: prev.y + deltaX * 0.01,
    }));

    setLastPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleReset = () => {
    setRotation({ x: 0.5, y: 0.5 });
    setZoom(1);
  };

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        width={600}
        height={400}
        className="w-full h-full rounded-lg cursor-move"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      <div className="absolute bottom-4 right-4 flex gap-2">
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setZoom(Math.min(zoom + 0.2, 3))}
          title="Zoom In"
          data-testid="button-zoom-in"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setZoom(Math.max(zoom - 0.2, 0.5))}
          title="Zoom Out"
          data-testid="button-zoom-out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={handleReset}
          title="Reset View"
          data-testid="button-reset-view"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
      <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm rounded-md px-3 py-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Move className="h-3 w-3" />
          <span>Drag to rotate • Scroll to zoom</span>
        </div>
      </div>
    </div>
  );
}
