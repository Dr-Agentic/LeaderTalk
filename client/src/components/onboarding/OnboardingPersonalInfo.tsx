import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { updateUserSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Extended schema for the profile form
const formSchema = updateUserSchema.pick({
  photoUrl: true,
  dateOfBirth: true,
  profession: true,
  goals: true
}).extend({
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
  location: z.string().optional(),
  dateOfBirth: z.string().min(1, { message: "Date of birth is required" }),
  profession: z.string().min(1, { message: "Profession is required" }),
  goals: z.string().min(10, { message: "Please provide at least 10 characters describing your goals" }),
});

type FormValues = z.infer<typeof formSchema>;

interface OnboardingPersonalInfoProps {
  onComplete: () => void;
  googleProfile: {
    photoUrl?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  } | null;
}

export default function OnboardingPersonalInfo({ onComplete, googleProfile }: OnboardingPersonalInfoProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: googleProfile?.firstName || "",
      lastName: googleProfile?.lastName || "",
      location: "",
      photoUrl: googleProfile?.photoUrl || "",
      dateOfBirth: "",
      profession: "",
      goals: "",
    },
  });
  
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    
    try {
      // Extract the data to be sent to the server
      const { firstName, lastName, ...updateData } = data;
      
      // Add username from first and last name
      const serverData = {
        ...updateData,
        username: `${firstName} ${lastName}`, // Update username with full name
      };
      
      const response = await apiRequest('PATCH', '/api/users/me', serverData);
      
      if (response.ok) {
        toast({
          title: "Profile updated",
          description: "Your profile has been set up successfully.",
        });
        
        if (onComplete) {
          onComplete();
        }
      } else {
        throw new Error("Failed to update profile");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save your information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="max-w-3xl mx-auto my-8 px-4">
      <Card className="bg-white p-8 rounded-lg shadow-md">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Tell us about yourself</h2>
          <p className="text-gray-600 mt-2">We'll use this information to personalize your experience</p>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex justify-center mb-6">
              <FormField
                control={form.control}
                name="photoUrl"
                render={({ field }) => (
                  <FormItem className="flex flex-col items-center">
                    <FormLabel className="sr-only">Profile Photo</FormLabel>
                    <FormControl>
                      <div className="flex flex-col items-center gap-4">
                        <Avatar className="h-24 w-24 border-2 border-primary/20">
                          <AvatarImage src={field.value || ''} alt="Profile" />
                          <AvatarFallback className="text-2xl">
                            {form.watch("firstName")?.[0]?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        {!googleProfile?.photoUrl && (
                          <Input 
                            type="url" 
                            className="w-full max-w-xs" 
                            placeholder="Profile photo URL (optional)" 
                            value={field.value || ''}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                          />
                        )}
                      </div>
                    </FormControl>
                    {!googleProfile?.photoUrl && (
                      <FormDescription className="text-xs text-center">
                        Enter a URL to your profile picture
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location <span className="text-gray-400 text-xs">(Optional)</span></FormLabel>
                    <FormControl>
                      <Input placeholder="City, Country" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="profession"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profession or Role</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your profession" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Executive">Executive/C-Level</SelectItem>
                      <SelectItem value="Manager">Manager/Team Lead</SelectItem>
                      <SelectItem value="Professional">Professional</SelectItem>
                      <SelectItem value="Entrepreneur">Entrepreneur</SelectItem>
                      <SelectItem value="Sales">Sales Professional</SelectItem>
                      <SelectItem value="Marketing">Marketing Professional</SelectItem>
                      <SelectItem value="Engineer">Engineer/Developer</SelectItem>
                      <SelectItem value="Creative">Creative Professional</SelectItem>
                      <SelectItem value="HR">HR Professional</SelectItem>
                      <SelectItem value="Student">Student</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="goals"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What do you want to improve?</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="I want to become more confident in presentations, improve how I handle difficult conversations, etc." 
                      rows={3} 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    This helps us personalize your feedback and recommendations.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full mt-8 py-6 text-lg" 
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Continue"}
            </Button>
          </form>
        </Form>
      </Card>
    </div>
  );
}