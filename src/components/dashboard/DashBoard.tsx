import { clientSelect } from "@/drizzle/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  TableHead
} from "@/components/ui/table";
import { FC } from "react";
import { Button, } from "@/components/ui/button";
import { MoveUpRight } from "lucide-react";

interface DashboardTableProps {
  clients: clientSelect[];
}

export const Dashboard: FC<DashboardTableProps> = ({ clients }) => {
  return (
    <div>
      <Table className="w-full">
        <TableHeader className="bg-transparent">
          <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
            <TableHead className="w-10">S.No</TableHead>
            <TableHead>Client Name</TableHead>
            <TableHead>Client Email</TableHead>
            <TableHead>Client Location</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="[&_td:first-child]:rounded-l-lg [&_td:last-child]:rounded-r-lg">
          {clients.map((client, index) => (
            <TableRow
              key={client.id}
              className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r"
            >
              <TableCell>{index + 1}</TableCell>
              <TableCell>{client.name}</TableCell>
              <TableCell>{client.email}</TableCell>
              <TableCell>{client.address}</TableCell>
              <TableCell>
                <Button variant="outline" size="sm">
                  View<MoveUpRight />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="text-muted-foreground mt-4 text-center text-sm">
        Table with vertical lines
      </p>
    </div>
  );
};
