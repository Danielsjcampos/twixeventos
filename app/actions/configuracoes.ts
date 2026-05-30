'use server'

import { revalidatePath } from 'next/cache'
import { setConfig } from '@/lib/db/queries/configuracoes'

export async function saveConfigs(entries: Record<string, string>) {
  await Promise.all(
    Object.entries(entries).map(([chave, valor]) => setConfig(chave, valor))
  )
  revalidatePath('/')
  revalidatePath('/admin/configuracoes')
}

/** Liga/desliga flags de funcionalidades (tracking, leitura, ads do glossário). */
export async function setFlags(entries: Record<string, string>) {
  await Promise.all(
    Object.entries(entries).map(([chave, valor]) => setConfig(chave, valor))
  )
  revalidatePath('/')
  revalidatePath('/admin/analytics')
  revalidatePath('/admin/glossario')
  revalidatePath('/glossario', 'layout')
}
