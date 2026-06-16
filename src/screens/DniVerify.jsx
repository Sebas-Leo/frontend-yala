import React from 'react';
import { Input, Button, Icon } from '../ds';

const css = `
.dv{max-width:480px;margin:0 auto;padding:40px 24px;}
.dv__back{display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:600;color:var(--text-muted);cursor:pointer;margin-bottom:14px;}
.dv__card{background:var(--surface-card);border:1px solid var(--border-subtle);border-radius:var(--radius-xl);padding:28px;box-shadow:var(--shadow-sm);}
.dv__icon{width:52px;height:52px;border-radius:50%;background:var(--brand-subtle);color:var(--brand);display:flex;align-items:center;justify-content:center;margin-bottom:16px;}
.dv__h1{font-size:22px;font-weight:800;color:var(--text-strong);letter-spacing:-.02em;margin-bottom:6px;}
.dv__sub{font-size:14px;color:var(--text-muted);line-height:1.5;margin-bottom:20px;}
.dv__form{display:flex;flex-direction:column;gap:14px;}
.dv__row{display:flex;gap:12px;}
.dv__note{font-size:12px;color:var(--text-subtle);display:flex;gap:7px;align-items:flex-start;line-height:1.5;margin-top:4px;}
`;
let ic = false; function ensure(){ if(!ic){ic=true;const s=document.createElement('style');s.textContent=css;document.head.appendChild(s);} }

export default function DniVerify({ onVerify, onBack }) {
  ensure();
  const [dni, setDni] = React.useState('');
  const valid = /^\d{8}$/.test(dni);

  return (
    <div className="dv">
      <div className="dv__back" onClick={onBack}><Icon.ChevronLeft size={16} /> Volver</div>
      <div className="dv__card">
        <div className="dv__icon"><Icon.Shield size={26} /></div>
        <div className="dv__h1">Verificá tu identidad</div>
        <div className="dv__sub">Yala pide tu DNI una única vez antes de tu primera compra o puja. Es para mantener el marketplace seguro entre desconocidos.</div>

        <form className="dv__form" onSubmit={(e) => { e.preventDefault(); onVerify && onVerify(); }}>
          <Input label="DNI" mono placeholder="12345678" inputMode="numeric" maxLength={8}
            value={dni} onChange={(e) => setDni(e.target.value.replace(/\D/g, '').slice(0, 8))}
            error={dni && !valid ? 'El DNI debe tener 8 dígitos.' : undefined} required />
          <div className="dv__row">
            <Input label="Nombres" placeholder="Diego" style={{ flex: 1, minWidth: 0 }} required />
            <Input label="Apellidos" placeholder="Ramírez" style={{ flex: 1, minWidth: 0 }} required />
          </div>
          <div className="dv__note"><Icon.Shield size={14} style={{ flex: 'none', marginTop: 1 }} /> Tu DNI nunca se comparte con el vendedor ni se muestra en tu perfil. Solo verás un ícono de "identidad verificada".</div>
          <Button variant="primary" size="lg" fullWidth type="submit" disabled={!valid}>Verificar identidad</Button>
        </form>
      </div>
    </div>
  );
}
