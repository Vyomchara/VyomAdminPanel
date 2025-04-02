import { ClientWrapper } from '@/components/clientDashboard/ClientWrapper';

export default function ClientPage({ 
  searchParams 
}: { 
  searchParams: { id: string } 
}) {
  const clientId = searchParams.id;
  
  if (!clientId) {
    console.error("Client page loaded without ID parameter");
    // Maybe add a redirect or error display here
  }
  
  return (
    <ClientWrapper 
      clientId={clientId}
      initialDroneAssignments={[]} // Add this missing required prop
    />
  );
}

