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
    slug: "conectar-meta-ads",
    title: "Cómo conectar Meta Ads",
    category: "Marketing",
    summary: "Qué credenciales necesitas, de dónde las sacas y qué hace el CRM con ellas.",
    body: `
Al conectar tu cuenta de Meta Ads, el CRM sincroniza la inversión publicitaria del mes actual y la guarda como inversión por canal, para que en Canales veas el coste por contacto sin tener que introducirlo a mano.

## Qué credenciales necesitas

- **Access Token de larga duración**: se genera desde Meta Business Suite, vinculado a tu cuenta publicitaria. Requiere tener una app creada en developers.facebook.com con el producto "Marketing API" añadido.
- **Ad Account ID**: el identificador de tu cuenta publicitaria, con el prefijo "act_" (por ejemplo, act_1234567890). Lo encuentras en Business Suite, en la configuración de la cuenta publicitaria.

Meta revisa el acceso a la Marketing API antes de dejarte sacar datos de inversión reales — puede tardar de horas a días en aprobarse.

## Cómo conseguir las credenciales

Sigue la [documentación oficial de la Marketing API de Meta](https://developers.facebook.com/docs/marketing-apis/get-started) para crear la app, activar el producto "Marketing API" y generar el access token.

## De dónde sale el dato que ves en Canales

Cada vez que le das a "Sincronizar ahora" en Configuración > Marketing, el CRM llama a la API de Meta y suma la inversión del mes en curso. Ese número se guarda como si lo hubieras escrito a mano en Canales, así que puedes seguir editándolo manualmente si algún mes prefieres corregirlo.

Si la sincronización falla, verás el motivo exacto del error debajo del nombre de la integración — normalmente es una credencial caducada o incorrecta.
`,
  },
  {
    slug: "conectar-google-ads",
    title: "Cómo conectar Google Ads",
    category: "Marketing",
    summary: "Qué credenciales necesitas, de dónde las sacas y qué hace el CRM con ellas.",
    body: `
Al conectar tu cuenta de Google Ads, el CRM sincroniza la inversión publicitaria del mes actual y la guarda como inversión por canal, para que en Canales veas el coste por contacto sin tener que introducirlo a mano.

## Qué credenciales necesitas

Necesitas cinco datos, todos desde Google Cloud y Google Ads:

- **Developer Token**: se solicita desde tu cuenta de Google Ads (Herramientas > Centro de API). Google también lo revisa antes de aprobarlo para acceso de producción.
- **Client ID y Client Secret**: credenciales OAuth de un proyecto de Google Cloud con la Google Ads API habilitada.
- **Refresh Token**: se obtiene siguiendo el flujo OAuth de Google (por ejemplo con el OAuth Playground de Google), autorizando acceso a tu cuenta de Ads.
- **Customer ID**: el número de tu cuenta de Google Ads (formato 123-456-7890).

## Cómo conseguir las credenciales

Sigue la [documentación oficial de la Google Ads API](https://developers.google.com/google-ads/api/docs/start) para crear el proyecto en Google Cloud, habilitar la API y obtener el developer token y las credenciales OAuth.

## De dónde sale el dato que ves en Canales

Cada vez que le das a "Sincronizar ahora" en Configuración > Marketing, el CRM llama a la API de Google Ads y suma la inversión del mes en curso. Ese número se guarda como si lo hubieras escrito a mano en Canales, así que puedes seguir editándolo manualmente si algún mes prefieres corregirlo.

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
  {
    slug: "pipeline-oportunidades",
    title: "Cómo funcionan las etapas y el pipeline",
    category: "Ventas",
    summary: "Qué son las etapas, cómo mover una oportunidad y qué pasa al marcarla ganada o perdida.",
    body: `
Toda oportunidad pasa por una serie fija de etapas, visibles tanto en Oportunidades (como lista) como en Pipeline (como tablero).

## Las etapas

- **Nuevo**: la oportunidad se acaba de crear, sin trabajar todavía.
- **Calificado**: ya has confirmado que es una oportunidad real (presupuesto, necesidad, decisor).
- **Propuesta**: le has enviado una propuesta o presupuesto.
- **Negociación**: está en conversación sobre condiciones, precio o alcance.
- **Ganado**: se ha cerrado con éxito.
- **Perdido**: se ha cerrado sin éxito.

## Cómo cambiarla de etapa

En Pipeline, arrastra la tarjeta a la columna de la etapa nueva. En Oportunidades (vista de lista), cámbiala directamente desde el desplegable de la fila.

## Por qué importa marcarla ganada o perdida

En cuanto una oportunidad pasa a "Ganado" o "Perdido" deja de contar como oportunidad abierta en el pipeline, pero sigue existiendo en tus datos: los importes de las oportunidades ganadas son los que alimentan las métricas de facturación potencial en Informes. Márcalas en cuanto se decidan para que el pipeline solo muestre lo que sigue vivo.
`,
  },
  {
    slug: "facturas-estados",
    title: "Estados de una factura y cómo exportarla",
    category: "Finanzas",
    summary: "Qué significa cada estado, de dónde salen los datos fiscales y cómo sacar el PDF.",
    body: `
## Estados

- **Borrador**: creada pero todavía no enviada al cliente. Puedes seguir editándola libremente.
- **Emitida**: ya se ha enviado al cliente. Cuenta como ingreso en el P&L desde este momento.
- **Pagada**: el cliente ya la ha abonado. También cuenta como ingreso en el P&L.
- **Anulada**: no cuenta como ingreso en ningún cálculo.

## Datos fiscales

Los datos de tu empresa (razón social, NIF, dirección) que aparecen impresos en la factura salen de Configuración > Datos de la empresa, así que revisa que estén completos antes de emitir la primera.

## Numeración

Las facturas llevan numeración correlativa automática — no puedes elegir el número a mano, para evitar huecos o duplicados.

## Exportar a PDF

Desde el detalle de una factura, el botón de imprimir/exportar genera un PDF limpio (sin menús ni botones) listo para enviar al cliente o guardar.
`,
  },
  {
    slug: "gastos-categorias",
    title: "Categorías de gastos y su relación con el P&L",
    category: "Finanzas",
    summary: "Para qué sirve la categoría de cada gasto.",
    body: `
Cada gasto que registras en Finanzas > Gastos se guarda con una fecha, un importe y una categoría.

## Categorías disponibles

Suministros, Material, Software, Transporte, Dietas, Alquiler y Otros.

## Para qué sirve la categoría

No afecta al cálculo del beneficio neto (todos los gastos restan por igual, sin importar la categoría), pero sí alimenta la tabla "Gastos por categoría" de Finanzas > P&L, que te permite ver en qué se te va el dinero mes a mes. Elige la categoría que más se ajuste — si dudas, usa "Otros" antes que dejarlo sin categorizar.
`,
  },
  {
    slug: "personalizar-fichas",
    title: "Cómo personalizar las fichas de Contactos, Empresas y Oportunidades",
    category: "Equipo",
    summary: "Qué campos mostrar en la ficha desplegable y cómo cambiar el orden.",
    body: `
En Contactos, Empresas y Oportunidades, cada fila de la tabla se puede desplegar haciendo clic en ella (fuera de los botones) para ver una ficha con más detalle.

## Qué campos aparecen en la ficha

Por defecto se muestra un conjunto de campos habitual, pero puedes elegir cuáles ver y en qué orden con el botón "Personalizar" que hay junto al título de cada sección.

## Cómo cambiarlos

En el desplegable de "Personalizar" marca o desmarca los campos que quieras mostrar u ocultar, y usa las flechas ↑ ↓ para reordenarlos. Se guarda al pulsar "Guardar".

## Es una preferencia personal

Esta personalización es solo tuya: cada usuario puede configurar sus fichas a su manera, sin que afecte a lo que ven los demás.
`,
  },
  {
    slug: "canal-origen-contactos",
    title: "Por qué rellenar el canal de origen de un contacto",
    category: "Marketing",
    summary: "Cómo se usa el campo \"¿De dónde vino?\" en Canales e Informes.",
    body: `
Al crear un contacto puedes indicar de qué canal vino (Instagram, Google, referido, etc.), con un detalle opcional y una URL de origen.

## Para qué se usa

Ese dato es la base de la pantalla de Canales: ahí ves cuántos contactos ha traído cada canal este mes y, si has introducido o sincronizado la inversión publicitaria, el coste por contacto de cada uno. Sin canal de origen, el contacto simplemente no se cuenta en ese desglose.

## Detalle y URL de origen

El campo de detalle sirve para anotar algo más concreto (por ejemplo, "post reels enero" o el nombre de quien lo refirió), y la URL de origen para guardar el enlace exacto (landing, anuncio) del que vino, por si luego quieres revisarlo.

## Recomendación

Acostúmbrate a rellenarlo siempre al dar de alta un contacto nuevo — es el único momento en que ese dato se puede capturar con precisión.
`,
  },
  {
    slug: "primeros-pasos",
    title: "Primeros pasos con el CRM",
    category: "Equipo",
    summary: "Qué configurar primero para sacarle partido al CRM desde el primer día.",
    body: `
Si acabas de empezar, este es el orden recomendado.

## 1. Datos fiscales

Rellena Configuración > Datos de la empresa — son los que aparecerán impresos en tus facturas.

## 2. Invita a tu equipo

Desde Configuración > Usuarios, genera una invitación (por enlace o email) para cada persona que necesite acceso, y decide si es administrador o usuario normal.

## 3. Registra el canal de origen de tus contactos

Cada vez que des de alta un contacto, indica de dónde vino. Es lo que alimenta la pantalla de Canales.

## 4. Conecta Meta Ads / Google Ads (opcional)

Si haces publicidad, conecta tus cuentas en Configuración > Marketing para que la inversión se rellene sola en Canales en vez de introducirla a mano.

## 5. Empieza a usar Oportunidades y Facturas

Da de alta tus oportunidades comerciales y, cuando cierres una venta, emite la factura correspondiente — ambas cosas alimentan automáticamente Finanzas > P&L e Informes.

## 6. Crea tu primer informe

En Informes, prueba el modo simple para tener un vistazo rápido, y pasa al avanzado cuando quieras combinar métricas o comparar periodos.
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
