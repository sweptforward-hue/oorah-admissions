import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/layout/Navbar";
import { Kid, KidStatus } from "@/types";
import { createClient } from "@/lib/supabase/server";

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

export default async function CampersDashboard() {
  const supabase = await createClient();

  // Fetch kids with their status
  const { data: campersData, error } = await supabase
    .from('kids')
    .select(`
      id,
      application_number,
      name,
      created_at,
      updated_at,
      statuses ( name )
    `)
    .order('created_at', { ascending: false });

  // Map to the Kid interface matching our UI needs
  let campers: Kid[] = [];

  if (!error && campersData) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    campers = (campersData as any[]).map((c: any) => {
      const statusName = Array.isArray(c.statuses) ? c.statuses[0]?.name : c.statuses?.name;
      return {
        id: c.id,
        application_number: c.application_number,
        name: c.name,
        status: (statusName || 'New') as KidStatus,
        created_at: c.created_at,
        updated_at: c.updated_at,
        last_activity: new Date(c.updated_at || c.created_at).toLocaleDateString(),
      };
    });
  } else {
    if (process.env.NODE_ENV !== 'production') {
      campers = [
        {
          id: "1",
          application_number: "1042",
          name: "John Smith",
          status: "VAAD Review",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_activity: "Today",
        },
        {
          id: "2",
          application_number: "1043",
          name: "Sarah Cohen",
          status: "Accepted",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_activity: "Yesterday",
        }
      ];
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Campers Roster & Admissions</h1>
            <p className="text-slate-500 mt-1">Manage and evaluate all applicant profiles</p>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <Input
              type="search"
              placeholder="Search kids..."
              className="max-w-xs bg-white"
            />
            <Button asChild>
              <Link href="/campers/new">+ New Kid</Link>
            </Button>
          </div>
        </div>

        <div className="rounded-md border bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Kid</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-slate-500">
                    No applications yet.
                  </TableCell>
                </TableRow>
              ) : (
                campers.map((camper) => (
                  <TableRow key={camper.id} className="cursor-pointer group hover:bg-slate-50">
                    <TableCell className="font-medium text-slate-900">
                      <Link href={`/campers/${camper.id}`} className="block">
                        {camper.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-slate-500">
                      <Link href={`/campers/${camper.id}`} className="block">
                        {camper.application_number}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/campers/${camper.id}`} className="block">
                        <Badge variant={getStatusVariant(camper.status as string)}>
                          {camper.status}
                        </Badge>
                      </Link>
                    </TableCell>
                    <TableCell className="text-right text-slate-500">
                      <Link href={`/campers/${camper.id}`} className="block">
                        {camper.last_activity}
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
