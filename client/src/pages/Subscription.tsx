import { useUser } from "../context/UserContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Subscription() {
  const { user } = useUser();
  const { toast } = useToast();

  const plans = [
    {
      name: "Standard",
      price: "Free",
      features: ["1 Client", "1 Invoice", "Basic Analytics", "Email Support"],
    },
    {
      name: "Premium",
      price: "$1.99/mo",
      features: [
        "Unlimited Clients",
        "Unlimited Invoices",
        "Advanced Analytics",
        "Priority Support",
        "Custom Branding",
      ],
    },
  ];

  const daysLeft = user?.trialEndsAt
    ? Math.max(
        0,
        Math.ceil(
          (new Date(user.trialEndsAt).getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      )
    : 0;
  console.log(user?.plan);
  return (
    <div className="container mx-auto py-8">
      {user?.plan === "trial" && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
          <h3 className="font-semibold text-yellow-800">Trial Period</h3>
          <p className="text-yellow-700">
            You have {daysLeft} days left in your trial. Choose a plan to
            continue using all features.
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={plan.name === "Premium" ? "border-primary" : ""}
          >
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>
                <span className="text-2xl font-bold">{plan.price}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center">
                    <CheckIcon className="w-5 h-5 text-green-500 mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="mt-auto">
              <Button
                className="w-full"
                variant={plan.name === "Premium" ? "default" : "outline"}
                onClick={async () => {
                  if (plan.name === "Premium") {
                    try {
                      const res = await fetch("/api/create-subscription", {
                        method: "POST",
                      });
                      if (!res.ok) throw new Error("Failed to create subscription");
                      const { url } = await res.json();
                      window.location.href = url;
                    } catch (error) {
                      toast({
                        title: "Error",
                        description: "Failed to process subscription",
                        variant: "destructive",
                      });
                    }
                  }
                }}
              >
                Choose {plan.name}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
