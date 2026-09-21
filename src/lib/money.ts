export function agorotToShekelString(agorot: number): string {
  return (agorot / 100).toFixed(2);
}

/** "₪65" for whole shekels, "₪65.50" otherwise. */
export function formatIls(agorot: number): string {
  return agorot % 100 === 0 ? `₪${agorot / 100}` : `₪${agorotToShekelString(agorot)}`;
}

export function shekelsToAgorot(shekels: number): number {
  return Math.round(shekels * 100);
}

export const MIN_ORDER_AGOROT = 3500;
export const DELIVERY_FEE_AGOROT = 0;
export const DEFAULT_DELIVERY_CITY = "אשקלון";
