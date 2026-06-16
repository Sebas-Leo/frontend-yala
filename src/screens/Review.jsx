import React from 'react';
import { ReputationStars, Textarea, Button, Avatar, Icon, YData } from '../ds';

const { orders } = YData;

const css = `
.rv{max-width:560px;margin:0 auto;padding:32px 24px;}
.rv__back{display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:600;color:var(--text-muted);cursor:pointer;margin-bottom:14px;}
.rv__h1{font-size:24px;font-weight:800;color:var(--text-strong);letter-spacing:-.02em;margin-bottom:4px;}
.rv__sub{font-size:14px;color:var(--text-muted);margin-bottom:20px;}
.rv__card{background:var(--surface-card);border:1px solid var(--border-subtle);border-radius:var(--radius-xl);padding:22px;box-shadow:var(--shadow-sm);}
.rv__item{display:flex;align-items:center;gap:12px;padding-bottom:18px;border-bottom:1px solid var(--border-subtle);margin-bottom:18px;}
.rv__img{width:56px;height:56px;border-radius:var(--radius-md);object-fit:cover;background:var(--surface-sunken);flex:none;}
.rv__ititle{font-size:14px;font-weight:700;color:var(--text-strong);}
.rv__iparty{font-size:13px;color:var(--text-muted);display:flex;align-items:center;gap:6px;margin-top:3px;}
.rv__lbl{font-size:13px;font-weight:700;color:var(--text-strong);margin-bottom:10px;}
.rv__stars{margin-bottom:20px;}
.rv__actions{display:flex;gap:10px;margin-top:18px;}
.rv__note{font-size:12px;color:var(--text-subtle);display:flex;gap:6px;align-items:flex-start;margin-top:14px;line-height:1.5;}
`;
let ic = false; function ensure(){ if(!ic){ic=true;const s=document.createElement('style');s.textContent=css;document.head.appendChild(s);} }

const RATING_LABELS = { 0: 'Tocá una estrella', 1: 'Muy malo', 2: 'Malo', 3: 'Regular', 4: 'Bueno', 5: 'Excelente' };

export default function Review({ onBack, onSubmit }) {
  ensure();
  const o = orders.find((x) => x.status === 'COMPLETED') || orders[2];
  const [rating, setRating] = React.useState(0);
  const [comment, setComment] = React.useState('');

  return (
    <div className="rv">
      <div className="rv__back" onClick={onBack}><Icon.ChevronLeft size={16} /> Mis órdenes</div>
      <div className="rv__h1">Dejá tu reseña</div>
      <div className="rv__sub">La reseña es mutua: vos calificás al vendedor y el vendedor te califica a vos.</div>

      <div className="rv__card">
        <div className="rv__item">
          <img className="rv__img" src={o.img} alt="" />
          <div style={{ minWidth: 0 }}>
            <div className="rv__ititle">{o.title}</div>
            <div className="rv__iparty"><Avatar name={o.party} verified size={18} /> {o.party} · orden #{o.id}</div>
          </div>
        </div>

        <div className="rv__lbl">¿Cómo fue tu experiencia?</div>
        <div className="rv__stars">
          <ReputationStars interactive value={rating} size={34} onRate={setRating} />
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>{RATING_LABELS[rating]}</div>
        </div>

        <Textarea label="Tu comentario (opcional)" maxLength={1000} rows={4}
          placeholder="Contá cómo fue la compra: el estado del ítem, el envío, la comunicación…"
          value={comment} onChange={(e) => setComment(e.target.value)} />

        <div className="rv__note"><Icon.Shield size={14} style={{ flex: 'none', marginTop: 1 }} /> Las reseñas no se pueden editar ni borrar una vez publicadas. Solo se permiten con la orden completada.</div>

        <div className="rv__actions">
          <Button variant="ghost" onClick={onBack}>Cancelar</Button>
          <Button variant="primary" fullWidth disabled={rating === 0} onClick={() => onSubmit && onSubmit(rating)}>Publicar reseña</Button>
        </div>
      </div>
    </div>
  );
}
