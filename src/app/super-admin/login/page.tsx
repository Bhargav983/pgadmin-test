
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SuperAdminLoginSchema } from "@/lib/schemas";
import { useSuperAuth } from "@/context/super-auth-context"; // Use new context
import { ShieldCheck } from "lucide-react";
import Image from "next/image";

type SuperAdminLoginFormValues = z.infer<typeof SuperAdminLoginSchema>;

export default function SuperAdminLoginPage() {
  const { superAdminLogin } = useSuperAuth(); // Use new context

  const form = useForm<SuperAdminLoginFormValues>({
    resolver: zodResolver(SuperAdminLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: SuperAdminLoginFormValues) => {
    // Dummy credentials for Super Admin
    if (data.email === "super@example.com" && data.password === "superpassword") {
      superAdminLogin("fake-super-admin-auth-token"); // Simulate token
    } else {
      form.setError("root", { message: "Invalid super admin email or password." });
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary/30 via-background to-background p-4">
      <Card className="w-full max-w-md shadow-2xl border-2 border-primary/50">
        <CardHeader className="text-center space-y-2">
           <div className="mx-auto mb-2">
              <Image
                src="https://www.iiiqbets.com/wp-content/uploads/2021/04/png-1.png"
                alt="Logo"
                width={150}
                height={50}
                className="h-full w-full object-contain"
              />
          </div>
          <div className="inline-flex items-center justify-center">
            <ShieldCheck className="h-8 w-8 text-primary mr-2" />
            <CardTitle className="font-headline text-3xl text-primary">Super Admin Login</CardTitle>
          </div>
          <CardDescription>Access the central user management portal.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="super@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {form.formState.errors.root && (
                <p className="text-sm font-medium text-destructive">{form.formState.errors.root.message}</p>
              )}
              <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Signing In..." : "Sign In"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Dummy credentials: super@example.com / superpassword
      </p>
    </div>
  );
}
