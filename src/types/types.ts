// This file contains type definitions related to clients and their operations

// Types for client views
export type View = 'summary' | 'config' | 'missions' // Fixed mission -> missions to match your code

// Client data structure from API/database
export interface ClientData {
  id: string;
  name: string;
  email: string;
  address: string;
  created_at: Date;
  vm_ip: string | null;
  vm_password?: string | null;
}

// Props for the sidebar component
export interface SidebarProps {
  className?: string;
  clientName: string;
  onNavigate: (view: View) => void;
  currentView: View;
}

// Props for client page
export interface PageProps {
  params: { id?: string };
  searchParams?: { [key: string]: string | undefined };
}

// Props for Mission Uploader component
export interface MissionUploaderProps {
  clientId: string;
  onUploadComplete?: (urls: string[]) => void;
}

// Response type for VM settings update
export interface VMSettingsUpdateResponse {
  success: boolean;
  error?: string;
}

// Drone assignment structure
export interface DroneAssignment {
  id: string;
  drone_id: string;
  client_id: string;
  assigned_at: string;
  drone_name?: string;
  drone_model?: string;
  drone_status?: 'active' | 'inactive' | 'maintenance';
}

// API response for client details
export interface ClientDetailsResponse {
  success: boolean;
  data?: ClientData;
  error?: string;
}

