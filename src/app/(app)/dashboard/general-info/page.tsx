
"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, Phone, Info } from "lucide-react";
import type { Holiday, ImportantContact } from "@/lib/types";

// Sample static data - in a real app, this might come from an API or be configurable
const sampleHolidays: Holiday[] = [
  { id: "1", date: "Jan 01", reason: "New Year's Day" },
  { id: "2", date: "Jan 26", reason: "Republic Day" },
  { id: "3", date: "Aug 15", reason: "Independence Day" },
  { id: "4", date: "Oct 02", reason: "Gandhi Jayanti" },
  { id: "5", date: "Dec 25", reason: "Christmas" },
  // Add more PG-specific or local holidays
];

const sampleContacts: ImportantContact[] = [
  { id: "1", service: "Plumber", name: "Ramesh Kumar", contactNumber: "9876543210" },
  { id: "2", service: "Electrician", name: "Suresh Singh", contactNumber: "9876543211" },
  { id: "3", service: "Cook/Canteen", name: "Anita Devi", contactNumber: "9876543212" },
  { id: "4", service: "Security Guard", name: "Mohan Lal", contactNumber: "9876543213" },
  { id: "5", service: "PG Manager", name: "Admin", contactNumber: "9999988888" },
];

export default function GeneralInfoPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Info className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-headline font-semibold">General Information</h1>
      </div>

      <Tabs defaultValue="holidays" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="holidays">
            <CalendarDays className="mr-2 h-4 w-4" /> Holiday List
          </TabsTrigger>
          <TabsTrigger value="contacts">
            <Phone className="mr-2 h-4 w-4" /> Important Contacts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="holidays">
          <Card className="shadow-lg mt-4">
            <CardHeader>
              <CardTitle className="font-headline">Holiday List</CardTitle>
              <CardDescription>Upcoming holidays and PG non-working days for the current year.</CardDescription>
            </CardHeader>
            <CardContent>
              {sampleHolidays.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">S.No.</TableHead>
                      <TableHead>Month-Date</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sampleHolidays.map((holiday, index) => (
                      <TableRow key={holiday.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{holiday.date}</TableCell>
                        <TableCell>{holiday.reason}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground">No holidays listed at the moment.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts">
          <Card className="shadow-lg mt-4">
            <CardHeader>
              <CardTitle className="font-headline">Important Contacts</CardTitle>
              <CardDescription>Key contact numbers for various services and emergencies.</CardDescription>
            </CardHeader>
            <CardContent>
              {sampleContacts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact Number</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sampleContacts.map((contact) => (
                      <TableRow key={contact.id}>
                        <TableCell className="font-medium">{contact.service}</TableCell>
                        <TableCell>{contact.name || "-"}</TableCell>
                        <TableCell>{contact.contactNumber}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground">No important contacts listed.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
