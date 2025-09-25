import imageCompression from 'browser-image-compression';

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebP?: boolean;
  quality?: number;
}

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  originalType: string;
  compressedType: string;
}

/**
 * Comprime una imagen optimizando su tamaño y calidad
 * @param file - Archivo de imagen a comprimir
 * @param options - Opciones de compresión
 * @returns Promise con el resultado de la compresión
 */
export async function compressImage(
  file: File, 
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxSizeMB = 2, // Tamaño máximo en MB
    maxWidthOrHeight = 1920, // Resolución máxima
    useWebP = true, // Usar WebP si es posible
    quality = 0.8 // Calidad (0.1 a 1.0)
  } = options;

  const originalSize = file.size;
  const originalType = file.type;

  try {
    // Configuración de compresión
    const compressionOptions = {
      maxSizeMB,
      maxWidthOrHeight,
      useWebP,
      quality,
      // Mantener la orientación EXIF
      preserveExif: false,
      // Configuración adicional para mejor compresión
      initialQuality: quality,
      alwaysKeepResolution: false,
    };

    // Comprimir la imagen
    const compressedFile = await imageCompression(file, compressionOptions);
    
    const compressedSize = compressedFile.size;
    const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;

    return {
      file: compressedFile,
      originalSize,
      compressedSize,
      compressionRatio,
      originalType,
      compressedType: compressedFile.type,
    };

  } catch (error) {
    console.error('Error comprimiendo imagen:', error);
    throw new Error('No se pudo comprimir la imagen. Por favor intenta con otra imagen.');
  }
}

/**
 * Valida si un archivo es una imagen válida
 * @param file - Archivo a validar
 * @returns true si es una imagen válida
 */
export function isValidImageFile(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  return validTypes.includes(file.type.toLowerCase());
}

/**
 * Formatea el tamaño de archivo en formato legible
 * @param bytes - Tamaño en bytes
 * @returns String formateado (ej: "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Configuraciones predefinidas para diferentes casos de uso
 */
export const COMPRESSION_PRESETS = {
  // Para imágenes de productos (balance entre calidad y tamaño)
  product: {
    maxSizeMB: 2,
    maxWidthOrHeight: 1920,
    useWebP: true,
    quality: 0.8,
  },
  
  // Para thumbnails (más compresión)
  thumbnail: {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 400,
    useWebP: true,
    quality: 0.7,
  },
  
  // Para imágenes de alta calidad (menos compresión)
  highQuality: {
    maxSizeMB: 5,
    maxWidthOrHeight: 2560,
    useWebP: true,
    quality: 0.9,
  },
  
  // Para imágenes muy pequeñas (máxima compresión)
  small: {
    maxSizeMB: 0.2,
    maxWidthOrHeight: 200,
    useWebP: true,
    quality: 0.6,
  },
} as const;
