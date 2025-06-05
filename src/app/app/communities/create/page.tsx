"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  ArrowLeft,
  Upload,
  Eye,
  Save,
  Globe,
  Lock,
  DollarSign,
  Users,
  Camera,
  Sparkles,
  AlertCircle
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

const categories = [
  "Business",
  "Technology",
  "Art & Creativity",
  "Sports",
  "Design",
  "Marketing",
  "Health & Fitness",
  "Education",
  "Music",
  "Photography",
  "Writing",
  "Gaming"
]

const currencies = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
]

export default function CreateCommunityPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("details")

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    category: "",
    isPrivate: false,
    isFree: true,
    price: 0,
    currency: "USD",
    image: "",
    banner: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Generate slug from name
    if (field === "name" && typeof value === "string") {
      const slug = value.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
      setFormData(prev => ({ ...prev, slug }))
    }

    // Clear errors
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Community name is required"
    }
    if (!formData.slug.trim()) {
      newErrors.slug = "URL slug is required"
    }
    if (!formData.description.trim()) {
      newErrors.description = "Description is required"
    }
    if (!formData.category) {
      newErrors.category = "Category is required"
    }
    if (!formData.isFree && formData.price <= 0) {
      newErrors.price = "Price must be greater than 0 for paid communities"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      setActiveTab("details")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/communities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to create community")
      }

      const community = await response.json()
      toast.success("Community created successfully!")
      router.push(`/app/communities/${community.slug}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create community")
    } finally {
      setIsLoading(false)
    }
  }

  const selectedCurrency = currencies.find(c => c.code === formData.currency)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/app/communities">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Communities
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Community</h1>
          <p className="text-gray-600 mt-1">
            Build a thriving community around your passion
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Community Details</CardTitle>
                  <CardDescription>
                    Basic information about your community
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Community Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="Enter community name"
                      className={errors.name ? "border-red-500" : ""}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="slug">URL Slug *</Label>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 mr-2">
                        skool.com/
                      </span>
                      <Input
                        id="slug"
                        value={formData.slug}
                        onChange={(e) => handleInputChange("slug", e.target.value)}
                        placeholder="community-url"
                        className={errors.slug ? "border-red-500" : ""}
                      />
                    </div>
                    {errors.slug && (
                      <p className="text-sm text-red-500 mt-1">{errors.slug}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      placeholder="Describe what your community is about..."
                      rows={4}
                      className={errors.description ? "border-red-500" : ""}
                    />
                    {errors.description && (
                      <p className="text-sm text-red-500 mt-1">{errors.description}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                      <SelectTrigger className={errors.category ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.category && (
                      <p className="text-sm text-red-500 mt-1">{errors.category}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="private">Private Community</Label>
                      <p className="text-sm text-gray-500">
                        Only invited members can join
                      </p>
                    </div>
                    <Switch
                      id="private"
                      checked={formData.isPrivate}
                      onCheckedChange={(checked) => handleInputChange("isPrivate", checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pricing" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pricing & Monetization</CardTitle>
                  <CardDescription>
                    Set up how you'll monetize your community
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="free">Free Community</Label>
                      <p className="text-sm text-gray-500">
                        Anyone can join for free
                      </p>
                    </div>
                    <Switch
                      id="free"
                      checked={formData.isFree}
                      onCheckedChange={(checked) => handleInputChange("isFree", checked)}
                    />
                  </div>

                  {!formData.isFree && (
                    <>
                      <div>
                        <Label htmlFor="currency">Currency</Label>
                        <Select value={formData.currency} onValueChange={(value) => handleInputChange("currency", value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {currencies.map(currency => (
                              <SelectItem key={currency.code} value={currency.code}>
                                {currency.symbol} {currency.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="price">Monthly Price *</Label>
                        <div className="flex items-center">
                          <span className="text-lg font-medium mr-2">
                            {selectedCurrency?.symbol}
                          </span>
                          <Input
                            id="price"
                            type="number"
                            min="1"
                            step="1"
                            value={formData.price}
                            onChange={(e) => handleInputChange("price", Number(e.target.value))}
                            placeholder="29"
                            className={errors.price ? "border-red-500" : ""}
                          />
                          <span className="text-sm text-gray-500 ml-2">/month</span>
                        </div>
                        {errors.price && (
                          <p className="text-sm text-red-500 mt-1">{errors.price}</p>
                        )}
                      </div>

                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Skool takes a 2.9% transaction fee on all paid memberships.
                          You'll earn {selectedCurrency?.symbol}{(formData.price * 0.971).toFixed(2)} per member per month.
                        </AlertDescription>
                      </Alert>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="media" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Media & Branding</CardTitle>
                  <CardDescription>
                    Upload images to make your community stand out
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label>Community Image</Label>
                    <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-2">
                        Upload a square image (recommended: 400x400px)
                      </p>
                      <Button variant="outline" size="sm">
                        <Upload className="h-4 w-4 mr-2" />
                        Choose File
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label>Banner Image (Optional)</Label>
                    <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-2">
                        Upload a banner image (recommended: 1200x400px)
                      </p>
                      <Button variant="outline" size="sm">
                        <Upload className="h-4 w-4 mr-2" />
                        Choose File
                      </Button>
                    </div>
                  </div>

                  <Alert>
                    <Sparkles className="h-4 w-4" />
                    <AlertDescription>
                      High-quality images help attract more members to your community.
                      Make sure your images are clear and represent your community's purpose.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Preview
              </CardTitle>
              <CardDescription>
                How your community will appear to others
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Community Card Preview */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white text-2xl">🏠</span>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-sm">
                        🏠
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm">
                          {formData.name || "Community Name"}
                        </h3>
                        <p className="text-xs text-gray-600">
                          by {session?.user?.name}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                      {formData.description || "Community description will appear here..."}
                    </p>

                    <div className="flex items-center justify-between text-xs mb-3">
                      <div className="flex items-center text-gray-600">
                        <Users className="h-3 w-3 mr-1" />
                        0 members
                      </div>
                      <div>
                        {formData.isFree ? (
                          <Badge variant="secondary" className="text-xs">Free</Badge>
                        ) : (
                          <span className="font-semibold">
                            {selectedCurrency?.symbol}{formData.price}/month
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {formData.category || "Category"}
                      </Badge>
                      <div className="flex items-center gap-1">
                        {formData.isPrivate ? (
                          <Lock className="h-3 w-3 text-gray-400" />
                        ) : (
                          <Globe className="h-3 w-3 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* URL Preview */}
                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  <span className="font-mono">
                    skool.com/{formData.slug || "community-url"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center border-t pt-6">
        <Button variant="outline" asChild>
          <Link href="/app/communities">
            Cancel
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button variant="outline">
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Community"}
          </Button>
        </div>
      </div>
    </div>
  )
}
