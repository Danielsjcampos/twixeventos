export function AuthorityBar() {
  const stats = [
    { value: '+455', label: 'Avaliações Google', suffix: '⭐' },
    { value: '+24',  label: 'Brinquedos Disponíveis', suffix: '' },
    { value: 'Desde 2015', label: 'Anos de Experiência', suffix: '' },
    { value: 'SJC',  label: 'e Vale do Paraíba', suffix: '' },
  ]

  return (
    <div className="bg-brand-surface border-t border-b border-brand-border py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0">
          {stats.map((stat, index) => (
            <div key={stat.label} className="flex flex-col items-center text-center relative">
              {index < stats.length - 1 && (
                <span className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 h-10 w-px bg-brand-border" />
              )}
              <span className="text-2xl font-black text-brand-text">
                {stat.value}
                {stat.suffix && <span className="ml-1">{stat.suffix}</span>}
              </span>
              <span className="text-brand-muted text-sm mt-1">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
