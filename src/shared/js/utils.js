export function makeCardsClickable(root){
  root.querySelectorAll(".atc-card[data-url]").forEach(card=>{
    const url=card.getAttribute("data-url");
    card.setAttribute("role","link");
    if(!card.hasAttribute("tabindex")) card.tabIndex = 0;
    card.addEventListener("click", e=>{
      if(e.target.closest("a,button,input,select,textarea")) return;
      location.href=url;
    });
    card.addEventListener("keydown", e=>{
      if(e.target!==card) return;
      if(e.key==="Enter"||e.key===" "){ e.preventDefault(); location.href=url; }
    });
  });
}