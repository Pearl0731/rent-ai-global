import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-adapter'
import { getAppRegion, getDatabaseAdapter } from '@/lib/db-adapter'

export async function POST(request: NextRequest) {
  try {
    const region = getAppRegion()
    const isChina = region === 'china'
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(
        { error: isChina ? '未登录' : 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { payoutAccountId } = body

    if (!payoutAccountId) {
      return NextResponse.json(
        { error: isChina ? '缺少收款账户ID' : 'Payout Account ID is required' },
        { status: 400 }
      )
    }

    const db = getDatabaseAdapter()
    const updateData = region === 'china'
      ? { verified: true, payoutAccountId }
      : { verified: true }
    const createData = region === 'china'
      ? { userId: user.id, verified: true, payoutAccountId }
      : { userId: user.id, verified: true }
    let agentProfile: any[] = []
    try {
      agentProfile = await db.query('agentProfiles', { userId: user.id })
    } catch {
      agentProfile = []
    }
    try {
      if (agentProfile && agentProfile.length > 0) {
        await db.update('agentProfiles', agentProfile[0].id, updateData)
      } else {
        await db.create('agentProfiles', createData)
      }
    } catch (profileError) {
      if (!isChina) {
        throw profileError
      }
    }
    if (isChina) {
      try {
        await db.update('users', user.id, { payoutAccountId, verified: true })
      } catch {}
    }

    return NextResponse.json({ success: true, payoutAccountId })
  } catch (error: any) {
    console.error('Update payout settings error:', error)
    const region = getAppRegion()
    const isChina = region === 'china'
    return NextResponse.json(
      { error: isChina ? '更新收款账户失败' : 'Failed to update payout settings', details: error.message },
      { status: 500 }
    )
  }
}
