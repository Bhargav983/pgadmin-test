"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cog } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-headline font-semibold">Settings</h1>
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center space-x-2">
          <Cog className="h-6 w-6 text-primary" />
          <CardTitle className="font-headline">Application Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Settings page is under construction. You'll be able to configure application preferences here.
          </p>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Theme</h3>
              <p className="text-sm text-muted-foreground">Customize application appearance (Light/Dark mode toggle coming soon).</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Notifications</h3>
              <p className="text-sm text-muted-foreground">Manage your notification preferences.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Data Management</h3>
              <p className="text-sm text-muted-foreground">Options for data backup and export (placeholder).</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
