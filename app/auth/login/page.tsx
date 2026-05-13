'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { User, Lock, ArrowRight, Zap } from 'lucide-react'
import { SmokeyBackground } from '@/components/ui/smokey-background'

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
})
type FormData = z.infer<typeof schema>

const DEV_EMAIL = 'admin@twixeventos.com'
const DEV_PASSWORD = 'twix@2025'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const fillDevCredentials = () => {
    setValue('email', DEV_EMAIL)
    setValue('password', DEV_PASSWORD)
  }

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })
      if (result?.error) {
        toast.error('Email ou senha incorretos')
      } else {
        router.push('/admin/dashboard')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative w-screen h-screen bg-gray-950 flex items-center justify-center overflow-hidden">
      <SmokeyBackground className="absolute inset-0" color="#2563EB" backdropBlurAmount="sm" />
      
      <div className="relative z-10 w-full max-w-sm p-8 space-y-6 bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 shadow-2xl mx-4">
        <div className="text-center">
          <h2 className="text-3xl font-black text-white tracking-tight uppercase">TWIX <span className="text-blue-400">EVENTOS</span></h2>
          <p className="mt-2 text-sm text-gray-300">Painel Administrativo</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 pt-4">
          {/* Email Input with Animated Label */}
          <div className="relative z-0">
            <input
              type="email"
              id="floating_email"
              className="block py-2.5 px-0 w-full text-sm text-white bg-transparent border-0 border-b-2 border-gray-400/50 appearance-none focus:outline-none focus:ring-0 focus:border-blue-400 peer"
              placeholder=" " 
              {...register('email')}
            />
            <label
              htmlFor="floating_email"
              className="absolute text-sm text-gray-300 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-blue-400 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
            >
              <User className="inline-block mr-2 -mt-1" size={16} />
              E-mail
            </label>
            {errors.email && <p className="absolute -bottom-5 left-0 text-red-400 text-xs">{errors.email.message}</p>}
          </div>

          {/* Password Input with Animated Label */}
          <div className="relative z-0">
            <input
              type="password"
              id="floating_password"
              className="block py-2.5 px-0 w-full text-sm text-white bg-transparent border-0 border-b-2 border-gray-400/50 appearance-none focus:outline-none focus:ring-0 focus:border-blue-400 peer"
              placeholder=" "
              {...register('password')}
            />
            <label
              htmlFor="floating_password"
              className="absolute text-sm text-gray-300 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-blue-400 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
            >
              <Lock className="inline-block mr-2 -mt-1" size={16} />
              Senha
            </label>
            {errors.password && <p className="absolute -bottom-5 left-0 text-red-400 text-xs">{errors.password.message}</p>}
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="group w-full flex items-center justify-center py-3 px-4 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_25px_rgba(37,99,235,0.6)] mt-4"
          >
            {loading ? 'Entrando...' : 'Acessar Painel'}
            {!loading && <ArrowRight className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform" />}
          </button>

          {process.env.NODE_ENV === 'development' && (
            <div className="pt-2">
              <button
                type="button"
                onClick={fillDevCredentials}
                className="w-full flex items-center justify-center gap-2 border border-dashed border-white/20 hover:border-blue-400/50 hover:bg-blue-400/10 text-gray-300 hover:text-blue-300 text-xs py-3 rounded-xl transition-colors"
              >
                <Zap className="w-3.5 h-3.5" />
                Acesso rápido — Dev ({DEV_EMAIL})
              </button>
            </div>
          )}
        </form>
        
        <p className="text-center text-xs text-gray-400/80 pt-4">
          Twix Eventos © 2025 — Sistema Interno
        </p>
      </div>
    </main>
  )
}
