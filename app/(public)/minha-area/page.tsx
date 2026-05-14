import type { Metadata } from 'next'
import { AreaClienteLogin } from '@/components/public/AreaClienteLogin'

export const metadata: Metadata = {
  title: 'Minha Área | Twix Eventos',
  description: 'Acesse sua área do cliente, acompanhe suas reservas e veja seu cashback acumulado.',
}

export default function MinhaAreaPage() {
  return <AreaClienteLogin />
}
