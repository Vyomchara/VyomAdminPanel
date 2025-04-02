"use server"

import { ClientService } from "@/services/client"
import { revalidatePath } from "next/cache"

const serviceMethods = new ClientService()

export async function updateClientVMIPAndPassword(clientId:string, data:{
  vmIp:string,
  vmPassword:string
 }){
  'use server';
  try {
    if (!data.vmIp.trim() || !/^(\d{1,3}\.){3}\d{1,3}(:\d+)?$/.test(data.vmIp)) {
      return { success: false, message: "Invalid VM IP address format" };
    }
    if (/^\s*$/.test(data.vmPassword)) {
      return { success: false, message: "Password cannot be empty" };
    }
    await serviceMethods.updateClient(clientId, { vm_ip: data.vmIp, vm_password: data.vmPassword });
    revalidatePath(`/client?id=${clientId}`);    
    return { success: true, message: "VM IP and password updated successfully" };
  } catch (err:any) {
    return { success: false, message: `Unable to update VM IP and VM Password: ${err.message}` };
  }
}

export async function updateClientVMIP(clientId: string, data:{vm_ip: string}) {
  'use server';
  try {
    // Validate IP address format
    if (!data.vm_ip.trim() || !/^(\d{1,3}\.){3}\d{1,3}(:\d+)?$/.test(data.vm_ip)) {
      return { success: false, message: "Invalid VM IP address format" };
    }
    
    // Continue with update
    await serviceMethods.updateClient(clientId, { vm_ip: data.vm_ip });
    
    revalidatePath(`/client?id=${clientId}`);
    return { success: true, message: "VM IP updated successfully" };
  } catch (err: any) {
    return { success: false, message: `Unable to update VM IP: ${err.message}` };
  }
}