import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Download, Ruler, Weight, Box, FileText, Hammer } from "lucide-react";
import type { SparePart } from "@shared/schema";

interface ManufacturingSpecsProps {
  part: SparePart;
}

interface ManufacturingData {
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    diameter?: number;
    unit?: string;
  };
  material?: string;
  tolerance?: string;
  weight?: number;
  weightUnit?: string;
  cadFormats?: string[];
  surfaceFinish?: string;
  hardness?: string;
}

export function ManufacturingSpecs({ part }: ManufacturingSpecsProps) {
  const specs: ManufacturingData = part.manufacturingSpecs 
    ? JSON.parse(part.manufacturingSpecs) 
    : {};

  if (!specs || Object.keys(specs).length === 0) {
    return (
      <Card data-testid="card-manufacturing-specs-empty">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hammer className="w-5 h-5" />
            Manufacturing Specifications
          </CardTitle>
          <CardDescription>
            Manufacturing specifications not available for this part
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card data-testid="card-manufacturing-specs">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Hammer className="w-5 h-5" />
          Manufacturing Specifications
        </CardTitle>
        <CardDescription>
          Accurate to millimeter precision - Ready for CNC, milling, and 3D printing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {specs.dimensions && (
          <div className="space-y-3" data-testid="section-dimensions">
            <div className="flex items-center gap-2">
              <Ruler className="w-4 h-4 text-muted-foreground" />
              <h4 className="font-semibold">Dimensions</h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {specs.dimensions.length && (
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Length</div>
                  <div className="font-mono text-lg" data-testid="text-dimension-length">
                    {specs.dimensions.length} {specs.dimensions.unit || 'mm'}
                  </div>
                </div>
              )}
              {specs.dimensions.width && (
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Width</div>
                  <div className="font-mono text-lg" data-testid="text-dimension-width">
                    {specs.dimensions.width} {specs.dimensions.unit || 'mm'}
                  </div>
                </div>
              )}
              {specs.dimensions.height && (
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Height</div>
                  <div className="font-mono text-lg" data-testid="text-dimension-height">
                    {specs.dimensions.height} {specs.dimensions.unit || 'mm'}
                  </div>
                </div>
              )}
              {specs.dimensions.diameter && (
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Diameter</div>
                  <div className="font-mono text-lg" data-testid="text-dimension-diameter">
                    {specs.dimensions.diameter} {specs.dimensions.unit || 'mm'}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {specs.material && (
            <div className="space-y-1" data-testid="section-material">
              <div className="flex items-center gap-2">
                <Box className="w-4 h-4 text-muted-foreground" />
                <div className="text-sm text-muted-foreground">Material</div>
              </div>
              <div className="font-medium" data-testid="text-material">{specs.material}</div>
            </div>
          )}

          {specs.weight && (
            <div className="space-y-1" data-testid="section-weight">
              <div className="flex items-center gap-2">
                <Weight className="w-4 h-4 text-muted-foreground" />
                <div className="text-sm text-muted-foreground">Weight</div>
              </div>
              <div className="font-medium" data-testid="text-weight">
                {specs.weight} {specs.weightUnit || 'kg'}
              </div>
            </div>
          )}

          {specs.tolerance && (
            <div className="space-y-1" data-testid="section-tolerance">
              <div className="text-sm text-muted-foreground">Tolerance</div>
              <div className="font-mono" data-testid="text-tolerance">{specs.tolerance}</div>
            </div>
          )}

          {specs.surfaceFinish && (
            <div className="space-y-1" data-testid="section-surface-finish">
              <div className="text-sm text-muted-foreground">Surface Finish</div>
              <div className="font-medium" data-testid="text-surface-finish">{specs.surfaceFinish}</div>
            </div>
          )}

          {specs.hardness && (
            <div className="space-y-1" data-testid="section-hardness">
              <div className="text-sm text-muted-foreground">Hardness</div>
              <div className="font-medium" data-testid="text-hardness">{specs.hardness}</div>
            </div>
          )}
        </div>

        {specs.cadFormats && specs.cadFormats.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3" data-testid="section-cad-formats">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <h4 className="font-semibold">Available CAD Formats</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {specs.cadFormats.map((format) => (
                  <Badge 
                    key={format} 
                    variant="secondary" 
                    className="font-mono"
                    data-testid={`badge-cad-format-${format.toLowerCase()}`}
                  >
                    {format}
                  </Badge>
                ))}
              </div>
              {part.model3dPath && (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    data-testid="button-download-cad"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download CAD Files
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    data-testid="button-view-3d"
                  >
                    <Box className="w-4 h-4 mr-2" />
                    View 3D Model
                  </Button>
                </div>
              )}
            </div>
          </>
        )}

        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Manufacturing Ready:</strong> All dimensions are accurate to the millimeter and suitable for 
            CNC machining, milling operations, and 3D printing. CAD files include proper tolerances and 
            material specifications for industrial manufacturing.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
