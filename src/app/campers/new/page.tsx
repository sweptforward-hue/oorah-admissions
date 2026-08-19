"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { createCamper } from "./actions";

export default function NewCamperPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await createCamper(formData);

    if (result?.error) {
      setError(result.error);
      setIsSubmitting(false);
    }
    // Note: if successful, it will redirect, so we don't need to reset isSubmitting
  };

  return (
    <div className="container mx-auto py-12 px-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Create New Camper</CardTitle>
          <CardDescription>
            Enter the details to start a new application. A dedicated application workspace will be created automatically.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Camper Name
              </label>
              <Input
                id="name"
                name="name"
                placeholder="e.g. John Smith"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="applicationNumber" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Application Number
              </label>
              <Input
                id="applicationNumber"
                name="applicationNumber"
                placeholder="e.g. 1045"
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="ghost" asChild type="button">
              <Link href="/campers">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Camper"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
