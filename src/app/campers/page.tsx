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

const PAGE_SIZE = 10;

const getStatusVariant = (status: string) => {
  switch (status) {
    case "Accepted":
    case "Enrolled":
      return "success";
    case "Rejected":
    case "Withdrawn":
      return "destructive";
    case "VAAD Review":
    case "Interview":
    case "Under Review":
    case "Contract Sent":
      return "warning";
    case "New":
    case "Incomplete":
    case "Pending":
    default:
      return "secondary";
  }
};

type SearchParams = Promise<{
  query?: string;
  session?: string;
  status?: string;
  page?: string;
}>;

interface PageProps {
  searchParams?: SearchParams;
}

export default async function CampersDashboard({ searchParams }: PageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const query = (resolvedSearchParams.query || "").trim();
  const sessionFilter = resolvedSearchParams.session || "All";
  const statusFilter = resolvedSearchParams.status || "All";
  const page = Math.max(1, parseInt(resolvedSearchParams.page || "1", 10));

  let campers: (Kid & { session?: string })[] = [];
  let totalCount = 0;
  let statusOptions: string[] = [];

  try {
    const supabase = await createClient();

    // Fetch unique status names for the filter dropdown
    const { data: statusesData } = await supabase.from("statuses").select("name").order("name");
    if (statusesData) {
      statusOptions = statusesData.map((s) => s.name);
    }

    // Build query for campers
    const hasStatusFilter = statusFilter !== "All" && statusFilter !== "";
    const selectQuery = hasStatusFilter
      ? "id, application_number, name, first_name, last_name, session, created_at, updated_at, statuses!inner(name)"
      : "id, application_number, name, first_name, last_name, session, created_at, updated_at, statuses(name)";

    let dbQuery = supabase
      .from("kids")
      .select(selectQuery, { count: "exact" });

    if (query) {
      // Escape special characters in query string for ilike pattern
      const safeQuery = query.replace(/[%_]/g, "\\$&");
      dbQuery = dbQuery.or(
        `name.ilike.%${safeQuery}%,first_name.ilike.%${safeQuery}%,last_name.ilike.%${safeQuery}%,application_number.ilike.%${safeQuery}%`
      );
    }

    if (sessionFilter !== "All" && sessionFilter !== "") {
      dbQuery = dbQuery.eq("session", sessionFilter);
    }

    if (hasStatusFilter) {
      dbQuery = dbQuery.eq("statuses.name", statusFilter);
    }

    const offset = (page - 1) * PAGE_SIZE;
    const { data: campersData, count, error } = await dbQuery
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (!error && campersData) {
      totalCount = count ?? campersData.length;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      campers = campersData.map((c: any) => {
        const rawStatus = c.statuses;
        const statusName = Array.isArray(rawStatus)
          ? rawStatus[0]?.name
          : rawStatus?.name;
        const fullName =
          c.name ||
          (c.first_name && c.last_name
            ? `${c.first_name} ${c.last_name}`
            : "Camper Record");

        return {
          id: c.id,
          application_number: c.application_number || "N/A",
          name: fullName,
          status: (statusName || "New") as KidStatus,
          session: c.session || "Unassigned",
          created_at: c.created_at,
          updated_at: c.updated_at,
          last_activity: new Date(c.updated_at || c.created_at).toLocaleDateString(),
        };
      });
    }
  } catch (err) {
    console.error("Failed to fetch campers roster:", err);
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;

  const buildUrl = (newParams: { query?: string; session?: string; status?: string; page?: number }) => {
    const q = newParams.query !== undefined ? newParams.query : query;
    const s = newParams.session !== undefined ? newParams.session : sessionFilter;
    const st = newParams.status !== undefined ? newParams.status : statusFilter;
    const p = newParams.page !== undefined ? newParams.page : page;

    const params = new URLSearchParams();
    if (q) params.set("query", q);
    if (s && s !== "All") params.set("session", s);
    if (st && st !== "All") params.set("status", st);
    if (p > 1) params.set("page", p.toString());

    const str = params.toString();
    return `/campers${str ? `?${str}` : ""}`;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Campers Roster & Admissions</h1>
            <p className="text-slate-500 mt-1">Manage and evaluate all applicant profiles</p>
          </div>
          <Button asChild>
            <Link href="/campers/new">+ New Kid</Link>
          </Button>
        </div>

        {/* Search & Filters Bar */}
        <form method="GET" action="/campers" className="bg-white p-4 rounded-md border shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          <div className="flex flex-1 flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                type="search"
                id="camper-roster-search"
                name="query"
                aria-label="Search campers roster"
                placeholder="Search by name or app #..."
                defaultValue={query}
                className="bg-white"
              />
            </div>

            <div className="w-full sm:w-44">
              <select
                name="session"
                aria-label="Filter by session"
                defaultValue={sessionFilter}
                className="w-full h-10 px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-950"
              >
                <option value="All">All Sessions</option>
                <option value="Session A">Session A</option>
                <option value="Session B">Session B</option>
                <option value="Full Summer">Full Summer</option>
              </select>
            </div>

            <div className="w-full sm:w-44">
              <select
                name="status"
                aria-label="Filter by status"
                defaultValue={statusFilter}
                className="w-full h-10 px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-950"
              >
                <option value="All">All Statuses</option>
                {statusOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <Button type="submit" variant="default" size="sm">
              Filter
            </Button>
            {(query || sessionFilter !== "All" || statusFilter !== "All" || page > 1) && (
              <Button asChild variant="outline" size="sm">
                <Link href="/campers">Clear</Link>
              </Button>
            )}
          </div>
        </form>

        {/* Campers Table */}
        <div className="rounded-md border bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Kid Name</TableHead>
                <TableHead>App #</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Session</TableHead>
                <TableHead className="text-right">Activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                    {query || sessionFilter !== "All" || statusFilter !== "All"
                      ? "No campers found matching your filter criteria."
                      : "No campers registered yet."}
                  </TableCell>
                </TableRow>
              ) : (
                campers.map((camper) => (
                  <TableRow key={camper.id} className="cursor-pointer group hover:bg-slate-50">
                    <TableCell className="font-medium text-slate-900">
                      <Link href={`/campers/${camper.id}`} className="block hover:underline">
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
                    <TableCell className="text-slate-600">
                      <Link href={`/campers/${camper.id}`} className="block">
                        {camper.session}
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

          {/* Pagination Controls */}
          {totalCount > 0 && (
            <div className="p-4 border-t flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
              <div>
                Showing <span className="font-medium text-slate-700">{(page - 1) * PAGE_SIZE + 1}</span> to{" "}
                <span className="font-medium text-slate-700">{Math.min(page * PAGE_SIZE, totalCount)}</span> of{" "}
                <span className="font-medium text-slate-700">{totalCount}</span> campers
              </div>

              <div className="flex items-center gap-2">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                >
                  <Link href={buildUrl({ page: page - 1 })}>Previous</Link>
                </Button>

                <span className="px-2 font-medium text-slate-700">
                  Page {page} of {totalPages}
                </span>

                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
                >
                  <Link href={buildUrl({ page: page + 1 })}>Next</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
