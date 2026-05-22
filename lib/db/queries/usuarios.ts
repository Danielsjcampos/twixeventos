import { db } from '../index'
import { usuariosSistema, adminUsers } from '../schema'
import { eq, desc } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

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
  email: string; nome: string; cargo?: string; role: UsuarioRole; senha?: string
}) {
  const [usuario] = await db.insert(usuariosSistema).values({
    email: data.email,
    nome: data.nome,
    cargo: data.cargo,
    role: data.role,
    permissoes: ROLES[data.role]?.permissoes ?? [],
  }).returning()

  // Sincroniza admin_users para login
  if (data.senha) {
    const passwordHash = await bcrypt.hash(data.senha, 10)
    await db.insert(adminUsers)
      .values({ email: data.email, nome: data.nome, passwordHash })
      .onConflictDoUpdate({
        target: adminUsers.email,
        set: { passwordHash, nome: data.nome },
      })
  }

  return [usuario]
}

export async function updateUsuario(id: string, data: Partial<{
  email: string; nome: string; cargo: string; role: UsuarioRole; ativo: boolean; senha: string
}>) {
  const { senha, ...rest } = data
  const permissoes = rest.role ? ROLES[rest.role]?.permissoes : undefined
  const [usuario] = await db.update(usuariosSistema)
    .set({
      ...rest,
      ...(permissoes ? { permissoes } : {}),
      updatedAt: new Date(),
    })
    .where(eq(usuariosSistema.id, id))
    .returning()

  // Atualiza senha em admin_users se fornecida
  if (senha && usuario) {
    const passwordHash = await bcrypt.hash(senha, 10)
    await db.insert(adminUsers)
      .values({ email: usuario.email, nome: usuario.nome, passwordHash })
      .onConflictDoUpdate({
        target: adminUsers.email,
        set: { passwordHash },
      })
  }

  return [usuario]
}

export async function deleteUsuario(id: string) {
  return db.delete(usuariosSistema).where(eq(usuariosSistema.id, id))
}
