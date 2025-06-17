
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { AnnouncementSchema } from '@/lib/schemas';
import type { AnnouncementFormValues, Resident, RecipientType } from '@/lib/types';
import { Send } from 'lucide-react';

const getStoredData = <T,>(key: string): T[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(key);
  try {
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to parse localStorage data for key:", key, e);
    return [];
  }
};

export function AnnouncementForm() {
  const { toast } = useToast();
  const [activeResidents, setActiveResidents] = useState<Resident[]>([]);

  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(AnnouncementSchema),
    defaultValues: {
      recipientType: 'all',
      specificResidentId: undefined,
      selectedResidentIds: [],
      subject: '',
      body: '',
    },
  });

  const fetchActiveResidents = useCallback(() => {
    const allResidents = getStoredData<Resident>('pgResidents');
    setActiveResidents(allResidents.filter(r => r.status === 'active' && r.email));
  }, []);

  useEffect(() => {
    fetchActiveResidents();
  }, [fetchActiveResidents]);

  const recipientType = form.watch('recipientType');

  const onSubmit = (data: AnnouncementFormValues) => {
    let targetEmails: string[] = [];
    let recipientDescription = "";

    if (data.recipientType === 'all') {
      targetEmails = activeResidents.map(r => r.email);
      recipientDescription = "all active residents";
    } else if (data.recipientType === 'specific' && data.specificResidentId) {
      const resident = activeResidents.find(r => r.id === data.specificResidentId);
      if (resident) {
        targetEmails = [resident.email];
        recipientDescription = `resident ${resident.name}`;
      }
    } else if (data.recipientType === 'selected' && data.selectedResidentIds) {
      targetEmails = activeResidents
        .filter(r => data.selectedResidentIds?.includes(r.id))
        .map(r => r.email);
      recipientDescription = `${data.selectedResidentIds.length} selected resident(s)`;
    }

    if (targetEmails.length === 0) {
      toast({
        title: 'No Recipients',
        description: 'No valid recipients found for this announcement.',
        variant: 'destructive',
      });
      return;
    }
    
    const emailConfig = typeof window !== 'undefined' ? localStorage.getItem('pgAdminEmailConfig') : null;
    let smtpMessage = "No SMTP configuration found in local settings. This email would normally use it.";
    if (emailConfig) {
        try {
            const parsedConfig = JSON.parse(emailConfig);
            smtpMessage = `Email would be sent using configured SMTP host: ${parsedConfig.emailHost}.`;
        } catch (e) {
            smtpMessage = "SMTP configuration found but could not be parsed.";
        }
    }


    console.log("--- ANNOUNCEMENT EMAIL (SIMULATED) ---");
    console.log("Recipients:", targetEmails);
    console.log("Subject:", data.subject);
    console.log("Body:", data.body);
    console.log("SMTP Info:", smtpMessage);
    console.log("--------------------------------------");

    toast({
      title: 'Announcement Prepared',
      description: `Message for ${recipientDescription} logged to console. ${smtpMessage}`,
      duration: 7000,
    });
    form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="recipientType"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Send To:</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={(value) => {
                    field.onChange(value as RecipientType);
                    if (value !== 'specific') form.setValue('specificResidentId', undefined);
                    if (value !== 'selected') form.setValue('selectedResidentIds', []);
                  }}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1 sm:flex-row sm:space-y-0 sm:space-x-4"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="all" />
                    </FormControl>
                    <FormLabel className="font-normal">All Active Residents ({activeResidents.length})</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="specific" />
                    </FormControl>
                    <FormLabel className="font-normal">Specific Resident</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="selected" />
                    </FormControl>
                    <FormLabel className="font-normal">Selected Residents</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {recipientType === 'specific' && (
          <FormField
            control={form.control}
            name="specificResidentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select Specific Resident</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger disabled={activeResidents.length === 0}>
                      <SelectValue placeholder={activeResidents.length > 0 ? "Select a resident" : "No active residents with email"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {activeResidents.map((resident) => (
                      <SelectItem key={resident.id} value={resident.id}>
                        {resident.name} ({resident.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {recipientType === 'selected' && (
          <FormItem>
            <FormLabel>Select Residents</FormLabel>
            {activeResidents.length > 0 ? (
              <ScrollArea className="h-40 w-full rounded-md border p-4">
                {activeResidents.map((resident) => (
                  <FormField
                    key={resident.id}
                    control={form.control}
                    name="selectedResidentIds"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={resident.id}
                          className="flex flex-row items-start space-x-3 space-y-0 mb-2"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(resident.id)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...(field.value || []), resident.id])
                                  : field.onChange(
                                      (field.value || []).filter(
                                        (value) => value !== resident.id
                                      )
                                    );
                              }}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            {resident.name} ({resident.email})
                          </FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
              </ScrollArea>
            ) : (
                <p className="text-sm text-muted-foreground">No active residents with email available for selection.</p>
            )}
             <FormField
                control={form.control}
                name="selectedResidentIds"
                render={() => <FormMessage />} // To show validation message for the array
            />
          </FormItem>
        )}

        <FormField
          control={form.control}
          name="subject"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Holiday Announcement" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="body"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message Body</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Compose your message here..."
                  className="min-h-[150px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90" disabled={form.formState.isSubmitting || (activeResidents.length === 0 && recipientType !== 'specific')}>
           <Send className="mr-2 h-4 w-4" /> {form.formState.isSubmitting ? "Sending..." : "Send Announcement"}
        </Button>
      </form>
    </Form>
  );
}

