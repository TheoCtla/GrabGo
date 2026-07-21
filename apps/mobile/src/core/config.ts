const expoEnv = process.env as {
  readonly EXPO_PUBLIC_API_BASE_URL?: string;
};

export const appConfig = {
  apiBaseUrl: expoEnv.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api'
} as const;
