export function AdSlot({ placement }: { placement: string }) {
  if (process.env.NEXT_PUBLIC_ADS_ENABLED !== "true") return null;
  return (
    <aside className="ad-slot" aria-label="광고 영역" data-placement={placement}>
      <span>광고</span>
      <p>광고 게재를 위한 예약 영역</p>
    </aside>
  );
}
