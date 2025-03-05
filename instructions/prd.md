# Product Requirements Document (PRD)

## 1. Overview

**Project Name:** Vyomchara Admin Panel  
**Purpose:**  
Develop an internal dashboard to manage clients and drone assignments. The application is built on a service-oriented architecture where distinct services (e.g., file uploading, client CRUD operations) are encapsulated and called by controllers (pages) within the Next.js app. The app uses Supabase for authentication, database, and storage, and shadcn UI components for a consistent look and feel.

---

## 2. Objectives & Goals

- **Secure Data Management:**  
  Execute all CRUD and file upload operations on the server side to protect sensitive operations.
  
- **Service-Oriented Architecture:**  
  Define discrete services for authentication, file uploading, and client CRUD operations that can be invoked by various pages (acting as controllers). This ensures reusability and better separation of concerns.
  
- **Unified Backend:**  
  Use Supabase as the central service for authentication (via email/password with @supabase/ssr), a managed PostgreSQL database, and object storage.
  
- **Modern, Scalable Front End:**  
  Leverage Next.js with the app router (pages) that call these services as needed, while using shadcn components to quickly build a polished UI.

---

## 3. Key Services and Features

### 3.1 Authentication Service
- **Email/Password Auth:**  
  - Use the `@supabase/ssr` package for server-side session handling.
  - Only login is required on the dashboard, while registration is administered separately via SQL/Supabase Studio.
  - Pages will check for a valid session before rendering protected content.

### 3.2 Client CRUD Operations Service
- **Service Functions:**  
  - **Create:** Add new client records based on the schema.
  - **Read:**  
    - Retrieve all clients to display on the dashboard.
    - Retrieve a specific client using their client ID.
  - **Update:** Modify client details.
  - **Delete:** Remove client records.
- **Usage:**  
  These service functions will be invoked by various pages. For example, one page may call the "Read all clients" service to display the client list, while another page (or a component) might call the "Update client" service.

### 3.3 File Uploading Service
- **Supabase Storage Integration:**  
  - Create a dedicated service for uploading files to Supabase Storage.
  - This service will include file validation, progress tracking, and error handling.
- **Usage:**  
  Pages that require client file uploads will call this service to ensure that files are stored securely and reliably.

### 3.4 UI Components with shadcn
- **Component Library:**  
  - Utilize shadcn’s prebuilt UI components to speed up development and maintain a consistent design language.
  - Example command for adding a component:  
    ```bash
    pnpm dlx shadcn@latest add button
    ```

---

## 4. Technical Architecture

### Tech Stack:
- **Framework:** Next.js using the new app router structure.
- **Architecture:**  
    - **Pages as Controllers:** Each page will act as a controller that calls the appropriate service (e.g., authentication service, client CRUD service, file uploading service) as needed.
- **UI Library:** shadcn components integrated with Tailwind CSS and icons from lucide library.
- **Supabase Integration:**  
  - **Auth:** Email/password authentication via `@supabase/ssr`.
  - **Database:** supabase managed postgres db.
  - **Storage:** supabase storage for file upload.
- **ORM:** Drizzle ORM for DB migrations and other operations
- **Server-Side Services:**  
  - Implement server-side service functions (using Next.js API routes or server functions) for handling all CRUD and file operations securely.
  - Use Supabase’s Row Level Security (RLS) for additional data protection where needed.

---

## 5. Dependencies and current folder structure

currently we have already setup the next project, and installed the following pacakges
```json
"dependencies": {
    "@supabase/ssr": "^0.5.2",
    "@supabase/supabase-js": "^2.49.1",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^0.477.0",
    "next": "15.2.1",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "tailwind-merge": "^3.0.2",
    "tailwindcss-animate": "^1.0.7"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
 ```

```
├── components.json
├── next.config.ts
├── next-env.d.ts
├── package.json
├── pnpm-lock.yaml
├── postcss.config.mjs
├── public
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── README.md
├── src
│   ├── app
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   └── lib
│       └── utils.ts
└── tsconfig.json

```

---

## 6. User Stories

