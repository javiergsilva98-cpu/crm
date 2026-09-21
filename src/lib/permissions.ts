// Fase 10 de 10: matriz de permisos consolidada. Cada pantalla y acción
// importa estas listas en vez de declarar su propia constante de roles
// suelta, para que la matriz completa se pueda leer y ajustar desde un
// solo sitio.
//
// Esto gobierna la capa de UI (qué se muestra/permite bajo el rol de
// demo elegido). La aplicación real sigue viviendo en las políticas RLS
// de supabase/migrations — esta matriz se ha escrito para que coincida
// con ellas exactamente; si se cambia una lista de aquí, hay que
// cambiar la política RLS correspondiente en una migración nueva.
//
// Roles con acceso total a todo: admin y presidente. Por eso aparecen
// en prácticamente todas las listas de abajo.
//
// Vicepresidente: mismo nivel de VISIBILIDAD que presidencia en
// inventario y tesorería (pedido explícito de la Fase 10). Sus permisos
// de EDICIÓN no quedaron cerrados del todo en la reunión ("revisar si
// debe tener también permisos de edición completos"): donde ya
// mirroreaba a presidencia antes de esta fase se ha dejado tal cual, y
// no se ha ampliado a las áreas donde no los tenía (crear votaciones,
// documentación privada, historial de fichaje, resolver incidencias)
// para no inventar una decisión que no se tomó en la reunión. Pendiente
// de cerrar.
//
// Secretario: rol NO definido del todo en la reunión. De momento tiene
// el mismo nivel que un socio normal, más la posibilidad de lanzar
// votaciones junto al presidente (VOTE_CREATE_ROLES). No lo añadas a
// ninguna otra lista de aquí sin que quede cerrado explícitamente — ver
// SECRETARIO_ROLE_PENDING más abajo.

import type { ClubRole } from "./demo-role";
import { ACCOUNT_MANAGE_ROLES } from "./account-auth";
import { EXPORT_ROLES } from "./export-auth";

export const SECRETARIO_ROLE_PENDING = true;
export { ACCOUNT_MANAGE_ROLES, EXPORT_ROLES };

export const MONEY_VIEW_ROLES: ClubRole[] = ["admin", "presidente", "vicepresidente", "tesorero"];
export const MONEY_EDIT_ROLES: ClubRole[] = ["admin", "presidente", "vicepresidente", "tesorero"];

export const INVENTORY_VIEW_ROLES: ClubRole[] = ["admin", "presidente", "vicepresidente", "tesorero"];
// Tesorero pasa a poder editar inventario a fondo (no solo registrar
// reposiciones), tal y como pide la Fase 10 ("también puede editar
// inventario si hace falta"). Bodeguero mantiene el mismo nivel de
// siempre.
export const INVENTORY_EDIT_ROLES: ClubRole[] = ["admin", "presidente", "vicepresidente", "tesorero", "bodeguero"];
export const RESTOCK_ROLES = INVENTORY_EDIT_ROLES;
export const INVENTORY_COUNT_ROLES = INVENTORY_EDIT_ROLES;

export const MENU_MANAGE_ROLES: ClubRole[] = ["admin", "presidente", "vicepresidente", "tesorero", "bodeguero"];
export const FULL_HISTORY_ROLES = MONEY_VIEW_ROLES;

export const VOTE_CREATE_ROLES: ClubRole[] = ["admin", "presidente", "secretario"];
export const VOTE_MANAGE_ROLES: ClubRole[] = ["admin", "presidente", "vicepresidente", "tesorero", "bodeguero"];

export const INCIDENCIAS_RESOLVE_ROLES: ClubRole[] = ["admin", "presidente", "tesorero", "bodeguero"];
export const FICHAJE_HISTORY_ROLES: ClubRole[] = ["admin", "presidente", "tesorero"];

export const DOCUMENTS_GENERAL_MANAGE_ROLES: ClubRole[] = ["admin", "presidente", "vicepresidente"];
export const DOCUMENTS_PRIVATE_ROLES: ClubRole[] = ["admin", "presidente", "tesorero"];

// Ficha de socios: ver el listado completo y editarlo. Secretario ya
// NO entra aquí (Fase 10: queda a nivel de socio salvo para votaciones).
// Mismo nivel que la gestión de cuentas de acceso (account-auth.ts),
// así que se reutiliza esa lista en vez de duplicarla.
export const MEMBER_MANAGE_ROLES: ClubRole[] = ACCOUNT_MANAGE_ROLES as ClubRole[];
export const GUEST_MANAGE_ROLES = MEMBER_MANAGE_ROLES;

// Calendario: crear eventos generales y aprobar/rechazar reservas.
// Tesorero se queda (los eventos llevan coste/cobro asociado);
// secretario ya no gestiona el calendario, solo puede solicitar una
// reserva como cualquier socio.
export const CALENDAR_MANAGE_ROLES: ClubRole[] = ["admin", "presidente", "vicepresidente", "tesorero"];

export const AUDIT_ROLES: ClubRole[] = ["admin", "presidente", "vicepresidente", "tesorero"];
