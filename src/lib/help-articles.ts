export type HelpArticle = {
  slug: string;
  title: string;
  category: string;
  summary: string;
  // Markdown muy simplificado: líneas "## " = subtítulo, líneas "- " (en
  // bloque) = lista, resto = párrafo. Sin dependencia externa a propósito.
  body: string;
};

export const HELP_ARTICLES: HelpArticle[] = [
  {
    slug: "conectar-meta-google-ads",
    title: "Cómo conectar Meta Ads y Google Ads",
    category: "Marketing",
    summary: "Qué credenciales necesitas, de dónde las sacas y qué hace el CRM con ellas.",
    body: `
Al conectar una cuenta de Meta Ads o Google Ads, el CRM sincroniza el gasto publicitario del mes actual y lo guarda como gasto por canal, para que en Canales veas el coste por contacto sin tener que introducirlo a mano.

## Meta Ads (Instagram / Facebook)

Necesitas dos datos:

- **Access Token de larga duración**: se genera desde Meta Business Suite, vinculado a tu cuenta publicitaria. Requiere tener una app creada en developers.facebook.com con el producto "Marketing API" añadido.
- **Ad Account ID**: el identificador de tu cuenta publicitaria, con el prefijo "act_" (por ejemplo, act_1234567890). Lo encuentras en Business Suite, en la configuración de la cuenta publicitaria.

Meta revisa el acceso a la Marketing API antes de dejarte sacar datos de gasto reales — puede tardar de horas a días en aprobarse.

## Google Ads

Necesitas cinco datos, todos desde Google Cloud y Google Ads:

- **Developer Token**: se solicita desde tu cuenta de Google Ads (Herramientas > Centro de API). Google también lo revisa antes de aprobarlo para acceso de producción.
- **Client ID y Client Secret**: credenciales OAuth de un proyecto de Google Cloud con la Google Ads API habilitada.
- **Refresh Token**: se obtiene siguiendo el flujo OAuth de Google (por ejemplo con el OAuth Playground de Google), autorizando acceso a tu cuenta de Ads.
- **Customer ID**: el número de tu cuenta de Google Ads (formato 123-456-7890).

## De dónde sale el dato que ves en Canales

Cada vez que le das a "Sincronizar ahora" en Configuración > Marketing, el CRM llama a la API correspondiente y suma el gasto del mes en curso. Ese número se guarda como si lo hubieras escrito a mano en Canales, así que puedes seguir editándolo manualmente si algún mes prefieres corregirlo.

Si la sincronización falla, verás el motivo exacto del error debajo del nombre de la integración — normalmente es una credencial caducada o incorrecta.
`,
  },
  {
    slug: "formularios-embed",
    title: "Cómo funciona el HTML de Formularios",
    category: "Marketing",
    summary: "Qué hace el código que generas, y dónde pegarlo en tu web.",
    body: `
Cada formulario que creas en Marketing > Formularios genera un bloque de HTML autocontenido: un formulario, más un poco de JavaScript que envía los datos directamente a tu CRM cuando alguien lo rellena.

## Dónde pegarlo

Pega el HTML generado en cualquier página de tu web, justo donde quieras que aparezca el formulario (por ejemplo, en el editor de tu web, en un bloque de "HTML personalizado"). No necesitas que esta app esté "despierta" ni hacer ninguna configuración adicional en el hosting de tu web: el HTML habla directamente con tu base de datos.

## Qué pasa cuando alguien lo envía

Se crea un contacto nuevo en el CRM automáticamente, guardando también la URL desde la que se envió el formulario (para saber de qué página vino cada lead).

## Píxeles de conversión

Si pegaste un Meta Pixel ID o un Google Ads Conversion ID al crear el formulario, el HTML generado ya incluye el código de seguimiento — se dispara automáticamente cuando el envío se completa con éxito. No hace falta que integres nada más en tu web para eso.

## Si algo no funciona

Revisa la consola del navegador en la página donde pegaste el formulario (clic derecho > Inspeccionar > Console) al enviarlo — cualquier error de red o de permisos aparecerá ahí.
`,
  },
  {
    slug: "informes-avanzados",
    title: "Cómo crear un informe avanzado",
    category: "Marketing",
    summary: "Mezclar métricas, elegir tipo de gráfico y comparar con el periodo anterior.",
    body: `
En Marketing > Informes, activa "Creación avanzada" para acceder a todas las opciones.

## Elegir tipo de visualización

- **Barras**: una sola métrica, ideal para comparar categorías (etapas, canales) o meses.
- **Líneas**: varias métricas mensuales superpuestas, para comparar tendencias (por ejemplo, facturación vs. gastos por mes).
- **Circular**: una sola métrica, mostrada como porcentaje del total.
- **Tabla de datos**: una o varias métricas en columnas, siempre que agrupen los datos de la misma forma (todas por mes, o todas por categoría).
- **Tarjeta con un dato**: una sola métrica, resumida en un único número grande.

## Por qué a veces no te deja mezclar métricas

Si mezclas una métrica que cuenta cosas (por ejemplo, número de contactos) con una que suma importes (por ejemplo, facturación en euros), o una agrupada por mes con otra agrupada por categoría, el CRM bloquea el guardado y te explica el motivo en la vista previa. Es una comprobación a propósito para que no acabes con un gráfico que mezcla unidades sin sentido.

## Comparar con el periodo anterior

Disponible en tablas y tarjetas: marca "Comparar con periodo anterior" en la métrica que quieras, con un rango de fechas elegido. El CRM calcula automáticamente el periodo inmediatamente anterior de la misma duración y muestra la diferencia en porcentaje.

## Plantillas de equipo

Al guardar un informe, puedes marcarlo como "plantilla de equipo": lo verán todos los usuarios, pero solo tú puedes editarlo o borrarlo.
`,
  },
  {
    slug: "invitar-usuarios",
    title: "Cómo invitar a alguien al CRM",
    category: "Equipo",
    summary: "Diferencia entre enlace y email, y entre los roles admin y usuario.",
    body: `
Solo los administradores pueden invitar a gente nueva, desde Configuración > Usuarios.

## Enlace o email

Al crear una invitación puedes dejar el email en blanco (se genera solo un enlace, que copias y envías tú por donde prefieras) o escribir un email (si tienes Resend configurado, se envía automáticamente; si no, la invitación se crea igual y queda "Pendiente de envío" para que copies el enlace a mano).

## Roles

- **Administrador**: ve y gestiona todos los datos del CRM (de todos los usuarios), y puede invitar o cambiar el rol de otras personas.
- **Usuario**: solo ve y gestiona lo que él mismo crea.

## El registro es solo por invitación

Nadie puede crear una cuenta sin un enlace de invitación válido — el registro público está cerrado. Cada enlace solo sirve una vez.
`,
  },
  {
    slug: "pnl-que-cuenta",
    title: "Qué cuenta como ingreso o gasto en el P&L",
    category: "Finanzas",
    summary: "De dónde salen los números de la cuenta de resultados.",
    body: `
La vista de Finanzas > P&L cruza dos fuentes de datos que ya tienes en el CRM.

## Ingresos

Se cuentan las facturas en estado "emitida" o "pagada", por su fecha de emisión. Las facturas en borrador o canceladas no cuentan como ingreso.

## Gastos

Se cuentan todos los gastos registrados en Finanzas > Gastos, por su fecha de gasto, sin importar la categoría.

## Beneficio y margen

Beneficio neto = Ingresos − Gastos. El margen (%) es ese beneficio dividido entre los ingresos totales del periodo.

## Filtrar por fechas

Puedes acotar el periodo con el filtro de fechas de arriba. Si no filtras, se muestra todo el histórico agrupado por mes.
`,
  },
];

export function helpArticle(slug: string): HelpArticle | null {
  return HELP_ARTICLES.find((a) => a.slug === slug) ?? null;
}

export function helpArticlesByCategory(): { category: string; articles: HelpArticle[] }[] {
  const categories = Array.from(new Set(HELP_ARTICLES.map((a) => a.category)));
  return categories.map((category) => ({
    category,
    articles: HELP_ARTICLES.filter((a) => a.category === category),
  }));
}
