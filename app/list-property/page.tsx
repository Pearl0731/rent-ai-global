"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

export default function ListPropertyPage() {
  const router = useRouter()
  const { toast } = useToast()
  const isChina = process.env.NEXT_PUBLIC_APP_REGION === 'china'
  const copy = isChina
    ? {
        title: "发布房源",
        subtitle: "创建一套可出租的新房源",
        propertyTitle: "房源标题",
        propertyType: "房源类型",
        description: "房源描述",
        address: "详细地址",
        city: "城市",
        state: "省份/州",
        zipCode: "邮编",
        monthlyRent: "月租金（¥）",
        deposit: "押金（¥）",
        bedrooms: "卧室数",
        bathrooms: "卫生间数",
        squareFeet: "面积（㎡）",
        buttonIdle: "发布房源",
        buttonLoading: "创建中...",
        typeApartment: "公寓",
        typeHouse: "住宅",
        typeCondo: "公寓楼",
        typeStudio: "开间",
        typeTownhouse: "联排",
        loginRequiredTitle: "请先登录",
        loginRequiredDesc: "只有登录的房东可以发布房源",
        createSuccessTitle: "房源创建成功",
        createSuccessDesc: "您的房源已成功发布",
        createFailedTitle: "创建失败",
        createFailedDefault: "创建失败",
      }
    : {
        title: "List Your Property",
        subtitle: "Add a new property to rent",
        propertyTitle: "Property Title",
        propertyType: "Property Type",
        description: "Description",
        address: "Address",
        city: "City",
        state: "State",
        zipCode: "Zip Code",
        monthlyRent: "Monthly Rent ($)",
        deposit: "Deposit ($)",
        bedrooms: "Bedrooms",
        bathrooms: "Bathrooms",
        squareFeet: "Square Feet",
        buttonIdle: "List Property",
        buttonLoading: "Creating...",
        typeApartment: "Apartment",
        typeHouse: "House",
        typeCondo: "Condo",
        typeStudio: "Studio",
        typeTownhouse: "Townhouse",
        loginRequiredTitle: "Login Required",
        loginRequiredDesc: "Only logged-in landlords can list a property",
        createSuccessTitle: "Property Created",
        createSuccessDesc: "Your property has been listed successfully",
        createFailedTitle: "Creation Failed",
        createFailedDefault: "Failed to create property",
      }
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    price: "",
    deposit: "",
    bedrooms: "",
    bathrooms: "",
    sqft: "",
    propertyType: "APARTMENT",
    petFriendly: false,
  })

  useEffect(() => {
    const token = localStorage.getItem("auth-token")
    const user = localStorage.getItem("user")
    if (!token || !user) {
      router.replace("/auth/login")
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const token = localStorage.getItem("auth-token")
    if (!token) {
      toast({
        title: copy.loginRequiredTitle,
        description: copy.loginRequiredDesc,
        variant: "destructive",
      })
      router.push("/auth/login")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/properties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          deposit: parseFloat(formData.deposit),
          bedrooms: parseInt(formData.bedrooms),
          bathrooms: parseFloat(formData.bathrooms),
          sqft: formData.sqft ? parseInt(formData.sqft) : null,
          images: [],
          amenities: [],
        }),
      })

      const data = await response.json()
      if (response.ok) {
        toast({
          title: copy.createSuccessTitle,
          description: copy.createSuccessDesc,
        })
        router.push("/dashboard/landlord")
      } else {
        throw new Error(data.error || copy.createFailedDefault)
      }
    } catch (error: any) {
      toast({
        title: copy.createFailedTitle,
        description: error.message,
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
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>{copy.title}</CardTitle>
            <CardDescription>{copy.subtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">{copy.propertyTitle} *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="propertyType">{copy.propertyType} *</Label>
                  <Select
                    value={formData.propertyType}
                    onValueChange={(value) => setFormData({ ...formData, propertyType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="APARTMENT">{copy.typeApartment}</SelectItem>
                      <SelectItem value="HOUSE">{copy.typeHouse}</SelectItem>
                      <SelectItem value="CONDO">{copy.typeCondo}</SelectItem>
                      <SelectItem value="STUDIO">{copy.typeStudio}</SelectItem>
                      <SelectItem value="TOWNHOUSE">{copy.typeTownhouse}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{copy.description} *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">{copy.address} *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">{copy.city} *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">{copy.state} *</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zipCode">{copy.zipCode}</Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">{copy.monthlyRent} *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deposit">{copy.deposit} *</Label>
                  <Input
                    id="deposit"
                    type="number"
                    value={formData.deposit}
                    onChange={(e) => setFormData({ ...formData, deposit: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bedrooms">{copy.bedrooms} *</Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    value={formData.bedrooms}
                    onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bathrooms">{copy.bathrooms} *</Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    step="0.5"
                    value={formData.bathrooms}
                    onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sqft">{copy.squareFeet}</Label>
                <Input
                  id="sqft"
                  type="number"
                  value={formData.sqft}
                  onChange={(e) => setFormData({ ...formData, sqft: e.target.value })}
                />
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? copy.buttonLoading : copy.buttonIdle}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  )
}
