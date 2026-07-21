export const endpoints = {
  auth: {
    login: '/auth/login',
    me: '/auth/me'
  },
  orders: {
    merchant: '/orders/merchant'
  }
} as const;
