
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/context/theme-context";
import { Cog, Sun, Moon, Laptop, Bell, Database, Mail, Save } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EmailConfigSchema } from "@/lib/schemas";
import type { EmailConfigFormValues } from "@/lib/types";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

const EMAIL_CONFIG_STORAGE_KEY = 'pgAdminEmailConfig';

export default function SettingsPage() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { toast } = useToast();

  const themeOptions = [
    { name: "Light", value: "light", icon: Sun },
    { name: "Dark", value: "dark", icon: Moon },
    { name: "System", value: "system", icon: Laptop },
  ] as const;

  const emailConfigForm = useForm<EmailConfigFormValues>({
    resolver: zodResolver(EmailConfigSchema),
    defaultValues: {
      emailBackend: 'smtp',
      emailHost: '',
      emailPort: 587,
      emailUseTls: true,
      emailHostUser: '',
      emailHostPassword: '',
      defaultFromEmail: '',
    },
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedEmailConfig = localStorage.getItem(EMAIL_CONFIG_STORAGE_KEY);
      if (storedEmailConfig) {
        try {
          const parsedConfig = JSON.parse(storedEmailConfig);
          emailConfigForm.reset(parsedConfig);
        } catch (e) {
          console.error("Failed to parse email config from localStorage", e);
        }
      }
    }
  }, [emailConfigForm]);

  const handleSaveEmailConfig = (values: EmailConfigFormValues) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(EMAIL_CONFIG_STORAGE_KEY, JSON.stringify(values));
      toast({
        title: "Email Configuration Saved",
        description: "Your email settings have been updated locally.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Cog className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-headline font-semibold">Application Settings</h1>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="data">Data Management</TabsTrigger>
          <TabsTrigger value="email">Email Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card className="shadow-lg mt-4">
            <CardHeader>
              <CardTitle className="font-headline flex items-center"><Laptop className="mr-2 h-5 w-5 text-accent" />Theme Settings</CardTitle>
              <CardDescription>
                Select your preferred application theme. System will match your OS preference.
                Current resolved theme: <span className="font-medium capitalize">{resolvedTheme}</span>.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2 rounded-md bg-muted p-1 w-fit">
                {themeOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={theme === option.value ? "default" : "ghost"}
                    onClick={() => setTheme(option.value)}
                    className={`flex-1 justify-center ${
                      theme === option.value ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'hover:bg-background/80'
                    }`}
                    size="sm"
                  >
                    <option.icon className="mr-2 h-4 w-4" />
                    {option.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="shadow-lg mt-4">
            <CardHeader>
              <CardTitle className="font-headline flex items-center"><Bell className="mr-2 h-5 w-5 text-accent" />Notification Preferences</CardTitle>
              <CardDescription>Manage how you receive notifications from the application.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Notification settings will be available here in a future update.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data">
          <Card className="shadow-lg mt-4">
            <CardHeader>
              <CardTitle className="font-headline flex items-center"><Database className="mr-2 h-5 w-5 text-accent" />Data Management</CardTitle>
              <CardDescription>Options for backing up, restoring, or exporting your application data.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Data management options will be available here in a future update.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <Card className="shadow-lg mt-4">
            <CardHeader>
              <CardTitle className="font-headline flex items-center"><Mail className="mr-2 h-5 w-5 text-accent" />Email Server Configuration</CardTitle>
              <CardDescription>Configure SMTP settings for sending emails. These settings are stored locally in your browser.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...emailConfigForm}>
                <form onSubmit={emailConfigForm.handleSubmit(handleSaveEmailConfig)} className="space-y-6">
                  <FormField
                    control={emailConfigForm.control}
                    name="emailBackend"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Backend</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., django.core.mail.backends.smtp.EmailBackend" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={emailConfigForm.control}
                      name="emailHost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Host</FormLabel>
                          <FormControl>
                            <Input placeholder="smtp.gmail.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={emailConfigForm.control}
                      name="emailPort"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Port</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="587" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={emailConfigForm.control}
                    name="emailUseTls"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Use TLS</FormLabel>
                          <FormDescription>
                            Enable if your SMTP server uses TLS.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={emailConfigForm.control}
                    name="emailHostUser"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Host User</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="yourname@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={emailConfigForm.control}
                    name="emailHostPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Host Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="your_app_password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={emailConfigForm.control}
                    name="defaultFromEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default From Email</FormLabel>
                        <FormControl>
                          <Input placeholder="Your Company <no-reply@yourdomain.com>" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full sm:w-auto bg-primary hover:bg-primary/90">
                    <Save className="mr-2 h-4 w-4" /> Save Email Configuration
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
