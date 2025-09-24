import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Dimensions,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppLayout } from "../src/components/navigation/AppLayout";
import { GlassCard } from "../src/components/ui/GlassCard";
import { Button } from "../src/components/ui/Button";
import { ThemedText } from "../src/components/ThemedText";
import { apiRequest, queryClient } from "../src/lib/apiService";
import {
  useMobileSubscription,
  useMobileProducts,
  useMobilePurchase,
  useMobileRestore,
  useMobileBillingUsage,
} from "../src/hooks/useMobileBilling";
import { revenueCatService } from "../src/services/revenueCatService";
import { theme } from "../src/styles/theme";

const { width } = Dimensions.get("window");

interface BillingProduct {
  id: string;
  code: string;
  name: string;
  description: string;
  productIcon: string | null;
  pricing: {
    amount: number;
    formattedPrice: string;
    formattedSavings?: string;
    interval: string;
    productId: string; // RevenueCat product ID instead of Stripe price ID
  };
  features: {
    wordLimit: number;
    maxRecordingLength: number;
    leaderLibraryAccess: boolean;
    advancedAnalytics: boolean;
    prioritySupport: boolean;
  };
  isDefault: boolean;
  isPopular: boolean;
  billingType: string;
}

// Using MobileSubscriptionData directly from RevenueCat service
import type { MobileSubscriptionData } from "../src/services/revenueCatService";

