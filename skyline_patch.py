import re
STATIC = "/var/lib/kolla/venv/lib/python3.12/site-packages/skyline_console/static"
html = open(STATIC + "/index.html").read()
html = html.replace("<title>Cloud</title>", "<title>Xloud Dashboard</title>")
import re as re2
html = re2.sub(r'<meta name="viewport"[^/]*/>', '<meta name="viewport" content="width=1400" />', html)
# Title interceptor: reads localStorage, sets title, prevents React from changing it
title_intercept = '<script>try{var _u=JSON.parse(localStorage.getItem("xloud_ui"));if(_u&&_u.pageTitle){document.title=_u.pageTitle;window._xloudTitle=_u.pageTitle;var _ot=Object.getOwnPropertyDescriptor(Document.prototype,"title");Object.defineProperty(document,"title",{get:function(){return _ot.get.call(this)},set:function(v){_ot.set.call(this,window._xloudTitle||v)}})}}catch(e){}</script>'
html = html.replace("</title>", "</title>" + title_intercept, 1)
html = html.replace('href="/favicon.ico"', 'href="/favicon.svg" type="image/svg+xml"')
html = re.sub(r"<style[^>]*>.*?</style>", "", html, flags=re.DOTALL)
html = re.sub(r"<script id=xloud-theme-auto>.*?</script>", "", html, flags=re.DOTALL)




# Instant theme v3: inject right before </head>, append to documentElement
instant_theme = '<script id="xloud-instant-theme">(function(){try{var s=JSON.parse(localStorage.getItem("xloud_ui"));if(!s||!s.brandColor)return;var c=s.brandColor;function h2l(hex){var r=parseInt(hex.slice(1,3),16)/255,g=parseInt(hex.slice(3,5),16)/255,b=parseInt(hex.slice(5,7),16)/255;var mx=Math.max(r,g,b),mn=Math.min(r,g,b),h,s2,l=(mx+mn)/2;if(mx===mn){h=s2=0}else{var d=mx-mn;s2=l>0.5?d/(2-mx-mn):d/(mx+mn);if(mx===r)h=((g-b)/d+(g<b?6:0))/6;else if(mx===g)h=((b-r)/d+2)/6;else h=((r-g)/d+4)/6}return[Math.round(h*360),Math.round(s2*100),Math.round(l*100)]}function h2h(h,s2,l){h/=360;s2/=100;l/=100;var r,g,b;if(s2===0){r=g=b=l}else{function q(p,q2,t){if(t<0)t+=1;if(t>1)t-=1;if(t<1/6)return p+(q2-p)*6*t;if(t<1/2)return q2;if(t<2/3)return p+(q2-p)*(2/3-t)*6;return p}var Q=l<0.5?l*(1+s2):l+s2-l*s2,p=2*l-Q;r=q(p,Q,h+1/3);g=q(p,Q,h);b=q(p,Q,h-1/3)}return"#"+[r,g,b].map(function(x){var h2=Math.round(x*255).toString(16);return h2.length===1?"0"+h2:h2}).join("")}var hsl=h2l(c),h=hsl[0],st=hsl[1],l=hsl[2];var sel=h2h(h,Math.min(st+10,100),Math.max(l-10,18));var sbg=h2h(h,Math.min(st,20),13);var btn=h2h(h,Math.min(st+5,100),Math.max(l-5,20));var hdr=h2h(h,Math.min(st,80),Math.min(l+12,70));var tab=h2h(h,Math.min(st+5,100),Math.min(l+8,55));var css=document.createElement("style");css.id="xloud-instant";css.textContent="body .ant-layout-sider{background:"+sbg+"!important}body .ant-menu-dark .ant-menu-item-selected{background:"+sel+"!important}body .ant-btn-primary{background:"+btn+"!important;border-color:"+btn+"!important}body .ant-layout-header{border-bottom:2px solid "+hdr+"!important}body .ant-tabs-tab-active .ant-tabs-tab-btn{color:"+tab+"!important}body .ant-tabs-ink-bar{background:"+tab+"!important}body .ant-switch-checked{background:"+c+"!important}body .ant-pagination-item-active{border-color:"+c+"!important}body .ant-checkbox-checked .ant-checkbox-inner{background:"+c+"!important;border-color:"+c+"!important}";document.documentElement.appendChild(css);function keep(){if(!window._xloudInstantStop)document.documentElement.appendChild(css)}window.addEventListener("load",keep);setInterval(keep,200)}catch(e){}})()</script>'
html = html.replace('</head>', instant_theme + '</head>')

