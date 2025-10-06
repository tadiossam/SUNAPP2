import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { SparePart } from "@shared/schema";

export default function UploadModelPage() {
  const [selectedPartId, setSelectedPartId] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: parts } = useQuery<SparePart[]>({
    queryKey: ["/api/parts"],
  });

  // Filter parts without 3D models
  const partsWithoutModels = parts?.filter((part) => !part.model3dPath);

  const uploadMutation = useMutation({
    mutationFn: async (data: { partId: string; file: File }) => {
      const formData = new FormData();
      formData.append('modelFile', data.file);

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/parts/${data.partId}/upload-model`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parts"] });
      setUploadStatus("success");
      setSelectedPartId("");
      setSelectedFile(null);
      toast({
        title: "Success",
        description: "3D model uploaded successfully",
      });
    },
    onError: () => {
      setUploadStatus("error");
      toast({
        title: "Error",
        description: "Failed to upload 3D model",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validExtensions = ['.glb', '.gltf', '.obj'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      
      if (!validExtensions.includes(fileExtension)) {
        toast({
          title: "Invalid file type",
          description: "Please select a GLB, GLTF, or OBJ file",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      setUploadStatus("idle");
    }
  };

  const handleUpload = () => {
    if (!selectedPartId) {
      toast({
        title: "Error",
        description: "Please select a part first",
        variant: "destructive",
      });
      return;
    }

    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please select a 3D model file",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate({
      partId: selectedPartId,
      file: selectedFile,
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-none border-b bg-card p-6">
        <div>
          <h1 className="text-3xl font-bold">Upload 3D Model</h1>
          <p className="text-muted-foreground mt-1">
            Add 3D schematics for spare parts
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {uploadStatus === "success" && (
            <Alert className="border-chart-2 bg-chart-2/10">
              <CheckCircle2 className="h-4 w-4 text-chart-2" />
              <AlertDescription className="text-chart-2">
                3D model uploaded successfully! You can now view it in the 3D Models section.
              </AlertDescription>
            </Alert>
          )}

          {uploadStatus === "error" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to upload the 3D model. Please try again.
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Upload 3D Model File</CardTitle>
              <CardDescription>
                Select a spare part and upload its 3D schematic model (GLB, GLTF, or OBJ format)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="part-select">Select Part</Label>
                <Select value={selectedPartId} onValueChange={setSelectedPartId}>
                  <SelectTrigger id="part-select" data-testid="select-part">
                    <SelectValue placeholder="Choose a spare part..." />
                  </SelectTrigger>
                  <SelectContent>
                    {partsWithoutModels && partsWithoutModels.length > 0 ? (
                      partsWithoutModels.map((part) => (
                        <SelectItem key={part.id} value={part.id}>
                          {part.partNumber} - {part.partName}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        No parts without models found
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Only parts without existing 3D models are shown
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="model-file">3D Model File</Label>
                <input
                  id="model-file"
                  type="file"
                  accept=".glb,.gltf,.obj"
                  onChange={handleFileSelect}
                  className="hidden"
                  data-testid="input-model-file"
                />
                <label
                  htmlFor="model-file"
                  className="border-2 border-dashed rounded-lg p-8 text-center hover-elevate cursor-pointer block"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Upload className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        GLB, GLTF, or OBJ files (max 50MB)
                      </p>
                    </div>
                  </div>
                </label>
                <p className="text-xs text-muted-foreground">
                  Supported formats: .glb (recommended), .gltf, .obj
                </p>
              </div>

              <div className="pt-4">
                <Button
                  className="w-full"
                  onClick={handleUpload}
                  disabled={!selectedPartId || uploadMutation.isPending}
                  data-testid="button-upload"
                >
                  {uploadMutation.isPending ? (
                    <>
                      <div className="h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Model
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upload Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <h4 className="font-medium mb-1">File Format Recommendations</h4>
                <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                  <li>GLB format is preferred for web viewing (single file, optimized)</li>
                  <li>GLTF format is acceptable (may include separate texture files)</li>
                  <li>OBJ format is supported but less optimized</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-1">Model Quality</h4>
                <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Optimize polygon count for web performance</li>
                  <li>Include proper textures and materials</li>
                  <li>Ensure correct scale and orientation</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-1">File Size</h4>
                <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Maximum file size: 50MB</li>
                  <li>Compress textures when possible</li>
                  <li>Use LOD (Level of Detail) models for large parts</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
