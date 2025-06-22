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
    <Card className="bg-card border-border backdrop-blur-xl">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 rounded-full bg-primary/20">
            <CreditCard className="h-6 w-6 text-primary" />
          </div>
        </div>
        <CardTitle className="text-foreground">Add Payment Method</CardTitle>
        <CardDescription className="text-muted-foreground">
          Secure bank-level encryption
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Payment Element */}
        <div className="bg-accent border border-border rounded-lg p-4">
          <PaymentElement 
            options={{
              layout: 'tabs',
              paymentMethodOrder: ['card', 'link'],
            }}
          />
        </div>
        
        {/* Action Buttons */}
        <div className="space-y-4">
          <Button
            type="submit"
            disabled={!stripe || isProcessing}
            onClick={handleSubmit}
            className="w-full"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
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
            className="w-full"
            size="lg"
          >
            Cancel
          </Button>
        </div>
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
      if (data.clientSecret) {
        setSetupClientSecret(data.clientSecret);
        setIsAddingNew(true);
      }
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
      <Card className="bg-card border-border backdrop-blur-xl">
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="p-3 rounded-full bg-primary/20">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
            <div className="text-center">
              <p className="text-foreground font-medium">Loading payment methods</p>
              <p className="text-muted-foreground text-sm mt-1">Please wait a moment...</p>
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
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 via-transparent to-white/5 backdrop-blur-xl shadow-2xl">
      {/* Glass effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 opacity-60" />
      
      <div className="relative p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur-sm shadow-lg shadow-primary/20">
              <CreditCard className="h-6 w-6 text-primary" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Select Payment Method</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Choose your preferred payment method
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {paymentMethods.length === 0 ? (
            <div className="text-center py-8 space-y-6">
              <div className="flex justify-center">
                <div className="p-6 rounded-2xl bg-gradient-to-br from-gray-700/30 to-gray-600/20 backdrop-blur-sm">
                  <CreditCard className="h-10 w-10 text-gray-400" />
                </div>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-2">No Payment Methods</h3>
                <p className="text-gray-400 text-sm mb-6">Add a payment method to continue</p>
                <Button
                  onClick={() => setupPaymentMethod.mutate()}
                  disabled={setupPaymentMethod.isPending}
                  className="w-full h-14 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-white font-semibold shadow-lg shadow-primary/25 backdrop-blur-sm border border-white/10 transition-all duration-200"
                  size="lg"
                >
                  {setupPaymentMethod.isPending ? (
                    <div className="flex items-center">
                      <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                      <span>Setting up...</span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Plus className="mr-3 h-5 w-5" />
                      <span>Add Payment Method</span>
                    </div>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Payment Method Cards */}
              {paymentMethods.map((pm) => (
                <div
                  key={pm.id}
                  onClick={() => handlePaymentMethodSelect(pm.id)}
                  className={`group relative overflow-hidden rounded-xl border transition-all duration-300 cursor-pointer backdrop-blur-sm ${
                    (selectedPaymentMethodId || defaultPaymentMethod?.id) === pm.id
                      ? "border-primary/40 bg-gradient-to-br from-primary/10 to-primary/5 shadow-lg shadow-primary/20"
                      : "border-white/10 bg-gradient-to-br from-white/5 to-transparent hover:border-primary/30 hover:from-primary/5"
                  }`}
                  style={{ minHeight: '80px' }}
                >
                  <div className="relative p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1 min-w-0">
                        <div className={`p-3 rounded-xl transition-all duration-200 ${
                          (selectedPaymentMethodId || defaultPaymentMethod?.id) === pm.id
                            ? "bg-primary/20 text-primary shadow-lg shadow-primary/20"
                            : "bg-white/10 text-gray-400 group-hover:bg-primary/10 group-hover:text-primary"
                        }`}>
                          {getPaymentMethodIcon(pm)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold text-base truncate">
                            {formatPaymentMethod(pm)}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <p className="text-gray-400 text-sm">
                              Added {new Date(pm.created * 1000).toLocaleDateString()}
                            </p>
                            {pm.isDefault && (
                              <Badge 
                                variant="secondary" 
                                className="bg-primary/20 text-primary border-primary/30 text-xs"
                              >
                                Default
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {(selectedPaymentMethodId || defaultPaymentMethod?.id) === pm.id && (
                        <div className="flex-shrink-0 ml-3">
                          <div className="w-8 h-8 rounded-full bg-primary shadow-lg shadow-primary/30 flex items-center justify-center">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Add New Payment Method */}
              {showAddNewOption && (
                <div
                  onClick={handleAddNewPaymentMethod}
                  className="group relative p-6 rounded-xl border-2 border-dashed border-white/20 bg-gradient-to-br from-white/5 to-transparent hover:border-primary/40 hover:from-primary/5 cursor-pointer transition-all duration-300 backdrop-blur-sm"
                  style={{ minHeight: '80px' }}
                >
                  <div className="flex items-center justify-center space-x-4">
                    <div className="p-3 rounded-xl bg-white/10 group-hover:bg-primary/20 transition-all duration-200">
                      <Plus className="h-5 w-5 text-gray-400 group-hover:text-primary transition-colors duration-200" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-gray-400 group-hover:text-primary transition-colors duration-200">
                        Add New Method
                      </p>
                      <p className="text-gray-500 text-sm mt-1 group-hover:text-gray-400 transition-colors duration-200">
                        Tap to add payment option
                      </p>
                    </div>
                  </div>
                  
                  {setupPaymentMethod.isPending && (
                    <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <div className="flex items-center space-x-3 text-white">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <span className="font-medium">Setting up...</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}