css = "<style id=xloud-static>"
# Layout/sizing only - NO colors here (colors handled by dynamic theme script)
css += "html,body{font-size:12px!important}"
css += ".ant-layout-sider{width:200px!important;min-width:200px!important;max-width:200px!important;flex:0 0 200px!important}"
css += ".ant-menu-dark,.ant-menu.ant-menu-dark{background:transparent!important}"
css += ".ant-menu-dark .ant-menu-item-selected{border-radius:4px!important}"
css += ".ant-menu-item,.ant-menu-submenu-title{font-size:12px!important;height:36px!important;line-height:36px!important}"
css += ".ant-btn{font-size:12px!important;padding:3px 12px!important;height:28px!important}"
css += ".ant-layout-header{height:48px!important;line-height:48px!important;padding:0 16px!important}"
css += "h2{font-size:16px!important}"
css += ".ant-breadcrumb{font-size:12px!important}"
css += ".ant-btn-default{color:#333!important;border-color:#d9d9d9!important}"
css += ".index__logo--t_KQf,.index__logo--VDnnm{width:220px!important;max-width:220px!important;min-width:220px!important;overflow:visible!important;padding:4px 0!important}"
css += ".index__logo-image--1r9zB{width:220px!important;max-width:220px!important}"
css += ".index__logo-image--1r9zB img{width:200px!important;height:52px!important;max-width:none!important;object-fit:contain!important}"
css += ".index__logo-collapse--1dyW-{display:none!important}"
css += ".index__logo--t_KQf span,.index__logo--VDnnm span{display:none!important}"
css += ".index__main--22yB3,.index__main--jl6wy{overflow:auto!important;height:calc(100vh - 48px)!important}"
css += ".index__content--14doI,.index__content--2bhUz{overflow:visible!important;height:auto!important}"
css += ".index__base-layout-right--3JjUr{overflow:auto!important}"
css += "button{cursor:pointer!important;transition:all 0.15s ease!important}"
css += ".ant-layout-footer::after{content:'Powered by Xloud Technologies';display:block;text-align:center;color:#999;font-size:12px;padding:8px 0}"
css += ".ant-table{table-layout:fixed!important}.ant-table-thead>tr>th,.ant-table-tbody>tr>td{overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}.ant-table-wrapper{overflow-x:auto!important}"
css += ".ant-btn-primary,.ant-btn-primary a,.ant-btn-primary span,.ant-btn-primary .anticon{color:#fff!important}"
css += ".ant-btn-icon-only{display:inline-flex!important;align-items:center!important;justify-content:center!important}"
css += "</style>"

