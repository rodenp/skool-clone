import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, CheckCircle, Star, Users, BookOpen, Calendar, Trophy, ArrowRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

const featuredCommunities = [
  {
    id: "1",
    rank: "#1",
    name: "Calligraphy School",
    description: "Learn modern calligraphy the fun, easy way! ✍️ With sisters Jordan & Jillian",
    members: "1.3k Members",
    price: "$9/month",
    image: "https://ext.same-assets.com/637669732/1498898794.jpeg",
    isEarning: true,
    earning: "$6,237/month"
  },
  {
    id: "2",
    rank: "#2",
    name: "Zero To Founder by Tom Bilyeu",
    description: "Level up your business and get on the path to financial freedom with billion-dollar founder Tom Bilyeu.",
    members: "1.1k Members",
    price: "$119/month",
    image: "https://ext.same-assets.com/637669732/3036548719.jpeg"
  },
  {
    id: "3",
    rank: "#3",
    name: "That Pickleball School",
    description: "🏓 THAT place for all pickleball players who want to get better.",
    members: "970 Members",
    price: "$39/month",
    image: "https://ext.same-assets.com/637669732/3135556938.jpeg"
  },
  {
    id: "4",
    rank: "#4",
    name: "Brotherhood Of Scent",
    description: "#1 Fragrance Community 🕯 Our mission is to help YOU leverage the power of scent to become the man you know yourself to be.",
    members: "6.8k Members",
    price: "Free",
    image: "https://ext.same-assets.com/637669732/4069097328.jpeg"
  },
  {
    id: "5",
    rank: "#5",
    name: "The Lady Change",
    description: "THE #1 community for menopausal (peri & post) women to lose weight, get healthier and regain their confidence!",
    members: "1.5k Members",
    price: "$49/month",
    image: "https://ext.same-assets.com/637669732/2533892990.jpeg"
  },
  {
    id: "6",
    rank: "#6",
    name: "Abbew Crew",
    description: "My mission is to help people reclaim their health, body and energy. Achieving fat loss or muscle building is not complicated. Try for yourself.",
    members: "10.2k Members",
    price: "$129",
    image: "https://ext.same-assets.com/637669732/3654773682.jpeg"
  }
]

const categories = [
  { name: "All", active: true },
  { name: "Hobbies" },
  { name: "Music" },
  { name: "Money" },
  { name: "Spirituality" },
  { name: "Tech" },
  { name: "Health" },
  { name: "Sports" },
  { name: "Self-improvement" },
  { name: "Relationships" }
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold">
                <span className="text-blue-600">s</span>
                <span className="text-orange-500">k</span>
                <span className="text-orange-400">o</span>
                <span className="text-blue-500">o</span>
                <span className="text-gray-800">l</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/app/login">
                <Button variant="outline" size="sm">
                  Log In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Discover communities
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            or{" "}
            <Link href="/app/signup" className="text-blue-600 hover:text-blue-700 underline">
              create your own
            </Link>
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mt-8 mb-12">
            <div className="relative">
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search for anything"
                className="pl-12 h-12 text-lg bg-white border-gray-300 rounded-lg shadow-sm"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {categories.map((category) => (
              <Button
                key={category.name}
                variant={category.active ? "default" : "outline"}
                size="sm"
                className="rounded-full"
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Communities Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredCommunities.map((community) => (
            <Card key={community.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative">
                <div className="absolute top-3 left-3 z-10">
                  <Badge className="bg-black text-white font-semibold">
                    {community.rank}
                  </Badge>
                </div>
                {community.isEarning && (
                  <div className="absolute top-3 right-3 z-10">
                    <Badge className="bg-green-600 text-white font-semibold">
                      {community.name}
                      <br />
                      <span className="text-sm">Earns {community.earning}</span>
                    </Badge>
                  </div>
                )}
                <div className="aspect-[16/9] relative">
                  <Image
                    src={community.image}
                    alt={community.name}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              <CardContent className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 line-clamp-1">
                      {community.name}
                    </h3>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {community.description}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{community.members}</span>
                  <span className="font-semibold text-gray-900">{community.price}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-12">
          <Button variant="outline" size="lg">
            Load More Communities
          </Button>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="bg-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Simple pricing
          </h2>
          <p className="text-lg text-gray-600 mb-2">
            1 plan with everything included. No hidden fees.
          </p>
          <p className="text-lg text-gray-600 mb-12">
            Get started with a 14-day free trial. Cancel anytime.
          </p>

          <Card className="max-w-md mx-auto">
            <CardContent className="p-8">
              <div className="text-4xl font-bold text-gray-900 mb-6">
                $99/month
              </div>

              <div className="space-y-4 mb-8">
                {[
                  "1 group",
                  "All features",
                  "Unlimited courses",
                  "Unlimited members",
                  "2.9% transaction fee"
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              <Link href="/app/signup">
                <Button size="lg" className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold">
                  Start 14-day free trial
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Transaction Fee Comparison */}
          <div className="mt-16">
            <p className="text-gray-600 mb-8">
              Skool has the cheapest transaction fees.
            </p>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4 text-center">
              {[
                { name: "Patreon", fee: "14%" },
                { name: "Discord", fee: "16%" },
                { name: "Gumroad", fee: "14%" },
                { name: "Kajabi", fee: "4.9%" },
                { name: "Stripe", fee: "4.9%" },
                { name: "Skool", fee: "2.9%" }
              ].map((platform) => (
                <div key={platform.name} className="text-sm">
                  <div className="text-gray-600">{platform.name}</div>
                  <div className="font-semibold text-gray-900">{platform.fee}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything you need to build a thriving community
            </h2>
            <p className="text-lg text-gray-600">
              All the tools you need in one simple platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Users,
                title: "Community",
                description: "Build engaged communities with discussions, polls, and member interactions"
              },
              {
                icon: BookOpen,
                title: "Courses",
                description: "Create and sell online courses with video content and progress tracking"
              },
              {
                icon: Calendar,
                title: "Events",
                description: "Schedule live events, workshops, and community meetups"
              },
              {
                icon: Trophy,
                title: "Gamification",
                description: "Boost engagement with points, levels, badges, and leaderboards"
              }
            ].map((feature) => (
              <div key={feature.title} className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to build your community?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of creators who are building thriving communities on Skool
          </p>
          <Link href="/app/signup">
            <Button size="lg" className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold">
              Start Your Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/pricing" className="hover:text-gray-900">Pricing</Link></li>
                <li><Link href="/features" className="hover:text-gray-900">Features</Link></li>
                <li><Link href="/community" className="hover:text-gray-900">Community</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/help" className="hover:text-gray-900">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-gray-900">Contact</Link></li>
                <li><Link href="/status" className="hover:text-gray-900">Status</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/about" className="hover:text-gray-900">About</Link></li>
                <li><Link href="/careers" className="hover:text-gray-900">Careers</Link></li>
                <li><Link href="/press" className="hover:text-gray-900">Press</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/privacy" className="hover:text-gray-900">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-gray-900">Terms</Link></li>
                <li><Link href="/gdpr" className="hover:text-gray-900">GDPR</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-gray-600">
            <p>&copy; 2024 Skool Clone. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
