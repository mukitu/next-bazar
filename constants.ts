export const BKASH_NUMBER = "01303595062";
export const BKASH_CHARGE_RATE = 0;
export const COD_CHARGE = 0;
export const SHIPPING_DHAKA = 0;
export const SHIPPING_OUTSIDE = 0;
export const CURRENCY_SYMBOL = "৳";

export const ORDER_STATUSES = [
  'Pending', 
  'Payment Submitted', 
  'Approved', 
  'Processing', 
  'Shipped', 
  'Delivered', 
  'Cancelled'
];

export const STATUS_STEPS: Record<string, number> = {
  'Pending': 1,
  'Payment Submitted': 2,
  'Approved': 3,
  'Processing': 4,
  'Shipped': 5,
  'Delivered': 6,
  'Cancelled': 0
};

export const STATUS_COLORS: Record<string, string> = {
  'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Payment Submitted': 'bg-blue-100 text-blue-800 border-blue-200',
  'Approved': 'bg-teal-100 text-teal-800 border-teal-200',
  'Processing': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'Shipped': 'bg-purple-100 text-purple-800 border-purple-200',
  'Delivered': 'bg-green-600 text-white border-green-700',
  'Cancelled': 'bg-red-100 text-red-800 border-red-200',
};
