"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Github, Mail, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"

const successStories = [
  {
    name: "Calligraphy School",
    earning: "$6,237/month",
    image: "https://ext.same-assets.com/637669732/1498898794.jpeg"
  },
  {
    name: "Zero To Founder",
    earning: "$119/month",
    image: "https://ext.same-assets.com/637669732/3036548719.jpeg"
  },
  {
    name: "That Pickleball School",
    earning: "$39/month",
    image: "https://ext.same-assets.com/637669732/3135556938.jpeg"
  }
]

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    username: "",
  })
  const [gdprConsent, setGdprConsent] = useState(false)
  const [marketingConsent, setMarketingConsent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [currentStory, setCurrentStory] = useState(0)
  const router = useRouter()

  // Carousel effect for success stories
  useState(() => {
    const interval = setInterval(() => {
      setCurrentStory((prev) => (prev + 1) % successStories.length)
    }, 3000)
    return () => clearInterval(interval)
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (!gdprConsent) {
      setError("You must agree to the privacy policy to continue")
      setIsLoading(false)
      return
    }

    try {
      // Create account via API
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          gdprConsent,
          marketingConsent,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create account")
      }

      // Sign in automatically after successful registration
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        throw new Error("Account created but failed to sign in")
      }

      toast.success("Account created successfully!")
      router.push("/app/onboarding")
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred")
      toast.error("Failed to create account")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setIsLoading(true)
    try {
      await signIn("google", { callbackUrl: "/app/onboarding" })
    } catch (error) {
      toast.error("Failed to sign up with Google")
      setIsLoading(false)
    }
  }

  const handleGitHubSignUp = async () => {
    setIsLoading(true)
    try {
      await signIn("github", { callbackUrl: "/app/onboarding" })
    } catch (error) {
      toast.error("Failed to sign up with GitHub")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left Side - Success Stories Carousel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-purple-700 items-center justify-center p-12">
        <div className="max-w-md text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Build a community around your passion.
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Make money doing what you love.
          </p>

          {/* Success Story Carousel */}
          <div className="relative">
            <div className="bg-white rounded-lg p-6 shadow-xl">
              <div className="aspect-video relative mb-4 rounded-lg overflow-hidden">
                <Image
                  src={successStories[currentStory].image}
                  alt={successStories[currentStory].name}
                  fill
                  className="object-cover"
                />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                {successStories[currentStory].name}
              </h3>
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                Earns {successStories[currentStory].earning}
              </div>
            </div>

            {/* Carousel Indicators */}
            <div className="flex justify-center mt-4 space-x-2">
              {successStories.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentStory ? 'bg-white' : 'bg-white/50'
                  }`}
                  onClick={() => setCurrentStory(index)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <Link href="/" className="text-3xl font-bold">
              <span className="text-blue-600">s</span>
              <span className="text-orange-500">k</span>
              <span className="text-orange-400">o</span>
              <span className="text-blue-500">o</span>
              <span className="text-gray-800">l</span>
            </Link>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Join Skool
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Start your 14-day free trial today
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Create your account</CardTitle>
              <CardDescription>
                Get started with your community today
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="mt-1"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="mt-1"
                    placeholder="Choose a username (optional)"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="mt-1"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="mt-1"
                    placeholder="Create a strong password"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Must be at least 8 characters long
                  </p>
                </div>

                {/* GDPR Consent */}
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="gdpr"
                      checked={gdprConsent}
                      onCheckedChange={(checked) => setGdprConsent(checked as boolean)}
                      className="mt-1"
                    />
                    <Label htmlFor="gdpr" className="text-sm leading-5">
                      I agree to the{" "}
                      <Link href="/privacy" className="text-blue-600 hover:text-blue-500">
                        Privacy Policy
                      </Link>{" "}
                      and{" "}
                      <Link href="/terms" className="text-blue-600 hover:text-blue-500">
                        Terms of Service
                      </Link>
                      <span className="text-red-500">*</span>
                    </Label>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="marketing"
                      checked={marketingConsent}
                      onCheckedChange={(checked) => setMarketingConsent(checked as boolean)}
                      className="mt-1"
                    />
                    <Label htmlFor="marketing" className="text-sm leading-5">
                      I'd like to receive updates and marketing communications
                    </Label>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
                  disabled={isLoading || !gdprConsent}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Start Free Trial
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={handleGoogleSignUp}
                  disabled={isLoading}
                  className="w-full"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Google
                </Button>
                <Button
                  variant="outline"
                  onClick={handleGitHubSignUp}
                  disabled={isLoading}
                  className="w-full"
                >
                  <Github className="h-4 w-4 mr-2" />
                  GitHub
                </Button>
              </div>

              <div className="text-center">
                <span className="text-sm text-gray-600">
                  Already have an account?{" "}
                  <Link
                    href="/app/login"
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    Sign in
                  </Link>
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Trial Benefits */}
          <div className="text-center space-y-2">
            <p className="text-sm font-medium text-gray-900">14-day free trial includes:</p>
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                Full access
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                No credit card
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                Cancel anytime
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
