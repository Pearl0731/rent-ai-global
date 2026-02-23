"use client"

import { useState, useEffect } from "react"
import { useTranslations } from 'next-intl'
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DollarSign, TrendingUp, Calendar, Download, AlertTriangle, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { getCurrencySymbol } from "@/lib/utils"
import Link from "next/link"

export default function AgentEarningsPage() {
  const { toast } = useToast()
  const t = useTranslations('dashboard')
  const tCommon = useTranslations('common')
  const currencySymbol = getCurrencySymbol()
  const [earnings, setEarnings] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalEarnings: 0,
    thisMonth: 0,
    pendingPayouts: 0,
  })
  const [hasPayoutAccount, setHasPayoutAccount] = useState(true)
  const [loading, setLoading] = useState(true)
  const isChina = process.env.NEXT_PUBLIC_APP_REGION === 'china'

  useEffect(() => {
    fetchEarnings()
  }, [])

  const fetchEarnings = async () => {
    try {
      const token = localStorage.getItem("auth-token")
      if (!token) return
      const userStr = localStorage.getItem("user")
      let localHasPayoutAccount = false
      if (userStr) {
        try {
          const localUser = JSON.parse(userStr)
          localHasPayoutAccount = !!(localUser?.payoutAccountId || localUser?.verified || localUser?.agentProfile?.payoutAccountId || localUser?.agentProfile?.verified)
        } catch {}
      }

      const response = await fetch("/api/agent/earnings", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setEarnings(data.earnings || [])
        setStats({
          totalEarnings: data.totalEarnings || 0,
          thisMonth: data.thisMonth || 0,
          pendingPayouts: data.pendingPayouts || 0,
        })
        setHasPayoutAccount(localHasPayoutAccount || data.hasPayoutAccount !== false) // Default to true if undefined
      }
    } catch (error) {
      console.error("Failed to fetch earnings:", error)
    } finally {
      setLoading(false)
    }
  }

  const renderEarningStatus = (status?: string) => {
    const normalized = String(status || '').toUpperCase()
    if (!isChina) {
      if (normalized === "PENDING_RELEASE") return "Held in Escrow"
      return status || (t('pending') || "Pending")
    }
    if (normalized === "PAID") return "已支付"
    if (normalized === "PENDING_RELEASE") return "托管中"
    if (normalized === "PENDING") return "待处理"
    return normalized || "待处理"
  }

  const handleExport = () => {
    const headers = isChina
      ? ["日期", "房源", "租客", "佣金", "总租金", "状态"]
      : ["Date", "Property", "Tenant", "Commission", "Total Rent", "Status"]
    const rows = (earnings || []).map((earning: any) => ([
      earning.createdAt ? new Date(earning.createdAt).toLocaleDateString() : "",
      earning.propertyTitle || "",
      earning.tenantName || "",
      `${currencySymbol}${earning.amount?.toLocaleString() || 0}`,
      `${currencySymbol}${earning.totalRent?.toLocaleString() || 0}`,
      renderEarningStatus(earning.status),
    ]))
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell || "").replace(/"/g, '""')}"`).join(","))
      .join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = isChina ? "收益报告.csv" : "earnings-report.csv"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast({
      title: tCommon('success'),
      description: isChina ? "报告已导出" : "Report exported",
    })
  }

  return (
    <DashboardLayout userType="agent">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">{t('earnings')}</h1>
            <p className="text-muted-foreground">{t('trackCommission') || "Track your commission and income"}</p>
          </div>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            {t('exportReport') || "Export Report"}
          </Button>
        </div>

        {/* Payout Account Alert */}
        {!hasPayoutAccount && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{isChina ? "缺少收款账户" : "Missing Payout Account"}</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>
                {isChina
                  ? "您尚未绑定收款账户，暂时无法领取佣金。"
                  : "You haven't linked a payout account yet. You won't be able to receive your commissions."}
              </span>
              <Button variant="outline" size="sm" className="ml-4" asChild>
                <Link href="/dashboard/agent/settings">
                  {isChina ? "去绑定" : "Link Account"}
                </Link>
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {isChina ? "已结算佣金" : (t('totalEarnings') || "Total Earnings")}
                  </p>
                  <p className="text-2xl font-bold">{currencySymbol}{stats.totalEarnings.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {isChina ? "本月已结算" : (t('thisMonth') || "This Month")}
                  </p>
                  <p className="text-2xl font-bold">{currencySymbol}{stats.thisMonth.toLocaleString()}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {isChina ? "待结算佣金" : (t('pendingPayouts') || "Pending Payouts")}
                  </p>
                  <p className="text-2xl font-bold">{currencySymbol}{stats.pendingPayouts.toLocaleString()}</p>
                </div>
                <Calendar className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('earningsHistory') || "Earnings History"}</CardTitle>
            <CardDescription>{t('commissionPayments') || "Your commission payments"}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">{tCommon('loading')}</div>
            ) : earnings.length > 0 ? (
              <div className="space-y-4">
                {earnings.map((earning: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{earning.description || (t('commissionPayment') || "Commission Payment")}</h3>
                        <Badge variant="outline" className="text-xs font-normal">
                          {earning.propertyTitle || "Property"}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {isChina ? "租客：" : "Tenant:"} {earning.tenantName || (isChina ? "未知" : "Unknown")}
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground mt-1">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(earning.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-lg text-green-600">
                        +{currencySymbol}{earning.amount?.toLocaleString() || 0}
                      </div>
                      <div className="text-xs text-muted-foreground mb-1">
                        {isChina ? "总租金：" : "Total Rent:"} {currencySymbol}{earning.totalRent?.toLocaleString()}
                      </div>
                      <Badge variant={earning.status === "PAID" ? "default" : (earning.status === "PENDING_RELEASE" ? "secondary" : "outline")}>
                        {renderEarningStatus(earning.status)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>{t('noEarningsYet') || "No earnings yet"}</p>
                <p className="text-sm mt-2">{t('completeDealsToEarn') || "Complete deals to start earning commissions"}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
