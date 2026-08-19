import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KidStatus, Kid } from "@/types";
import { createClient } from "@/lib/supabase/server";

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
      created_at,
      updated_at,
      statuses ( name )
    `)
    .eq('id', id)
    .single();

  let camper: Kid | null = null;

  if (error || !camperData) {
    // If we're not in production, let's mock it for local UI testing
    // without a real database setup. In prod, we'd probably 404.
    if (process.env.NODE_ENV !== 'production' && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      camper = {
        id,
        application_number: id === "1" ? "1042" : id === "2" ? "1043" : id === "3" ? "1044" : "1045",
        name: id === "1" ? "John Smith" : id === "2" ? "Sarah Cohen" : id === "3" ? "David Levy" : "New Camper",
        status: (id === "1" ? "VAAD Review" : id === "2" ? "Accepted" : id === "3" ? "Incomplete" : "New") as KidStatus,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    } else {
      console.error("Camper not found:", error);
      notFound();
    }
  } else {
    camper = {
      id: camperData.id,
      application_number: camperData.application_number,
      name: camperData.name,
      status: camperData.statuses?.name || 'New',
      created_at: camperData.created_at,
      updated_at: camperData.updated_at,
    };
  }

  if (!camper) return notFound();

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <Link href="/campers" className="text-sm text-slate-500 hover:text-slate-900 mb-4 inline-block">
          &larr; Back to Admissions
        </Link>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{camper.name}</h1>
            <p className="text-slate-500 mt-1">Application #{camper.application_number}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 mr-4">
              <span className="text-sm font-medium text-slate-500">Status:</span>
              <Badge variant={getStatusVariant(camper.status as string)} className="text-sm px-3 py-1">
                {camper.status}
              </Badge>
            </div>
            <Button variant="outline">Change Status</Button>
            <Button variant="outline">Export</Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-6 flex flex-wrap justify-start h-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
          <TabsTrigger value="voice-notes">Voice Notes</TabsTrigger>
          <TabsTrigger value="transcript">Transcript</TabsTrigger>
          <TabsTrigger value="vaad">VAAD</TabsTrigger>
          <TabsTrigger value="contract">Contract</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Application Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500 block mb-1">Created Date</span>
                        <span className="font-medium">{new Date(camper.created_at).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block mb-1">Last Activity</span>
                        <span className="font-medium">{new Date(camper.updated_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-slate-500">
                    Activity feed will appear here.
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Status Checklist</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full border bg-slate-100" />
                      <span className="text-slate-500">Application Form</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full border bg-slate-100" />
                      <span className="text-slate-500">Parent Form</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full border bg-slate-100" />
                      <span className="text-slate-500">Transcript</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="chat">
          <Card>
            <CardContent className="py-12 text-center text-slate-500">
              Chat interface would be here.
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mocking other tabs for now */}
        <TabsContent value="documents">
          <Card><CardContent className="py-12 text-center text-slate-500">Documents interface would be here.</CardContent></Card>
        </TabsContent>
        <TabsContent value="photos">
          <Card><CardContent className="py-12 text-center text-slate-500">Photos gallery would be here.</CardContent></Card>
        </TabsContent>
        <TabsContent value="voice-notes">
          <Card><CardContent className="py-12 text-center text-slate-500">Voice Notes player would be here.</CardContent></Card>
        </TabsContent>
        <TabsContent value="transcript">
          <Card><CardContent className="py-12 text-center text-slate-500">Transcript upload and viewer would be here.</CardContent></Card>
        </TabsContent>
        <TabsContent value="vaad">
          <Card><CardContent className="py-12 text-center text-slate-500">VAAD voting interface would be here.</CardContent></Card>
        </TabsContent>

        <TabsContent value="contract">
          <Card>
            <CardHeader>
              <CardTitle>Camper Contract</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="py-8 text-center border-2 border-dashed rounded-md border-slate-200">
                <p className="text-slate-500 mb-4">No contract uploaded yet.</p>
                <Button>Upload Contract</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card><CardContent className="py-12 text-center text-slate-500">Full audit history would be here.</CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
