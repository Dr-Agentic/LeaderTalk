import React, { useState, useMemo } from "react";
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
import { useTheme } from '../src/hooks/useTheme';

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
  const theme = useTheme();
  const [selectedPlan, setSelectedPlan] = useState<BillingProduct | null>(null);

  // Dynamic styles based on theme
  const dynamicStyles = useMemo(() => ({
    currentPlanText: {
      color: theme.colors.foreground,
    },
    planDescription: {
      color: theme.colors.muted,
    },
    priceText: {
      color: theme.colors.foreground,
    },
    featureText: {
      color: theme.colors.muted,
    },
    popularBadge: {
      backgroundColor: theme.colors.success,
    },
    selectedPlan: {
      borderColor: theme.colors.primary,
      backgroundColor: `${theme.colors.primary}1A`, // 10% opacity
    },
    usageText: {
      color: theme.colors.muted,
    },
    loadingText: {
      color: theme.colors.muted,
    },
    errorText: {
      color: theme.colors.error,
    },
    successText: {
      color: theme.colors.success,
    },
  }), [theme]);

  // Fetch current subscription using RevenueCat
  const {
    data: currentSubscription,
    isLoading: subscriptionLoading,
    error: subscriptionError,
    refetch: refetchSubscription,
  } = useMobileSubscription();

  // Fetch available plans using RevenueCat
  const { 
    data: plans, 
    isLoading: plansLoading,
    error: plansError,
  } = useMobileProducts();

  // DEBUG: Console log API responses
  console.log('=== SUBSCRIPTION DEBUG ===');
  console.log('currentSubscription:', JSON.stringify(currentSubscription, null, 2));
  console.log('plans:', JSON.stringify(plans, null, 2));
  console.log('subscriptionLoading:', subscriptionLoading);
  console.log('plansLoading:', plansLoading);
  console.log('subscriptionError:', subscriptionError);
  console.log('plansError:', plansError);
  console.log('========================');

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

    // Platform-specific purchase flow
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      // Mobile: Use RevenueCat via mobile billing hooks
      Alert.alert(
        "Confirm Purchase",
        `Purchase ${plan.name} for ${plan.pricing.formattedPrice}${plan.pricing.interval}?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Purchase",
            onPress: () => {
              purchaseSubscription.mutate({
                productId: productId,
              }, {
                onSuccess: () => {
                  Alert.alert(
                    "Purchase Successful!",
                    `You've successfully subscribed to ${plan.name}. Your subscription is now active.`,
                    [{ text: "OK" }]
                  );
                },
                onError: (error: any) => {
                  Alert.alert(
                    "Purchase Failed",
                    error.message || "Unable to complete purchase. Please try again.",
                    [{ text: "OK" }]
                  );
                }
              });
            },
          },
        ],
      );
    } else {
      // Web: Use existing Stripe flow
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
    }
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
          <ThemedText style={[styles.loadingText, dynamicStyles.loadingText]}>
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
          <ThemedText style={[styles.title, dynamicStyles.currentPlanText]}>Choose Your Plan</ThemedText>
          <ThemedText style={[styles.subtitle, dynamicStyles.planDescription]}>
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
                  <ThemedText style={[styles.cardTitle, dynamicStyles.currentPlanText]}>
                    Current Subscription
                  </ThemedText>
                  <ThemedText style={[styles.cardSubtitle, dynamicStyles.planDescription]}>
                    You're subscribed to {currentSubscription.subscription.plan}
                  </ThemedText>
                </View>
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: `${theme.colors.primary}33` }, // 20% opacity
                  ]}
                >
                  <ThemedText style={[styles.badgeText, dynamicStyles.currentPlanText]}>
                    {currentSubscription.subscription.formattedStatus}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.subscriptionStats}>
                <View style={styles.statItem}>
                  <ThemedText style={[styles.statLabel, dynamicStyles.usageText]}>Word Usage</ThemedText>
                  <ThemedText style={[styles.statValue, dynamicStyles.currentPlanText]}>
                    {currentSubscription.subscription.formattedUsage}
                  </ThemedText>
                </View>
                <View style={styles.statItem}>
                  <ThemedText style={[styles.statLabel, dynamicStyles.usageText]}>Amount</ThemedText>
                  <ThemedText style={[styles.statValue, dynamicStyles.currentPlanText]}>
                    {currentSubscription.subscription.formattedAmount}
                    {currentSubscription.subscription.formattedInterval}
                  </ThemedText>
                </View>
                <View style={styles.statItem}>
                  <ThemedText style={[styles.statLabel, dynamicStyles.usageText]}>Next Billing</ThemedText>
                  <ThemedText style={[styles.statSubvalue, dynamicStyles.usageText]}>
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
                    { backgroundColor: `${theme.colors.error}1A` }, // 10% opacity
                  ]}
                  textStyle={{ color: theme.colors.chart[5] }}
                  disabled={cancelSubscription.isPending}
                  loading={cancelSubscription.isPending}
                />
              )}

              {/* Restore Purchases Button for Mobile */}
              {(Platform.OS === 'ios' || Platform.OS === 'android') && (
                <Button
                  title="Restore Purchases"
                  onPress={() => {
                    restorePurchases.mutate(undefined, {
                      onSuccess: () => {
                        Alert.alert(
                          "Restore Complete",
                          "Your purchases have been restored successfully.",
                          [{ text: "OK" }]
                        );
                      },
                      onError: (error: any) => {
                        Alert.alert(
                          "Restore Failed",
                          error.message || "Unable to restore purchases. Please try again.",
                          [{ text: "OK" }]
                        );
                      }
                    });
                  }}
                  style={[
                    styles.restoreButton,
                    { backgroundColor: `${theme.colors.primary}1A` }, // 10% opacity
                  ]}
                  textStyle={{ color: theme.colors.primary }}
                  disabled={restorePurchases.isPending}
                  loading={restorePurchases.isPending}
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
                  selectedPlan?.id === plan.id && [styles.selectedPlanCard, dynamicStyles.selectedPlan],
                ]}
              >
                <View style={styles.planHeader}>
                  <View style={styles.planTitleRow}>
                    <ThemedText style={[styles.planName, dynamicStyles.currentPlanText]}>{plan.name}</ThemedText>
                    {plan.isPopular && (
                      <View style={[styles.popularBadge, dynamicStyles.popularBadge]}>
                        <ThemedText style={[styles.popularText, dynamicStyles.currentPlanText]}>
                          Popular
                        </ThemedText>
                      </View>
                    )}
                  </View>
                  <ThemedText style={[styles.planDescription, dynamicStyles.planDescription]}>
                    {plan.description}
                  </ThemedText>
                </View>

                {/* Pricing */}
                <View style={styles.pricingSection}>
                  <ThemedText style={[styles.price, dynamicStyles.priceText]}>
                    {plan.pricing.formattedPrice}
                  </ThemedText>
                  {plan.pricing.formattedSavings && (
                    <ThemedText style={[styles.savings, dynamicStyles.successText]}>
                      {plan.pricing.formattedSavings}
                    </ThemedText>
                  )}
                </View>

                {/* Features */}
                <View style={styles.featuresSection}>
                  <View style={styles.featureItem}>
                    <Feather name="check" size={16} color={theme.colors.success} />
                    <ThemedText style={[styles.featureText, dynamicStyles.featureText]}>
                      {plan.features.wordLimit.toLocaleString()} words/month
                    </ThemedText>
                  </View>
                  {plan.features.advancedAnalytics && (
                    <View style={styles.featureItem}>
                      <Feather name="check" size={16} color={theme.colors.success} />
                      <ThemedText style={[styles.featureText, dynamicStyles.featureText]}>
                        Advanced analytics
                      </ThemedText>
                    </View>
                  )}
                  {plan.features.prioritySupport && (
                    <View style={styles.featureItem}>
                      <Feather name="check" size={16} color={theme.colors.success} />
                      <ThemedText style={[styles.featureText, dynamicStyles.featureText]}>
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
                          dynamicStyles.currentPlanText,
                          { fontWeight: "600" },
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
                      ? { color: theme.colors.disabled }
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
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
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
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
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
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
  },
  statSubvalue: {
    fontSize: 12,
    textAlign: "center",
  },
  cancelButton: {
    borderWidth: 1,
  },
  restoreButton: {
    borderWidth: 1,
    marginTop: 12,
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
  },
  popularBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  popularText: {
    fontSize: 12,
    fontWeight: "600",
  },
  planDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  pricingSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  price: {
    fontSize: 32,
    fontWeight: "bold",
  },
  savings: {
    fontSize: 14,
    fontWeight: "600",
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
  },
  selectButton: {
    marginTop: "auto",
  },
  currentPlanButton: {
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
  },
  securityText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
