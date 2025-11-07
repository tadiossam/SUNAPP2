import { AspectRatio } from "@/components/ui/aspect-ratio";

interface ResponsiveFrameProps {
  children: React.ReactNode;
  ratio?: number;
  className?: string;
}

export function ResponsiveFrame({ children, ratio = 16 / 9, className = "" }: ResponsiveFrameProps) {
  return (
    <AspectRatio ratio={ratio} className={className}>
      <div className="w-full h-full">
        {children}
      </div>
    </AspectRatio>
  );
}
