"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { User } from "next-auth";
import { saveCustomerProfile, updateUserInfo } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

interface ProfileFormProps {
  user: User;
  customerProfile: any | null;
}

// Schema for user information
const userSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
});

// Schema for customer profile
const customerSchema = z.object({
  phone: z.string().optional(),
  address: z.string().optional(),
  hostel: z.string().optional(),
  room: z.string().optional(),
  college: z.string().optional(),
});

export function ProfileForm({ user, customerProfile }: ProfileFormProps) {
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [isUpdatingCustomer, setIsUpdatingCustomer] = useState(false);

  // Form for user information
  const userForm = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: user.name || "",
      email: user.email || "",
    },
  });

  // Form for customer profile
  const customerForm = useForm<z.infer<typeof customerSchema>>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      phone: customerProfile?.phone || "",
      address: customerProfile?.address || "",
      hostel: customerProfile?.hostel || "",
      room: customerProfile?.room || "",
      college: customerProfile?.college || "",
    },
  });

  // Handle user information update
  const onUserSubmit = async (data: z.infer<typeof userSchema>) => {
    setIsUpdatingUser(true);

    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("email", data.email);

      const result = await updateUserInfo(formData);

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Profile Updated",
          description: "Your profile information has been updated successfully.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingUser(false);
    }
  };

  // Handle customer profile update
  const onCustomerSubmit = async (data: z.infer<typeof customerSchema>) => {
    setIsUpdatingCustomer(true);

    try {
      const formData = new FormData();
      if (data.phone) formData.append("phone", data.phone);
      if (data.address) formData.append("address", data.address);
      if (data.hostel) formData.append("hostel", data.hostel);
      if (data.room) formData.append("room", data.room);
      if (data.college) formData.append("college", data.college);

      const result = await saveCustomerProfile(formData);

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Profile Updated",
          description: "Your customer profile has been updated successfully.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingCustomer(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Basic User Information */}
      <div>
        <h3 className="text-lg font-medium mb-4">Basic Information</h3>
        <Form {...userForm}>
          <form
            onSubmit={userForm.handleSubmit(onUserSubmit)}
            className="space-y-4"
          >
            <FormField
              control={userForm.control}
              name="name"
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
              control={userForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isUpdatingUser}>
              {isUpdatingUser ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Basic Information"
              )}
            </Button>
          </form>
        </Form>
      </div>

      {/* Additional Customer Profile Information */}
      <div>
        <h3 className="text-lg font-medium mb-4">Contact & Address Information</h3>
        <Form {...customerForm}>
          <form
            onSubmit={customerForm.handleSubmit(onCustomerSubmit)}
            className="space-y-4"
          >
            <FormField
              control={customerForm.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={customerForm.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={customerForm.control}
                name="hostel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hostel</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={customerForm.control}
                name="room"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room Number</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={customerForm.control}
              name="college"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>College/Department</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isUpdatingCustomer}>
              {isUpdatingCustomer ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Contact Information"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
} 