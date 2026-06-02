import React from 'react';
import { unstable_cache } from 'next/cache';
import { getAllConfigs } from '@/lib/db/queries/configuracoes';
import { HeaderClient } from './HeaderClient';

// Cache server-side das configs (roda em toda página) — revalida a cada 5 min.
const getConfigsCache = unstable_cache(
  () => getAllConfigs(),
  ['public-header-configs'],
  { revalidate: 300 },
);

export async function Header() {
  let configs: Record<string, string> = {};

  try {
    configs = await getConfigsCache();
  } catch (error) {
    console.error('Error fetching configs for header:', error);
  }

  return (
    <HeaderClient 
      logoUrl={configs['logo_url']} 
      bannerAtivo={configs['banner_ativo']} 
      bannerTexto={configs['banner_texto']} 
    />
  );
}
