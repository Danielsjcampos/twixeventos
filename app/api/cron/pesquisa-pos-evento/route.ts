import { NextResponse } from 'next/server'
import { rawSql } from '@/lib/db'
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

  const eventosParaEnviar = await rawSql<Array<{
    id: string; nome_cliente: string; telefone_cliente: string
    horario_fim: string; data_evento: string; pesquisa_enviada: boolean | null
  }>>`
    SELECT id, nome_cliente, telefone_cliente, horario_fim, data_evento, pesquisa_enviada
    FROM eventos
    WHERE status IN ('realizado', 'confirmado')
      AND pesquisa_enviada IS NOT TRUE
      AND (data_evento::date + COALESCE(horario_fim, '20:00')::time) AT TIME ZONE 'America/Sao_Paulo'
          BETWEEN ${alvoInicio.toISOString()} AND ${alvoFim.toISOString()}
    LIMIT 50
  `

  let enviados = 0
  for (const ev of eventosParaEnviar) {
    const mensagem = interpolate(template ?? 'Olá {nome}! Como foi seu evento?', {
      nome: ev.nome_cliente,
    })
    const ok = await sendWhatsAppMessage({ telefone: ev.telefone_cliente, mensagem })
    if (ok) {
      try {
        await rawSql`UPDATE eventos SET pesquisa_enviada = true WHERE id = ${ev.id}`
      } catch {
        // Coluna pode não existir ainda — ignorar
      }
      enviados++
    }
  }

  return NextResponse.json({ ok: true, eventos: eventosParaEnviar.length, enviados })
}
