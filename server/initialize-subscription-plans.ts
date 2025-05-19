import { dbStorage } from "./dbStorage";

async function initializeSubscriptionPlans() {
  try {
    console.log("Initializing subscription plans...");
    await dbStorage.initializeSubscriptionPlans();
    console.log("Subscription plans initialized successfully!");
    
    // Display the plans for verification
    const plans = await dbStorage.getSubscriptionPlans();
    console.log("Current subscription plans:");
    console.table(plans.map(plan => ({
      id: plan.id,
      planCode: plan.planCode,
      name: plan.name,
      monthlyWordLimit: plan.monthlyWordLimit,
      monthlyPriceUsd: plan.monthlyPriceUsd,
      isDefault: plan.isDefault
    })));
  } catch (error) {
    console.error("Error initializing subscription plans:", error);
  }
}

// Run the script
initializeSubscriptionPlans();