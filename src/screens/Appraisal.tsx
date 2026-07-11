import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Icon, EmptyState } from '../ds';
import { identifyPhoto, type AppraisalResult } from '../api/appraisal';
import { compressImage } from '../utils/appraisal';

const css = `
.ap{max-width:820px;margin:0 auto;padding:24px;}
.ap__hd{margin-bottom:20px;}
.ap__tt{display:flex;align-items:center;gap:10px;font-size:26px;font-weight:800;color:var(--text-strong);letter-spacing:-.02em;}
.ap__sub{font-size:14px;color:var(--text-muted);margin-top:6px;line-height:1.5;}
.ap__cats{display:flex;flex-wrap:wrap;gap:7px;margin-top:12px;}
.ap__chip{font-size:12px;font-weight:600;color:var(--text-muted);background:var(--surface-sunken);border:1px solid var(--border-subtle);border-radius:var(--radius-pill);padding:4px 12px;}
.ap__card{background:var(--surface-card);border:1px solid var(--border-subtle);border-radius:var(--radius-xl);padding:24px;box-shadow:var(--shadow-sm);}
.ap__drop{border:1.5px dashed var(--border-default);border-radius:var(--radius-lg);padding:40px 24px;display:flex;flex-direction:column;align-items:center;gap:12px;text-align:center;cursor:pointer;transition:all var(--dur-fast);color:var(--text-muted);}
.ap__drop:hover{border-color:var(--brand);background:var(--brand-subtle);color:var(--brand);}
.ap__dropic{width:56px;height:56px;border-radius:50%;background:var(--brand-subtle);color:var(--brand);display:flex;align-items:center;justify-content:center;}
.ap__droptt{font-size:15px;font-weight:700;color:var(--text-strong);}
.ap__drophint{font-size:12.5px;color:var(--text-subtle);}
.ap__thumb{width:120px;height:120px;border-radius:var(--radius-lg);object-fit:cover;background:var(--surface-sunken);flex:none;border:1px solid var(--border-subtle);}
.ap__loading{display:flex;flex-direction:column;align-items:center;gap:14px;padding:32px;text-align:center;}
.ap__spinner{width:38px;height:38px;border-radius:50%;border:3px solid var(--border-subtle);border-top-color:var(--brand);animation:yala-spin .8s linear infinite;}
@keyframes yala-spin{to{transform:rotate(360deg)}}
.ap__loadtt{font-size:15px;font-weight:700;color:var(--text-strong);}
.ap__loadsub{font-size:13px;color:var(--text-muted);}
.ap__result{display:flex;flex-direction:column;gap:0;}
.ap__rhead{display:flex;gap:18px;align-items:flex-start;padding-bottom:20px;border-bottom:1px solid var(--border-subtle);}
.ap__rtag{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.03em;color:var(--brand);background:var(--brand-subtle);border-radius:var(--radius-pill);padding:4px 11px;}
.ap__rname{font-size:20px;font-weight:800;color:var(--text-strong);letter-spacing:-.01em;margin-top:8px;line-height:1.25;}
.ap__rmeta{font-size:13px;color:var(--text-muted);margin-top:5px;}
.ap__conf{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:var(--text-muted);margin-top:8px;}
.ap__confdot{width:8px;height:8px;border-radius:50%;}
.ap__range{padding:22px 0;border-bottom:1px solid var(--border-subtle);text-align:center;}
.ap__rangelbl{font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:var(--text-subtle);margin-bottom:8px;}
.ap__rangeval{font-size:30px;font-weight:800;color:var(--text-strong);letter-spacing:-.02em;}
.ap__rangeval b{color:var(--brand);}
.ap__comps{padding-top:18px;}
.ap__complbl{display:flex;align-items:center;justify-content:space-between;font-size:13px;font-weight:700;color:var(--text-strong);margin-bottom:12px;}
.ap__src{font-size:11px;font-weight:600;color:var(--text-subtle);}
.ap__comp{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 14px;border:1px solid var(--border-subtle);border-radius:var(--radius-md);margin-bottom:8px;}
.ap__comptt{font-size:13px;color:var(--text-strong);min-width:0;}
.ap__comppr{font-size:13px;font-weight:700;color:var(--text-strong);font-variant-numeric:tabular-nums;white-space:nowrap;}
.ap__foot{display:flex;gap:10px;flex-wrap:wrap;margin-top:20px;}
.ap__ident{font-size:12.5px;color:var(--text-muted);background:var(--surface-sunken);border-radius:var(--radius-md);padding:12px 14px;margin-top:16px;line-height:1.5;}
.ap__ident b{color:var(--text-strong);}
@media(max-width:560px){.ap__thumb{width:100%;height:200px}.ap__rhead{flex-direction:column}}
`;
let ic = false;
function ensure() { if (!ic) { ic = true; const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s); } }

