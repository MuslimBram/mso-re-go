import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "VR Explorer — Eksploro botën në Street View 360°" },
      {
        name: "description",
        content:
          "Aplikacion immersive që përdor Google Street View real për të 'ecur' nëpër botë me kontroll si në lojë, modalitet VR Headset dhe bibliotekë vendesh të shenjta islame e monumentesh botërore.",
      },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "VR Explorer — Eksploro botën në Street View 360°" },
      { property: "og:description", content: "Udhëto në çdo cep të botës me Street View 360° dhe modalitet VR Headset." },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "VR Explorer" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "VR Explorer — Eksploro botën në Street View 360°" },
      { name: "twitter:description", content: "Udhëto në çdo cep të botës me Street View 360° dhe modalitet VR Headset." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/acb751a3-f84d-4fba-ac9e-9e9e8276b67c" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/acb751a3-f84d-4fba-ac9e-9e9e8276b67c" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return <Outlet />;
}
