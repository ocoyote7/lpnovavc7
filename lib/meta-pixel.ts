
export function trackPurchase(value: number, currency = "BRL", eventId?: string) {
  if (typeof window === "undefined") return;
  if (!(window as any).fbq) return;

  (window as any).fbq("track", "Purchase", {
    value,
    currency,
  }, { eventID: eventId });
}
