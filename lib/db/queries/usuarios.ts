import { db } from '../index'
import { usuariosSistema } from '../schema'
import { eq, desc } from 'drizzle-orm'

export type UsuarioRole = 'admin' | 'operador' | 'financeiro' | 'viewer'

export const ROLES: Record<UsuarioRole, { label: string; cor: string; permissoes: string[] }> = {
  admin: {
    label: 'Administrador',
    cor: '#EF4444',
    permissoes: ['dashboard', 'leads', 'brinquedos', 'eventos', 'monitores', 'financeiro', 'usuarios', 'configuracoes'],
  },
  operador: {
    label: 'Operador',
    cor: '#3B82F6',
    permissoes: ['dashboard', 'leads', 'brinquedos', 'eventos', 'monitores'],
  },
  financeiro: {
    label: 'Financeiro',
    cor: '#10B981',
    permissoes: ['dashboard', 'financeiro', 'eventos'],
  },
  viewer: {
    label: 'Visualizador',
    cor: '#6B7280',
    permissoes: ['dashboard'],
  },
}

export async function getUsuarios() {
  try {
    return await db.select().from(usuariosSistema).orderBy(desc(usuariosSistema.createdAt))
  } catch {
    return []
  }
}

export async function getUsuarioById(id: string) {
  const rows = await db.select().from(usuariosSistema).where(eq(usuariosSistema.id, id)).limit(1)
  return rows[0] ?? null
}

export async function createUsuario(data: {
  email: string; nome: string; cargo?: string; role: UsuarioRole
}) {
  return db.insert(usuariosSistema).values({
    email: data.email,
    nome: data.nome,
    cargo: data.cargo,
    role: data.role,
    permissoes: ROLES[data.role]?.permissoes ?? [],
  }).returning()
}

export async function updateUsuario(id: string, data: Partial<{
  email: string; nome: string; cargo: string; role: UsuarioRole; ativo: boolean
}>) {
  const permissoes = data.role ? ROLES[data.role]?.permissoes : undefined
  return db.update(usuariosSistema)
    .set({
      ...data,
      ...(permissoes ? { permissoes } : {}),
      updatedAt: new Date(),
    })
    .where(eq(usuariosSistema.id, id))
    .returning()
}

export async function deleteUsuario(id: string) {
  return db.delete(usuariosSistema).where(eq(usuariosSistema.id, id))
}
