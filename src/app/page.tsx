import { useState, useEffect } from "react";
import Image from "next/image";
import { AddClientDialog } from "@/components/dashboard/addClient";
import Component1 from "@/components/ui/originui/comp-485";
import { clientSelect } from "@/drizzle/schema";
import { ClientService } from "@/services/client";
import { ModeToggle } from "@/components/ui/ModeToggle";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";

// Mark as async server component
async function getData() {
  const serviceMethods = new ClientService();
  return await serviceMethods.getAllClient(20, true);
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
        <Component1 clients={clients} />
      </section>
      <div className="absolute bottom-4 right-4">
      </div>
    </div>
  );
}
