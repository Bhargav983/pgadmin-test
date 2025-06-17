
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/context/theme-context";
import { Cog, Sun, Moon, Laptop } from "lucide-react";

export default function SettingsPage() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const themeOptions = [
    { name: "Light", value: "light", icon: Sun },
    { name: "Dark", value: "dark", icon: Moon },
    { name: "System", value: "system", icon: Laptop },
  ] as const;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-headline font-semibold">Settings</h1>
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center space-x-2">
          <Cog className="h-6 w-6 text-primary" />
          <CardTitle className="font-headline">Application Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Theme</h3>
              <CardDescription className="mb-3">
                Select your preferred application theme. 
                System will match your operating system&apos;s preference.
                Current resolved theme: <span className="font-medium capitalize">{resolvedTheme}</span>.
              </CardDescription>
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
            </div>
            
            <div className="pt-4">
              <h3 className="text-lg font-semibold mb-2">Notifications</h3>
              <p className="text-sm text-muted-foreground">Manage your notification preferences (placeholder).</p>
            </div>
            <div className="pt-4">
              <h3 className="text-lg font-semibold mb-2">Data Management</h3>
              <p className="text-sm text-muted-foreground">Options for data backup and export (placeholder).</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
