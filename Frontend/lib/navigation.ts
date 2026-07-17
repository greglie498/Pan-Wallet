import { router } from "expo-router";

export const navigate = {
  push: (path: string) => router.push(path as any),
  replace: (path: string) => router.replace(path as any),
  back: () => router.back(),
  pushWithParams: (path: string, params: Record<string, string>) =>
    router.push({ pathname: path as any, params }),
};