- **As an Admin:**  
  - I want to log in securely using email and password so that I can access the dashboard.
  - I want to view a list of all clients on the dashboard by invoking the "read all clients" service.
  - I want to view a specific client's details using their client ID.
  - I want to update client information and delete clients by using dedicated service functions.
  - I want to upload client-related files through a dedicated file uploading service.

- **As a Developer:**  
  - I need clearly defined server-side services that encapsulate core functionality, ensuring security and code reuse.
  - I want pages (acting as controllers) to call these services directly, reducing redundancy and improving maintainability.
  - I want to leverage shadcn components for quick, consistent UI development.

---

## 7. Non-Functional Requirements

- **Security:**  
  - All sensitive operations (CRUD, file uploads) must run on the server side.
  - Environment variables must be used to store sensitive credentials.
  
- **Performance:**  
  - Services should efficiently handle operations to ensure minimal latency.
  - Implement caching strategies where applicable (e.g., for client lists) to enhance responsiveness.
  
- **Scalability:**  
  - The modular, service-oriented design should allow for easy scaling as the number of clients and files increases.
  
- **Maintainability:**  
  - Codebase should be modular with clear separation between service logic and page controllers.
  - Comprehensive documentation should be provided for each service.

---

## 8. Coding Examples

###  Authentication in Nextjs 15 application using @supabase/ssr package
#### 1. Environment Setup

First, install the necessary packages:

```bash
npm install @supabase/supabase-js @supabase/ssr
```

Create a `.env.local` file in your project root with your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=<your_supabase_project_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_supabase_anon_key>
```

#### 2. Create Supabase Client Utilities

##### Client Component Utility  
Create `utils/supabase/client.ts`:

```ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
  );
}
```

##### Server Component Utility  
Create `utils/supabase/server.ts`:

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        },
      },
    }
  );
}
```

#### 3. Middleware for Session Management

Create a `middleware.ts` file in your project root to refresh tokens and protect routes:

```ts
import type { NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

And add a helper in `utils/supabase/middleware.ts`:

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If no user is found and the user isn't on the login page, redirect them
  if (!user && !request.nextUrl.pathname.startsWith("/login")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
```

This middleware ensures that any protected route verifies the user's session before proceeding.

#### 4. Creating the Login Page with Server Actions

##### Login Page Component  
Create `app/login/page.tsx`:

```tsx
import { login, signup } from "./actions";

export default function LoginPage() {
  return (
    <form>
      <label htmlFor="email">Email:</label>
      <input id="email" name="email" type="email" required />
      
      <label htmlFor="password">Password:</label>
      <input id="password" name="password" type="password" required />
      
      <button formAction={login}>Log in</button>
      <button formAction={signup}>Sign up</button>
    </form>
  );
}
```

#### Server Actions  
Create `app/login/actions.ts`:

```ts
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function login(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  if (error) redirect("/error");
  redirect("/");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  if (error) redirect("/error");
  redirect("/");
}
```

These actions run on the server and perform authentication securely using the Supabase SSR client.

#### Summary

- **Environment & Installation:**  
  Set up your Supabase project, add credentials to `.env.local`, and install the required packages.
  
- **Client & Server Utilities:**  
  Create separate utilities for browser and server components to handle Supabase interactions securely.
  
- **Middleware:**  
  Implement middleware to manage sessions and redirect unauthenticated users.
  
- **Login Page & Server Actions:**  
  Build a login page that leverages server actions for secure authentication.

---

### supabase storage in nextjs 15 application (upload)

#### 1. Setting Up a Supabase Client

Create a file (for example, `lib/supabaseClient.ts`) to initialize the Supabase client that will be used for both uploading and later serving images(if required).