// Juegos TCG soportados por JustTCG (los más comunes para el demo).
const GAMES = ['Pokémon', 'Yu-Gi-Oh!', 'Magic', 'One Piece', 'Dragon Ball', 'Digimon', 'Lorcana'];

function money(n: number, currency = 'USD') {
  const sym = currency === 'USD' ? '$' : currency + ' ';
  return sym + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

type Phase = 'idle' | 'analyzing' | 'done' | 'error';

interface Outcome {
  result: AppraisalResult;
  // 'matched' -> hay precio en JustTCG; 'no-match' -> carta identificada sin precio;
  // 'unclear' -> foto mala / no es una carta TCG.
  kind: 'matched' | 'no-match' | 'unclear';
}

export default function Appraisal() {
  ensure();
  const navigate = useNavigate();
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [phase, setPhase] = React.useState<Phase>('idle');
  const [imageUrl, setImageUrl] = React.useState<string>('');
  const [outcome, setOutcome] = React.useState<Outcome | null>(null);
  const [errMsg, setErrMsg] = React.useState('');

  // Publica una subasta con la carta tasada: navega al flujo de crear publicación (AUCTION)
  // con título, precio sugerido (media del rango JustTCG) e imagen ya cargados.
  const onPublish = () => {
    if (!outcome || outcome.kind !== 'matched' || !outcome.result.pricing) return;
    const r = outcome.result;
    const p = r.pricing;
    const title = [r.character, r.franchise, r.variant].filter(Boolean).join(' ').trim() || p.itemName;
    const suggestedPrice = Math.round(((p.priceMin + p.priceMax) / 2) * 100) / 100;
    navigate('/seller/new-listing', {
      state: { prefill: { title, suggestedPrice, imageDataUrl: imageUrl } },
    });
  };

  const reset = () => {
    setPhase('idle');
    setImageUrl('');
    setOutcome(null);
    setErrMsg('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const pick = () => fileRef.current && fileRef.current.click();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setErrMsg('');
    setOutcome(null);
    try {
      const dataUrl = await compressImage(file); // resize + JPEG en el cliente
      setImageUrl(dataUrl);
      setPhase('analyzing');
      const result = await identifyPhoto(dataUrl);

      // Caso límite: foto mala / no es una carta TCG reconocible.
      if (!result.recognizable || result.category !== 'tcg' || result.confidence < 0.35) {
        setOutcome({ result, kind: 'unclear' });
      } else if (result.pricing) {
        setOutcome({ result, kind: 'matched' });
      } else {
        setOutcome({ result, kind: 'no-match' });
      }
      setPhase('done');
    } catch (err: any) {
      setErrMsg(err?.message || 'No pudimos analizar la foto. Intenta de nuevo.');
      setPhase('error');
    }
  };

  return (
    <div className="ap">
      <div className="ap__hd">
        <div className="ap__tt"><Icon.TrendingUp size={26} /> ¿Cuánto vale?</div>
        <div className="ap__sub">Sube una foto de tu carta TCG y nuestro agente con IA la identifica y te da su precio real de mercado con comparables. Precios en vivo de JustTCG.</div>
        <div className="ap__cats">
          {GAMES.map((c) => <span key={c} className="ap__chip">{c}</span>)}
        </div>
      </div>

      <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={onFile} />

      <div className="ap__card">
        {phase === 'idle' && (
          <div className="ap__drop" onClick={pick}>
            <div className="ap__dropic"><Icon.Image size={26} /></div>
            <div className="ap__droptt">Sube una foto de tu carta</div>
            <div className="ap__drophint">JPG, PNG o WEBP · la comprimimos antes de enviarla</div>
            <Button variant="primary" size="md" onClick={(e: any) => { e.stopPropagation(); pick(); }}>
              <Icon.Plus size={16} /> Elegir foto
            </Button>
          </div>
        )}

        {phase === 'analyzing' && (
          <div className="ap__loading">
            {imageUrl && <img className="ap__thumb" src={imageUrl} alt="" />}
            <div className="ap__spinner" />
            <div>
              <div className="ap__loadtt">Analizando la carta…</div>
              <div className="ap__loadsub">Identificando con IA y consultando precios en JustTCG</div>
            </div>
          </div>
        )}

        {phase === 'error' && (
          <EmptyState
            icon={<Icon.AlertTriangle size={26} />}
            title="No pudimos analizar la foto"
            description={errMsg}
            actions={<Button variant="primary" onClick={pick}>Reintentar</Button>}
          />
        )}

        {phase === 'done' && outcome && (
          <Result outcome={outcome} imageUrl={imageUrl} onRetry={pick} onReset={reset} onPublish={onPublish} />
        )}
      </div>
    </div>
  );
}

function confColor(c: number) {
  if (c >= 0.7) return 'var(--success)';
  if (c >= 0.45) return 'var(--warning)';
  return 'var(--danger)';
}

function Result({ outcome, imageUrl, onRetry, onReset, onPublish }: { outcome: Outcome; imageUrl: string; onRetry: () => void; onReset: () => void; onPublish: () => void }) {
  const { result, kind } = outcome;

  // --- Caso límite: foto mala / no es una carta TCG ---
  if (kind === 'unclear') {
    return (
      <EmptyState
        icon={<Icon.SearchX size={26} />}
        title="No pudimos reconocer una carta TCG"
        description={result.note || 'La foto puede estar borrosa o no es una carta de un juego soportado. Sube una foto más clara, bien iluminada y bien encuadrada de la carta.'}
        actions={<Button variant="primary" onClick={onRetry}><Icon.Image size={16} /> Subir otra foto</Button>}
      />
    );
  }

  const identLine = (
    <div className="ap__ident">
      <b>Identificado por IA:</b> {result.franchise || 'TCG'}
      {result.character ? ` · ${result.character}` : ''}
      {result.variant ? ` · ${result.variant}` : ''}
    </div>
  );

  // --- Caso límite: carta identificada pero sin precio en JustTCG ---
  if (kind === 'no-match' || !result.pricing) {
    return (
      <div>
        <EmptyState
          icon={<Icon.Inbox size={26} />}
          title="No encontramos su precio en JustTCG"
          description={result.note || `Reconocimos ${result.character || 'la carta'}, pero no aparece en la base de precios de JustTCG. Prueba con una foto donde se lea mejor el nombre y el set.`}
        />
        {identLine}
        <div className="ap__foot">
          <Button variant="secondary" onClick={onReset}>Tasar otra carta</Button>
        </div>
      </div>
    );
  }

  // --- Match con precio real ---
  const p = result.pricing;
  return (
    <div className="ap__result">
      <div className="ap__rhead">
        {imageUrl && <img className="ap__thumb" src={imageUrl} alt="" />}
        <div>
          <span className="ap__rtag"><Icon.Check size={13} /> {result.franchise || 'TCG'}</span>
          <div className="ap__rname">{p.itemName}</div>
          <div className="ap__rmeta">{result.variant ? result.variant : 'Carta TCG'}</div>
          <div className="ap__conf">
            <span className="ap__confdot" style={{ background: confColor(result.confidence) }} />
            Confianza de identificación: {Math.round(result.confidence * 100)}%
          </div>
        </div>
      </div>

      <div className="ap__range">
        <div className="ap__rangelbl">Rango de precio de mercado</div>
        <div className="ap__rangeval"><b>{money(p.priceMin, p.currency)}</b> — <b>{money(p.priceMax, p.currency)}</b></div>
      </div>

      <div className="ap__comps">
        <div className="ap__complbl">
          <span>Comparables reales</span>
          <span className="ap__src">Fuente: JustTCG · {p.currency}</span>
        </div>
        {p.comparables.map((c, i) => (
          <div className="ap__comp" key={i}>
            <span className="ap__comptt">{c.title}</span>
            <span className="ap__comppr">{money(c.price, p.currency)}</span>
          </div>
        ))}
      </div>

      <div className="ap__foot">
        <Button variant="primary" onClick={onPublish}>
          {Icon.Gavel ? <Icon.Gavel size={16} /> : null} Publicar subasta con este precio
        </Button>
        <Button variant="secondary" onClick={onReset}><Icon.Image size={16} /> Tasar otra carta</Button>
      </div>

      <div className="ap__ident" style={{ marginTop: 12 }}>
        <b>Nota:</b> precios reales de mercado (JustTCG) en {p.currency}; el valor final depende del estado, la edición y la demanda.
      </div>
    </div>
  );
}
