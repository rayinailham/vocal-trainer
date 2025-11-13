import * as React from "react"
import Link from "next/link"

// Local Button component
const Button: React.FC<{ children: React.ReactNode; variant?: string; asChild?: boolean; className?: string; size?: string; } & React.HTMLAttributes<HTMLElement>> = ({ children, variant, asChild, className, size, ...props }) => {
  const baseClass = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
  const sizeClass = size === 'lg' ? 'h-12 px-8 text-lg' : '';
  const variantClass = variant === 'outline' 
    ? 'border-2 border-green-600 text-green-600 hover:bg-green-50' 
    : 'bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg';
  
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      className: `${baseClass} ${sizeClass} ${variantClass} ${className || ''} ${children.props.className || ''}`,
      ...props
    });
  }
  return <button className={`${baseClass} ${sizeClass} ${variantClass} ${className || ''}`} {...props}>{children}</button>;
};

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-200px)] bg-white flex items-center justify-center">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          {/* Title */}
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 text-gray-900">
            Vocal Trainer
          </h1>

          {/* Subtitle - minimal */}
          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-xl mx-auto">
            Master your vocal range and improve your singing
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button asChild size="lg">
              <Link href="/vocal-range">
                Find Your Vocal Range
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/vocal-training">
                Start Training
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}