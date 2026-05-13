import type { Metadata } from 'next'
import { getUsuarios } from '@/lib/db/queries/usuarios'
import { UsuariosClient } from '@/components/admin/UsuariosClient'

export const metadata: Metadata = { title: 'Usuários' }
export const dynamic = 'force-dynamic'

export default async function UsuariosPage() {
  const usuarios = await getUsuarios()
  return <UsuariosClient usuariosInicial={usuarios as Parameters<typeof UsuariosClient>[0]['usuariosInicial']} />
}
