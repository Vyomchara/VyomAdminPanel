import Image from "next/image";
import { AddClientDialog } from "@/components/dashboard/addClient";
import { DashboardTable } from "@/components/dashboard/table";
import { clientSelect } from "@/drizzle/schema";
import { ClientService } from "@/services/client";

const serviceMethods = new ClientService()

const clients:clientSelect[] = await serviceMethods.getAllClient(5,true)

export default function Home() {
  return (
    <div className="p-8">
      {/* Header with Logo and Add Client Button */}
      <header className="flex justify-between items-center mb-8">
        <div className="text-xl font-bold">Your Logo</div>
        {/* AddClientDialog wraps the button and manages its state */}
        <AddClientDialog />
      </header>

      {/* Main Content: Clients Table */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Recent Clients</h2>
        <DashboardTable clients={clients} />
      </section>
    </div>
  );
}
