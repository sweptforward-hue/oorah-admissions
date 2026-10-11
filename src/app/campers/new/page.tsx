"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/layout/Navbar";
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
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="container mx-auto py-10 px-4 max-w-4xl">
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="border-b border-slate-100 pb-6">
            <CardTitle className="text-2xl text-slate-800">Camper Intake & Registration Form</CardTitle>
            <CardDescription className="text-slate-500">
              Complete the intake sections below to open a dedicated admission workspace. All fields persist directly to Supabase without mock fallbacks.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-8 pt-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-md text-sm">
                  {error}
                </div>
              )}

              {/* SECTION 1: Personal Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">
                  1. Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="firstName" className="text-sm font-medium text-slate-700">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <Input id="firstName" name="firstName" placeholder="e.g. John" required />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="lastName" className="text-sm font-medium text-slate-700">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <Input id="lastName" name="lastName" placeholder="e.g. Smith" required />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="applicationNumber" className="text-sm font-medium text-slate-700">
                      Application Number <span className="text-red-500">*</span>
                    </label>
                    <Input id="applicationNumber" name="applicationNumber" placeholder="e.g. APP-1045" required />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="gender" className="text-sm font-medium text-slate-700">
                      Gender
                    </label>
                    <select
                      id="gender"
                      name="gender"
                      className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="dateOfBirth" className="text-sm font-medium text-slate-700">
                      Date of Birth
                    </label>
                    <Input id="dateOfBirth" name="dateOfBirth" type="date" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="grade" className="text-sm font-medium text-slate-700">
                      Grade
                    </label>
                    <Input id="grade" name="grade" placeholder="e.g. 7th Grade" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="school" className="text-sm font-medium text-slate-700">
                      School / Yeshiva
                    </label>
                    <Input id="school" name="school" placeholder="e.g. Torah Academy" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="session" className="text-sm font-medium text-slate-700">
                      Session Preference
                    </label>
                    <select
                      id="session"
                      name="session"
                      className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    >
                      <option value="">Select Session</option>
                      <option value="Session A">Session A</option>
                      <option value="Session B">Session B</option>
                      <option value="Full Summer">Full Summer</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="city" className="text-sm font-medium text-slate-700">
                      City
                    </label>
                    <Input id="city" name="city" placeholder="e.g. Brooklyn" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="state" className="text-sm font-medium text-slate-700">
                      State
                    </label>
                    <Input id="state" name="state" placeholder="e.g. NY" />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Family Contacts */}
              <div className="space-y-4 pt-2">
                <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">
                  2. Family Contacts
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="fatherName" className="text-sm font-medium text-slate-700">
                      Father&apos;s Full Name
                    </label>
                    <Input id="fatherName" name="fatherName" placeholder="e.g. David Smith" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="fatherPhone" className="text-sm font-medium text-slate-700">
                      Father&apos;s Phone
                    </label>
                    <Input id="fatherPhone" name="fatherPhone" placeholder="e.g. (555) 019-2831" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="motherName" className="text-sm font-medium text-slate-700">
                      Mother&apos;s Full Name
                    </label>
                    <Input id="motherName" name="motherName" placeholder="e.g. Sarah Smith" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="motherPhone" className="text-sm font-medium text-slate-700">
                      Mother&apos;s Phone
                    </label>
                    <Input id="motherPhone" name="motherPhone" placeholder="e.g. (555) 019-2832" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label htmlFor="emergencyContact" className="text-sm font-medium text-slate-700">
                      Emergency Contact (Name & Phone)
                    </label>
                    <Input id="emergencyContact" name="emergencyContact" placeholder="e.g. Uncle Mark - (555) 999-0011" />
                  </div>
                </div>
              </div>

              {/* SECTION 3: Medical Notes & Health Info */}
              <div className="space-y-4 pt-2">
                <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">
                  3. Medical Notes & Health Requirements
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="medicalNotes" className="text-sm font-medium text-slate-700">
                      Medical / Health Notes & Conditions
                    </label>
                    <Textarea
                      id="medicalNotes"
                      name="medicalNotes"
                      placeholder="Specify any medical conditions, medications, or special health requirements..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="allergiesDietary" className="text-sm font-medium text-slate-700">
                      Allergies & Dietary Restrictions
                    </label>
                    <Input
                      id="allergiesDietary"
                      name="allergiesDietary"
                      placeholder="e.g. Peanut allergy, Gluten-free, Kosher L'Mehadrin"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: Intake Questionnaire */}
              <div className="space-y-4 pt-2">
                <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">
                  4. Intake Questionnaire & Admissions Notes
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="behavioralNotes" className="text-sm font-medium text-slate-700">
                      Behavioral, Social & Educational Notes
                    </label>
                    <Textarea
                      id="behavioralNotes"
                      name="behavioralNotes"
                      placeholder="Notes regarding social integration, classroom background, or behavioral observations..."
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="previousCampExp" className="text-sm font-medium text-slate-700">
                        Previous Camp Experience
                      </label>
                      <Input id="previousCampExp" name="previousCampExp" placeholder="e.g. Camp Agudah (2 summers)" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="referralSource" className="text-sm font-medium text-slate-700">
                        Referral Source / How did you hear about us?
                      </label>
                      <Input id="referralSource" name="referralSource" placeholder="e.g. Oorah Outreach Representative" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="notes" className="text-sm font-medium text-slate-700">
                      General Admissions Notes
                    </label>
                    <Textarea
                      id="notes"
                      name="notes"
                      placeholder="Additional notes for admissions committee and VAAD review..."
                      rows={2}
                    />
                  </div>
                </div>
              </div>

            </CardContent>
            <CardFooter className="flex justify-between border-t border-slate-100 pt-6 mt-4 bg-slate-50/50 rounded-b-lg">
              <Button variant="ghost" asChild type="button">
                <Link href="/campers">Cancel</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting} className="px-6">
                {isSubmitting ? "Saving Intake..." : "Complete Intake & Create Workspace"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
