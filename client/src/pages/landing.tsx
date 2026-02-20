import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, BookOpen, Award, Users, Lightbulb, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-purple-accent rounded-lg flex items-center justify-center">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg">The Rundown</h1>
                <span className="text-xs text-purple-accent bg-purple-accent/20 px-2 py-0.5 rounded-full">University</span>
              </div>
            </div>
            <Link href="/register">
              <Button className="bg-purple-accent hover:bg-purple-accent/90">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-accent to-blue-accent bg-clip-text text-transparent">
            Master AI for Your Career
          </h1>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Join thousands of professionals learning to implement AI in their daily work with practical courses, guides, and certifications.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button 
                size="lg"
                className="bg-purple-accent hover:bg-purple-accent/90 text-white px-8 py-3 text-lg"
              >
                Start Learning <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button 
              size="lg" 
              variant="outline"
              className="border-border text-white hover:bg-card px-8 py-3 text-lg"
            >
              View Courses
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-card/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose The Rundown University?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-accent/20 rounded-lg flex items-center justify-center mb-4">
                  <BookOpen className="h-6 w-6 text-purple-accent" />
                </div>
                <CardTitle>16 Industry-Specific Courses</CardTitle>
                <CardDescription>
                  AI courses tailored for Marketing, Finance, Consulting, Healthcare, and more.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-accent/20 rounded-lg flex items-center justify-center mb-4">
                  <Award className="h-6 w-6 text-blue-accent" />
                </div>
                <CardTitle>LinkedIn-Ready Certificates</CardTitle>
                <CardDescription>
                  Earn certifications that demonstrate practical AI implementation skills.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <div className="w-12 h-12 bg-green-accent/20 rounded-lg flex items-center justify-center mb-4">
                  <Lightbulb className="h-6 w-6 text-green-accent" />
                </div>
                <CardTitle>300+ Practical Guides</CardTitle>
                <CardDescription>
                  Step-by-step tutorials you can complete in 15-20 minutes with real-world use cases.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-accent/20 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-orange-accent" />
                </div>
                <CardTitle>Weekly Live Workshops</CardTitle>
                <CardDescription>
                  60-90 minute sessions with industry leaders providing hands-on guidance.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <div className="w-12 h-12 bg-pink-accent/20 rounded-lg flex items-center justify-center mb-4">
                  <Brain className="h-6 w-6 text-pink-accent" />
                </div>
                <CardTitle>Personalized Learning</CardTitle>
                <CardDescription>
                  AI-powered recommendations based on your industry and learning preferences.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-accent/20 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-purple-accent" />
                </div>
                <CardTitle>Exclusive Community</CardTitle>
                <CardDescription>
                  Connect with 1M+ AI-first professionals and early adopters.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Transform Your Career with AI?</h2>
          <p className="text-xl text-gray-400 mb-8">
            Join thousands of professionals who are already using AI to accelerate their careers.
          </p>
          <Link href="/register">
            <Button 
              size="lg"
              className="bg-purple-accent hover:bg-purple-accent/90 text-white px-12 py-4 text-xl"
            >
              Start Your Free Trial
            </Button>
          </Link>
          <p className="text-sm text-gray-500 mt-4">14-day free trial • No credit card required</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-6 h-6 bg-purple-accent rounded-lg flex items-center justify-center">
                <Brain className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold">The Rundown University</span>
            </div>
            <p className="text-gray-400 text-sm">
              © 2024 The Rundown University. Making AI accessible for everyone.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
