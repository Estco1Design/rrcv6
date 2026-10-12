/**
 * RRC PRIVATE SESSION — клиентский сигнал успешного private-доступа.
 *
 * Основной источник истины — httpOnly-cookie rrc_private_access,
 * который сервер ставит в POST /api/private-access/verify (см.
 * src/app/api/private-access/verify/route.ts) и который проверяется
 * на сервере для /private/* (src/lib/private-access.ts).
 *
 * Этот non-sensitive sessionStorage-флаг нужен только чтобы интро
 * (RrcBootIntro) могло корректно смонтироваться на /private/welcome
 * после client-side навигации, не полагаясь на заголовок cookie.
 * Никаких секретов здесь нет.
 */

export const PRIVATE_SESSION_KEY = 'rrc_private_session';

export function markPrivateSession(): void {
  try {
    sessionStorage.setItem(PRIVATE_SESSION_KEY, '1');
  } catch {
    /* storage может быть недоступен — серверная защита от этого не зависит */
  }
}

export function hasPrivateSession(): boolean {
  try {
    return sessionStorage.getItem(PRIVATE_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Выход из private-зоны (EXIT в приватном header): снимаем клиентский
 * флаг сессии и помечаем, что при следующем заходе на публичный сайт
 * intro стоит показать снова (код можно ввести заново — серверная
 * cookie удаляет серверный endpoint выхода).
 */
export function markPublicExit(): void {
  try {
    sessionStorage.removeItem(PRIVATE_SESSION_KEY);
    sessionStorage.setItem('rrc_intro_seen', 'false');
  } catch {
    /* storage может быть недоступен — переход всё равно работает */
  }
}
