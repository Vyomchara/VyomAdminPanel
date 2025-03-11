import { login } from "@/app/login/action";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button"; // Import the reusable component
import { MailIcon, LockIcon } from "lucide-react";
import InputWithIcon from "@/components/ui/modifiedui/InputWithIcon"; // Import the reusable component
import { ThemeProvider } from "@/components/ui/theme-provider";

export default function LoginPage() {
  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-b  ">
      
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Enter your credentials below</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={login}>
            <div className="space-y-4">
              {/* Reusable Input Component */}
              <InputWithIcon id="email" label="Email" type="email" placeholder="Enter your email" Icon={MailIcon} />
              <InputWithIcon id="password" label="Password" type="password" placeholder="Enter your password" Icon={LockIcon} />
            </div>

            <CardFooter className="px-0 mt-4">
              <Button type="submit" className="w-full">
                Log In
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
