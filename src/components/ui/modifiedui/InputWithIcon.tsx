import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MailIcon, LockIcon } from "lucide-react";

interface InputWithIconProps {
  id: string;
  label: string;
  type: string;
  placeholder: string;
  Icon: React.ElementType;
}

export default function InputWithIcon({ id, label, type, placeholder, Icon }: InputWithIconProps) {
  return (
    <div className="*:not-first:mt-2 ">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input id={id} name={id} type={type} placeholder={placeholder} className="peer pe-9" required />
        <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 end-0 flex items-center pe-3 peer-disabled:opacity-50">
          <Icon size={16} aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
