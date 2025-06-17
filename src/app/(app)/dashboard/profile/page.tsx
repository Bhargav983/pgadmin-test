
"use client";

import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { ProfileInfoSchema, ChangePasswordSchema } from "@/lib/schemas";
import type { ProfileInfoFormValues, ChangePasswordFormValues } from "@/lib/types";
import { UserCircle, KeyRound, UploadCloud, Save, Image as ImageIcon, Mail, User } from "lucide-react";
import NextImage from "next/image"; // Using NextImage for preview

const MAX_FILE_SIZE_MB = 2;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export default function ProfilePage() {
  const { toast } = useToast();
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // --- Profile Information Form ---
  const profileForm = useForm<ProfileInfoFormValues>({
    resolver: zodResolver(ProfileInfoSchema),
    defaultValues: {
      name: "Admin User", // Static default
      email: "admin@example.com", // Static default, make it read-only in form
      photoUrl: null,
    },
  });

  const handlePhotoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast({
          title: "File too large",
          description: `Please select an image smaller than ${MAX_FILE_SIZE_MB}MB.`,
          variant: "destructive",
        });
        event.target.value = ""; // Clear the input
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file (e.g., JPG, PNG, GIF).",
          variant: "destructive",
        });
        event.target.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
        profileForm.setValue("photoUrl", reader.result as string); // Store Data URI in form
      };
      reader.readAsDataURL(file);
    } else {
      setPhotoPreview(null);
      profileForm.setValue("photoUrl", null);
    }
  };

  const onProfileInfoSubmit = (values: ProfileInfoFormValues) => {
    console.log("Profile Info Submitted (Simulated):", values);
    // In a real app, you would send this to your backend.
    // For photo, you'd typically upload the file object, not the Data URI, or handle Data URI on backend.
    toast({
      title: "Profile Updated",
      description: "Your profile information has been saved (simulated).",
    });
  };

  // --- Change Password Form ---
  const passwordForm = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const onChangePasswordSubmit = (values: ChangePasswordFormValues) => {
    console.log("Change Password Submitted (Simulated):", values);
    // In a real app, you'd send this to your backend for verification and update.
    toast({
      title: "Password Changed",
      description: "Your password has been updated (simulated).",
    });
    passwordForm.reset(); // Clear form after submission
  };

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex items-center space-x-3">
        <UserCircle className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-headline font-semibold">My Profile</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Information Card */}
        <Card className="lg:col-span-2 shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline flex items-center"><User className="mr-2 h-5 w-5 text-accent"/>Profile Information</CardTitle>
            <CardDescription>Manage your personal details and profile picture.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onProfileInfoSubmit)} className="space-y-6">
                <div className="flex flex-col items-center space-y-4 mb-6">
                  <Avatar className="h-32 w-32 border-2 border-primary shadow-md">
                    <AvatarImage src={photoPreview || "https://placehold.co/128x128.png"} alt="Admin Photo" data-ai-hint="person avatar" />
                    <AvatarFallback className="text-3xl">AD</AvatarFallback>
                  </Avatar>
                  <FormField
                    control={profileForm.control}
                    name="photoUrl"
                    render={() => ( // field is not directly used for input display, but for validation
                      <FormItem className="w-full max-w-xs">
                        <FormLabel htmlFor="photoUpload" className="sr-only">Upload new photo</FormLabel>
                        <FormControl>
                           <Input
                            id="photoUpload"
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoFileChange}
                            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                          />
                        </FormControl>
                        <FormDescription className="text-center text-xs">Max {MAX_FILE_SIZE_MB}MB. JPG, PNG, GIF.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={profileForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your full name" {...field} />
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
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="your.email@example.com" {...field} readOnly disabled className="cursor-not-allowed bg-muted/50" />
                      </FormControl>
                      <FormDescription>Email address cannot be changed.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full sm:w-auto bg-primary hover:bg-primary/90" disabled={profileForm.formState.isSubmitting}>
                  <Save className="mr-2 h-4 w-4" /> {profileForm.formState.isSubmitting ? "Saving..." : "Save Profile Changes"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Change Password Card */}
        <Card className="lg:col-span-1 shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline flex items-center"><KeyRound className="mr-2 h-5 w-5 text-accent"/>Change Password</CardTitle>
            <CardDescription>Update your account password.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(onChangePasswordSubmit)} className="space-y-6">
                <FormField
                  control={passwordForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormDescription className="text-xs">Leave blank for this simulation if not testing validation.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="confirmNewPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full sm:w-auto bg-primary hover:bg-primary/90" disabled={passwordForm.formState.isSubmitting}>
                  <Save className="mr-2 h-4 w-4" /> {passwordForm.formState.isSubmitting ? "Updating..." : "Update Password"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