export default function SubscriptionScreen() {
  const [selectedPlan, setSelectedPlan] = useState<BillingProduct | null>(null);

  // Fetch current subscription using RevenueCat
  const {
    data: currentSubscription,
    isLoading: subscriptionLoading,
    refetch: refetchSubscription,
  } = useMobileSubscription();

  // Fetch available plans using RevenueCat
  const { data: plans, isLoading: plansLoading } = useMobileProducts();

  // Mobile billing usage
  const { data: billingUsage } = useMobileBillingUsage();

  // RevenueCat purchase mutation
  const purchaseSubscription = useMobilePurchase();

  // RevenueCat restore mutation
  const restorePurchases = useMobileRestore();

  // Mock update subscription for compatibility
  const updateSubscription = useMutation({
    mutationFn: async (planData: { productId: string }) => {
      // Trigger RevenueCat purchase flow
      return purchaseSubscription.mutateAsync({
        productId: planData.productId,
      });
    },
    onSuccess: (data, variables) => {
      // RevenueCat will handle the actual payment processing
      // This success handler now just shows confirmation
      showSubscriptionSuccessMessage(data, variables);
      queryClient.invalidateQueries({ queryKey: ["subscription-current"] });
    },
    onError: (error: any) => {
      Alert.alert(
        "Error",
        error.message || "Failed to update subscription. Please try again.",
        [{ text: "OK" }],
      );
    },
  });

  // Cancel subscription mutation
  const cancelSubscription = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/billing/subscriptions/cancel", {
        method: "POST",
      });
    },
    onSuccess: () => {
      Alert.alert(
        "Subscription Cancelled",
        `Your subscription has been cancelled. You'll continue to enjoy Executive features until ${currentSubscription?.subscription?.formattedNextRenewal}, then switch to the free Starter plan.`,
        [{ text: "OK" }],
      );
      queryClient.invalidateQueries({ queryKey: ["subscription-current"] });
    },
    onError: (error: any) => {
      Alert.alert(
        "Error",
        error.message || "Failed to cancel subscription. Please try again.",
        [{ text: "OK" }],
      );
    },
  });

  const showSubscriptionSuccessMessage = (data: any, variables: any) => {
    const currentPlan = currentSubscription?.subscription?.plan || "";
    const newPlan = data.newPlan || "";
    const amount = data.amount || 0;
    const interval = data.interval || "";
    const nextRenewal = data.nextRenewal || "";

    let title = "Success!";
    let message = "Your subscription has been updated successfully";

    if (currentPlan === "leadertalk_starter" && newPlan.includes("exec")) {
      title = "🎉 Welcome to Executive!";
      message = `You've successfully upgraded to our premium plan! You'll be billed ${amount} ${interval}ly starting ${nextRenewal}.`;
    } else if (interval === "year" && currentPlan.includes("monthly")) {
      title = "🎉 Annual Savings Activated!";
      message = `You've switched to our annual plan! Your annual subscription (${amount}/year) begins at the end of your current cycle.`;
    } else if (
      newPlan === "leadertalk_starter" &&
      currentPlan.includes("exec")
    ) {
      title = "Subscription Updated";
      message = `You've switched to our free starter plan. You'll continue enjoying Executive benefits until ${nextRenewal}.`;
    }

    Alert.alert(title, message, [{ text: "OK" }]);
  };

  const handleSubscribe = async (plan: BillingProduct) => {
    const productId = plan.pricing?.productId;
    if (!productId) {
      Alert.alert("Error", "Invalid plan selected. Please try again.");
      return;
    }

    const currentProductId = currentSubscription?.subscription?.productId;
    const isCurrentPlan = currentProductId === productId;

    if (isCurrentPlan) {
      return;
    }

    Alert.alert(
      "Confirm Subscription Change",
      `Are you sure you want to change to ${plan.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: () => updateSubscription.mutate({ productId }),
        },
      ],
    );
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      "Cancel Subscription?",
      `Are you sure you want to cancel your Executive subscription?\n\n• You'll keep Executive features until ${currentSubscription?.subscription?.formattedNextRenewal}\n• After that, you'll switch to the free Starter plan\n• No refunds for the current billing period`,
      [
        { text: "Keep Subscription", style: "cancel" },
        {
          text: "Cancel Subscription",
          style: "destructive",
          onPress: () => cancelSubscription.mutate(),
        },
      ],
    );
  };

  const handleCancelScheduledChange = async (scheduleId: string) => {
    try {
      await apiRequest("/api/billing/subscription/scheduled/cancel", {
        method: "POST",
        body: JSON.stringify({ scheduleId }),
      });

      Alert.alert(
        "Scheduled Change Cancelled",
        "Your scheduled subscription change has been cancelled successfully.",
        [{ text: "OK" }],
      );

      refetchSubscription();
      queryClient.invalidateQueries({ queryKey: ["subscription-scheduled"] });
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message || "Failed to cancel scheduled change",
        [{ text: "OK" }],
      );
    }
  };

  if (subscriptionLoading || plansLoading) {
    return (
      <AppLayout
        pageTitle="Subscription"
        showBackButton={true}
        backTo="/settings"
        backLabel="Back to Settings"
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <ThemedText style={styles.loadingText}>
            Loading subscription details...
          </ThemedText>
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      pageTitle="Subscription Management"
      showBackButton={true}
      backTo="/settings"
      backLabel="Back to Settings"
    >
      <StatusBar style="light" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={styles.title}>Choose Your Plan</ThemedText>
          <ThemedText style={styles.subtitle}>
            Upgrade your leadership training with premium features and increased
            word limits
          </ThemedText>
        </View>

        {/* Current Subscription Status */}
        {currentSubscription?.hasSubscription &&
          currentSubscription.subscription && (
            <GlassCard style={styles.currentSubscriptionCard}>
              <View style={styles.cardHeader}>
                <View>
                  <ThemedText style={styles.cardTitle}>
                    Current Subscription
                  </ThemedText>
                  <ThemedText style={styles.cardSubtitle}>
                    You're subscribed to {currentSubscription.subscription.plan}
                  </ThemedText>
                </View>
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: "rgba(138, 43, 226, 0.2)" },
                  ]}
                >
                  <ThemedText style={styles.badgeText}>
                    {currentSubscription.subscription.formattedStatus}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.subscriptionStats}>
                <View style={styles.statItem}>
                  <ThemedText style={styles.statLabel}>Word Usage</ThemedText>
                  <ThemedText style={styles.statValue}>
                    {currentSubscription.subscription.formattedUsage}
                  </ThemedText>
                </View>
                <View style={styles.statItem}>
                  <ThemedText style={styles.statLabel}>Amount</ThemedText>
                  <ThemedText style={styles.statValue}>
                    {currentSubscription.subscription.formattedAmount}
                    {currentSubscription.subscription.formattedInterval}
                  </ThemedText>
                </View>
                <View style={styles.statItem}>
                  <ThemedText style={styles.statLabel}>Next Billing</ThemedText>
                  <ThemedText style={styles.statSubvalue}>
                    {currentSubscription.subscription.formattedNextRenewal}
                  </ThemedText>
                </View>
                <View style={styles.statItem}>
                  <ThemedText style={styles.statLabel}>
                    Subscription Created
                  </ThemedText>
                  <ThemedText style={styles.statSubvalue}>
                    {currentSubscription.subscription.formattedStartDate}
                  </ThemedText>
                </View>
              </View>

              {/* Cancel Subscription Button for Paid Plans */}
              {!currentSubscription.subscription.isFree && (
                <Button
                  title="Cancel Subscription"
                  onPress={handleCancelSubscription}
                  style={[
                    styles.cancelButton,
                    { backgroundColor: "rgba(255, 107, 107, 0.1)" },
                  ]}
                  textStyle={{ color: theme.colors.chart[5] }}
                  disabled={cancelSubscription.isPending}
                  loading={cancelSubscription.isPending}
                />
              )}
            </GlassCard>
          )}

        {/* Available Plans */}
        <View style={styles.plansContainer}>
          {plans?.map((plan) => {
            const currentProductId = currentSubscription?.subscription?.productId;
            const planProductId = plan.pricing?.productId;
            const isCurrentPlan = currentProductId === planProductId;

            return (
              <GlassCard
                key={plan.id}
                style={[
                  styles.planCard,
                  selectedPlan?.id === plan.id && styles.selectedPlanCard,
                ]}
              >
                <View style={styles.planHeader}>
                  <View style={styles.planTitleRow}>
                    <ThemedText style={styles.planName}>{plan.name}</ThemedText>
                    {plan.isPopular && (
                      <View style={styles.popularBadge}>
                        <ThemedText style={styles.popularText}>
                          Popular
                        </ThemedText>
                      </View>
                    )}
                  </View>
                  <ThemedText style={styles.planDescription}>
                    {plan.description}
                  </ThemedText>
                </View>

                {/* Pricing */}
                <View style={styles.pricingSection}>
                  <ThemedText style={styles.price}>
                    {plan.pricing.formattedPrice}
                  </ThemedText>
                  {plan.pricing.formattedSavings && (
                    <ThemedText style={styles.savings}>
                      {plan.pricing.formattedSavings}
                    </ThemedText>
                  )}
                </View>

                {/* Features */}
                <View style={styles.featuresSection}>
                  <View style={styles.featureItem}>
                    <Feather name="check" size={16} color={theme.colors.success} />
                    <ThemedText style={styles.featureText}>
                      {plan.features.wordLimit.toLocaleString()} words/month
                    </ThemedText>
                  </View>
                  {plan.features.advancedAnalytics && (
                    <View style={styles.featureItem}>
                      <Feather name="check" size={16} color={theme.colors.success} />
                      <ThemedText style={styles.featureText}>
                        Advanced analytics
                      </ThemedText>
                    </View>
                  )}
                  {plan.features.prioritySupport && (
                    <View style={styles.featureItem}>
                      <Feather name="check" size={16} color={theme.colors.success} />
                      <ThemedText style={styles.featureText}>
                        Priority support
                      </ThemedText>
                    </View>
                  )}
                  {plan.billingType === "yearly" && (
                    <View style={styles.featureItem}>
                      <Feather name="check" size={16} color={theme.colors.info} />
                      <ThemedText
                        style={[
                          styles.featureText,
                          { color: theme.colors.foreground, fontWeight: "600" },
                        ]}
                      >
                        Best value option
                      </ThemedText>
                    </View>
                  )}
                </View>

                {/* Select Button */}
                <Button
                  title={isCurrentPlan ? "Current Plan" : "Select Plan"}
                  onPress={() => handleSubscribe(plan)}
                  disabled={updateSubscription.isPending || isCurrentPlan}
                  loading={updateSubscription.isPending}
                  style={[
                    styles.selectButton,
                    isCurrentPlan && styles.currentPlanButton,
                  ]}
                  textStyle={
                    isCurrentPlan
                      ? { color: "rgba(255, 255, 255, 0.6)" }
                      : undefined
                  }
                />
              </GlassCard>
            );
          })}
        </View>

        {/* Security Notice */}
        <GlassCard style={styles.securityCard}>
          <View style={styles.securityHeader}>
            <Feather name="check-circle" size={20} color={theme.colors.success} />
            <ThemedText style={styles.securityTitle}>
              Secure Payment Processing
            </ThemedText>
          </View>
          <ThemedText style={styles.securityText}>
            All payments are processed securely through our payment provider.
            Your payment information is never stored on our servers.
          </ThemedText>
        </GlassCard>
      </ScrollView>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#fff",
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
    lineHeight: 24,
  },
  currentSubscriptionCard: {
    marginBottom: 24,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(138, 43, 226, 0.3)",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.primary,
  },
  subscriptionStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statItem: {
    width: "48%",
    marginBottom: 16,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.7)",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  statSubvalue: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: "rgba(255, 107, 107, 0.3)",
  },
  plansContainer: {
    gap: 20,
    marginBottom: 32,
  },
  planCard: {
    padding: 20,
  },
  selectedPlanCard: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  planHeader: {
    marginBottom: 20,
  },
  planTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  planName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  popularBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  popularText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
  planDescription: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    lineHeight: 20,
  },
  pricingSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  price: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
  },
  savings: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.success,
    marginTop: 4,
  },
  featuresSection: {
    marginBottom: 24,
    gap: 12,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
  },
  selectButton: {
    marginTop: "auto",
  },
  currentPlanButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  securityCard: {
    marginTop: 8,
  },
  securityHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  securityText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    lineHeight: 20,
  },
});
