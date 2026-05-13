import { NextResponse } from 'next/server'
import { getLeadsSemInteracao, addInteracao } from '@/lib/db/queries/leads'

export async function GET(req: Request) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const leadsSemResposta = await getLeadsSemInteracao(48)
  for (const lead of leadsSemResposta) {
    await addInteracao({
      leadId:   lead.id,
      tipo:     'sistema',
      conteudo: `⚠️ Lead sem interação há mais de 48h. Status: ${lead.status}`,
    })
  }

  return NextResponse.json({ processed: leadsSemResposta.length })
}
