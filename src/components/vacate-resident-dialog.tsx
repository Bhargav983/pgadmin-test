
"use client";

import React, { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, UserX } from "lucide-react";
import { VacateResidentSchema } from "@/lib/schemas";
import type { VacateResidentFormValues } from "@/lib/types";

interface VacateResidentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: VacateResidentFormValues) => void;
  residentName: string;
  hasDues: boolean;
  duesAmount: number;
}

export function VacateResidentDialog({
  isOpen,
  onClose,
  onSubmit,
  residentName,
  hasDues,
  duesAmount,
}: VacateResidentDialogProps) {
  const form = useForm<VacateResidentFormValues>({
    resolver: zodResolver(VacateResidentSchema),
    defaultValues: {
      reasonForLeaving: "",
      confirmNoDues: !hasDues, // Pre-check if no dues detected
      confirmNoClaims: false,
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        reasonForLeaving: "",
        confirmNoDues: !hasDues,
        confirmNoClaims: false,
      });
    }
  }, [isOpen, hasDues, form]);

  const handleFormSubmit = (values: VacateResidentFormValues) => {
    if (hasDues) {
        // This case should ideally be prevented by disabling the submit button,
        // but as a safeguard:
        alert("Cannot vacate resident with outstanding dues.");
        return;
    }
    onSubmit(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center">
            <UserX className="mr-2 h-5 w-5 text-orange-500" /> Vacate Resident: {residentName}
          </DialogTitle>
          <DialogDescription>
            Complete the details below to vacate the resident. This action will change their status to 'Former' and unassign them from their room.
          </DialogDescription>
        </DialogHeader>

        {hasDues && (
          <Alert variant="destructive" className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Outstanding Dues!</AlertTitle>
            <AlertDescription>
              This resident has outstanding dues of <strong>₹{duesAmount.toLocaleString()}</strong>.
              Please clear all pending payments using the 'Record Payment' feature before vacating.
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="reasonForLeaving"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Leaving</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Completed studies, Relocating, etc."
                      {...field}
                      disabled={hasDues}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmNoDues"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={hasDues || !hasDues} // Always disabled if dues, or reflects no dues
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Confirm all financial dues are cleared
                    </FormLabel>
                    {hasDues ? (
                        <FormDescription className="text-destructive">
                            Cannot confirm, dues of ₹{duesAmount.toLocaleString()} exist.
                        </FormDescription>
                    ) : (
                        <FormDescription>
                            No outstanding dues detected for this resident.
                        </FormDescription>
                    )}
                  </div>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="confirmNoClaims"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={hasDues}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Confirm no pending claims or damages
                    </FormLabel>
                     <FormDescription>
                        Ensure all belongings are cleared and there are no damages to the room or PG property.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={form.formState.isSubmitting || hasDues || !form.watch("confirmNoClaims") || !form.watch("confirmNoDues")}
              >
                {form.formState.isSubmitting ? "Processing..." : "Proceed to Vacate"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
