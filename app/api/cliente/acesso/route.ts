import { NextRequest, NextResponse } from 'next/server'
import { getClientePorCodigo } from '@/lib/db/queries/area-cliente'

// POST /api/cliente/acesso — valida código e retorna dados básicos do cliente
export async function POST(req: NextRequest) {
  try {
    const { codigo } = await req.json()
    if (!codigo || typeof codigo !== 'string') {
      return NextResponse.json({ error: 'Código obrigatório' }, { status: 400 })
    }

    const cliente = await getClientePorCodigo(codigo.trim().toUpperCase())
    if (!cliente) {
      return NextResponse.json({ error: 'Código não encontrado. Verifique e tente novamente.' }, { status: 404 })
    }

    // Retorna apenas dados públicos (não expõe ID interno)
    return NextResponse.json({
      ok: true,
      codigo: cliente.codigoAcesso,
      nome:   cliente.nome.split(' ')[0], // apenas primeiro nome
    })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