```ts
// lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

## 2. Creating an Upload Form Component

Create a React component that allows users to select a file and then upload it to a designated storage bucket. In this example, we’ll assume the bucket name is `images`.

```tsx
// components/ImageUploader.tsx
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function ImageUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    // Generate a unique file name if needed. Here we use the original name.
    const fileName = file.name;

    // Upload the file to the 'images' bucket, at the root folder
    const { data, error } = await supabase.storage
      .from('images')
      .upload(fileName, file);

    if (error) {
      setUploadError(error.message);
      setUploading(false);
      return;
    }

    // Optionally, get the public URL to display the uploaded image
    const { data: publicData } = supabase.storage
      .from('images')
      .getPublicUrl(fileName);

    setImageUrl(publicData.publicUrl);
    setUploading(false);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Upload an Image</h2>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
      >
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
      {uploadError && <p className="mt-2 text-red-500">{uploadError}</p>}
      {imageUrl && (
        <div className="mt-4">
          <p>Uploaded Image:</p>
          <img src={imageUrl} alt="Uploaded" className="mt-2 max-w-md" />
        </div>
      )}
    </div>
  );
}
```

### Explanation:
- **File Input:**  
  The file input allows users to choose an image. Once selected, we store the file in the component state.
  
- **Upload Function:**  
  When the upload button is clicked, we call the Supabase Storage API to upload the file to a bucket named `images`.  
  - If there is an error, it is displayed.
  - On success, we use the `getPublicUrl` method to fetch the public URL for the uploaded file and display the image.
  
- **Button State:**  
  The button is disabled while uploading or if no file is selected.

---

## 3. Using the ImageUploader Component in a Page

Finally, integrate the uploader component into a page, for example, in `pages/index.tsx`:

```tsx
// pages/index.tsx
import type { NextPage } from 'next';
import ImageUploader from '../components/ImageUploader';

const Home: NextPage = () => {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Supabase Image Upload Example</h1>
      <ImageUploader />
    </div>
  );
};

export default Home;
```

---

## 4. Additional Considerations

- **Bucket Configuration:**  
  Ensure that the `images` bucket is configured in your Supabase project. If you require public access to the uploaded files, verify the bucket’s public settings.
  
- **Error Handling & Validation:**  
  In a production application, you may want to add more robust error handling and file validations (e.g., file type and size restrictions).

- **Security:**  
  Consider implementing server-side logic if you want to restrict who can upload files, or if you need additional processing before storing files.

---

## Summary

1. **Initialize Supabase Client:**  
   Create a utility to instantiate your Supabase client using your project's credentials.
   
2. **Upload Form Component:**  
   Build a React component that handles file selection, uploads the file to a designated bucket, and retrieves a public URL.
   
3. **Integrate into a Page:**  
   Use your component within a Next.js page to allow users to upload and view images.

This detailed example should help you integrate file uploads to a Supabase storage bucket in your Next.js project—following the approach outlined in the Kodaschool blog post.


---
## 9. Milestones & Timeline

1. **Project Setup – already Done**  
   - Initialize Next.js project.
   - Set up Supabase project (database, auth, storage).
   - Configure environment variables.
  
2. **Authentication & Base UI:**  
   - Integrate `@supabase/ssr` for email/password authentication.
   - Set up basic login page and ensure session handling.
   - Integrate shadcn UI components for consistent design.

3. **Service Development: Client CRUD Operations:**  
   - Build server-side service functions for creating, reading (all and by client ID), updating, and deleting clients.
   - Develop pages that call these services, starting with a client list dashboard.

4. **Service Development: File Uploads:**  
   - Develop the file uploading service using Supabase Storage.
   - Implement pages/components that integrate file upload functionality with progress tracking and validation.

5. **Testing & QA:**  
   - Perform end-to-end testing of all services and page integrations.
   - Ensure secure operations, validate error handling, and optimize performance.

6. **Deployment & Final Review:**  
   - Deploy the application on AWS Amplify.
   - Conduct a final review, update documentation, and prepare for production rollout.

---

## 10. Future Enhancements

- **Role-Based Access Control (RBAC):**  
  Introduce finer-grained access control for various admin users.
  
- **Real-Time Updates:**  
  Leverage Supabase’s real-time capabilities to automatically update the dashboard as client data changes.
  
- **Analytics & Reporting:**  
  Integrate dashboards for detailed analytics on client and drone usage.
  
- **Extended Drone & Payload Management:**  
  Expand services to cover drone and payload assignments as needed.