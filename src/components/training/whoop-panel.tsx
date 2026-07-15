import { WhoopDashboard } from "@/components/training/WhoopDashboard";
import { getWhoopData } from "@/lib/whoop/get-whoop-data";

export const runtime = "nodejs";

export async function WhoopPanel() {
  const dashboard = await getWhoopData();

  return (
    <WhoopDashboard
      dashboard={dashboard}
      error={!dashboard.enabled ? dashboard.message : null}
    />
  );
}
