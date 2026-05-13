import React from 'react';
import { getAllConfigs } from '@/lib/db/queries/configuracoes';
import { HeaderClient } from './HeaderClient';

export async function Header() {
  let configs: Record<string, string> = {};
  
  try {
    configs = await getAllConfigs();
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
