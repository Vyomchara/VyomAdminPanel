import { clientSelect } from "@/drizzle/schema";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
    TableHeader,
    TableRow,
    TableHead
} from "../ui/table";
import { FC } from "react";
import { Button } from "../ui/button";

interface DashboardTableProps{
    clients:clientSelect[]
}

export const DashboardTable :FC<DashboardTableProps> = ({clients})=>{
    return (
        <Table className={"w-full bg-[#0C0A09]"}>
            <TableHeader className="" >
                <TableRow className="*:border-border [&>:not(:last-child)]:border-r" >
                    <TableHead className="w-10">S.No</TableHead>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Client Email</TableHead>
                    <TableHead>Client Address</TableHead>
                    <TableHead>Act</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody  className="[&_td:first-child]:rounded-l-lg " >
                {clients.map((client,index)=>{
                    return (
                        <TableRow key={client.id}  className="*:border-border  [&>:not(:last-child)]:border-r"
                         >
                            <TableCell className="p-4" >{index+1}</TableCell>
                            <TableCell className="font-medium" >{client.name}</TableCell>
                            <TableCell>{client.email}</TableCell>
                            <TableCell>{client.address}</TableCell>
                            <TableCell>
                                <Button variant="outline"size="sm">
                                    view
                                </Button>
                            </TableCell>
                        </TableRow>
                    )
                })}
            </TableBody>
        </Table>
    )
}