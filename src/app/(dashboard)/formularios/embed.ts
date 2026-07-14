import type { FormField } from "./types";

type EmbedConfig = {
  formId: string;
  fields: FormField[];
  supabaseUrl: string;
  supabaseAnonKey: string;
  metaPixelId: string | null;
  googleAdsConversionId: string | null;
  googleAdsConversionLabel: string | null;
};

function fieldInputHtml(field: FormField) {
  const req = field.required ? " required" : "";
  const inputType = field.type === "email" ? "email" : field.type === "phone" ? "tel" : "text";
  const requiredMark = field.required ? " *" : "";
  return `  <label>${field.label}${requiredMark}<br><input type="${inputType}" name="${field.key}"${req}></label>`;
}

export function buildEmbedHtml(config: EmbedConfig) {
  const fieldsHtml = config.fields.map(fieldInputHtml).join("\n");

  const metaSnippet = config.metaPixelId
    ? `
<!-- Meta Pixel -->
<script>
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
  n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
  document,'script','https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', '${config.metaPixelId}');
  fbq('track', 'PageView');
</script>`
    : "";

  const gtagSnippet = config.googleAdsConversionId
    ? `
<!-- Google Ads -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${config.googleAdsConversionId}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${config.googleAdsConversionId}');
</script>`
    : "";

  const trackConversionLines = [
    config.metaPixelId ? "        if (window.fbq) fbq('track', 'Lead');" : "",
    config.googleAdsConversionId
      ? `        if (window.gtag) gtag('event', 'conversion', { send_to: '${config.googleAdsConversionId}${
          config.googleAdsConversionLabel ? "/" + config.googleAdsConversionLabel : ""
        }' });`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  return `<!-- Formulario generado desde el CRM -->${metaSnippet}${gtagSnippet}
<form id="crm-form-${config.formId}">
${fieldsHtml}
  <button type="submit">Enviar</button>
  <p class="crm-form-status" style="display:none;"></p>
</form>
<script>
(function () {
  var form = document.getElementById('crm-form-${config.formId}');
  var status = form.querySelector('.crm-form-status');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var data = {};
    new FormData(form).forEach(function (value, key) { data[key] = value; });
    fetch('${config.supabaseUrl}/rest/v1/rpc/submit_form', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': '${config.supabaseAnonKey}',
        'Authorization': 'Bearer ${config.supabaseAnonKey}'
      },
      body: JSON.stringify({
        p_form_id: '${config.formId}',
        p_data: data,
        p_source_url: window.location.href
      })
    }).then(function (res) {
      status.style.display = 'block';
      if (res.ok) {
        form.reset();
        status.textContent = 'Gracias, hemos recibido tus datos.';
${trackConversionLines}
      } else {
        status.textContent = 'Hubo un error al enviar el formulario.';
      }
    });
  });
})();
</script>`;
}
