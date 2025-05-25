import AppLayout from "@/components/AppLayout";
import SecureSubscription from "@/components/subscription/SecureSubscription";

export default function SubscriptionSecure() {
  return (
    <AppLayout
      showBackButton={true}
      backTo="/settings"
      backLabel="Back to Settings"
      pageTitle="Subscription Management"
    >
      <SecureSubscription />
    </AppLayout>
  );
}