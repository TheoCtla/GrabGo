const dashboardEnv = import.meta.env as {
  readonly VITE_API_BASE_URL?: string;
};

export const appConfig = {
  apiBaseUrl: dashboardEnv.VITE_API_BASE_URL ?? 'http://localhost:3000/api'
} as const;
