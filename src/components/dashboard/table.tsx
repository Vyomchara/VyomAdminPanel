"use client";

import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {

  Table as TableComponent,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ColumnDef,
  ColumnFiltersState,
  FilterFn,
  PaginationState,
  flexRender,
  getCoreRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {

  CircleAlertIcon,
  CircleXIcon,
  EllipsisIcon,
  FilterIcon,
  ListFilterIcon,
  PlusIcon,
  TrashIcon,
  MoveUpRight,
  ChevronDown,
  ChevronUp

} from "lucide-react";
import { clientSelect } from "@/drizzle/schema";
import { AddClientDialog } from "@/components/dashboard/addClient";
import { useEffect, useState, useRef } from "react";

import { useId as useReactId } from "react";
import Link from "next/link";

type Item = clientSelect;

// Custom filter function for multi-column searching
const multiColumnFilterFn: FilterFn<Item> = (row, columnId, filterValue) => {
  const searchableRowContent =
    `${row.original.name} ${row.original.email}`.toLowerCase();
  const searchTerm = (filterValue ?? "").toLowerCase();
  return searchableRowContent.includes(searchTerm);
};

// Add a helper function for text truncation
const truncateText = (text: string, limit: number = 60) => {
  if (text.length <= limit) return text;
  return `${text.slice(0, limit)}...`;
};


// Replace the checkbox column with an S.No. column
const columns: ColumnDef<Item>[] = [
  {
    id: "serialNumber",
    header: "S.No.",
    cell: ({ row }) => (
      <div className="text-center ">
        {row.index + 1}
      </div>
    ),
    size: 40, // Reduced from 60 to 40 pixels
    enableSorting: false,
  },
  {
    header: "Client Name",
    accessorKey: "name",
    cell: ({ row }) => (
      <div className="font-medium truncate" title={row.getValue("name")}>
        {truncateText(row.getValue("name"))}
      </div>
    ),
    size: 180,
    filterFn: multiColumnFilterFn,
    enableSorting: false,
  },
  {
    header: "Client Email",
    accessorKey: "email",
    size: 220,
    enableSorting: false,
    cell: ({ row }) => (
      <div className="truncate" title={row.getValue("email")}>
        {truncateText(row.getValue("email"))}
      </div>
    ),
  },
  {
    header: "Client Address",
    accessorKey: "address",
    cell: ({ row }) => (
      <div className="truncate" title={row.getValue("address")}>
        {truncateText(row.getValue("address"))}
      </div>
    ),
    size: 220,
    enableSorting: false,
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => (
      <Link href={`/client?id=${row.original.id}`}>
        <Button variant="outline" className="items-center" size="sm">
          view<MoveUpRight className="w-5 h-5" />
        </Button>
      </Link>
    ),
    size: 60,
    enableHiding: false,
  },
];


interface TableProps {
  clients: clientSelect[];
}

export function Table({ clients }: TableProps) {
  const id = useId();
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const [showAll, setShowAll] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize data with sorting by created_at
  const [data, setData] = useState<Item[]>(() => {
    const sortedData = [...clients].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return showAll ? sortedData : sortedData.slice(0, 5);
  });

  // Update table configuration to remove pagination
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    state: {
      columnFilters,
    },
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Filter by name or email */}
          <div className="relative">
            <Input
              id={`${id}-input`}
              ref={inputRef}
              className={cn(
                "peer min-w-60 ps-9",
                Boolean(table.getColumn("name")?.getFilterValue()) && "pe-9"
              )}
              value={
                (table.getColumn("name")?.getFilterValue() ?? "") as string
              }
              onChange={(e) =>
                table.getColumn("name")?.setFilterValue(e.target.value)
              }
              placeholder="Filter by name or email..."
              type="text"
              aria-label="Filter by name or email"
            />
            <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
              <ListFilterIcon size={16} aria-hidden="true" />
            </div>
            {Boolean(table.getColumn("name")?.getFilterValue()) && (
              <button
                className="text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md transition-[color,box-shadow] outline-none focus:z-10 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Clear filter"
                onClick={() => {
                  table.getColumn("name")?.setFilterValue("");
                  if (inputRef.current) {
                    inputRef.current.focus();
                  }
                }}
              >
                <CircleXIcon size={16} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <AddClientDialog>
            <Button className="ml-auto" variant="outline">
              <PlusIcon
                className="-ms-1 opacity-60"
                size={16}
                aria-hidden="true"
              />
              Add Client
            </Button>
          </AddClientDialog>
        </div>
      </div>

      {/* Table */}
      <div className="bg-background overflow-hidden rounded-md border">
        <TableComponent className="w-full table-fixed">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="*:border-border [&>:not(:last-child)]:border-r hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: `${header.getSize()}px` }}
                    className="h-11"
                  >
                    {header.isPlaceholder ? null : flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="*:border-border [&>:not(:last-child)]:border-r"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell 
                      key={cell.id} 
                      className={cn(
                        "last:py-0",
                        cell.column.id === "name" && "font-medium"
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </TableComponent>
      </div>


      {/* Replace the entire Pagination section with this */}
      <div className="flex items-center justify-end gap-8">
        <Button
          variant="outline"
          onClick={() => {
            setShowAll(!showAll);
            const sortedData = [...clients].sort((a, b) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            setData(showAll ? sortedData.slice(0, 5) : sortedData);
          }}
          className="text-sm"
        >
          {showAll ? "Show Less" : "See More"}
          {showAll ? 
            <ChevronUp className=" h-4 w-4" /> : 
            <ChevronDown className=" h-4 w-4" />
          }
        </Button>
      </div>
    </div>
  );
}
function useId() {

  return useReactId();
}

