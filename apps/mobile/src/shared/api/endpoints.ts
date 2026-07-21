export const endpoints = {
  auth: {
    login: '/auth/login',
    me: '/auth/me'
  },
  catalog: {
    campuses: '/campuses',
    products: (snackId: string) => `/products?snackId=${encodeURIComponent(snackId)}`,
    productDetail: (productId: string) => `/products/${productId}`,
    slots: (snackId: string) => `/slots/available?snackId=${encodeURIComponent(snackId)}`,
    snacks: (campusId?: string) =>
      campusId ? `/snacks?campusId=${encodeURIComponent(campusId)}` : '/snacks',
    snackDetail: (snackId: string) => `/snacks/${snackId}`
  }
} as const;
