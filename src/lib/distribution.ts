export type DistributionChannel = "web" | "desktop-direct" | "steam" | "ios" | "android";

export interface DistributionPolicy {
  channel: DistributionChannel;
  externalStore: boolean;
  nativeStoreName: string | null;
}

const POLICIES: Record<DistributionChannel, DistributionPolicy> = {
  web: { channel: "web", externalStore: true, nativeStoreName: null },
  "desktop-direct": { channel: "desktop-direct", externalStore: true, nativeStoreName: null },
  steam: { channel: "steam", externalStore: false, nativeStoreName: "Steam" },
  ios: { channel: "ios", externalStore: false, nativeStoreName: "App Store" },
  android: { channel: "android", externalStore: false, nativeStoreName: "Google Play" },
};

export function distributionPolicy(value?: string): DistributionPolicy {
  const channel = value?.toLowerCase() as DistributionChannel | undefined;
  return channel && channel in POLICIES ? POLICIES[channel] : POLICIES.web;
}

export const DISTRIBUTION = distributionPolicy(import.meta.env.VITE_DISTRIBUTION_CHANNEL);
