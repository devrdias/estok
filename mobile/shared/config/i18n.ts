import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

const DEFAULT_LOCALE = 'pt';

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
      },
      newCount: {
        title: 'Nova contagem',
        stockLabel: 'Estoque',
        valueToConsider: 'Valor a considerar',
        salesValue: 'Valor de venda',
        costValue: 'Valor de custo',
      },
      settings: {
        title: 'Configurações',
        language: 'Idioma',
        account: 'Conta',
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
      },
      newCount: {
        title: 'New count',
        stockLabel: 'Stock',
        valueToConsider: 'Value to consider',
        salesValue: 'Sales value',
        costValue: 'Cost value',
      },
      settings: {
        title: 'Settings',
        language: 'Language',
        account: 'Account',
      },
    },
  },
};

/**
 * Initialize i18n with PT and EN. Uses device locale if supported, else PT.
 */
export function initI18n(): void {
  const deviceLocale = Localization.getLocales()[0]?.languageCode ?? DEFAULT_LOCALE;
  const lng = deviceLocale.startsWith('pt') ? 'pt' : deviceLocale.startsWith('en') ? 'en' : DEFAULT_LOCALE;

  i18n.use(initReactI18next).init({
    resources,
    lng,
    fallbackLng: DEFAULT_LOCALE,
    supportedLngs: ['pt', 'en'],
    interpolation: { escapeValue: false },
  });
}

export default i18n;
