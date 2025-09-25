import { useState } from 'react';
import { COMPRESSION_PRESETS } from '../utils/imageCompression';
import type { CompressionOptions } from '../utils/imageCompression';

interface CompressionSettingsProps {
  onSettingsChange: (settings: CompressionOptions) => void;
  initialSettings?: CompressionOptions;
}

const CompressionSettings = ({ onSettingsChange, initialSettings }: CompressionSettingsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<CompressionOptions>(
    initialSettings || COMPRESSION_PRESETS.product
  );

  const handlePresetSelect = (presetName: keyof typeof COMPRESSION_PRESETS) => {
    const preset = COMPRESSION_PRESETS[presetName];
    setSettings(preset);
    onSettingsChange(preset);
  };

  const handleCustomChange = (field: keyof CompressionOptions, value: number) => {
    const newSettings = { ...settings, [field]: value };
    setSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const presets = [
    { key: 'product', name: 'Producto', description: 'Balance entre calidad y tamaño' },
    { key: 'thumbnail', name: 'Miniatura', description: 'Máxima compresión' },
    { key: 'highQuality', name: 'Alta Calidad', description: 'Mínima compresión' },
    { key: 'small', name: 'Pequeña', description: 'Para iconos y avatares' },
  ] as const;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="text-xs text-gray-500 hover:text-gray-700 underline"
      >
        ⚙️ Configurar compresión
      </button>

      {isOpen && (
        <div className="absolute top-8 left-0 z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-80">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-gray-900">Configuración de Compresión</h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* Presets rápidos */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Presets rápidos
              </label>
              <div className="grid grid-cols-2 gap-2">
                {presets.map((preset) => (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => handlePresetSelect(preset.key)}
                    className={`text-xs p-2 rounded border text-left ${
                      JSON.stringify(settings) === JSON.stringify(COMPRESSION_PRESETS[preset.key])
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">{preset.name}</div>
                    <div className="text-gray-500">{preset.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Configuración personalizada */}
            <div className="border-t pt-4">
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Configuración personalizada
              </label>
              
              <div className="space-y-3">
                {/* Tamaño máximo */}
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Tamaño máximo (MB): {settings.maxSizeMB}
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="10"
                    step="0.1"
                    value={settings.maxSizeMB}
                    onChange={(e) => handleCustomChange('maxSizeMB', parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Resolución máxima */}
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Resolución máxima (px): {settings.maxWidthOrHeight}
                  </label>
                  <input
                    type="range"
                    min="200"
                    max="4000"
                    step="100"
                    value={settings.maxWidthOrHeight}
                    onChange={(e) => handleCustomChange('maxWidthOrHeight', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Calidad */}
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Calidad: {Math.round((settings.quality || 0.8) * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={settings.quality}
                    onChange={(e) => handleCustomChange('quality', parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Usar WebP */}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="useWebP"
                    checked={settings.useWebP}
                    onChange={(e) => handleCustomChange('useWebP', e.target.checked ? 1 : 0)}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <label htmlFor="useWebP" className="text-xs text-gray-600">
                    Usar formato WebP (más eficiente)
                  </label>
                </div>
              </div>
            </div>

            {/* Información */}
            <div className="border-t pt-3">
              <div className="text-xs text-gray-500">
                <p className="mb-1">💡 <strong>Consejos:</strong></p>
                <ul className="space-y-1 text-xs">
                  <li>• Calidad 80% es ideal para la mayoría de casos</li>
                  <li>• WebP reduce el tamaño en ~25% sin pérdida visual</li>
                  <li>• Resolución 1920px es suficiente para pantallas HD</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompressionSettings;
