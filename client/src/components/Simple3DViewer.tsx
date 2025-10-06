import { useEffect, useRef, useState } from "react";
import { RotateCcw, ZoomIn, ZoomOut, Move, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

interface Simple3DViewerProps {
  modelPath?: string;
  className?: string;
}

export function Simple3DViewer({ modelPath, className = "" }: Simple3DViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0.5, y: 0.5 });
  const [zoom, setZoom] = useState(5);
  const [isDragging, setIsDragging] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [autoRotate, setAutoRotate] = useState(false);
  const [rotationSpeed, setRotationSpeed] = useState(0.5);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);
    sceneRef.current = scene;

    // Create camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = zoom;
    cameraRef.current = camera;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight1.position.set(5, 5, 5);
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight2.position.set(-5, -5, -5);
    scene.add(directionalLight2);

    // Load model if path provided
    if (modelPath) {
      setIsLoading(true);
      setLoadError(null);

      // Create placeholder geometry while loading
      const geometry = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 32);
      const material = new THREE.MeshStandardMaterial({ 
        color: 0x2563eb,
        metalness: 0.3,
        roughness: 0.4
      });
      const placeholder = new THREE.Mesh(geometry, material);
      scene.add(placeholder);
      modelRef.current = new THREE.Group();
      modelRef.current.add(placeholder);

      // Try to load GLTF model
      const loader = new GLTFLoader();
      
      loader.load(
        modelPath,
        (gltf) => {
          setIsLoading(false);
          
          // Remove placeholder
          scene.remove(placeholder);
          
          // Add loaded model
          const model = gltf.scene;
          
          // Center and scale model
          const box = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 2 / maxDim;
          
          model.position.sub(center);
          model.scale.multiplyScalar(scale);
          
          scene.add(model);
          modelRef.current = model;
        },
        (progress) => {
          // Loading progress
          console.log((progress.loaded / progress.total * 100) + '% loaded');
        },
        (error) => {
          console.error('Error loading model:', error);
          setLoadError('Model file not found - showing placeholder');
          setIsLoading(false);
        }
      );
    } else {
      // No model path - show default placeholder
      const geometry = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 32);
      const material = new THREE.MeshStandardMaterial({ 
        color: 0x2563eb,
        metalness: 0.3,
        roughness: 0.4
      });
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);
      modelRef.current = new THREE.Group();
      modelRef.current.add(mesh);
      setIsLoading(false);
    }

    // Animation loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      
      if (modelRef.current) {
        modelRef.current.rotation.x = rotation.x;
        modelRef.current.rotation.y = rotation.y;
      }
      
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [modelPath]);

  // Update rotation
  useEffect(() => {
    if (modelRef.current) {
      modelRef.current.rotation.x = rotation.x;
      modelRef.current.rotation.y = rotation.y;
    }
  }, [rotation]);

  // Update zoom
  useEffect(() => {
    if (cameraRef.current) {
      cameraRef.current.position.z = zoom;
    }
  }, [zoom]);

  // Auto-rotation effect
  useEffect(() => {
    if (!autoRotate) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const animate = () => {
      setRotation((prev) => ({
        x: prev.x,
        y: prev.y + rotationSpeed * 0.02,
      }));
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [autoRotate, rotationSpeed]);

  // Touch support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setLastPos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    
    e.preventDefault();

    const touch = e.touches[0];
    const deltaX = touch.clientX - lastPos.x;
    const deltaY = touch.clientY - lastPos.y;

    setRotation((prev) => ({
      x: prev.x + deltaY * 0.01,
      y: prev.y + deltaX * 0.01,
    }));

    setLastPos({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

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
    setZoom(5);
  };

  return (
    <div className={`relative ${className}`}>
      <div
        ref={containerRef}
        className="w-full h-full rounded-lg cursor-move"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading 3D model...</p>
          </div>
        </div>
      )}

      {/* Error message */}
      {loadError && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-yellow-500/10 border border-yellow-500/20 rounded-md px-4 py-2">
          <p className="text-xs text-yellow-600 dark:text-yellow-400">{loadError}</p>
        </div>
      )}
      
      {/* Main Controls */}
      <div className="absolute bottom-4 right-4 flex gap-2">
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setAutoRotate(!autoRotate)}
          title={autoRotate ? "Pause Auto-Rotation" : "Start Auto-Rotation"}
          aria-label={autoRotate ? "Pause automatic rotation" : "Start automatic rotation"}
          data-testid="button-auto-rotate"
        >
          {autoRotate ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setZoom(Math.max(zoom - 0.5, 2))}
          title="Zoom In"
          aria-label="Zoom in on 3D model"
          data-testid="button-zoom-in"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setZoom(Math.min(zoom + 0.5, 15))}
          title="Zoom Out"
          aria-label="Zoom out on 3D model"
          data-testid="button-zoom-out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={handleReset}
          title="Reset View"
          aria-label="Reset view to default position"
          data-testid="button-reset-view"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Rotation Speed Control */}
      {autoRotate && (
        <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm rounded-md px-4 py-3 w-64">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Rotation Speed</span>
              <span className="text-xs text-muted-foreground">{rotationSpeed.toFixed(1)}x</span>
            </div>
            <Slider
              value={[rotationSpeed]}
              onValueChange={(values) => setRotationSpeed(values[0])}
              min={0.1}
              max={2}
              step={0.1}
              className="w-full"
              data-testid="slider-rotation-speed"
            />
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm rounded-md px-3 py-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Move className="h-3 w-3" />
          <span>Drag to rotate 360° • {autoRotate ? 'Auto-rotating' : 'Click play for auto-rotation'}</span>
        </div>
      </div>
    </div>
  );
}
