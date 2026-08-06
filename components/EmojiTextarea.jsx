'use client';

import { useRef } from 'react';

// ✅ Emojis en código Unicode: nunca se corrompen
const EMOJIS = [
  '\u2764\uFE0F', '\uD83D\uDC9A', '\uD83D\uDE4F', '\u2705', '\u26A0\uFE0F',
  '\uD83D\uDCC5', '\uD83D\uDCB0', '\uD83D\uDD25', '\uD83C\uDF89', '\uD83D\uDCE6',
  '\uD83D\uDE9A', '\u23F0', '\uD83D\uDC4B', '\uD83D\uDE0A', '\uD83C\uDF81', '\uD83D\uDCF1',
];

// ✅ Variables AMIGABLES: el equipo ve un nombre claro, no código
export const VARIABLES_AMIGABLES = {
  nombre:      { label: 'Nombre del cliente',   token: '[Nombre]' },
  productos:   { label: 'Lista de productos',   token: '[Productos]' },
  monto:       { label: 'Monto a pagar',        token: '[Monto]' },
  plataforma:  { label: 'Plataforma',           token: '[Plataforma]' },
  fecha_vence: { label: 'Fecha de vencimiento', token: '[Vence]' },
  dias:        { label: 'Días de ajuste',       token: '[Días]' },
  tipo:        { label: 'Regalo o Falla',       token: '[Tipo]' },
};

// ✅ Plantillas por defecto con marcas amigables
export const PLANTILLAS_WA_DEFAULT = {
  gracias_productos: '\u00a1Gracias [Nombre] por tu compra! \u2764\uFE0F\n\nRecuerda guardar nuestro WhatsApp y seguirnos en redes sociales para mantenerte al d\u00eda sobre nuestros productos \uD83D\uDCF1\n\n\uD83D\uDCF8 Instagram @Voltechstore.ve\n\uD83C\uDFB5 TikTok @Voltechstore.ve\n\nNuestro Cat\u00e1logo \uD83D\uDC47\nhttps://voltechstore.ve\n\nPor cada cliente que refieras tendr\u00e1s descuentos exclusivos \uD83C\uDF81',
  recordatorio_productos: '\u00a1Buen d\u00eda [Nombre]! \uD83D\uDC4B\n\nTe escribimos de parte de *Voltechstore.ve* para recordarte tu pago pendiente de $[Monto] por:\n[Productos]\n\nPor favor realiza el pago para evitar la suspensi\u00f3n del servicio. \u00a1Gracias por tu puntualidad! \uD83D\uDE4F',
  recordatorio_streaming: '\u00a1Buen d\u00eda [Nombre]!\n\nTe recordamos que tu servicio [Plataforma] est\u00e1 disponible *solo hasta el d\u00eda de ma\u00f1ana*\n\nMonto: $[Monto]\nVence: [Vence] \uD83D\uDCC5\n\nPor favor realiza el pago pendiente para evitar la suspensi\u00f3n del servicio.\n\nSi ya pagaste, ignora este mensaje. \u00a1Gracias por tu puntualidad! \uD83D\uDE4F\n\nEl equipo de Voltechstore.ve \u2764\uFE0F',
  regalo_falla: 'Hola [Nombre] \uD83D\uDC4B\n\nAplicamos un ajuste de *[Días] días* ([Tipo]) a tu cuenta *[Plataforma]* \uD83C\uDF81\n\nNuevo vencimiento: [Vence] \uD83D\uDCC5\n\n\u00a1Gracias por tu preferencia! \u2764\uFE0F\nEl equipo de Voltechstore.ve',
};

// ✅ Resuelve: plantilla del usuario → global → default
export function resolverPlantillaWa(store, usuario, clave) {
  const uid = usuario?.id || usuario?.nombre || 'anon';
  const data = store || {};
  return data?.[uid]?.[clave] || data?.global?.[clave] || PLANTILLAS_WA_DEFAULT[clave] || '';
}

// ✅ Reemplaza las marcas amigables [Nombre] Y también las viejas {{nombre}} (compatibilidad)
export function rellenarVariables(texto, datos = {}) {
  let out = texto || '';
  Object.entries(datos).forEach(([clave, valor]) => {
    const v = String(valor ?? '');
    const token = VARIABLES_AMIGABLES[clave]?.token;
    if (token) out = out.split(token).join(v);
    out = out.split(`{{${clave}}}`).join(v);
  });
  return out;
}

export default function EmojiTextarea({ value, onChange, variables = [], rows = 6, placeholder }) {
  const ref = useRef(null);

  const insertar = (texto) => {
    const el = ref.current;
    if (!el) { onChange((value || '') + texto); return; }
    const start = el.selectionStart ?? (value || '').length;
    const end = el.selectionEnd ?? (value || '').length;
    const next = (value || '').slice(0, start) + texto + (value || '').slice(end);
    onChange(next);
    setTimeout(() => { el.focus(); el.selectionStart = el.selectionEnd = start + texto.length; }, 0);
  };

  return (
    <div>
      <textarea
        ref={ref}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-voltech w-full rounded-lg px-4 py-3 text-sm"
      />
      <div className="flex flex-wrap gap-1 mt-2">
        {EMOJIS.map((e, i) => (
          <button key={i} type="button" onClick={() => insertar(e)} className="px-2 py-1 bg-voltech-dark/50 border border-voltech-border rounded hover:border-voltech-cyan text-sm transition-colors">
            {e}
          </button>
        ))}
      </div>
      {variables.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {variables.map((clave) => {
            const v = VARIABLES_AMIGABLES[clave];
            if (!v) return null;
            return (
              <button key={clave} type="button" onClick={() => insertar(v.token)} className="px-2 py-1 bg-voltech-cyan/10 border border-voltech-cyan/30 rounded text-[10px] text-voltech-cyan hover:bg-voltech-cyan/20 transition-colors">
                + {v.label}
              </button>
            );
          })}
        </div>
      )}
      <p className="text-[10px] text-voltech-muted mt-2">
        Los botones azules insertan marcas como [Nombre]; al enviar, el sistema las cambia automáticamente por los datos reales del cliente.
      </p>
    </div>
  );
}