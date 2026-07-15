import {
  getWhoopDashboard,
  getWhoopErrorMessage,
  WHOOP_TRAINING_RANGE,
} from "@/lib/whoop/dashboard";

export async function getWhoopData() {
  try {
    return await getWhoopDashboard(WHOOP_TRAINING_RANGE);
  } catch (error) {
    throw new Error(getWhoopErrorMessage(error));
  }
}
