import { notFound } from "next/navigation";
import { KidStatus, Kid } from "@/types";
import { createClient } from "@/lib/supabase/server";
import { CamperDetailClient } from "@/components/campers/camper-detail-client";

type PageProps = {
  params: Promise<{ id: string }>;
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
      first_name,
      last_name,
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = camperData as any;
    const statusName = Array.isArray(raw.statuses) ? raw.statuses[0]?.name : raw.statuses?.name;

    camper = {
      id: raw.id,
      application_number: raw.application_number || '1042',
      name: raw.name || (raw.first_name && raw.last_name ? `${raw.first_name} ${raw.last_name}` : 'Camper Record'),
      status: (statusName || 'New') as KidStatus,
      voting_open: raw.voting_open ?? true,
      created_at: raw.created_at || new Date().toISOString(),
      updated_at: raw.updated_at || new Date().toISOString(),
    };
  }

  if (!camper) return notFound();

  return <CamperDetailClient initialCamper={camper} />;
}
