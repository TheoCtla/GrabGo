export const endpoints = {
  auth: {
    login: '/auth/login',
    me: '/auth/me',
    registerStudent: '/auth/register/student'
  },
  catalog: {
    campuses: '/campuses',
    products: (snackId: string) => `/products?snackId=${encodeURIComponent(snackId)}`,
    productDetail: (productId: string) => `/products/${productId}`,
    slots: (snackId: string) => `/slots/available?snackId=${encodeURIComponent(snackId)}`,
    snacks: (campusId?: string) =>
      campusId ? `/snacks?campusId=${encodeURIComponent(campusId)}` : '/snacks',
    snackDetail: (snackId: string) => `/snacks/${snackId}`
  },
  orders: {
    create: '/orders',
    detail: (orderId: string) => `/orders/${orderId}`,
    me: '/orders/me',
    pay: (orderId: string) => `/orders/${orderId}/pay`
  }
} as const;
