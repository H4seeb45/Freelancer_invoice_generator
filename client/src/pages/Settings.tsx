import React, { useState } from "react";
import { useUser } from "../context/UserContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { User } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

// Form schemas
const profileSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  address: z.string().optional(),
  companyName: z.string().optional(),
});

const invoiceSettingsSchema = z.object({
  invoicePrefix: z.string().min(1, "Prefix is required"),
  defaultTaxRate: z.number().min(0, "Cannot be negative").max(100, "Cannot exceed 100%"),
  defaultTerms: z.string(),
  defaultNotes: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type InvoiceSettingsValues = z.infer<typeof invoiceSettingsSchema>;

export default function Settings() {
  const { user } = useUser();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("professional");
  const [selectedColor, setSelectedColor] = useState("primary");
  const [logoPreview, setLogoPreview] = useState<string | null>(user?.companyLogo || null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  
  // Handle logo upload
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      toast({
        title: "File too large",
        description: "Please select an image under 2MB",
        variant: "destructive",
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setLogoPreview(result);
      // In a real app, you would upload this to a server and get a URL back
    };
    reader.readAsDataURL(file);
  };

  // Trigger file input click
  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      email: user?.email || "",
      phone: user?.phone || "",
      address: user?.address || "",
      companyName: user?.companyName || "",
    },
  });

  // Invoice settings form
  const invoiceSettingsForm = useForm<InvoiceSettingsValues>({
    resolver: zodResolver(invoiceSettingsSchema),
    defaultValues: {
      invoicePrefix: "INV-",
      defaultTaxRate: 0,
      defaultTerms: "net_30",
      defaultNotes: "Thank you for your business!",
    },
  });

  // Update profile
  const onUpdateProfile = async (data: ProfileFormValues) => {
    setIsUpdating(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedProfile = await response.json();
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Update invoice settings
  const onUpdateInvoiceSettings = (data: InvoiceSettingsValues) => {
    setIsUpdating(true);
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Settings Updated",
        description: "Your invoice settings have been updated successfully.",
      });
      setIsUpdating(false);
    }, 1000);
  };
  
  // Update template settings
  const onUpdateTemplateSettings = () => {
    setIsUpdating(true);
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Template Updated",
        description: `Your invoice template has been updated to "${selectedTemplate}" with the selected color.`,
      });
      setIsUpdating(false);
    }, 1000);
  };

  return (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800">Settings</h2>
        <p className="mt-1 text-sm text-gray-600">Manage your account and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="invoice">Invoice Settings</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal and business information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                  {logoPreview ? (
                    <img 
                      src={logoPreview} 
                      alt="Company logo" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-gray-500" />
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleLogoUpload}
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={triggerFileUpload}
                  >
                    Upload Logo
                  </Button>
                  <p className="text-xs text-gray-500 mt-1">
                    Recommended: 200x200px PNG or JPG
                  </p>
                </div>
              </div>
              
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onUpdateProfile)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={profileForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={profileForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            rows={3} 
                            placeholder="Your business address" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end">
                    <Button type="submit" disabled={isUpdating}>
                      {isUpdating ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoice Settings Tab */}
        <TabsContent value="invoice">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Settings</CardTitle>
              <CardDescription>
                Customize your default invoice settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...invoiceSettingsForm}>
                <form onSubmit={invoiceSettingsForm.handleSubmit(onUpdateInvoiceSettings)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={invoiceSettingsForm.control}
                      name="invoicePrefix"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Invoice Number Prefix</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>
                            Used for generating invoice numbers (e.g., INV-2023-001)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={invoiceSettingsForm.control}
                      name="defaultTaxRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Tax Rate (%)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0"
                              max="100"
                              step="0.01"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={invoiceSettingsForm.control}
                      name="defaultTerms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Payment Terms</FormLabel>
                          <FormControl>
                            <select
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              {...field}
                            >
                              <option value="due_on_receipt">Due on Receipt</option>
                              <option value="net_15">Net 15</option>
                              <option value="net_30">Net 30</option>
                              <option value="net_60">Net 60</option>
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={invoiceSettingsForm.control}
                    name="defaultNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Notes</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            rows={3}
                            placeholder="Default notes to appear on your invoices" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end">
                    <Button type="submit" disabled={isUpdating}>
                      {isUpdating ? "Saving..." : "Save Settings"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Templates</CardTitle>
              <CardDescription>
                Choose and customize your invoice templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card 
                  className={`cursor-pointer transition-all ${selectedTemplate === "professional" ? "border-2 border-primary" : "hover:border-2 hover:border-primary"}`}
                  onClick={() => setSelectedTemplate("professional")}
                >
                  <CardContent className="p-4">
                    <div className="aspect-[8.5/11] bg-gray-100 flex items-center justify-center">
                      <div className="w-4/5 h-4/5 bg-white shadow p-2">
                        <div className={`w-full h-1/6 bg-${selectedColor} mb-2`}></div>
                        <div className="w-1/3 h-1 bg-gray-300 mb-2"></div>
                        <div className="w-full h-1/2 bg-gray-200 mb-2"></div>
                        <div className="w-full h-1/6 bg-gray-100"></div>
                      </div>
                    </div>
                    <p className="text-center mt-2 font-medium">Professional</p>
                  </CardContent>
                </Card>
                
                <Card 
                  className={`cursor-pointer transition-all ${selectedTemplate === "minimal" ? "border-2 border-primary" : "hover:border-2 hover:border-primary"}`}
                  onClick={() => setSelectedTemplate("minimal")}
                >
                  <CardContent className="p-4">
                    <div className="aspect-[8.5/11] bg-gray-100 flex items-center justify-center">
                      <div className="w-4/5 h-4/5 bg-white shadow p-2">
                        <div className={`w-1/2 h-1/6 bg-${selectedColor} mb-2`}></div>
                        <div className="w-1/3 h-1 bg-gray-300 mb-2"></div>
                        <div className="w-full h-1/2 bg-gray-200 mb-2"></div>
                        <div className="w-full h-1/6 bg-gray-100"></div>
                      </div>
                    </div>
                    <p className="text-center mt-2 font-medium">Minimal</p>
                  </CardContent>
                </Card>
                
                <Card 
                  className={`cursor-pointer transition-all ${selectedTemplate === "modern" ? "border-2 border-primary" : "hover:border-2 hover:border-primary"}`}
                  onClick={() => setSelectedTemplate("modern")}
                >
                  <CardContent className="p-4">
                    <div className="aspect-[8.5/11] bg-gray-100 flex items-center justify-center">
                      <div className="w-4/5 h-4/5 bg-white shadow p-2">
                        <div className={`h-1/6 bg-${selectedColor} mb-2 rounded-md`}></div>
                        <div className="w-1/3 h-1 bg-gray-300 mb-2"></div>
                        <div className="w-full h-1/2 bg-gray-200 mb-2 rounded-md"></div>
                        <div className="w-full h-1/6 bg-gray-100 rounded-md"></div>
                      </div>
                    </div>
                    <p className="text-center mt-2 font-medium">Modern</p>
                  </CardContent>
                </Card>
              </div>
              
              <Separator className="my-6" />
              
              <div>
                <h3 className="text-lg font-medium mb-4">Template Colors</h3>
                <div className="flex space-x-4">
                  <div 
                    className={`w-8 h-8 rounded-full bg-primary cursor-pointer ${selectedColor === 'primary' ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
                    onClick={() => setSelectedColor('primary')}
                  ></div>
                  <div 
                    className={`w-8 h-8 rounded-full bg-blue-500 cursor-pointer ${selectedColor === 'blue-500' ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                    onClick={() => setSelectedColor('blue-500')}
                  ></div>
                  <div 
                    className={`w-8 h-8 rounded-full bg-green-500 cursor-pointer ${selectedColor === 'green-500' ? 'ring-2 ring-offset-2 ring-green-500' : ''}`}
                    onClick={() => setSelectedColor('green-500')}
                  ></div>
                  <div 
                    className={`w-8 h-8 rounded-full bg-purple-500 cursor-pointer ${selectedColor === 'purple-500' ? 'ring-2 ring-offset-2 ring-purple-500' : ''}`}
                    onClick={() => setSelectedColor('purple-500')}
                  ></div>
                  <div 
                    className={`w-8 h-8 rounded-full bg-orange-500 cursor-pointer ${selectedColor === 'orange-500' ? 'ring-2 ring-offset-2 ring-orange-500' : ''}`}
                    onClick={() => setSelectedColor('orange-500')}
                  ></div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                onClick={onUpdateTemplateSettings} 
                disabled={isUpdating}
              >
                {isUpdating ? "Saving..." : "Save Template Settings"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure how you want to be notified
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-medium">Payment Received</h3>
                    <p className="text-sm text-gray-500">
                      Get notified when a client pays an invoice
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" value="" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-medium">Invoice Overdue</h3>
                    <p className="text-sm text-gray-500">
                      Get notified when an invoice becomes overdue
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" value="" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-medium">Client Reminders</h3>
                    <p className="text-sm text-gray-500">
                      Automatically send payment reminders to clients
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" value="" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-medium">Weekly Summary</h3>
                    <p className="text-sm text-gray-500">
                      Receive a weekly summary of your invoicing activity
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" value="" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button>Save Notification Settings</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
