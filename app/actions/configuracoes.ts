'use server'

import { revalidatePath } from 'next/cache'
import { setConfig } from '@/lib/db/queries/configuracoes'
import { GKEYS, desconectarGoogle } from '@/lib/google/oauth'

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

/** Salva o site do Search Console e a propriedade GA4 usados na integração Google. */
export async function salvarConfigGoogle(entries: { gscSite?: string; ga4Property?: string }) {
  if (entries.gscSite !== undefined) {
    await setConfig(GKEYS.gscSite, entries.gscSite.trim(), 'Site do Search Console')
  }
  if (entries.ga4Property !== undefined) {
    await setConfig(GKEYS.ga4Property, entries.ga4Property.trim(), 'Propriedade GA4 (somente números)')
  }
  revalidatePath('/admin/analytics')
}

/** Desconecta a conta Google (remove refresh token salvo). */
export async function desconectarContaGoogle() {
  await desconectarGoogle()
  revalidatePath('/admin/analytics')
}
