"use client"

import { useTranslations } from 'next-intl'
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { getCurrencySymbol } from "@/lib/utils"

export default function ApplicationsPage() {
  const router = useRouter()
  const t = useTranslations('dashboard')
  const tApplication = useTranslations('application')
  const tCommon = useTranslations('common')
  const tPayment = useTranslations('payment')
  const currencySymbol = getCurrencySymbol()
  const isChina = process.env.NEXT_PUBLIC_APP_REGION === 'china'
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const renderStatus = (status?: string) => {
    const s = (status || '').toUpperCase()
    switch (s) {
      case 'APPROVED':
        return tApplication('approved')
      case 'AGENT_APPROVED':
        return tApplication('agentApproved')
      case 'PENDING':
        return tApplication('pending')
      case 'REJECTED':
        return tApplication('rejected')
      case 'WITHDRAWN':
        return tApplication('withdrawn')
      case 'UNDER_REVIEW':
        return tApplication('underReview')
      default:
        return tApplication('status')
    }
  }

  const getStatusColor = (status?: string) => {
    const s = (status || '').toUpperCase()
    switch (s) {
      case 'APPROVED': 
        return "bg-green-500 hover:bg-green-600 border-transparent text-white"
      case 'AGENT_APPROVED':
        return "bg-yellow-500 hover:bg-yellow-600 border-transparent text-white"
      case 'REJECTED': 
        return "bg-red-500 hover:bg-red-600 border-transparent text-white"
      case 'PENDING': 
      case 'UNDER_REVIEW':
        return "bg-secondary hover:bg-secondary/80 border-transparent text-secondary-foreground"
      case 'WITHDRAWN':
        return "text-foreground border-input bg-background hover:bg-accent hover:text-accent-foreground" // outline style
      default: 
        return "bg-secondary hover:bg-secondary/80 border-transparent text-secondary-foreground"
    }
  }

  useEffect(() => {
    fetchApplications()
  }, [])

  const uniqueApplications = useMemo(() => {
    const map = new Map<string, any>()
    applications.forEach((application) => {
      const tenantId = application.tenantId || application.tenant?.id
      const propertyId = application.propertyId || application.property?.id
      const key = tenantId || propertyId
        ? `tenant:${String(tenantId || 'unknown')}|property:${String(propertyId || 'unknown')}`
        : `id:${String(application.id || '')}`
      const existing = map.get(key)
      const nextTime = new Date(application.appliedDate || application.createdAt || 0).getTime()
      const existingTime = existing ? new Date(existing.appliedDate || existing.createdAt || 0).getTime() : 0
      if (!existing || nextTime >= existingTime) {
        map.set(key, application)
      }
    })
    return Array.from(map.values())
  }, [applications])

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem("auth-token")
      if (!token) return

      const response = await fetch("/api/applications?userType=tenant", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setApplications(data.applications || [])
      }
    } catch (error) {
      console.error("Failed to fetch applications:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout userType="tenant">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{tApplication('title')}</h1>
          <p className="text-muted-foreground">{t('trackApplicationStatus') || "Track your application status"}</p>
        </div>

        {loading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">{tCommon('loading')}</p>
            </CardContent>
          </Card>
        ) : uniqueApplications.length > 0 ? (
          <div className="space-y-4">
            {uniqueApplications.map((application) => (
              <Card key={application.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-lg">{application.property?.title || t('property') || "Property"}</div>
                      <div className="text-sm text-muted-foreground">
                        {t('appliedOn') || "Applied on"} {new Date(application.appliedDate || application.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {t('deposit') || "Deposit"}: {currencySymbol}{(application.depositAmount || 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(application.status)}>
                        {renderStatus(application.status)}
                      </Badge>
                      {(application.status || '').toUpperCase() === 'APPROVED' || (application.status || '').toUpperCase() === 'AGENT_APPROVED' ? (
                        <div className="mt-2 text-xs text-muted-foreground">
                          {tPayment('status') || "Status"}: {tPayment('pending') || "Pending Payment"}
                        </div>
                      ) : null}
                      <div className="mt-2">
                        <div className="flex items-center justify-end gap-2">
                          {((application.status || '').toUpperCase() === 'APPROVED' || (application.status || '').toUpperCase() === 'AGENT_APPROVED') ? (
                            <Button 
                              size="sm" 
                              onClick={() => router.push(`/dashboard/tenant/payments`)}
                            >
                              {tPayment('title') || "Pay"}
                            </Button>
                          ) : null}
                          {((application.status || '').toUpperCase() === 'REJECTED') ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/dashboard/tenant/apply?propertyId=${application.propertyId}`)}
                            >
                              {isChina ? "重新申请" : "Reapply"}
                            </Button>
                          ) : null}
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => router.push(`/dashboard/tenant/property/${application.propertyId}`)}
                          >
                            {tCommon('view') || "View"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">{t('noApplicationsYet') || "No applications yet. Start applying to properties!"}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
