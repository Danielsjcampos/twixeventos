import { getConfig } from '@/lib/db/queries/configuracoes'

interface SendMessageParams {
  telefone: string
  mensagem: string
}

export async function sendWhatsAppMessage({ telefone, mensagem }: SendMessageParams): Promise<boolean> {
  const [apiUrl, token, instance, ativo] = await Promise.all([
    getConfig('whatsapp_api_url'),
    getConfig('whatsapp_token'),
    getConfig('whatsapp_instance'),
    getConfig('whatsapp_ativo'),
  ])

  if (!ativo || ativo !== 'true') {
    console.log('[WhatsApp] Automação desabilitada')
    return false
  }
  if (!apiUrl || !token) {
    console.error('[WhatsApp] API URL ou token não configurados')
    return false
  }

  const numero = telefone.replace(/\D/g, '')
  const numeroFmt = numero.startsWith('55') ? numero : `55${numero}`

  try {
    // Suporte a 0API e similar
    const body = instance
      ? { phone: numeroFmt, message: mensagem, instance }
      : { phone: numeroFmt, message: mensagem }

    const res = await fetch(`${apiUrl}/message/sendText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      console.error('[WhatsApp] Erro:', await res.text())
      return false
    }
    console.log(`[WhatsApp] Mensagem enviada para ${numeroFmt}`)
    return true
  } catch (e) {
    console.error('[WhatsApp] Exceção:', e)
    return false
  }
}

export function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`)
}
