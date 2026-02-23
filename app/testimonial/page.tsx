"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Star } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function TestimonialPage() {
  const router = useRouter()
  const { toast } = useToast()
  const isChina = process.env.NEXT_PUBLIC_APP_REGION === 'china'
  const copy = isChina
    ? {
        title: "写评价",
        subtitle: "分享你的 RentGuard 体验，帮助更多用户做出选择",
        name: "姓名",
        namePlaceholder: "请输入你的姓名",
        role: "身份",
        rolePlaceholder: "例如：租客、房东、中介",
        rating: "评分",
        content: "评价内容",
        contentPlaceholder: "分享你对 RentGuard 的体验与建议...",
        submit: "提交评价",
        submitting: "提交中...",
        emptyContentTitle: "请填写评价",
        emptyContentDesc: "评价内容不能为空",
        successTitle: "感谢你的评价",
        successDesc: "我们已收到你的反馈",
        errorTitle: "提交失败",
        errorDesc: "提交评价失败",
        tenant: "租客",
        landlord: "房东",
        agent: "中介",
      }
    : {
        title: "Share Your Experience",
        subtitle: "Help others by sharing your experience with RentGuard",
        name: "Your Name",
        namePlaceholder: "Enter your name",
        role: "Your Role",
        rolePlaceholder: "e.g., Tenant, Landlord, Agent",
        rating: "Rating",
        content: "Your Review",
        contentPlaceholder: "Share your experience with RentGuard...",
        submit: "Submit Review",
        submitting: "Submitting...",
        emptyContentTitle: "Error",
        emptyContentDesc: "Please write your review",
        successTitle: "Thank you!",
        successDesc: "Your review has been submitted successfully.",
        errorTitle: "Error",
        errorDesc: "Failed to submit review",
        tenant: "Tenant",
        landlord: "Landlord",
        agent: "Agent",
      }
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    content: "",
    rating: 5,
  })

  useEffect(() => {
    const userStr = localStorage.getItem("user")
    if (userStr) {
      const userData = JSON.parse(userStr)
      const roleLabel = userData.userType === "TENANT"
        ? (isChina ? "租客" : "Tenant")
        : userData.userType === "LANDLORD"
          ? (isChina ? "房东" : "Landlord")
          : (isChina ? "中介" : "Agent")
      setUser(userData)
      setFormData(prev => ({
        ...prev,
        name: userData.name || "",
        role: roleLabel,
      }))
    }
  }, [isChina])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.content.trim()) {
      toast({
        title: copy.emptyContentTitle,
        description: copy.emptyContentDesc,
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/testimonials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: copy.successTitle,
          description: copy.successDesc,
        })
        router.push("/")
      } else {
        const data = await response.json()
        throw new Error(data.error || copy.errorDesc)
      }
    } catch (error: any) {
      toast({
        title: copy.errorTitle,
        description: error.message || copy.errorDesc,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-12">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-3xl">{copy.title}</CardTitle>
              <CardDescription>{copy.subtitle}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">{copy.name}</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={copy.namePlaceholder}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">{copy.role}</Label>
                  <Input
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder={copy.rolePlaceholder}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>{copy.rating}</Label>
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFormData({ ...formData, rating: star })}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`h-8 w-8 transition-colors ${
                            star <= formData.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted-foreground"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">{copy.content}</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder={copy.contentPlaceholder}
                    rows={5}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? copy.submitting : copy.submit}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
