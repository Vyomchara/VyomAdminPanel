import { getClientDetails } from "@/app/action"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Server, Mail, MapPin } from "lucide-react"
import Link from "next/link"
import { DroneTable } from "./DroneTable"
import { notFound } from "next/navigation"

function SummaryDashboard({ client, droneAssignments }: { client: any, droneAssignments: any }) {
  return (
    <div>
      {/* Client Information Section - More compact */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Client Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="col-span-1">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div>
                  <div className="flex items-center mb-2">
                    <Server className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">VM IP:</span>
                  </div>
                  <p className="text-sm font-medium">{client?.vm_ip || 'Not Set'}</p>
                </div>
                
                {/* VM Password */}
                <div>
                  <div className="flex items-center mb-2">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      className="h-4 w-4 mr-2 text-muted-foreground"
                    >
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <span className="text-sm text-muted-foreground">VM Password:</span>
                  </div>
                  <p className="text-sm font-medium">{client?.vm_password || 'Not Set'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="col-span-1">
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Email:</span>
                  <span className="ml-2 text-sm truncate" title={client?.email}>
                    {client?.email}
                  </span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Address:</span>
                  <span className="ml-2 text-sm truncate" title={client?.address}>
                    {client?.address}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Drones Section */}
      <div>
        <h2 className="text-xl font-bold mb-4">Assigned Drones</h2>
        {droneAssignments && droneAssignments.length > 0 ? (
          <DroneTable assignments={droneAssignments} />
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No drones assigned to this client
          </div>
        )}
      </div>
    </div>
  )
}

export default async function ClientPage({
  searchParams,
}: {
  searchParams: { id: string }
}) {
  const { id } = searchParams
  if (!id) notFound()

  const result = await getClientDetails(id)
  
  if (!result.success || !result.data) notFound()
  
  const client = result.data

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Client Details</h1>
        <Link href="/">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>

      <div className="space-y-6">
        <div className="grid gap-2">
          <h3 className="font-medium">Name</h3>
          <p className="text-muted-foreground">{client.name}</p>
        </div>

        <div className="grid gap-2">
          <h3 className="font-medium">Email</h3>
          <p className="text-muted-foreground">{client.email}</p>
        </div>

        <div className="grid gap-2">
          <h3 className="font-medium">Address</h3>
          <p className="text-muted-foreground">{client.address}</p>
        </div>

        <div className="grid gap-2">
          <h3 className="font-medium">Created At</h3>
          <p className="text-muted-foreground">
            {new Date(client.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  )
}