# Global theme auto-apply script - reads localStorage on every page load
theme_script = """<script id=xloud-theme-auto>
(function(){
function h2h(h,s,l){h/=360;s/=100;l/=100;var r,g,b;
if(s===0){r=g=b=l}else{
function q2(p,q,t){if(t<0)t+=1;if(t>1)t-=1;if(t<1/6)return p+(q-p)*6*t;if(t<1/2)return q;if(t<2/3)return p+(q-p)*(2/3-t)*6;return p}
var q=l<0.5?l*(1+s):l+s-l*s,p=2*l-q;r=q2(p,q,h+1/3);g=q2(p,q,h);b=q2(p,q,h-1/3)}
return"#"+[r,g,b].map(function(x){var h=Math.round(x*255).toString(16);return h.length===1?"0"+h:h}).join("")}
function h2l(hex){var r=parseInt(hex.slice(1,3),16)/255,g=parseInt(hex.slice(3,5),16)/255,b=parseInt(hex.slice(5,7),16)/255;
var mx=Math.max(r,g,b),mn=Math.min(r,g,b),h,s,l=(mx+mn)/2;
if(mx===mn){h=s=0}else{var d=mx-mn;s=l>0.5?d/(2-mx-mn):d/(mx+mn);
if(mx===r)h=((g-b)/d+(g<b?6:0))/6;else if(mx===g)h=((b-r)/d+2)/6;else h=((r-g)/d+4)/6}
return[Math.round(h*360),Math.round(s*100),Math.round(l*100)]}
try{
var s=JSON.parse(localStorage.getItem("xloud_ui"));
if(!s)s={brandColor:"#00897b"};
if(!s.brandColor)s.brandColor="#00897b";
var c=s.brandColor,hsl=h2l(c),h=hsl[0],st=hsl[1],l=hsl[2];
var btn=h2h(h,Math.min(st+5,100),Math.max(l-5,20));
var hdr=h2h(h,Math.min(st,80),Math.min(l+12,70));
var sel=h2h(h,Math.min(st+10,100),Math.max(l-10,18));
var sbg=h2h(h,Math.min(st,20),13);
var hov=h2h(h,st,Math.min(l+15,65));
var tab=h2h(h,Math.min(st+5,100),Math.min(l+8,55));
var swi=h2h(h,Math.min(st,90),Math.max(l-3,25));
var chk=h2h(h,Math.min(st+8,100),Math.max(l-8,22));
var pag=h2h(h,Math.max(st-15,30),Math.min(l+20,75));
var lit=h2h(h,Math.max(st-10,30),92);
var el=document.createElement("style");el.id="xloud-dyn";
el.textContent=
".ant-layout-sider{background:"+sbg+"!important}"+
".ant-menu-dark .ant-menu-item-selected{background:"+sel+"!important}"+
".ant-btn-primary{background:"+btn+"!important;border-color:"+btn+"!important}"+
".ant-btn-primary:hover,.ant-btn-primary:focus{background:"+hov+"!important;border-color:"+hov+"!important}"+
".ant-layout-header{border-bottom:2px solid "+hdr+"!important}"+
"a{color:"+c+"!important}"+".ant-btn-primary a,.ant-btn-primary span,.ant-btn a[style]{color:#fff!important}"+
"a:hover{color:"+hov+"!important}"+
".ant-switch-checked{background:"+swi+"!important}"+
".ant-tabs-tab-active .ant-tabs-tab-btn{color:"+tab+"!important}"+
".ant-tabs-ink-bar{background:"+tab+"!important}"+
".ant-pagination-item-active{border-color:"+pag+"!important;background:"+lit+"!important}"+
".ant-pagination-item-active a{color:"+c+"!important}"+
".ant-checkbox-checked .ant-checkbox-inner{background-color:"+chk+"!important;border-color:"+chk+"!important}"+
".ant-radio-checked .ant-radio-inner{border-color:"+c+"!important}"+
".ant-radio-checked .ant-radio-inner::after{background-color:"+c+"!important}"+
".ant-select-focused .ant-select-selector{border-color:"+hdr+"!important}"+
".ant-input:focus,.ant-input-focused{border-color:"+hdr+"!important}"+
".ant-menu-item-selected{color:"+c+"!important}"+
".ant-breadcrumb a{color:"+tab+"!important}"+
".ant-table-thead>tr>th{border-bottom:2px solid "+lit+"!important}"+
".ant-spin-dot-item{background-color:"+c+"!important}"+
".ant-progress-bg{background-color:"+c+"!important}"+
".login-form-button{background:"+btn+"!important;border-color:"+btn+"!important}"+
".ant-btn-default:hover,.ant-btn-default:focus{color:"+c+"!important;border-color:"+c+"!important}"+
".ant-menu-dark .ant-menu-item:hover,.ant-menu-dark .ant-menu-submenu-title:hover{background:rgba(255,255,255,0.08)!important}"+
".ant-input:focus,.ant-input-focused,.ant-select-focused .ant-select-selector{border-color:"+hdr+"!important;box-shadow:0 0 0 2px rgba("+parseInt(c.slice(1,3),16)+","+parseInt(c.slice(3,5),16)+","+parseInt(c.slice(5,7),16)+",0.2)!important}";
document.body.appendChild(el);function reapply(){var e=document.getElementById("xloud-dyn");if(e)document.body.appendChild(e)}window.addEventListener("load",reapply);setTimeout(reapply,500);setTimeout(reapply,1500);setTimeout(reapply,3000);setTimeout(reapply,5000);
if(s.pageTitle){document.title=s.pageTitle;
window._xloudTitle=s.pageTitle;
setInterval(function(){if(window._xloudTitle&&document.title!==window._xloudTitle)document.title=window._xloudTitle},500);
}
if(s.faviconUrl){var lk=document.querySelector("link[rel*=icon]");if(lk)lk.href=s.faviconUrl}
if(s.logoUrl){document.addEventListener("DOMContentLoaded",function(){var imgs=document.querySelectorAll("img[src*=logo]");imgs.forEach(function(img){img.src=s.logoUrl})})}
}catch(e){}
})();
</script>"""

html = html.replace("</head>", css + "</head>")





html = html.replace("</body>", theme_script + "</body>")
open(STATIC + "/index.html", "w").write(html)
import os
os.chmod(STATIC + "/index.html", 0o644)
print("index.html patched with global theme auto-apply")
