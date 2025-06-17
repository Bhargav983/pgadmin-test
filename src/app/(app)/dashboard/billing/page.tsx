"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BadgeDollarSign, Receipt } from "lucide-react";
import Image from "next/image";

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-headline font-semibold">Billing &amp; Payments</h1>
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center space-x-2">
          <BadgeDollarSign className="h-6 w-6 text-primary" />
          <CardTitle className="font-headline">Billing Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            This section is under construction. Future features will include tracking payments, generating invoices, and managing billing cycles for residents.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Payments</CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹0.00</div>
                <p className="text-xs text-muted-foreground">
                  No upcoming payments scheduled
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue Payments</CardTitle>
                 <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">₹0.00</div>
                <p className="text-xs text-muted-foreground">
                  No overdue payments
                </p>
              </CardContent>
            </Card>
          </div>
           <div className="mt-8 p-6 border rounded-lg bg-secondary/50 flex flex-col items-center text-center">
            <Image src="https://placehold.co/300x200.png" alt="Billing illustration" width={300} height={200} className="rounded-md mb-4" data-ai-hint="payment illustration" />
            <h3 className="text-xl font-semibold mb-2">Automated Billing Coming Soon!</h3>
            <p className="text-muted-foreground max-w-md">
              We are working hard to bring you a comprehensive billing system to streamline your PG management. Stay tuned for updates!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
