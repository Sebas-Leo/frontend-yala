import React from 'react';
import { Input, Select, Tag, Button, Icon, YData } from '../ds';

const { listings } = YData;

const css = `
.ca{max-width:640px;margin:0 auto;padding:24px;}
.ca__back{display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:600;color:var(--text-muted);cursor:pointer;margin-bottom:14px;}
.ca__h1{font-size:26px;font-weight:800;color:var(--text-strong);letter-spacing:-.02em;margin-bottom:4px;}
.ca__sub{font-size:14px;color:var(--text-muted);margin-bottom:22px;}
.ca__card{background:var(--surface-card);border:1px solid var(--border-subtle);border-radius:var(--radius-xl);padding:24px;box-shadow:var(--shadow-sm);display:flex;flex-direction:column;gap:18px;}
.ca__lbl{font-size:13px;font-weight:600;color:var(--text-strong);margin-bottom:10px;}
.ca__durs{display:flex;gap:10px;flex-wrap:wrap;}
.ca__hint{font-size:12px;color:var(--text-subtle);display:flex;gap:6px;align-items:flex-start;line-height:1.5;}
`;
let ic = false; function ensure(){ if(!ic){ic=true;const s=document.createElement('style');s.textContent=css;document.head.appendChild(s);} }

const DURATIONS = [1, 3, 5, 7];

export default function CreateAuction({ onBack, onCreate }) {
  ensure();
  const [duration, setDuration] = React.useState(3);
  const options = listings.map((l) => ({ value: l.id, label: l.title }));

  return (
    <div className="ca">
      <div className="ca__back" onClick={onBack}><Icon.ChevronLeft size={16} /> Panel del vendedor</div>
      <div className="ca__h1">Nueva subasta</div>
      <div className="ca__sub">Elegí una publicación tuya y definí el precio inicial y la duración.</div>

      <form className="ca__card" onSubmit={(e) => { e.preventDefault(); onCreate && onCreate(); }}>
        <Select label="Publicación" options={options} placeholder="Elegí una de tus publicaciones" required />
        <Input label="Precio inicial (S/.)" prefix="S/." mono placeholder="0.00" hint="Es la puja mínima de apertura." required />

        <div>
          <div className="ca__lbl">Duración</div>
          <div className="ca__durs">
            {DURATIONS.map((d) => <Tag key={d} selected={duration === d} onClick={() => setDuration(d)}>{d} {d === 1 ? 'día' : 'días'}</Tag>)}
          </div>
        </div>

        <Input label="Inicio programado (opcional)" type="datetime-local" hint="Si lo dejás vacío, la subasta arranca de inmediato." />

        <div className="ca__hint"><Icon.Clock size={14} style={{ flex: 'none', marginTop: 1 }} /> Al cerrar con pujas se crea una orden para el ganador con 48h para pagar. Si no paga, pasa al 2º mejor postor.</div>

        <Button variant="primary" size="lg" fullWidth type="submit">Crear subasta</Button>
      </form>
    </div>
  );
}
