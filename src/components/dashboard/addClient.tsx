"use client"

import {
    Dialog,
    DialogDescription,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog"

import { Input} from "../ui/input"
import { Button } from "../ui/button"
import { Label } from "../ui/label"
import { useState } from "react"
import {clientCreateAction} from "@/app/action"
import { toast } from "sonner"

export function AddClientDialog(){
    const [clientName,setClientName] = useState("")
    const [clientEmail,setClientEmail] = useState("")
    const [clientAddress,setClientAddress] = useState("")
    const [open, setOpen] = useState(false)

    async function handleSubmit(e:React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const result = await clientCreateAction({
            name:clientName,
            email:clientEmail,
            address: clientAddress
        })
        if (result.success){
            toast.success(result.message)
            setOpen(false)
            setClientName("");
            setClientEmail("");
            setClientAddress("");
        }
        else{
            toast.error(result.message)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">Add Client</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Add New Client</DialogTitle>
                    <DialogDescription>Initialize Client's Onboarding by adding Client's Contact Details to the Platform</DialogDescription>
                </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="client_name" className="text-right">Name</Label>
                              <Input id="client_name" value={clientName} onChange={(e)=>setClientName(e.target.value)} className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="client_email" className="text-right">Email</Label>
                              <Input id="client_email" value={clientEmail} onChange={(e)=>setClientEmail(e.target.value)} className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="client_address" className="text-right">Address</Label>
                              <Input id="client_address" value={clientAddress} onChange={(e)=>setClientAddress(e.target.value)} className="col-span-3" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={()=>{setOpen(false)}}>Cancel</Button>
                            <Button type="submit">Save changes</Button>
                        </DialogFooter>
                    </form>
            </DialogContent>
        </Dialog>
    )
}