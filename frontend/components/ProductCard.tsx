import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../types';
import Badge from './Badge';
import { useCart } from '../context/CartContext';

// Import icons
import organicoIcon from '../icons/organico.png';
import sinAzucarIcon from '../icons/sin-azucar.png';
import sinGlutenIcon from '../icons/sin-gluten.png';
import ketoIcon from '../icons/keto.png';
import veganoIcon from '../icons/vegano.png';
import naturalIcon from '../icons/natural.png';
import integralIcon from '../icons/integral.png';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();

  const attributeIcons: Record<string, string> = {
    'Organic': organicoIcon,
    'Sugar Free': sinAzucarIcon,
    'Gluten Free': sinGlutenIcon,
    'Keto': ketoIcon,
    'Vegan': veganoIcon,
    'Natural': naturalIcon,
    'Integral': integralIcon
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart(product);
  };

  return (
    <Link to={`/product/${product.id}`} className="group flex flex-col h-full bg-white hover:shadow-lg transition-shadow duration-300 rounded-sm">
      <div className="relative aspect-square overflow-hidden bg-[#F5F5F5]">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.badges?.map((badge) => (
            <Badge key={badge} text={badge} />
          ))}
        </div>

        {/* Attribute Icons Overlay */}
        <div className="absolute top-2 right-2 flex flex-col gap-2">
          {/* Always show Natural icon for testing */}
          <div className="flex flex-col items-center group">
            <div className="w-10 h-10 rounded-full bg-white/95 backdrop-blur shadow-md flex items-center justify-center p-1.5 hover:scale-110 transition-transform border border-primary/10" title="Natural">
              <img src={attributeIcons['Natural']} alt="Natural" className="w-full h-full object-contain" />
            </div>
            <span className="text-[8px] font-bold uppercase tracking-tight text-secondary bg-white/80 px-1 rounded mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Natural
            </span>
          </div>

          {product.badges?.filter(badge => badge !== 'Natural').map((badge) => (
            attributeIcons[badge] && (
              <div key={badge} className="flex flex-col items-center group">
                <div className="w-10 h-10 rounded-full bg-white/95 backdrop-blur shadow-md flex items-center justify-center p-1.5 hover:scale-110 transition-transform border border-primary/10" title={badge}>
                  <img src={attributeIcons[badge]} alt={badge} className="w-full h-full object-contain" />
                </div>
                <span className="text-[8px] font-bold uppercase tracking-tight text-secondary bg-white/80 px-1 rounded mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {badge}
                </span>
              </div>
            )
          ))}
        </div>
        {/* Quick Add Button overlay */}
        <button
          onClick={handleAddToCart}
          className="absolute bottom-4 right-4 w-10 h-10 bg-white text-primary rounded-full shadow-md flex items-center justify-center opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:bg-primary hover:text-white"
          aria-label="Add to cart"
        >
          <span className="material-symbols-outlined text-xl">add_shopping_cart</span>
        </button>
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-medium text-foreground text-lg mb-1 line-clamp-1 group-hover:text-secondary transition-colors font-serif">
          {product.name}
        </h3>
        <div className="flex items-center gap-1 mb-2">
          <span className="material-symbols-outlined text-accent text-sm">star</span>
          <span className="text-xs text-secondary">{product.rating || 5.0}</span>
        </div>
        <div className="mt-auto">
          <span className="text-lg font-bold text-foreground">
            ${product.price.toFixed(2)} MXN
          </span>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;