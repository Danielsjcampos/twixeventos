import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { datasComecorativas, clientes } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'
import { getConfig } from '@/lib/db/queries/configuracoes'
import { sendWhatsAppMessage, interpolate } from '@/lib/whatsapp'

// Cron executado diariamente para enviar mensagens de aniversário
export async function GET(request: Request) {
  // Verificar autorização (Vercel Cron ou chave secreta)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [diasAntesStr, template] = await Promise.all([
    getConfig('aniversario_dias_antes'),
    getConfig('aniversario_mensagem'),
  ])

  const diasAntes = Number(diasAntesStr ?? '3')
  const hoje = new Date()
  const alvo = new Date(hoje.getTime() + diasAntes * 86400000)
  const mesAlvo = (alvo.getMonth() + 1).toString().padStart(2, '0')
  const diaAlvo = alvo.getDate().toString().padStart(2, '0')

  // Buscar aniversariantes no dia alvo
  const rows = await db
    .select({
      nome: datasComecorativas.nome,
      relacao: datasComecorativas.relacao,
      clienteNome: clientes.nome,
      clienteTelefone: clientes.telefone,
      ativo: clientes.ativo,
    })
    .from(datasComecorativas)
    .innerJoin(clientes, eq(datasComecorativas.clienteId, clientes.id))
    .where(
      sql`TO_CHAR(${datasComecorativas.dataNasc}, 'MM-DD') = ${`${mesAlvo}-${diaAlvo}`}`
    )

  let enviados = 0
  const erros: string[] = []

  for (const row of rows) {
    if (!row.ativo) continue
    const mensagem = interpolate(template ?? 'Parabéns {aniversariante}!', {
      nome: row.clienteNome,
      aniversariante: row.nome,
    })
    const ok = await sendWhatsAppMessage({ telefone: row.clienteTelefone, mensagem })
    if (ok) enviados++
    else erros.push(row.clienteTelefone)
  }

  return NextResponse.json({
    ok: true,
    data: `${diaAlvo}/${mesAlvo}`,
    aniversariantes: rows.length,
    enviados,
    erros,
  })
}
