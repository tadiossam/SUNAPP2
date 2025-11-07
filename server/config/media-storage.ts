import path from 'path';

export const MEDIA_STORAGE_CONFIG = {
  baseDir: path.join(process.cwd(), 'public', 'uploads'),
  
  folders: {
    employees: 'employees',
    spareParts: 'spare-parts',
    equipment: 'equipment',
  },
  
  // Get full path for a specific folder
  getPath(folder: 'employees' | 'spareParts' | 'equipment'): string {
    return path.join(this.baseDir, this.folders[folder]);
  },
  
  // Get URL for accessing uploaded files
  getUrl(folder: 'employees' | 'spareParts' | 'equipment', filename: string): string {
    return `/uploads/${this.folders[folder]}/${filename}`;
  },
  
  // Allowed file extensions
  allowedExtensions: {
    images: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    videos: ['.mp4', '.webm', '.mov', '.avi'],
  },
  
  // Max file sizes (in bytes)
  maxFileSize: {
    image: 10 * 1024 * 1024, // 10MB
    video: 100 * 1024 * 1024, // 100MB
  },
};
