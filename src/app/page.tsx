import * as React from "react"
import Link from "next/link"

// Local component definitions with types
const Button: React.FC<{ children: React.ReactNode; variant?: string; asChild?: boolean; className?: string; size?: string; } & React.HTMLAttributes<HTMLElement>> = ({ children, variant, asChild, className, size, ...props }) => {
  const baseClass = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";
  const sizeClass = size === 'lg' ? 'h-12 px-6 text-lg' : '';
  const variantClass = variant === 'secondary' ? 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80' : variant === 'outline' ? 'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground' : 'bg-primary text-primary-foreground shadow hover:bg-primary/90';
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      className: `${baseClass} ${sizeClass} ${variantClass} ${className || ''} ${children.props.className || ''}`,
      ...props
    });
  }
  return <button className={`${baseClass} ${sizeClass} ${variantClass} ${className || ''}`} {...props}>{children}</button>;
};

const Card: React.FC<{ children: React.ReactNode; className?: string; } & React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => <div className={`rounded-xl border bg-card text-card-foreground shadow ${className || ''}`} {...props}>{children}</div>;
const CardHeader: React.FC<{ children: React.ReactNode; className?: string; } & React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => <div className={`flex flex-col space-y-1.5 p-6 ${className || ''}`} {...props}>{children}</div>;
const CardTitle: React.FC<{ children: React.ReactNode; className?: string; } & React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => <div className={`font-semibold leading-none tracking-tight ${className || ''}`} {...props}>{children}</div>;
const CardDescription: React.FC<{ children: React.ReactNode; className?: string; } & React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => <div className={`text-sm text-muted-foreground ${className || ''}`} {...props}>{children}</div>;
const CardContent: React.FC<{ children: React.ReactNode; className?: string; } & React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => <div className={`p-6 pt-0 ${className || ''}`} {...props}>{children}</div>;

// Badge component defined but not used in current implementation
// const Badge: React.FC<{ children: React.ReactNode; variant?: string; className?: string; } & React.HTMLAttributes<HTMLSpanElement>> = ({ children, variant, className, ...props }) => {
//   const variantClass = variant === 'secondary' ? 'bg-secondary text-secondary-foreground' : variant === 'outline' ? 'border border-input bg-background' : 'bg-primary text-primary-foreground';
//   return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variantClass} ${className || ''}`} {...props}>{children}</span>;
// };

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent animate-fade-in">
            Vocal Trainer
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-slide-up">
            Master your vocal range and improve your singing with real-time pitch detection and personalized training exercises.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up animation-delay-200">
            <Button asChild size="lg" className="text-lg px-8 py-6">
              <Link href="/vocal-range">
                Find Your Vocal Range
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6">
              <Link href="/vocal-training">
                Start Training
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Features</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to improve your vocal skills and reach your full potential
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Vocal Range Feature Card */}
          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-400">
                  <path d="M9 18V5l12-2v13"></path>
                  <circle cx="6" cy="18" r="3"></circle>
                  <circle cx="18" cy="16" r="3"></circle>
                </svg>
              </div>
              <CardTitle className="text-2xl">Vocal Range Detection</CardTitle>
              <CardDescription className="text-base">
                Discover your vocal range with our step-by-step detection process. Find your lowest and highest notes with real-time pitch analysis.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span className="text-sm">Real-time pitch detection</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span className="text-sm">Visual feedback with audio waveform</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span className="text-sm">Save your vocal range profile</span>
                </div>
              </div>
              <Button asChild className="w-full mt-6">
                <Link href="/vocal-range">
                  Get Started
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Vocal Training Feature Card */}
          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600 dark:text-indigo-400">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                </svg>
              </div>
              <CardTitle className="text-2xl">Vocal Training</CardTitle>
              <CardDescription className="text-base">
                Improve your pitch accuracy and control with personalized training exercises. Track your progress and see measurable improvement.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span className="text-sm">Multiple training variations</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span className="text-sm">Real-time pitch feedback</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span className="text-sm">Score tracking and progress visualization</span>
                </div>
              </div>
              <Button asChild className="w-full mt-6">
                <Link href="/vocal-training">
                  Start Training
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get started with Vocal Trainer in just a few simple steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">1</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Find Your Range</h3>
            <p className="text-muted-foreground">
              Use our vocal range detection tool to discover your lowest and highest notes
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">2</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Choose Training</h3>
            <p className="text-muted-foreground">
              Select from various training exercises tailored to your vocal range and goals
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">3</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Track Progress</h3>
            <p className="text-muted-foreground">
              Monitor your improvement with detailed scoring and progress visualization
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 md:p-12 text-center text-white max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Improve Your Voice?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of users who have improved their vocal skills with Vocal Trainer
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="secondary" className="text-lg px-8 py-6">
              <Link href="/vocal-range">
                Get Started Now
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg px-8 py-6 border-white text-white hover:bg-white hover:text-blue-600">
              <Link href="/test-audio">
                Test Your Microphone
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}