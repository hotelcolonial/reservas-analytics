/**
 * Camada de persistência abstraída.
 *
 * Hoje os dados vivem em localStorage, mas toda leitura/escrita passa por
 * `StorageAdapter`. Para migrar a Supabase/Postgres no futuro, basta criar um
 * `supabaseAdapter` que implemente a mesma interface e trocá-lo aqui — nenhum
 * componente nem o store precisam mudar.
 */
export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** Implementação sobre window.localStorage, segura para SSR. */
export const localStorageAdapter: StorageAdapter = {
  getItem(key) {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key, value) {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // quota cheia ou modo privado — ignora silenciosamente
    }
  },
  removeItem(key) {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignora
    }
  },
};

/** Adapter ativo da aplicação. Trocar esta linha ao migrar de backend. */
export const storage: StorageAdapter = localStorageAdapter;

/** Chave única de persistência do app no storage. */
export const STORAGE_KEY = "reservatrack-colonial";
