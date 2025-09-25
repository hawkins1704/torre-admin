import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';

interface ProductImageProps {
  imageId?: Id<'_storage'>;
  className?: string;
  alt?: string;
}

const ProductImage = ({ imageId, className = '', alt = 'Producto' }: ProductImageProps) => {
  const imageUrl = useQuery(
    api.products.getImageUrl,
    imageId ? { storageId: imageId } : 'skip'
  );

  if (!imageId || !imageUrl) {
    return (
      <div className={`bg-gray-200 rounded-lg flex items-center justify-center ${className}`}>
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={`object-cover rounded-lg ${className}`}
    />
  );
};

export default ProductImage;
