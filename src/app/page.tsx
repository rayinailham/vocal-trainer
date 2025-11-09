import * as React from "react"
import Image from "next/image"

// Local component definitions with types
const Button: React.FC<{ children: React.ReactNode; variant?: string; asChild?: boolean; className?: string; } & React.HTMLAttributes<HTMLElement>> = ({ children, variant, asChild, className, ...props }) => {
  const baseClass = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";
  const variantClass = variant === 'secondary' ? 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80' : variant === 'outline' ? 'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground' : 'bg-primary text-primary-foreground shadow hover:bg-primary/90';
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      className: `${baseClass} ${variantClass} ${className || ''} ${children.props.className || ''}`,
      ...props
    });
  }
  return <button className={`${baseClass} ${variantClass} ${className || ''}`} {...props}>{children}</button>;
};

const Card: React.FC<{ children: React.ReactNode; className?: string; } & React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => <div className={`rounded-xl border bg-card text-card-foreground shadow ${className || ''}`} {...props}>{children}</div>;
const CardHeader: React.FC<{ children: React.ReactNode; className?: string; } & React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => <div className={`flex flex-col space-y-1.5 p-6 ${className || ''}`} {...props}>{children}</div>;
const CardTitle: React.FC<{ children: React.ReactNode; className?: string; } & React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => <div className={`font-semibold leading-none tracking-tight ${className || ''}`} {...props}>{children}</div>;
const CardDescription: React.FC<{ children: React.ReactNode; className?: string; } & React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => <div className={`text-sm text-muted-foreground ${className || ''}`} {...props}>{children}</div>;
const CardContent: React.FC<{ children: React.ReactNode; className?: string; } & React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => <div className={`p-6 pt-0 ${className || ''}`} {...props}>{children}</div>;

const Badge: React.FC<{ children: React.ReactNode; variant?: string; className?: string; } & React.HTMLAttributes<HTMLSpanElement>> = ({ children, variant, className, ...props }) => {
  const variantClass = variant === 'secondary' ? 'bg-secondary text-secondary-foreground' : variant === 'outline' ? 'border border-input bg-background' : 'bg-primary text-primary-foreground';
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variantClass} ${className || ''}`} {...props}>{children}</span>;
};

const Avatar: React.FC<{ children: React.ReactNode; className?: string; } & React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => <div className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full ${className || ''}`} {...props}>{children}</div>;
const AvatarImage: React.FC<{ src: string; alt: string; className?: string; } & React.HTMLAttributes<HTMLImageElement>> = ({ src, alt, className, ...props }) => <Image className={`aspect-square h-full w-full ${className || ''}`} src={src} alt={alt} width={40} height={40} {...props} />;
const AvatarFallback: React.FC<{ children: React.ReactNode; className?: string; } & React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => <div className={`flex h-full w-full items-center justify-center rounded-full bg-muted ${className || ''}`} {...props}>{children}</div>;

const Separator: React.FC<{ className?: string; } & React.HTMLAttributes<HTMLHRElement>> = ({ className, ...props }) => <hr className={`shrink-0 bg-border h-[1px] w-full ${className || ''}`} {...props} />;

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Welcome to Next.js with shadcn/ui!
          </h1>
          <p className="text-lg text-muted-foreground mb-4">
            Get started by editing <code className="bg-muted px-2 py-1 rounded">app/page.tsx</code>
          </p>
          <div className="flex justify-center gap-2">
            <Badge variant="secondary">Next.js 14</Badge>
            <Badge variant="secondary">TypeScript</Badge>
            <Badge variant="secondary">Tailwind CSS</Badge>
            <Badge variant="default">shadcn/ui</Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Documentation</CardTitle>
              <CardDescription>
                Find in-depth information about Next.js features and API.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <a href="https://nextjs.org/docs">Learn More →</a>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Learn</CardTitle>
              <CardDescription>
                Learn about Next.js in an interactive course with quizzes!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="secondary" className="w-full">
                <a href="https://nextjs.org/learn">Start Learning →</a>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Examples</CardTitle>
              <CardDescription>
                Discover and deploy boilerplate example Next.js projects.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <a href="https://github.com/vercel/next.js/tree/canary/examples">View Examples →</a>
              </Button>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-8" />

        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Meet the Team</h2>
          <div className="flex justify-center gap-4">
            <div className="text-center">
              <Avatar className="mx-auto mb-2">
                <AvatarImage src="/placeholder-avatar.jpg" alt="User" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <p className="font-medium">John Doe</p>
              <Badge variant="outline">Developer</Badge>
            </div>
            <div className="text-center">
              <Avatar className="mx-auto mb-2">
                <AvatarImage src="/placeholder-avatar.jpg" alt="User" />
                <AvatarFallback>JS</AvatarFallback>
              </Avatar>
              <p className="font-medium">Jane Smith</p>
              <Badge variant="outline">Designer</Badge>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}