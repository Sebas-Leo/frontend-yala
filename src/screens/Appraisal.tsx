import React from 'react';
import { Button, Icon, EmptyState } from '../ds';
import { identifyPhoto, type AppraisalIdentification } from '../api/appraisal';
import { compressImage, matchDataset, type AppraisalMatch } from '../utils/appraisal';

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
.ap__preview{display:flex;gap:18px;align-items:center;}
.ap__thumb{width:120px;height:120px;border-radius:var(--radius-lg);object-fit:cover;background:var(--surface-sunken);flex:none;border:1px solid var(--border-subtle);}
.ap__pvinfo{flex:1;min-width:0;display:flex;flex-direction:column;gap:12px;}
.ap__pvactions{display:flex;gap:10px;flex-wrap:wrap;}
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
.ap__complbl{font-size:13px;font-weight:700;color:var(--text-strong);margin-bottom:12px;}
.ap__comp{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 14px;border:1px solid var(--border-subtle);border-radius:var(--radius-md);margin-bottom:8px;}
.ap__comptt{font-size:13px;color:var(--text-strong);min-width:0;}
.ap__comppr{font-size:13px;font-weight:700;color:var(--text-strong);font-variant-numeric:tabular-nums;white-space:nowrap;}
.ap__foot{display:flex;gap:10px;flex-wrap:wrap;margin-top:20px;}
.ap__ident{font-size:12.5px;color:var(--text-muted);background:var(--surface-sunken);border-radius:var(--radius-md);padding:12px 14px;margin-top:16px;line-height:1.5;}
.ap__ident b{color:var(--text-strong);}
@media(max-width:560px){.ap__preview{flex-direction:column;align-items:stretch}.ap__thumb{width:100%;height:200px}.ap__rhead{flex-direction:column}}
`;
let ic = false;
function ensure() { if (!ic) { ic = true; const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s); } }

const CATEGORIES = ['Funkos', 'Nendoroids', 'Mangas', 'Cómics', 'Cartas TCG'];
const CAT_LABEL: Record<string, string> = {
  funko: 'Funko', nendoroid: 'Nendoroid', manga: 'Manga', comic: 'Cómic', tcg: 'Carta TCG', unknown: 'Sin identificar',
};

function money(n: number) {
  return 'S/. ' + n.toLocaleString('es-PE');
}

type Phase = 'idle' | 'analyzing' | 'done' | 'error';

interface Outcome {
  id: AppraisalIdentification;
  match: AppraisalMatch | null;
  // 'matched' -> hay ítem en dataset; 'no-match' -> IA identificó pero no está en la base;
  // 'unclear' -> foto mala / no reconocible.
  kind: 'matched' | 'no-match' | 'unclear';
}

export default function Appraisal() {
  ensure();
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [phase, setPhase] = React.useState<Phase>('idle');
  const [imageUrl, setImageUrl] = React.useState<string>('');
  const [outcome, setOutcome] = React.useState<Outcome | null>(null);
  const [errMsg, setErrMsg] = React.useState('');

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
      const id = await identifyPhoto(dataUrl);

      // Caso límite: foto mala / no es un coleccionable reconocible.
      if (!id.recognizable || id.category === 'unknown' || id.confidence < 0.35) {
        setOutcome({ id, match: null, kind: 'unclear' });
        setPhase('done');
        return;
      }
      const match = matchDataset(id);
      setOutcome({ id, match, kind: match ? 'matched' : 'no-match' });
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
        <div className="ap__sub">Sube una foto de tu coleccionable y nuestro agente con IA lo identifica y te da un rango de precio estimado con ejemplos comparables.</div>
        <div className="ap__cats">
          {CATEGORIES.map((c) => <span key={c} className="ap__chip">{c}</span>)}
        </div>
      </div>

      <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={onFile} />

      <div className="ap__card">
        {phase === 'idle' && (
          <div className="ap__drop" onClick={pick}>
            <div className="ap__dropic"><Icon.Image size={26} /></div>
            <div className="ap__droptt">Sube una foto de tu coleccionable</div>
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
              <div className="ap__loadtt">Analizando la foto…</div>
              <div className="ap__loadsub">La IA está identificando tu coleccionable</div>
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
          <Result outcome={outcome} imageUrl={imageUrl} onRetry={pick} onReset={reset} />
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

function Result({ outcome, imageUrl, onRetry, onReset }: { outcome: Outcome; imageUrl: string; onRetry: () => void; onReset: () => void }) {
  const { id, match, kind } = outcome;

  // --- Caso límite: foto mala / no reconocible ---
  if (kind === 'unclear') {
    return (
      <EmptyState
        icon={<Icon.SearchX size={26} />}
        title="No pudimos reconocer el coleccionable"
        description={id.note || 'La foto puede estar borrosa o el objeto no es un coleccionable de las categorías soportadas. Sube una foto más clara, bien iluminada y bien encuadrada.'}
        actions={<Button variant="primary" onClick={onRetry}><Icon.Image size={16} /> Subir otra foto</Button>}
      />
    );
  }

  const identLine = (
    <div className="ap__ident">
      <b>Identificado por IA:</b> {CAT_LABEL[id.category] || id.category}
      {id.franchise ? ` · ${id.franchise}` : ''}{id.character ? ` · ${id.character}` : ''}
      {id.variant ? ` · ${id.variant}` : ''}
    </div>
  );

  // --- Caso límite: identificado pero sin match en el dataset ---
  if (kind === 'no-match' || !match) {
    return (
      <div>
        <EmptyState
          icon={<Icon.Inbox size={26} />}
          title="Aún no tenemos este ítem en la base"
          description={`Reconocimos ${id.character || id.franchise || 'el coleccionable'}, pero todavía no está en nuestra base de datos de precios. Estamos sumando más ítems cada semana.`}
        />
        {identLine}
        <div className="ap__foot">
          <Button variant="secondary" onClick={onReset}>Tasar otra foto</Button>
        </div>
      </div>
    );
  }

  // --- Match encontrado ---
  const item = match.item;
  return (
    <div className="ap__result">
      <div className="ap__rhead">
        {imageUrl && <img className="ap__thumb" src={imageUrl} alt="" />}
        <div>
          <span className="ap__rtag"><Icon.Check size={13} /> {CAT_LABEL[item.category]}</span>
          <div className="ap__rname">{item.name}</div>
          <div className="ap__rmeta">{item.franchise}{item.character && item.character !== item.franchise ? ` · ${item.character}` : ''}{id.variant ? ` · ${id.variant}` : ''}</div>
          <div className="ap__conf">
            <span className="ap__confdot" style={{ background: confColor(id.confidence) }} />
            Confianza de identificación: {Math.round(id.confidence * 100)}%
          </div>
        </div>
      </div>

      <div className="ap__range">
        <div className="ap__rangelbl">Rango de precio estimado</div>
        <div className="ap__rangeval"><b>{money(item.priceMin)}</b> — <b>{money(item.priceMax)}</b></div>
      </div>

      <div className="ap__comps">
        <div className="ap__complbl">Comparables recientes</div>
        {item.comparables.map((c, i) => (
          <div className="ap__comp" key={i}>
            <span className="ap__comptt">{c.title}</span>
            <span className="ap__comppr">{money(c.price)}</span>
          </div>
        ))}
      </div>

      <div className="ap__foot">
        <Button variant="secondary" onClick={onReset}><Icon.Image size={16} /> Tasar otra foto</Button>
      </div>

      <div className="ap__ident" style={{ marginTop: 12 }}>
        <b>Nota:</b> es una estimación referencial basada en comparables del mercado; el precio real depende del estado, la edición y la demanda.
      </div>
    </div>
  );
}
