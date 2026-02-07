import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as SecureStore from 'expo-secure-store';

const DEFAULT_LOCALE = 'pt';
const LANGUAGE_STORAGE_KEY = 'app_language';

const resources = {
  pt: {
    translation: {
      common: {
        ok: 'OK',
        cancel: 'Cancelar',
        back: 'Voltar',
        create: 'Criar',
        filter: 'Filtrar',
        logout: 'Sair',
      },
      home: {
        title: 'Tela Inicial',
        tabLabel: 'Início',
        description: 'Ao logar no sistema o usuário será direcionado para esta tela, onde poderá ir para a tela de contagens, tela de configurações ou deslogar.',
        count: 'Contagem',
        settings: 'Configurações',
      },
      auth: {
        login: 'Entrar',
        loginWithGoogle: 'Entrar com Google',
      },
      counts: {
        title: 'Contagens',
        newCount: 'Abrir nova contagem',
        code: 'Código',
        stock: 'Estoque',
        startDate: 'Data de início',
        endDate: 'Data de finalização',
        status: 'Status',
        inProgress: 'em andamento',
        finished: 'finalizado',
        actions: 'Ações',
        continue: 'Continuar',
        verify: 'Conferir',
        delete: 'Excluir',
        deleteConfirmTitle: 'Excluir contagem',
        deleteConfirmMessage: 'Tem certeza que deseja excluir esta contagem? Esta ação não pode ser desfeita.',
        dateFrom: 'Data de',
        dateTo: 'Data até',
        allStocks: 'Todos os estoques',
        allStatuses: 'Todos',
        finalize: 'Finalizar contagem',
        finalizedSuccess: 'Contagem finalizada.',
        viewOnly: 'Contagem finalizada (somente leitura)',
        balance: 'Saldo',
        velocity: 'Velocidade (%/dia)',
        divergenceTitle: 'Divergência',
        divergenceMessage: 'Quantidade contada diferente do sistema. Deseja refazer a contagem?',
        keepCount: 'Não, registrar assim',
        refillCount: 'Sim, refazer',
        countedAt: 'Data/hora da contagem',
        pdvOfflineTitle: 'PDV offline',
        pdvOfflineMessage: 'Conecte o(s) PDV(s) vinculado(s) ao estoque antes de registrar.',
        transferPendingTitle: 'Transferência pendente',
        transferPendingMessage: 'Finalize as transferências pendentes deste produto antes de registrar.',
        staleBanner: '{{count}} contagem(ns) em andamento há mais de {{days}} dias',
      },
      newCount: {
        title: 'Nova contagem',
        stockLabel: 'Estoque',
        structureLabel: 'Estrutura mercadológica',
        allCategories: 'Todas',
        valueToConsider: 'Valor a considerar',
        salesValue: 'Valor de venda',
        costValue: 'Valor de custo',
      },
      settings: {
        title: 'Configurações',
        language: 'Idioma',
        theme: 'Aparência',
        themeSystem: 'Sistema',
        themeLight: 'Claro',
        themeDark: 'Escuro',
        account: 'Conta',
        countProductSort: 'Ordem da lista na contagem',
        sortByName: 'Nome',
        sortByCode: 'Código',
        sortByValue: 'Valor',
      },
    },
  },
  en: {
    translation: {
      common: {
        ok: 'OK',
        cancel: 'Cancel',
        back: 'Back',
        create: 'Create',
        filter: 'Filter',
        logout: 'Log out',
      },
      home: {
        title: 'Home',
        tabLabel: 'Home',
        description: 'After logging in, you will be directed to this screen where you can go to counts, settings, or log out.',
        count: 'Count',
        settings: 'Settings',
      },
      auth: {
        login: 'Log in',
        loginWithGoogle: 'Sign in with Google',
      },
      counts: {
        title: 'Counts',
        newCount: 'Open new count',
        code: 'Code',
        stock: 'Stock',
        startDate: 'Start date',
        endDate: 'End date',
        status: 'Status',
        inProgress: 'in progress',
        finished: 'finished',
        actions: 'Actions',
        continue: 'Continue',
        verify: 'Verify',
        delete: 'Delete',
        deleteConfirmTitle: 'Delete count',
        deleteConfirmMessage: 'Are you sure you want to delete this count? This action cannot be undone.',
        dateFrom: 'From date',
        dateTo: 'To date',
        allStocks: 'All stocks',
        allStatuses: 'All',
        finalize: 'Finalize count',
        finalizedSuccess: 'Count finalized.',
        viewOnly: 'Count finalized (read-only)',
        balance: 'Balance',
        velocity: 'Velocity (%/day)',
        divergenceTitle: 'Divergence',
        divergenceMessage: 'Counted quantity differs from system. Do you want to recount?',
        keepCount: 'No, register as is',
        refillCount: 'Yes, recount',
        countedAt: 'Count date/time',
        pdvOfflineTitle: 'PDV offline',
        pdvOfflineMessage: 'Connect the PDV(s) linked to this stock before registering.',
        transferPendingTitle: 'Pending transfer',
        transferPendingMessage: 'Complete pending transfers for this product before registering.',
        staleBanner: '{{count}} count(s) in progress for more than {{days}} days',
      },
      newCount: {
        title: 'New count',
        stockLabel: 'Stock',
        structureLabel: 'Product structure (category)',
        allCategories: 'All',
        valueToConsider: 'Value to consider',
        salesValue: 'Sales value',
        costValue: 'Cost value',
      },
      settings: {
        title: 'Settings',
        language: 'Language',
        theme: 'Appearance',
        themeSystem: 'System',
        themeLight: 'Light',
        themeDark: 'Dark',
        account: 'Account',
        countProductSort: 'Product list order in count',
        sortByName: 'Name',
        sortByCode: 'Code',
        sortByValue: 'Value',
      },
    },
  },
};

/**
 * Initialize i18n with PT and EN. Default language is PT; user can switch to EN in Settings.
 */
export function initI18n(): void {
  i18n.use(initReactI18next).init({
    resources,
    lng: DEFAULT_LOCALE,
    fallbackLng: DEFAULT_LOCALE,
    supportedLngs: ['pt', 'en'],
    interpolation: { escapeValue: false },
  });
}

export type SupportedLng = 'pt' | 'en';

/**
 * Read persisted language preference. Call after init to apply user choice.
 */
export async function getStoredLanguage(): Promise<SupportedLng | null> {
  try {
    const value = await SecureStore.getItemAsync(LANGUAGE_STORAGE_KEY);
    if (value === 'pt' || value === 'en') return value;
  } catch {
    // ignore
  }
  return null;
}

/**
 * Persist language preference and change i18n language.
 */
export async function setStoredLanguage(lng: SupportedLng): Promise<void> {
  try {
    await SecureStore.setItemAsync(LANGUAGE_STORAGE_KEY, lng);
    await i18n.changeLanguage(lng);
  } catch {
    i18n.changeLanguage(lng);
  }
}

export default i18n;
