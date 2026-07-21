export const endpoints = {
  auth: {
    login: '/auth/login',
    me: '/auth/me'
  },
  orders: {
    detail: (orderId: string) => `/orders/${orderId}`,
    merchant: '/orders/merchant',
    status: (orderId: string) => `/orders/${orderId}/status`,
    withdrawalValidate: '/orders/withdrawal/validate'
  }
} as const;
