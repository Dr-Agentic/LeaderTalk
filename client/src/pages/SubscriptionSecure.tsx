import AppLayout from "@/components/AppLayout";
import PlanManager from "@/components/subscription/PlanManager";

export default function SubscriptionSecure() {
  return (
    <AppLayout
      showBackButton={true}
      backTo="/settings"
      backLabel="Back to Settings"
      pageTitle="Subscription Management"
    >
      <PlanManager />
    </AppLayout>
  );
}