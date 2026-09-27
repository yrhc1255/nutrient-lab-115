/** Original approved mockup artwork, framed without rasterizing the live interface. */
export function ReferenceArt({kind}:{kind:'home'|'scientist'|'food'|'lab'|'evidence'}) {
  const labels = {home:'明亮教室中的米飯、蔬菜、蛋、豆類與實驗器材',scientist:'拿著放大鏡觀察的科學探索員',food:'米飯、魚、油、蔬菜與水的食物插畫',lab:'使用滴管觀察試管的科學探索員',evidence:'記錄觀察、比對資料與提出結論的筆記'};
  const source=kind==='home'?'home':'guide';
  return <span className={`reference-art reference-${kind}`} role="img" aria-label={labels[kind]}><img src={`/art/${source}-reference.png`} alt="" /></span>;
}

export function DetailedExperiment({revealed}:{revealed:boolean}) {
  return <div className={`detailed-experiment ${revealed?'is-revealed':''}`} role="img" aria-label={revealed?'加入碘液後，澱粉液呈藍黑色，水呈黃褐色。':'黃褐色碘液與尚未檢測的澱粉液、水。'}>
    <img src="/art/lesson-reference.png" alt="" />
    {revealed&&<><i className="sample starch"/><i className="sample water"/><b className="drop starch-drop"/><b className="drop water-drop"/></>}
    <span className="iodine-label">碘液<br/><small>（黃褐色）</small></span><span className="starch-label">澱粉液<br/><small>（待測樣本）</small></span><span className="water-label">水<br/><small>（對照組）</small></span>
  </div>;
}
