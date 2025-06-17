
"use client";

import React from 'react';
import { AnnouncementForm } from './announcement-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Megaphone } from 'lucide-react';

export default function AnnouncementsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-headline font-semibold flex items-center">
          <Megaphone className="mr-3 h-8 w-8 text-primary" />
          Send Announcements
        </h1>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Compose and Send Message</CardTitle>
          <CardDescription>
            Create an announcement to be sent to residents. Email sending is simulated and will be logged to the console.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AnnouncementForm />
        </CardContent>
      </Card>
    </div>
  );
}
