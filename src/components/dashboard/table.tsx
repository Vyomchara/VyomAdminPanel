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
        <Table className={"w-full"}>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-10">S.No</TableHead>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Client Email</TableHead>
                    <TableHead>Client Address</TableHead>
                    <TableHead>Act</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {clients.map((client,index)=>{
                    return (
                        <TableRow key={client.id}>
                            <TableCell>{index+1}</TableCell>
                            <TableCell>{client.name}</TableCell>
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