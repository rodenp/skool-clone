"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  User,
  Heart,
  Sparkles,
  Rocket,
  BookOpen
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

const steps = [
  {
    id: 1,
    title: "Welcome to Skool!",
    description: "Let's get you set up in just a few steps"
  },
  {
    id: 2,
    title: "Complete Your Profile",
    description: "Tell us a bit about yourself"
  },
  {
    id: 3,
    title: "Choose Your Interests",
    description: "We'll recommend communities based on your interests"
  },
  {
    id: 4,
    title: "You're All Set!",
    description: "Ready to explore communities and start learning"
  }
]

const interests = [
  { id: "business", name: "Business", icon: "💼" },
  { id: "technology", name: "Technology", icon: "💻" },
  { id: "design", name: "Design", icon: "🎨" },
  { id: "marketing", name: "Marketing", icon: "📈" },
  { id: "fitness", name: "Fitness", icon: "💪" },
  { id: "cooking", name: "Cooking", icon: "👨‍🍳" },
  { id: "music", name: "Music", icon: "🎵" },
  { id: "photography", name: "Photography", icon: "📸" },
  { id: "writing", name: "Writing", icon: "✍️" },
  { id: "gaming", name: "Gaming", icon: "🎮" },
  { id: "art", name: "Art", icon: "🎭" },
  { id: "education", name: "Education", icon: "🎓" },
]

export default function OnboardingPage() {
  const { data: session, update } = useSession()
  const router = useRouter()

  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  // Form data
  const [profile, setProfile] = useState({
    username: session?.user?.username || "",
    bio: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  })
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])

  const progress = (currentStep / steps.length) * 100

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleInterestToggle = (interestId: string) => {
    setSelectedInterests(prev =>
      prev.includes(interestId)
        ? prev.filter(id => id !== interestId)
        : [...prev, interestId]
    )
  }

  const handleComplete = async () => {
    setIsLoading(true)

    try {
      // Update user profile
      const response = await fetch("/api/user/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: profile.username,
          bio: profile.bio,
          timezone: profile.timezone,
          interests: selectedInterests,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to complete onboarding")
      }

      // Update session
      await update()

      toast.success("Welcome to Skool! Your profile has been set up.")
      router.push("/app/dashboard")
    } catch (error) {
      toast.error("Failed to complete setup. Please try again.")
      console.error("Onboarding error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome to Skool, {session?.user?.name?.split(' ')[0]}! 🎉
              </h2>
              <p className="text-gray-600">
                You're about to join an amazing community platform where you can learn,
                teach, and connect with like-minded people from around the world.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-medium text-gray-900">Join Communities</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Connect with communities that match your interests
                </p>
              </div>
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-medium text-gray-900">Learn & Grow</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Access courses and content from expert creators
                </p>
              </div>
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Rocket className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-medium text-gray-900">Create & Earn</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Build your own community and monetize your knowledge
                </p>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Complete Your Profile
              </h2>
              <p className="text-gray-600">
                Let others know who you are and what you're about
              </p>
            </div>

            <div className="space-y-4 max-w-md mx-auto">
              <div>
                <Label htmlFor="username">Username (optional)</Label>
                <Input
                  id="username"
                  type="text"
                  value={profile.username}
                  onChange={(e) => setProfile(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Choose a unique username"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This will be your unique identifier on the platform
                </p>
              </div>

              <div>
                <Label htmlFor="bio">Bio (optional)</Label>
                <Textarea
                  id="bio"
                  value={profile.bio}
                  onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell us a bit about yourself..."
                  rows={3}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Share your interests, experience, or what you hope to learn
                </p>
              </div>

              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Input
                  id="timezone"
                  type="text"
                  value={profile.timezone}
                  onChange={(e) => setProfile(prev => ({ ...prev, timezone: e.target.value }))}
                  className="mt-1"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">
                  Detected automatically for event scheduling
                </p>
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Choose Your Interests
              </h2>
              <p className="text-gray-600">
                Select topics you're interested in to get personalized recommendations
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-w-4xl mx-auto">
              {interests.map((interest) => (
                <button
                  key={interest.id}
                  onClick={() => handleInterestToggle(interest.id)}
                  className={`
                    flex flex-col items-center p-4 border-2 rounded-lg transition-all
                    ${selectedInterests.includes(interest.id)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }
                  `}
                >
                  <span className="text-2xl mb-2">{interest.icon}</span>
                  <span className="text-sm font-medium">{interest.name}</span>
                  {selectedInterests.includes(interest.id) && (
                    <CheckCircle className="h-4 w-4 text-blue-500 mt-1" />
                  )}
                </button>
              ))}
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-500">
                Selected {selectedInterests.length} interests
              </p>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                You're All Set! 🚀
              </h2>
              <p className="text-gray-600 mb-6">
                Your profile has been created and we've found some great communities for you to explore.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 max-w-md mx-auto">
              <h3 className="font-semibold text-gray-900 mb-4">What's next?</h3>
              <div className="space-y-3 text-left">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm">Explore recommended communities</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm">Join your first community</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm">Start engaging with posts</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm">Consider creating your own community</span>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold inline-block mb-4">
            <span className="text-blue-600">s</span>
            <span className="text-orange-500">k</span>
            <span className="text-orange-400">o</span>
            <span className="text-blue-500">o</span>
            <span className="text-gray-800">l</span>
          </Link>

          {/* Progress */}
          <div className="max-w-md mx-auto mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Step {currentStep} of {steps.length}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <h1 className="text-lg font-medium text-gray-900">
            {steps[currentStep - 1].title}
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            {steps[currentStep - 1].description}
          </p>
        </div>

        {/* Content */}
        <Card className="border-0 shadow-xl">
          <CardContent className="p-8">
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-6">
          <div className="flex items-center space-x-2">
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={isLoading}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-gray-500"
            >
              Exit Setup
            </Button>
          </div>

          <div>
            {currentStep < steps.length ? (
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? "Setting up..." : "Complete Setup"}
                <Rocket className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
