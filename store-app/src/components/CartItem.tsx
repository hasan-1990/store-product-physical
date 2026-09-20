import OptimizedImage from './OptimizedImage';

export interface CartItemData {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  size?: string;
  color?: string;
}

interface CartItemProps {
  item: CartItemData;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  className?: string;
}

const CartItem = ({ item, onUpdateQuantity, onRemove, className = '' }: CartItemProps) => {
  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1) {
      onUpdateQuantity(item.id, newQuantity);
    }
  };

  const subtotal = item.price * item.quantity;

  return (
    <div className={`flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 sm:space-x-reverse p-4 bg-white border border-gray-200 rounded-lg ${className}`}>
      <div className="flex items-center space-x-4 space-x-reverse w-full sm:w-auto">
        {/* Product Image */}
        <div className="flex-shrink-0">
          <OptimizedImage
            src={item.image}
            alt={item.name}
            width={80}
            height={80}
            className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-md"
            decoding="async"
          />
        </div>

        {/* Product Details */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 truncate">
            {item.name}
          </h3>
          
          {/* Product Variations */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 sm:space-x-reverse mt-1 space-y-1 sm:space-y-0">
            {item.color && (
              <span className="text-xs sm:text-sm text-gray-500">
                رنگ: <span className="font-medium">{item.color}</span>
              </span>
            )}
            {item.size && (
              <span className="text-xs sm:text-sm text-gray-500">
                سایز: <span className="font-medium">{item.size}</span>
              </span>
            )}
          </div>

          {/* Price */}
          <p className="text-base sm:text-lg font-semibold text-gray-900 mt-1 sm:mt-2">
            {item.price.toLocaleString('fa-IR')} تومان
          </p>
        </div>
      </div>

      {/* Controls Row - Mobile: Full width, Desktop: Side by side */}
      <div className="flex items-center justify-between w-full sm:w-auto sm:space-x-4 sm:space-x-reverse">
        {/* Quantity Controls */}
        <div className="flex items-center space-x-2 space-x-reverse">
          <button
            onClick={() => handleQuantityChange(item.quantity - 1)}
            className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            disabled={item.quantity <= 1}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          
          <span className="w-10 text-center font-medium text-sm sm:text-base">
            {item.quantity}
          </span>
          
          <button
            onClick={() => handleQuantityChange(item.quantity + 1)}
            className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* Subtotal */}
        <div className="text-base sm:text-lg font-semibold text-gray-900 text-left">
          {subtotal.toLocaleString('fa-IR')} تومان
        </div>

        {/* Remove Button */}
        <button
          onClick={() => onRemove(item.id)}
          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
          aria-label="حذف آیتم"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default CartItem;
