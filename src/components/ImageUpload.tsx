import { useState, useRef } from 'react';
import type { Id } from '../../convex/_generated/dataModel';
import { compressImage, isValidImageFile, formatFileSize, COMPRESSION_PRESETS } from '../utils/imageCompression';
import type { CompressionOptions } from '../utils/imageCompression';
import CompressionSettings from './CompressionSettings';
import ProductImage from './ProductImage';

interface ImageUploadProps {
  currentImageId?: Id<'_storage'>;
  onImageSelected?: (file: File) => void;
  onImageRemoved?: () => void;
  disabled?: boolean;
}

const ImageUpload = ({ 
  currentImageId, 
  onImageSelected, 
  onImageRemoved, 
  disabled = false 
}: ImageUploadProps) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [compressionInfo, setCompressionInfo] = useState<{
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
  } | null>(null);
  const [compressionSettings, setCompressionSettings] = useState<CompressionOptions>(COMPRESSION_PRESETS.product);
  const [imageRemoved, setImageRemoved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!isValidImageFile(file)) {
      alert('Por favor selecciona un archivo de imagen válido (JPG, PNG, GIF, WebP).');
      return;
    }

    // Validar tamaño inicial (máximo 50MB antes de compresión)
    if (file.size > 50 * 1024 * 1024) {
      alert('La imagen es demasiado grande. Por favor selecciona una imagen menor a 50MB.');
      return;
    }

    setIsCompressing(true);
    setCompressionInfo(null);

    try {
      // Comprimir la imagen usando la configuración actual
      const result = await compressImage(file, compressionSettings);
      
      setSelectedImage(result.file);
      setCompressionInfo({
        originalSize: result.originalSize,
        compressedSize: result.compressedSize,
        compressionRatio: result.compressionRatio,
      });
      
      // Crear preview con la imagen comprimida
      const url = URL.createObjectURL(result.file);
      setPreviewUrl(url);
      
      // Notificar al componente padre que se seleccionó una imagen
      onImageSelected?.(result.file);
      
    } catch (error) {
      console.error('Error comprimiendo imagen:', error);
      alert('Error al procesar la imagen. Por favor intenta con otra imagen.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setCompressionInfo(null);
    setImageRemoved(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onImageRemoved?.();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-medium text-gray-700">
          Imagen del Producto
        </label>
        <CompressionSettings 
          onSettingsChange={setCompressionSettings}
          initialSettings={compressionSettings}
        />
      </div>
      
      {/* Mostrar imagen actual si existe y no fue removida */}
      {currentImageId && !imageRemoved && !selectedImage && (
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Imagen Actual</h3>
            <div className="flex justify-center">
              <ProductImage 
                imageId={currentImageId} 
                className="w-48 h-48 object-cover rounded-lg shadow-sm"
                alt="Imagen actual del producto"
              />
            </div>
          </div>
          <div className="text-center">
            <button
              type="button"
              onClick={handleRemoveImage}
              disabled={disabled}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Remover Imagen Actual
            </button>
          </div>
        </div>
      )}

      {/* Área de drop/select - solo se muestra si no hay imagen actual o fue removida */}
      {(!currentImageId || imageRemoved || selectedImage) && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
          {isCompressing ? (
            <div className="space-y-4">
              <div className="text-gray-500">
                <svg className="animate-spin mx-auto h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Comprimiendo imagen...</p>
                <p className="text-xs text-gray-500">Optimizando tamaño y calidad</p>
              </div>
            </div>
          ) : previewUrl ? (
            <div className="space-y-4">
              <div className="relative inline-block">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-48 mx-auto rounded-lg shadow-sm"
                />
                {/* Botón X en la esquina superior derecha */}
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  disabled={disabled}
                  className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Eliminar imagen"
                >
                  ×
                </button>
              </div>
              
              {/* Información de compresión */}
              {compressionInfo && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-green-800 font-medium">Imagen optimizada</span>
                    <span className="text-green-600 font-bold">
                      -{compressionInfo.compressionRatio.toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-green-700">
                    <div className="flex justify-between">
                      <span>Original:</span>
                      <span>{formatFileSize(compressionInfo.originalSize)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Comprimida:</span>
                      <span>{formatFileSize(compressionInfo.compressedSize)}</span>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-green-600">
                    ✅ La imagen se guardará al crear/actualizar el producto
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <label htmlFor="image-upload" className="cursor-pointer">
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    Haz clic para seleccionar una imagen
                  </span>
                  <span className="mt-1 block text-xs text-gray-500">
                    PNG, JPG, GIF, WebP hasta 50MB (se optimizará automáticamente)
                  </span>
                </label>
                <input
                  ref={fileInputRef}
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="sr-only"
                  disabled={disabled}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
