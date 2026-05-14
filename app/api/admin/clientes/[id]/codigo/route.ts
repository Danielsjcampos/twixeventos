import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { ensureCodigoAcesso } from '@/lib/db/queries/area-cliente'
import { getConfig } from '@/lib/db/queries/configuracoes'
import { db } from '@/lib/db'
import { clientes } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { sendWhatsAppMessage } from '@/lib/whatsapp'

// POST /api/admin/clientes/[id]/codigo — gera código e envia via WhatsApp
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const codigo = await ensureCodigoAcesso(id)

  // Buscar telefone do cliente
  const [cliente] = await db
    .select({ nome: clientes.nome, telefone: clientes.telefone })
    .from(clientes)
    .where(eq(clientes.id, id))

  if (!cliente) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })

  // Montar URL da área do cliente
  const siteUrl = (await getConfig('site_url')) ?? 'https://twixeventos.com'
  const urlArea = `${siteUrl.replace(/\/$/, '')}/minha-area`

  const mensagem =
    `Olá ${cliente.nome.split(' ')[0]}! 🎉\n\n` +
    `Seu acesso à *Área do Cliente* Twix Eventos está pronto!\n\n` +
    `🔑 *Seu código único:* ${codigo}\n\n` +
    `Acesse agora e acompanhe suas reservas, histórico de festas e seu saldo de cashback:\n` +
    `👉 ${urlArea}\n\n` +
    `_Guarde este código — ele é a sua chave de acesso._`

  let enviado = false
  try {
    await sendWhatsAppMessage({ telefone: cliente.telefone, mensagem })
    enviado = true
  } catch {
    // Não bloquear — retorna código mesmo se WhatsApp falhar
  }

  return NextResponse.json({ codigo, enviado, urlArea })
}
