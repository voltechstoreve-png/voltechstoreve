'use client';

import { ImageIcon } from 'lucide-react';

// ✅ Calcula los % de reparto según la proporción real de la imagen
function calcularPct(ratio) {
  const r = Number(ratio) || 1;
  const pcImg  = r <= 1.1 ? 50 : r >= 1.5 ? 70 : Math.round(50 + ((r - 1.1) / 0.4) * 20);
  const mobImg = r <= 1.1 ? 70 : r >= 1.5 ? 50 : Math.round(70 - ((r - 1.1) / 0.4) * 20);
  return { pcImg, pcText: 100 - pcImg, mobImg, mobText: 100 - mobImg };
}

export default function BannerCard({
  banner,
  mode = 'desktop',        // 'desktop' | 'mobile' | 'preview-pc' | 'preview-mobile'
  ratio = 1,               // proporción real (ancho/alto) de la portada
  isWide = null,           // opcional: fuerza 70/30 (true) o 50/50 (false)
  onClick,
  precioManual = null,
}) {
  if (!banner) return null;

  const {
    titulo, 
    descripcion, 
    url_imagen, 
    url_imagen_2, 
    imagenes,     
    url_video, 
    url_fondo,
    texto_boton = 'VER OFERTA', 
    color_boton = '#22d3ee',
    precio_manual, 
    url_destino,
  } = banner;

  const imgList = imagenes && imagenes.length > 0 
    ? imagenes 
    : [url_imagen, url_imagen_2].filter(Boolean);
    
  const tieneDosImagenes = imgList.length >= 2;

  const precio = precioManual || precio_manual;
  const isPreview = mode.startsWith('preview');
  
  const ratioEfectivo = tieneDosImagenes ? 1.5 : ratio;
  const pct = calcularPct(ratioEfectivo);
  
  const pcImg  = typeof isWide === 'boolean' ? (isWide ? 70 : 50) : pct.pcImg;
  const pcText = 100 - pcImg;
  const mobImg  = typeof isWide === 'boolean' ? (isWide ? 50 : 70) : pct.mobImg;
  const mobText = 100 - mobImg;

  // 🖼️ BLOQUE MULTIMEDIA (Se ajusta al 100% del ancho)
  const media = (
    <>
      {url_video ? (
        <video src={url_video} className="absolute inset-0 w-full h-full object-cover" autoPlay muted loop playsInline />
      ) : tieneDosImagenes ? (
        <div className="w-full h-full flex flex-row items-center justify-center bg-black">
          <img src={imgList[0]} alt={titulo || 'Imagen 1'} className="w-1/2 h-full object-cover" />
          <img src={imgList[1]} alt={titulo || 'Imagen 2'} className="w-1/2 h-full object-cover" />
        </div>
      ) : url_imagen ? (
        /* 🚀 w-full h-full object-cover/contain ajustado sin paddings para llenar ancho completo */
        <img src={url_imagen} alt={titulo || 'Banner'} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-voltech-muted">
          <ImageIcon className="w-10 h-10 opacity-50" />
        </div>
      )}
    </>
  );

  // 📝 BLOQUE DE TEXTO E INFORMACIÓN
  const texto = (compacto) => (
    <>
      {url_fondo && <img src={url_fondo} alt="" className="absolute inset-0 w-full h-full object-cover" />}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/90 to-black/40"></div>
      
      <div className={`relative z-10 h-full w-full flex flex-col justify-between items-center text-center ${
        compacto ? 'p-2.5 pb-3' : 'items-start text-left p-6 lg:p-8'
      }`}>
        <div className="flex flex-col items-center gap-0.5 w-full">
          <p className={`${compacto ? 'text-xs font-black' : 'text-lg lg:text-2xl font-black'} text-white drop-shadow uppercase tracking-tight leading-tight line-clamp-1`}>
            {titulo || 'Título de Oferta'}
          </p>
          
          {descripcion && (
            <p className={`${compacto ? 'text-[10px] text-gray-300' : 'text-xs lg:text-sm text-gray-300'} drop-shadow line-clamp-1`}>
              {descripcion}
            </p>
          )}
          
          {precio && (
            <p className={`${compacto ? 'text-xs font-bold' : 'text-lg lg:text-xl font-extrabold'} text-emerald-400 drop-shadow mt-0.5`}>
              {precio}
            </p>
          )}
        </div>
        
        <span
          className={`${
            compacto ? 'py-1.5 px-5 text-[10px] rounded-full' : 'px-5 py-2.5 text-xs rounded-xl hover:scale-105 transition-transform'
          } font-bold uppercase tracking-wider shadow-lg inline-block`}
          style={{ backgroundColor: color_boton || '#22d3ee', color: '#0a0a0a' }}
        >
          {texto_boton || 'VER OFERTA'}
        </span>
      </div>
    </>
  );

  // 🖥️ DESKTOP / PREVIEW-PC
  if (mode === 'desktop' || mode === 'preview-pc') {
    const clase = `relative w-full overflow-hidden rounded-2xl flex flex-row group cursor-pointer border border-zinc-800/80 shadow-2xl transition-all ${
      isPreview ? 'bg-voltech-dark h-[260px]' : 'bg-black h-[280px]'
    }`;
    
    const contenido = (
      <>
        <div className="relative h-full flex-shrink-0 bg-black flex items-center justify-center overflow-hidden rounded-l-2xl" style={{ width: `${pcImg}%` }}>
          {media}
        </div>
        <div className="relative h-full bg-black overflow-hidden flex-1" style={{ width: `${pcText}%` }}>
          {texto(false)}
        </div>
      </>
    );
    
    return onClick
      ? <div className={clase} onClick={onClick}>{contenido}</div>
      : <a href={url_destino || '#'} target={url_destino ? '_blank' : '_self'} className={clase}>{contenido}</a>;
  }

  // 📱 MOBILE / PREVIEW-MOBILE (Ancho 100% Real de borde a borde)
  const clase = `w-full overflow-hidden rounded-2xl border border-zinc-800 bg-black flex flex-col shadow-xl ${
    isPreview ? 'h-[360px] w-full max-w-[280px] mx-auto' : 'h-[360px] max-h-[360px] w-full snap-start shrink-0'
  }`;
  
  const contenido = (
    <>
      {/* Contenedor de Imagen ocupando el ancho 100% dinámico */}
      <div className="relative w-full bg-black flex items-center justify-center overflow-hidden" style={{ height: `${mobImg}%` }}>
        {media}
      </div>
      {/* Contenedor de Texto abajo super limpio */}
      <div className="relative w-full bg-black overflow-hidden flex-1 flex items-center justify-center">
        {texto(true)}
      </div>
    </>
  );
  
  return onClick
    ? <div className={clase} onClick={onClick}>{contenido}</div>
    : <a href={url_destino || '#'} target={url_destino ? '_blank' : '_self'} className={clase}>{contenido}</a>;
}