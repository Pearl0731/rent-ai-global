"use client"

import { useState, useEffect } from "react"
import { useTranslations } from 'next-intl'
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"

export default function AgentSettingsPage() {
  const { toast } = useToast()
  const t = useTranslations('dashboard')
  const tCommon = useTranslations('common')
  const tAuth = useTranslations('auth')
  const [loading, setLoading] = useState(false)
  const [payoutLoading, setPayoutLoading] = useState(false)
  const [payoutAccountId, setPayoutAccountId] = useState("")
  const isChina = process.env.NEXT_PUBLIC_APP_REGION === 'china'
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    avatar: "",
    companyName: "",
    licenseNumber: "",
    bio: "",
  })

  useEffect(() => {
    const userStr = localStorage.getItem("user")
    if (userStr) {
      const user = JSON.parse(userStr)
      setFormData(prev => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        avatar: user.avatar || "",
      }))
      if (user.agentProfile?.payoutAccountId) {
        setPayoutAccountId(user.agentProfile.payoutAccountId)
      }
    }
  }, [])

  const handleSave = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("auth-token")
      if (!token) {
        toast({
          title: tCommon('error'),
          description: t('pleaseLoginAgain') || "Please login again",
          variant: "destructive",
        })
        return
      }

      const response = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          avatar: formData.avatar,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem("user", JSON.stringify(data.user))
        toast({
          title: tCommon('success'),
          description: t('profileUpdated') || "Profile updated successfully",
        })
        window.dispatchEvent(new Event("storage"))
      } else {
        const data = await response.json()
        throw new Error(data.error || t('updateProfileFailed') || "Failed to update profile")
      }
    } catch (error: any) {
      toast({
        title: tCommon('error'),
        description: error.message || t('saveSettingsFailed') || "Failed to save settings",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (name: string) => {
    if (!name) return "U"
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
  }

  const handleConnectPayout = async () => {
    setPayoutLoading(true)
    try {
      const token = localStorage.getItem("auth-token")
      if (!token) {
        toast({
          title: tCommon('error'),
          description: t('pleaseLoginAgain') || "Please login again",
          variant: "destructive",
        })
        return
      }
      const response = await fetch("/api/agent/payout-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          payoutAccountId: `agent_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
        }),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || t('saveSettingsFailed') || "Failed to save settings")
      }
      const data = await response.json()
      setPayoutAccountId(data.payoutAccountId)
      const userStr = localStorage.getItem("user")
      if (userStr) {
        const user = JSON.parse(userStr)
        user.payoutAccountId = data.payoutAccountId
        user.verified = true
        user.agentProfile = {
          ...(user.agentProfile || {}),
          payoutAccountId: data.payoutAccountId,
          verified: true,
        }
        localStorage.setItem("user", JSON.stringify(user))
        window.dispatchEvent(new Event("storage"))
      }
      toast({
        title: tCommon('success'),
        description: isChina ? "收款账户已绑定" : "Payout account linked",
      })
    } catch (error: any) {
      const rawMessage = error.message || t('saveSettingsFailed') || "Failed to save settings"
      const description = isChina
        ? (/[A-Za-z]/.test(rawMessage) ? "绑定收款账户失败" : rawMessage)
        : rawMessage
      toast({
        title: tCommon('error'),
        description,
        variant: "destructive",
      })
    } finally {
      setPayoutLoading(false)
    }
  }

  return (
    <DashboardLayout userType="agent">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{t('settings')}</h1>
          <p className="text-muted-foreground">{t('manageAccountSettings') || "Manage your account settings"}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('profileInformation') || "Profile Information"}</CardTitle>
            <CardDescription>{t('updatePersonalAndBusinessInfo') || "Update your personal and business information"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={formData.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${formData.name || 'User'}`} />
                <AvatarFallback className="text-xl">{getInitials(formData.name)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold">{formData.name || tCommon('user')}</div>
                <div className="text-sm text-muted-foreground">{formData.email}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('fullName') || "Full Name"}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{tAuth('email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">{t('emailCannotBeChanged') || "Email cannot be changed"}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">{tAuth('phone')}</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyName">{t('companyName') || "Company Name"}</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder={t('realEstateCompanyPlaceholder') || "Your real estate company"}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="licenseNumber">{t('licenseNumber') || "License Number"}</Label>
              <Input
                id="licenseNumber"
                value={formData.licenseNumber}
                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                placeholder={t('licenseNumberPlaceholder') || "Your real estate license number"}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">{t('bio') || "Bio"}</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder={t('bioPlaceholder') || "Tell clients about yourself..."}
                rows={4}
              />
            </div>

            <Button onClick={handleSave} disabled={loading}>
              {loading ? tCommon('loading') : (t('saveChanges') || "Save Changes")}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{isChina ? "收款账户" : "Payout Account"}</CardTitle>
            <CardDescription>{isChina ? "绑定收款账户以接收佣金" : "Link a payout account to receive commissions"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {payoutAccountId ? (
              <div className="text-sm text-muted-foreground">
                {isChina ? "已绑定账户：" : "Linked account:"} {payoutAccountId}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  {isChina ? "尚未绑定收款账户" : "No payout account linked"}
                </div>
                <Button onClick={handleConnectPayout} disabled={payoutLoading}>
                  {payoutLoading ? tCommon('loading') : (isChina ? "绑定收款账户" : "Link Payout Account")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('notificationPreferences') || "Notification Preferences"}</CardTitle>
            <CardDescription>{t('chooseNotificationMethod') || "Choose how you want to be notified"}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{t('notificationSettingsComingSoon') || "Notification settings coming soon"}</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
