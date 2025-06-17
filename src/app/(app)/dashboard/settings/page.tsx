
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/context/theme-context";
import { Cog, Sun, Moon, Laptop, Bell, Database, Mail } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SettingsPage() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const themeOptions = [
    { name: "Light", value: "light", icon: Sun },
    { name: "Dark", value: "dark", icon: Moon },
    { name: "System", value: "system", icon: Laptop },
  ] as const;

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
              {/* Placeholder for notification settings UI */}
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
              {/* Placeholder for data management UI */}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <Card className="shadow-lg mt-4">
            <CardHeader>
              <CardTitle className="font-headline flex items-center"><Mail className="mr-2 h-5 w-5 text-accent" />Email Configuration</CardTitle>
              <CardDescription>Configure settings for sending emails from the application (e.g., for alerts or reports).</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Email configuration settings will be available here in a future update.</p>
              {/* Placeholder for email configuration UI */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
