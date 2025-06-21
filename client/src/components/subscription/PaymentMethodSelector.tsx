import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CreditCard,
  Plus,
  Check,
  Link as LinkIcon,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY!);

interface PaymentMethodData {
  id: string;
  type: string;
  isDefault: boolean;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  link?: {
    email: string;
  };
  created: number;
}

interface PaymentMethodSelectorProps {
  onPaymentMethodSelected: (paymentMethodId?: string) => void;
  showAddNewOption?: boolean;
  selectedPaymentMethodId?: string;
  immediateCharge?: number;
  warningMessage?: string;
}

function AddPaymentMethodForm({
  clientSecret,
  onSuccess,
  onCancel,
}: {
  clientSecret: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error, setupIntent } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: window.location.origin + "/subscription",
        },
        redirect: "if_required",
      });

      if (error) {
        toast({
          title: "Payment Method Setup Failed",
          description: error.message,
          variant: "destructive",
        });
      } else if (setupIntent && setupIntent.status === "succeeded") {
        toast({
          title: "Payment Method Added",
          description: "Your payment method has been successfully added!",
        });
        onSuccess();
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="border-gray-600/50 bg-gradient-to-br from-gray-900/90 to-gray-800/80 backdrop-blur-sm shadow-2xl">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between text-white text-lg">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <span>Add New Payment Method</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg"
          >
            Cancel
          </Button>
        </CardTitle>
        <CardDescription className="text-gray-300 text-sm leading-relaxed">
          Add a secure payment method to your account
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="p-4 rounded-xl border border-gray-600/40 bg-gray-800/30">
            <PaymentElement 
              options={{
                layout: 'tabs',
                paymentMethodOrder: ['card', 'link'],
              }}
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="submit"
              disabled={!stripe || isProcessing}
              className="flex-1 bg-primary hover:bg-primary/90 text-white shadow-lg h-12"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding payment method...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Payment Method
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isProcessing}
              className="border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:text-white h-12 sm:w-auto"
              size="lg"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default function PaymentMethodSelector({
  onPaymentMethodSelected,
  showAddNewOption = true,
  selectedPaymentMethodId,
  immediateCharge = 0,
  warningMessage,
}: PaymentMethodSelectorProps) {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [setupClientSecret, setSetupClientSecret] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch payment methods
  const { data: paymentMethodsData, isLoading } = useQuery<{
    paymentMethods: PaymentMethodData[];
  }>({
    queryKey: ["/api/billing/payment-methods"],
    enabled: true,
  });

  // Setup new payment method mutation
  const setupPaymentMethod = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/billing/payment-methods/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to setup payment method");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setSetupClientSecret(data.clientSecret);
      setIsAddingNew(true);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to setup payment method. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Set default payment method mutation
  const setDefaultPaymentMethod = useMutation({
    mutationFn: async (paymentMethodId: string) => {
      const response = await fetch("/api/billing/payment-methods/set-default", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ paymentMethodId }),
      });
      if (!response.ok) {
        throw new Error("Failed to set default payment method");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Default Payment Method Updated",
        description: "Your default payment method has been updated successfully.",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/billing/payment-methods"],
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update default payment method.",
        variant: "destructive",
      });
    },
  });

  const paymentMethods = paymentMethodsData?.paymentMethods || [];
  const defaultPaymentMethod = paymentMethods.find(pm => pm.isDefault);

  const formatPaymentMethod = (pm: PaymentMethodData) => {
    if (pm.type === "card" && pm.card) {
      return `${pm.card.brand.toUpperCase()} •••• ${pm.card.last4}`;
    }
    if (pm.type === "link" && pm.link) {
      return `Link (${pm.link.email})`;
    }
    return `${pm.type.charAt(0).toUpperCase() + pm.type.slice(1)} Payment`;
  };

  const getPaymentMethodIcon = (pm: PaymentMethodData) => {
    if (pm.type === "card") {
      return <CreditCard className="h-4 w-4" />;
    }
    if (pm.type === "link") {
      return <LinkIcon className="h-4 w-4" />;
    }
    return <CreditCard className="h-4 w-4" />;
  };

  const handlePaymentMethodSelect = (paymentMethodId: string) => {
    onPaymentMethodSelected(paymentMethodId);
  };

  const handleAddNewPaymentMethod = () => {
    setupPaymentMethod.mutate();
  };

  const handleSetAsDefault = (paymentMethodId: string) => {
    setDefaultPaymentMethod.mutate(paymentMethodId);
  };

  // Hide payment panel if no immediate charge is required
  if (immediateCharge === 0) {
    // Automatically select no payment method for free transactions
    onPaymentMethodSelected(undefined);
    return null;
  }

  if (isLoading) {
    return (
      <Card className="border-gray-600/50 bg-gradient-to-br from-gray-900/90 to-gray-800/80 backdrop-blur-sm shadow-2xl">
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
              <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-pulse"></div>
            </div>
            <div className="text-center">
              <p className="text-white font-medium">Loading payment methods</p>
              <p className="text-gray-400 text-sm mt-1">Please wait a moment...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isAddingNew && setupClientSecret) {
    return (
      <Elements
        stripe={stripePromise}
        options={{ clientSecret: setupClientSecret }}
      >
        <AddPaymentMethodForm
          clientSecret={setupClientSecret}
          onSuccess={() => {
            setIsAddingNew(false);
            setSetupClientSecret(null);
            queryClient.invalidateQueries({
              queryKey: ["/api/billing/payment-methods"],
            });
          }}
          onCancel={() => {
            setIsAddingNew(false);
            setSetupClientSecret(null);
          }}
        />
      </Elements>
    );
  }

  return (
    <Card className="border-gray-600/50 bg-gradient-to-br from-gray-900/90 to-gray-800/80 backdrop-blur-sm shadow-2xl">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-3 text-white text-lg">
          <div className="p-2 rounded-lg bg-primary/20">
            <CreditCard className="h-5 w-5 text-primary" />
          </div>
          <span>Payment Method</span>
        </CardTitle>
        <CardDescription className="text-gray-300 text-sm leading-relaxed">
          Select a payment method for your subscription
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pb-6">
        {paymentMethods.length === 0 ? (
          <div className="text-center py-12">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-gray-700/30 flex items-center justify-center mb-4">
                <CreditCard className="h-8 w-8 text-gray-500" />
              </div>
              <h3 className="text-white font-medium mb-2">No payment methods</h3>
              <p className="text-gray-400 text-sm">Add a payment method to continue</p>
            </div>
            <Button
              onClick={() => setupPaymentMethod.mutate()}
              disabled={setupPaymentMethod.isPending}
              className="w-full max-w-xs mx-auto bg-primary hover:bg-primary/90 text-white shadow-lg"
              size="lg"
            >
              {setupPaymentMethod.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Payment Method
                </>
              )}
            </Button>
          </div>
        ) : (
          <>
            {/* Payment Method Cards - Mobile Optimized */}
            <div className="space-y-3">
              {paymentMethods.map((pm) => (
                <div
                  key={pm.id}
                  onClick={() => handlePaymentMethodSelect(pm.id)}
                  className={`group relative overflow-hidden rounded-xl border transition-all duration-300 cursor-pointer touch-manipulation
                    ${(selectedPaymentMethodId || defaultPaymentMethod?.id) === pm.id
                      ? "border-primary/60 bg-gradient-to-r from-primary/10 to-primary/5 shadow-lg shadow-primary/20 transform scale-[1.02]"
                      : "border-gray-600/40 bg-gradient-to-r from-gray-800/40 to-gray-700/20 hover:border-primary/30 hover:shadow-md active:scale-[0.98]"
                    }`}
                  style={{ minHeight: '80px' }}
                >
                  {/* Selection indicator with animation */}
                  {(selectedPaymentMethodId || defaultPaymentMethod?.id) === pm.id && (
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent animate-in fade-in duration-300" />
                  )}
                  
                  {/* Active border glow */}
                  {(selectedPaymentMethodId || defaultPaymentMethod?.id) === pm.id && (
                    <div className="absolute inset-0 rounded-xl border border-primary/30 animate-in fade-in duration-300" />
                  )}
                  
                  <div className="relative p-5">
                    {/* Top row - Payment method info */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4 flex-1 min-w-0">
                        <div className={`p-3 rounded-xl transition-all duration-200
                          ${(selectedPaymentMethodId || defaultPaymentMethod?.id) === pm.id
                            ? "bg-primary/20 text-primary shadow-lg shadow-primary/20"
                            : "bg-gray-700/50 text-gray-400 group-hover:bg-primary/10 group-hover:text-primary"
                          }`}>
                          {getPaymentMethodIcon(pm)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold text-base truncate">
                            {formatPaymentMethod(pm)}
                          </p>
                          <p className="text-gray-400 text-sm mt-1">
                            Added {new Date(pm.created * 1000).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      {/* Selection checkmark with animation */}
                      {(selectedPaymentMethodId || defaultPaymentMethod?.id) === pm.id && (
                        <div className="flex-shrink-0 ml-3 animate-in zoom-in duration-300">
                          <div className="w-8 h-8 rounded-full bg-primary shadow-lg shadow-primary/30 flex items-center justify-center">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom row - Status and actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-700/30">
                      <div className="flex items-center space-x-3">
                        {pm.isDefault && (
                          <Badge variant="secondary" className="text-xs bg-primary/20 text-primary border-primary/30 px-3 py-1">
                            <Check className="h-3 w-3 mr-1" />
                            Default
                          </Badge>
                        )}
                      </div>
                      
                      {!pm.isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetAsDefault(pm.id);
                          }}
                          disabled={setDefaultPaymentMethod.isPending}
                          className="text-sm text-gray-400 hover:text-primary hover:bg-primary/10 px-4 py-2 h-auto rounded-lg transition-all duration-200"
                        >
                          {setDefaultPaymentMethod.isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            "Set Default"
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add New Payment Method Card - Mobile Optimized */}
            {showAddNewOption && (
              <div
                onClick={handleAddNewPaymentMethod}
                className="group relative mt-4 p-6 rounded-xl border-2 border-dashed border-gray-600/40 bg-gradient-to-r from-gray-800/20 to-gray-700/10 cursor-pointer transition-all duration-300 hover:border-primary/40 hover:bg-gradient-to-r hover:from-primary/5 hover:to-primary/2 active:scale-[0.98] touch-manipulation"
                style={{ minHeight: '80px' }}
              >
                <div className="flex items-center justify-center space-x-4">
                  <div className="p-3 rounded-xl bg-gray-700/30 group-hover:bg-primary/20 transition-all duration-200 group-hover:shadow-lg group-hover:shadow-primary/20">
                    <Plus className="h-5 w-5 text-gray-400 group-hover:text-primary transition-colors duration-200" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-gray-400 group-hover:text-primary transition-colors duration-200 text-base">
                      Add New Payment Method
                    </p>
                    <p className="text-gray-500 text-sm mt-1 group-hover:text-gray-400 transition-colors duration-200">
                      Tap to add a new payment option
                    </p>
                  </div>
                </div>
                
                {setupPaymentMethod.isPending && (
                  <div className="absolute inset-0 bg-gray-900/50 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <div className="flex items-center space-x-3 text-white">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <span className="font-medium">Setting up...</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}