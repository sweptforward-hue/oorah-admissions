import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/layout/Navbar";
import { KidStatus, Kid } from "@/types";
import { createClient } from "@/lib/supabase/server";
import { VoiceNotesTab } from "@/components/kids/voice-notes-tab";
import { PhotoGallery } from "@/components/kids/photo-gallery";
import { DocumentManager } from "@/components/kids/document-manager";

type PageProps = {
  params: Promise<{ id: string }>;
};

const getStatusVariant = (status: string) => {
  switch (status) {
    case "Accepted":
      return "success";
    case "Rejected":
    case "Withdrawn":
      return "destructive";
    case "VAAD Review":
    case "Interview":
    case "Under Review":
      return "warning";
    case "New":
    case "Incomplete":
    default:
      return "secondary";
  }
};

export default async function CamperDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  const supabase = await createClient();

  const { data: camperData, error } = await supabase
    .from('kids')
    .select(`
      id,
      application_number,
      name,
      voting_open,
      created_at,
      updated_at,
      statuses ( name )
    `)
    .eq('id', id)
    .single();

  let camper: Kid | null = null;

  if (error || !camperData) {
    if (process.env.NODE_ENV !== 'production' && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      camper = {
        id,
        application_number: id === "1" ? "1042" : id === "2" ? "1043" : id === "3" ? "1044" : "1045",
        name: id === "1" ? "John Smith" : id === "2" ? "Sarah Cohen" : id === "3" ? "David Levy" : "New Camper",
        status: (id === "1" ? "VAAD Review" : id === "2" ? "Accepted" : id === "3" ? "Incomplete" : "New") as KidStatus,
        voting_open: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    } else {
      notFound();
    }
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = camperData as any;
    const statusName = Array.isArray(raw.statuses) ? raw.statuses[0]?.name : raw.statuses?.name;

    camper = {
      id: raw.id,
      application_number: raw.application_number,
      name: raw.name,
      status: (statusName || 'New') as KidStatus,
      voting_open: raw.voting_open ?? true,
      created_at: raw.created_at,
      updated_at: raw.updated_at,
    };
  }

  if (!camper) return notFound();

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/campers" className="text-sm text-slate-500 hover:text-slate-900 mb-4 inline-block">
            &larr; Back to Admissions
          </Link>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border shadow-sm">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{camper.name}</h1>
                <Badge variant={getStatusVariant(camper.status as string)} className="text-sm px-3 py-1">
                  {camper.status}
                </Badge>
                {camper.voting_open ? (
                  <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">VAAD Open</span>
                ) : (
                  <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-medium">VAAD Closed</span>
                )}
              </div>
              <p className="text-slate-500 mt-1">Application #{camper.application_number}</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline">Change Status</Button>
              <Button variant="outline">Export Data</Button>
            </div>
          </div>
        </div>

        {/* 9 Workstream Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-6 flex flex-wrap justify-start h-auto bg-white p-1 rounded-lg border shadow-sm">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="chat">Chat (@mentions)</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="photos">Photos</TabsTrigger>
            <TabsTrigger value="voice-notes">Voice Notes</TabsTrigger>
            <TabsTrigger value="transcript">Transcript</TabsTrigger>
            <TabsTrigger value="vaad">VAAD Voting</TabsTrigger>
            <TabsTrigger value="contract">Contract</TabsTrigger>
            <TabsTrigger value="activity">Activity & Audit</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Application Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500 block mb-1">Created Date</span>
                        <span className="font-medium">{new Date(camper.created_at).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block mb-1">Last Modified</span>
                        <span className="font-medium">{new Date(camper.updated_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Custom Fields</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-slate-600">
                    <p>Dynamic custom metadata defined by administrators will be populated here.</p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Checklist</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        <span className="text-slate-700">Application Form</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        <span className="text-slate-700">Parent Questionnaire</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-amber-500">⏳</span>
                        <span className="text-slate-700">Official Transcript</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-slate-400">○</span>
                        <span className="text-slate-500">Medical Release & Contract</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Chat with @mentions */}
          <TabsContent value="chat">
            <Card>
              <CardHeader>
                <CardTitle>Internal Team Chat & Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-slate-100 rounded-lg text-sm text-slate-700">
                  <strong>Rabbi Cohen</strong>: <em>@Azriel Cohenca</em> Please review the recommendation letter attached.
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type a note (use @name to mention team members)..."
                    className="flex-1 p-2 border rounded-md text-sm bg-white"
                  />
                  <Button>Send Note</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents / Google Drive */}
          <TabsContent value="documents">
            <DocumentManager kidId={camper.id} />
          </TabsContent>

          {/* Photos */}
          <TabsContent value="photos">
            <PhotoGallery kidId={camper.id} />
          </TabsContent>

          {/* Voice Notes */}
          <TabsContent value="voice-notes">
            <VoiceNotesTab kidId={camper.id} />
          </TabsContent>

          {/* Transcript */}
          <TabsContent value="transcript">
            <Card>
              <CardHeader>
                <CardTitle>Academic Transcripts</CardTitle>
              </CardHeader>
              <CardContent className="p-8 text-center text-slate-500">
                School report cards and transcript files will appear here.
              </CardContent>
            </Card>
          </TabsContent>

          {/* VAAD */}
          <TabsContent value="vaad">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>VAAD Admissions Voting</CardTitle>
                <Button variant="outline" size="sm">
                  {camper.voting_open ? 'Close Voting' : 'Reopen Voting'}
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm font-semibold text-amber-900">Current Status: VAAD Review (1 of 2 required Accepts recorded)</p>
                </div>

                <div className="flex gap-3">
                  <Button className="bg-green-600 hover:bg-green-700 text-white">Vote Accept</Button>
                  <Button className="bg-red-600 hover:bg-red-700 text-white">Vote Reject</Button>
                  <Button variant="outline">Vote Abstain</Button>
                  <Button variant="outline">Request Interview</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contract */}
          <TabsContent value="contract">
            <Card>
              <CardHeader>
                <CardTitle>Camper Contract & E-Signature</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border border-slate-200 p-6 rounded-lg bg-slate-50 text-center">
                  <p className="text-sm text-slate-600 mb-4">Official Season Enrollment Contract</p>
                  <div className="flex justify-center gap-3">
                    <Button>Generate Contract PDF</Button>
                    <Button variant="outline">Upload Signed Copy</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity */}
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Full Audit History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-xs text-slate-600 border-b pb-2">
                  <span className="font-semibold">Status changed to VAAD Review</span> by Admissions Staff — Today
                </div>
                <div className="text-xs text-slate-600 border-b pb-2">
                  <span className="font-semibold">Application created</span> (App #{camper.application_number}) — {new Date(camper.created_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
