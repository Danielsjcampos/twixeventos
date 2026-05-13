import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { eventos } from '@/lib/db/schema'
import { eq, and, gte, lt, sql, inArray } from 'drizzle-orm'
import { getConfig } from '@/lib/db/queries/configuracoes'
import { sendWhatsAppMessage, interpolate } from '@/lib/whatsapp'

// Executado a cada hora — envia pesquisa para eventos realizados há N horas
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [horasStr, template, ativo] = await Promise.all([
    getConfig('pesquisa_horas_apos'),
    getConfig('pesquisa_mensagem'),
    getConfig('pesquisa_ativo'),
  ])

  if (!ativo || ativo !== 'true') {
    return NextResponse.json({ ok: true, msg: 'Pesquisa desabilitada' })
  }

  const horas = Number(horasStr ?? '24')
  const agora = new Date()
  const alvoInicio = new Date(agora.getTime() - (horas + 1) * 3600000)
  const alvoFim   = new Date(agora.getTime() - horas * 3600000)

  // Buscar eventos que terminaram exatamente N horas atrás
  // Usamos data_evento + horario_fim para calcular quando terminou
  const rows = await db.execute(sql`
    SELECT id, nome_cliente, telefone_cliente, horario_fim, data_evento,
           pesquisa_enviada
    FROM eventos
    WHERE status IN ('realizado', 'confirmado')
      AND pesquisa_enviada IS NOT TRUE
      AND (data_evento::date + COALESCE(horario_fim, '20:00')::time) AT TIME ZONE 'America/Sao_Paulo'
          BETWEEN ${alvoInicio.toISOString()} AND ${alvoFim.toISOString()}
    LIMIT 50
  `)

  const eventosParaEnviar = rows.rows as {
    id: string; nome_cliente: string; telefone_cliente: string
    horario_fim: string; data_evento: string; pesquisa_enviada: boolean | null
  }[]

  let enviados = 0
  for (const ev of eventosParaEnviar) {
    const mensagem = interpolate(template ?? 'Olá {nome}! Como foi seu evento?', {
      nome: ev.nome_cliente,
    })
    const ok = await sendWhatsAppMessage({ telefone: ev.telefone_cliente, mensagem })
    if (ok) {
      // Marcar como enviado (adicionar coluna se não existir)
      try {
        await db.execute(sql`UPDATE eventos SET pesquisa_enviada = true WHERE id = ${ev.id}`)
      } catch {
        // Coluna pode não existir ainda — ignorar
      }
      enviados++
    }
  }

  return NextResponse.json({ ok: true, eventos: eventosParaEnviar.length, enviados })
}
