import { getClientDroneAssignments } from '@/app/action';
import { ClientWrapper } from '@/components/clientDashboard/ClientWrapper';
import { droneAssignmentSelect } from "@/drizzle/schema";

export default async function ClientPage({ params }: { params: { id?: string } }) {
  const clientId = params.id;
  
  // Fetch drone assignments for this client
  let droneAssignments: droneAssignmentSelect[] = [];
  if (clientId) {
    const result = await getClientDroneAssignments(clientId);
    if (result.success) {
      droneAssignments = result.assignments;
    }
  }

  return (
    <ClientWrapper 
      clientId={clientId || ''} 
      initialDroneAssignments={droneAssignments} 
    />
  );
}

