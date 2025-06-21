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
    <Card className="border-gray-600 bg-gray-800/30">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <div className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Add New Payment Method</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-gray-400 hover:text-white"
          >
            Cancel
          </Button>
        </CardTitle>
        <CardDescription className="text-gray-300">
          Add a new payment method to your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <PaymentElement />
          <div className="flex space-x-2">
            <Button
              type="submit"
              disabled={!stripe || isProcessing}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding payment method...
                </>
              ) : (
                "Add Payment Method"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isProcessing}
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

  const handlePaymentMethodChange = (paymentMethodId: string) => {
    if (paymentMethodId === "add_new") {
      setupPaymentMethod.mutate();
      return;
    }
    onPaymentMethodSelected(paymentMethodId);
  };

  const handleSetAsDefault = (paymentMethodId: string) => {
    setDefaultPaymentMethod.mutate(paymentMethodId);
  };

  if (isLoading) {
    return (
      <Card className="border-gray-600 bg-gray-800/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-white">Loading payment methods...</span>
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
    <Card className="border-gray-600 bg-gray-800/30">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-white">
          <CreditCard className="h-5 w-5" />
          <span>Payment Method</span>
        </CardTitle>
        <CardDescription className="text-gray-300">
          Select a payment method for your subscription
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {paymentMethods.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 mx-auto text-gray-500 mb-4" />
            <p className="text-gray-400 mb-4">No payment methods found</p>
            <Button
              onClick={() => setupPaymentMethod.mutate()}
              disabled={setupPaymentMethod.isPending}
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
            <Select
              value={selectedPaymentMethodId || defaultPaymentMethod?.id || ""}
              onValueChange={handlePaymentMethodChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((pm) => (
                  <SelectItem key={pm.id} value={pm.id}>
                    <div className="flex items-center space-x-2">
                      {getPaymentMethodIcon(pm)}
                      <span>{formatPaymentMethod(pm)}</span>
                      {pm.isDefault && (
                        <Badge variant="secondary" className="ml-2">
                          Default
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
                {showAddNewOption && (
                  <SelectItem value="add_new">
                    <div className="flex items-center space-x-2">
                      <Plus className="h-4 w-4" />
                      <span>Add New Payment Method</span>
                    </div>
                  </SelectItem>
                )}
              </SelectContent>
            </Select>

            {/* Payment Method Details */}
            {paymentMethods.map((pm) => (
              <div
                key={pm.id}
                className={`p-3 rounded-lg border ${
                  (selectedPaymentMethodId || defaultPaymentMethod?.id) === pm.id
                    ? "border-primary bg-primary/10"
                    : "border-gray-600 bg-gray-700/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getPaymentMethodIcon(pm)}
                    <div>
                      <p className="text-white font-medium">
                        {formatPaymentMethod(pm)}
                      </p>
                      <p className="text-gray-400 text-sm">
                        Added {new Date(pm.created * 1000).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {pm.isDefault ? (
                      <Badge variant="secondary" className="flex items-center space-x-1">
                        <Check className="h-3 w-3" />
                        <span>Default</span>
                      </Badge>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetAsDefault(pm.id)}
                        disabled={setDefaultPaymentMethod.isPending}
                      >
                        Set as Default
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </CardContent>
    </Card>
  );
}