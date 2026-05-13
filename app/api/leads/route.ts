import { NextResponse } from 'next/server'
import { createLead } from '@/lib/db/queries/leads'
import { leadSchema } from '@/lib/validations/lead'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = leadSchema.parse(body)
    const lead = await createLead({
      ...data,
      email: data.email || null,
      origem: data.origem ?? 'site',
    })
    return NextResponse.json({ success: true, id: lead.id }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/leads]', error)
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }
}
