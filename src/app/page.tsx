import { useState, useEffect } from "react";
import Image from "next/image";
import { AddClientDialog } from "@/components/dashboard/addClient";
import { clientSelect } from "@/drizzle/schema";
import { ClientService } from "@/services/client";
import { ModeToggle } from "@/components/ui/ModeToggle";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { Table } from "@/components/dashboard/Table"; // Update import to use named import

const serviceMethods = new ClientService();

async function getData() {
  // Remove the limit parameter (20) to get all clients
  // Keep reverse=true to maintain newest-first ordering
  return await serviceMethods.getAllClient(undefined, true);
}

export default async function Home() {
  const clients = await getData();

  return (
    <div className="p-8">
      {/* Header with Logo */}
      <header className="flex justify-between items-center mb-8">
        <div className="text-xl font-bold">Your Logo</div>
        <ModeToggle />
      </header>

      {/* Main Content: Clients Table */}
      <section>
        <Table clients={clients} />
      </section>
      <div className="absolute bottom-4 right-4">
      </div>
    </div>
  );
}
