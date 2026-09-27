export function Icon({ name, size = 22 }: { name: 'flask' | 'leaf' | 'book' | 'arrow' | 'check' | 'lock' | 'home'; size?: number }) {
  const paths = { flask: 'M9 3h6M10 3v7L4 20q0 1 2 1h12q2 0 2-1l-6-10V3M8 15h8', leaf: 'M20 3C7 2 2 8 5 16s15 3 15-13ZM4 21 15 10', book: 'M12 5C8 2 3 3 3 3v16s5-1 9 2c4-3 9-2 9-2V3s-5-1-9 2Zm0 0v16', arrow: 'M4 12h16m-6-6 6 6-6 6', check: 'm5 12 4 4L19 6', lock: 'M7 10V7a5 5 0 0 1 10 0v3M5 10h14v11H5Zm7 5v2', home: 'm3 10 9-8 9 8M5 9v12h5v-7h4v7h5V9' };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}

export function TableScene() {
  return <svg viewBox="0 0 660 420" role="img" aria-labelledby="table-title" className="table-scene">
    <title id="table-title">餐盤、蔬菜、米飯與試管的原創示意圖</title>
    <rect x="16" y="20" width="630" height="366" rx="180" fill="#e4efeb" />
    <path d="M24 322c113-36 295-34 612-4v68H24Z" fill="#d9c9aa" />
    <ellipse cx="301" cy="325" rx="198" ry="31" fill="#b7b8a5" opacity=".3" />
    <ellipse cx="291" cy="267" rx="182" ry="103" fill="#fffef9" stroke="#c5d7d1" strokeWidth="3" />
    <ellipse cx="291" cy="267" rx="151" ry="80" fill="#f2f4eb" stroke="#d6dfd5" strokeWidth="2" />
    <g fill="#438060"><circle cx="208" cy="233" r="31"/><circle cx="242" cy="213" r="33"/><circle cx="169" cy="250" r="24"/><circle cx="212" cy="264" r="30"/></g>
    <g fill="#6b9a5b"><circle cx="201" cy="210" r="18"/><circle cx="254" cy="236" r="19"/><circle cx="180" cy="230" r="17"/></g>
    <ellipse cx="345" cy="278" rx="63" ry="41" fill="#fff" transform="rotate(-25 345 278)"/><ellipse cx="347" cy="278" rx="26" ry="25" fill="#e9ac3c"/>
    <g transform="translate(287 181)"><path d="M-41 24q41-36 82 0l-11 36h-60Z" fill="#fcfbec"/><path d="M-45 26h90q-6 68-45 68T-45 26" fill="#6c999b"/><path d="M-30 35q5 38 16 45M-4 34v50M23 35q-4 34-12 45" fill="none" stroke="#e0eded" strokeWidth="6"/></g>
    <path d="m121 308 35-65q11-15 23-7 12 9 5 20l-52 60Z" fill="#da873d"/><path d="m163 236-3-28m10 24 13-26" stroke="#548157" strokeWidth="7" strokeLinecap="round"/>
    <g transform="translate(480 114)"><rect x="-15" y="117" width="133" height="12" rx="4" fill="#ad9675"/><path d="M-5 100v83m111-83v83M-14 173h130" stroke="#ad9675" strokeWidth="10" strokeLinecap="round"/>
    <path d="M9 0h24v129a12 12 0 0 1-24 0ZM52 0h24v129a12 12 0 0 1-24 0Z" fill="#f7fcfd" fillOpacity=".75" stroke="#7c9fa7" strokeWidth="2"/>
    <path d="M11 69h20v60a10 10 0 0 1-20 0Z" fill="#bd8839"/><path d="M54 85h20v44a10 10 0 0 1-20 0Z" fill="#75b7be"/>
    <path d="M6 0h30M49 0h30" stroke="#7c9fa7" strokeWidth="4" strokeLinecap="round"/></g>
    <g transform="translate(108 80) rotate(-15)"><rect width="102" height="76" rx="8" fill="#fffef8" stroke="#d5d9c6"/><path d="M17 23h60M17 39h45M17 55h51" stroke="#bac7b3" strokeWidth="4"/></g>
    <path d="m415 104 10-19m5 28 23-3" stroke="#dba445" strokeWidth="5" strokeLinecap="round" />
  </svg>;
}

export function ExperimentScene({ revealed }: {revealed: boolean}) {
  return <svg viewBox="0 0 560 250" role="img" aria-labelledby="experiment-title" className="experiment-scene">
    <title id="experiment-title">{revealed ? '滴入碘液後：澱粉液呈藍黑色，水維持黃褐色。' : '尚未滴入碘液的澱粉液與水樣本。'}</title>
    <rect width="560" height="250" rx="16" fill="#edf5f3"/>
    <path d="M0 182h560" stroke="#d7e5e1" strokeWidth="2"/>
    <g transform="translate(44 51)"><rect x="8" y="41" width="66" height="102" rx="12" fill="#9c622b"/><rect x="16" y="35" width="50" height="19" rx="3" fill="#583e2f"/><path d="M31 34V9a10 10 0 0 1 20 0v25" fill="#233f45"/><rect x="13" y="80" width="56" height="35" rx="3" fill="#fffdf4"/><text x="41" y="104" textAnchor="middle" fill="#233f45" fontSize="17">碘液</text></g>
    {[{x:246,label:'澱粉液',color:'#36305e'}, {x:428,label:'水',color:'#ba8736'}].map(s=><g key={s.label}>
      <ellipse cx={s.x} cy="180" rx="72" ry="13" fill="#c4d4d2" opacity=".4"/>
      <path d={`M${s.x-68} 137v35c0 24 136 24 136 0v-35`} fill="#dceef0" fillOpacity=".75" stroke="#719ba5" strokeWidth="2"/>
      <ellipse cx={s.x} cy="150" rx="65" ry="20" fill={revealed?s.color:'#dceef0'} className="sample-liquid"/>
      <ellipse cx={s.x} cy="136" rx="68" ry="22" fill="none" stroke="#719ba5" strokeWidth="2"/>
      {revealed&&<path d={`M${s.x} 87q-14 18 0 24 14-6 0-24`} fill="#ba8736" className="drop"/>}
      <text x={s.x} y="225" textAnchor="middle" fill="#193d48" fontSize="20" fontWeight="600">{s.label}</text>
    </g>)}
  </svg>;
}
