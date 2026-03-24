import React, { Component } from "react";
import { observer, inject } from "mobx-react";

// Convert hex to HSL
function hexToHsl(hex) {
  var r = parseInt(hex.slice(1,3),16)/255, g = parseInt(hex.slice(3,5),16)/255, b = parseInt(hex.slice(5,7),16)/255;
  var max = Math.max(r,g,b), min = Math.min(r,g,b), h, s, l = (max+min)/2;
  if(max===min){h=s=0}else{
    var d=max-min; s=l>0.5?d/(2-max-min):d/(max+min);
    if(max===r)h=((g-b)/d+(g<b?6:0))/6;
    else if(max===g)h=((b-r)/d+2)/6;
    else h=((r-g)/d+4)/6;
  }
  return [Math.round(h*360),Math.round(s*100),Math.round(l*100)];
}

function hslToHex(h,s,l) {
  h/=360;s/=100;l/=100;
  var r,g,b;
  if(s===0){r=g=b=l}else{
    function hue2rgb(p,q,t){if(t<0)t+=1;if(t>1)t-=1;if(t<1/6)return p+(q-p)*6*t;if(t<1/2)return q;if(t<2/3)return p+(q-p)*(2/3-t)*6;return p}
    var q=l<0.5?l*(1+s):l+s-l*s, p=2*l-q;
    r=hue2rgb(p,q,h+1/3);g=hue2rgb(p,q,h);b=hue2rgb(p,q,h-1/3);
  }
  return "#"+[r,g,b].map(function(x){var hex=Math.round(x*255).toString(16);return hex.length===1?"0"+hex:hex}).join("");
}

// Generate all theme colors from one brand color
function generatePalette(hex) {
  var hsl = hexToHsl(hex);
  var h = hsl[0], s = hsl[1], l = hsl[2];
  return {
    primaryColor: hex,                                              // base brand color
    btnPrimary: hslToHex(h, Math.min(s+5,100), Math.max(l-5,20)),  // slightly darker for buttons
    headerBorder: hslToHex(h, Math.min(s,80), Math.min(l+12,70)),  // lighter shade for header
    sidebarSelectedBg: hslToHex(h, Math.min(s+10,100), Math.max(l-10,18)), // darker for selected
    sidebarBg: hslToHex(h, Math.min(s, 20), 13),                   // very dark desaturated
    linkHover: hslToHex(h, s, Math.min(l+15, 65)),                  // lighter for hover
    activeLight: hslToHex(h, Math.max(s-10,30), 92),                // very light tint
    tabActive: hslToHex(h, Math.min(s+5,100), Math.min(l+8,55)),   // slightly lighter for active tabs
    switchBg: hslToHex(h, Math.min(s,90), Math.max(l-3,25)),       // near-primary for switches
    checkBg: hslToHex(h, Math.min(s+8,100), Math.max(l-8,22)),     // darker for checkboxes
    paginationBorder: hslToHex(h, Math.max(s-15,30), Math.min(l+20,75)), // lighter for pagination
  };
}

var DEFAULTS = {brandColor:"#00897b",logoUrl:"",faviconUrl:"",primaryColor:"#00897b",sidebarBg:"#212121",sidebarSelectedBg:"#00897b",headerBorder:"#00897b",btnPrimary:"#00897b",pageTitle:"Xloud Dashboard",welcomeText:"Welcome to Xloud Platform",footerText:"Powered by Xloud Technologies"};
function getSettings(){try{return JSON.parse(localStorage.getItem("xloud_ui")||"null")||DEFAULTS}catch(e){return DEFAULTS}}
function saveSettings(s){localStorage.setItem("xloud_ui",JSON.stringify(s))}
function applyTheme(s){
  var el=document.getElementById("xloud-dyn");
  if(el)el.parentNode.removeChild(el);
  el=document.createElement("style");el.id="xloud-dyn";document.body.appendChild(el);
  // Regenerate shades from brand color
  var brand = s.brandColor || s.primaryColor || "#00897b";
  var p = generatePalette(brand);
  el.textContent =
    ".ant-layout-sider{background:"+p.sidebarBg+"!important}" +
    ".ant-menu-dark .ant-menu-item-selected{background:"+p.sidebarSelectedBg+"!important}" +
    ".ant-btn-primary{background:"+p.btnPrimary+"!important;border-color:"+p.btnPrimary+"!important}" +
    ".ant-btn-primary:hover,.ant-btn-primary:focus{background:"+p.linkHover+"!important;border-color:"+p.linkHover+"!important}" +
    ".ant-layout-header{border-bottom:2px solid "+p.headerBorder+"!important}" +
    "a{color:"+p.primaryColor+"!important}" +
    "a:hover{color:"+p.linkHover+"!important}" +
    ".ant-switch-checked{background:"+p.switchBg+"!important}" +
    ".ant-tabs-tab-active .ant-tabs-tab-btn{color:"+p.tabActive+"!important}" +
    ".ant-tabs-ink-bar{background:"+p.tabActive+"!important}" +
    ".ant-pagination-item-active{border-color:"+p.paginationBorder+"!important;background:"+p.activeLight+"!important}" +
    ".ant-pagination-item-active a{color:"+p.primaryColor+"!important}" +
    ".ant-checkbox-checked .ant-checkbox-inner{background-color:"+p.checkBg+"!important;border-color:"+p.checkBg+"!important}" +
    ".ant-radio-checked .ant-radio-inner{border-color:"+p.primaryColor+"!important}" +
    ".ant-radio-checked .ant-radio-inner::after{background-color:"+p.primaryColor+"!important}" +
    ".ant-select-focused .ant-select-selector{border-color:"+p.headerBorder+"!important}" +
    ".ant-input:focus,.ant-input-focused{border-color:"+p.headerBorder+"!important}" +
    ".ant-menu-item-selected{color:"+p.primaryColor+"!important}" +
    ".ant-breadcrumb a{color:"+p.tabActive+"!important}" +
    ".ant-table-thead>tr>th{border-bottom:2px solid "+p.activeLight+"!important}" +
    ".ant-steps-item-finish .ant-steps-item-icon{border-color:"+p.primaryColor+"!important}" +
    ".ant-steps-item-finish .ant-steps-item-icon>.ant-steps-icon{color:"+p.primaryColor+"!important}" +
    ".ant-progress-bg{background-color:"+p.primaryColor+"!important}" +
    ".ant-tag-has-color{background:"+p.btnPrimary+"!important}" +
    ".login-form-button{background:"+p.btnPrimary+"!important;border-color:"+p.btnPrimary+"!important}" +
    ".ant-btn-default:hover,.ant-btn-default:focus{color:"+p.primaryColor+"!important;border-color:"+p.primaryColor+"!important}" +
    ".ant-menu-dark .ant-menu-item:hover,.ant-menu-dark .ant-menu-submenu-title:hover{background:rgba(255,255,255,0.08)!important}" +
    ".ant-spin-dot-item{background-color:"+p.primaryColor+"!important}" +
    ".ant-input:focus,.ant-input-focused,.ant-select-focused .ant-select-selector{border-color:"+p.headerBorder+"!important;box-shadow:0 0 0 2px rgba("+parseInt(p.primaryColor.slice(1,3),16)+","+parseInt(p.primaryColor.slice(3,5),16)+","+parseInt(p.primaryColor.slice(5,7),16)+",0.2)!important}";
  document.title=s.pageTitle||"Xloud Dashboard";window._xloudTitle=s.pageTitle||"Xloud Dashboard";
  var logos=document.querySelectorAll(".index__logo-image--1r9zB img");if(s.logoUrl){logos.forEach(function(img){img.src=s.logoUrl})}else{logos.forEach(function(img){img.src="/asset/image/cloud-logo.svg?t="+Date.now()})}
  var link=document.querySelector("link[rel*='icon']");if(s.faviconUrl){if(link)link.href=s.faviconUrl}else{if(link)link.href="/favicon.svg?t="+Date.now()}
}
function fileToDataUrl(file, cb){var reader=new FileReader();reader.onload=function(e){cb(e.target.result)};reader.readAsDataURL(file)}

var L={display:"block",marginBottom:4,fontWeight:600,fontSize:13,color:"#333"};
var I={width:"100%",padding:"8px 12px",border:"1px solid #d9d9d9",borderRadius:4,fontSize:14,marginBottom:16,boxSizing:"border-box"};
var S={background:"#fff",borderRadius:8,padding:24,marginBottom:20,boxShadow:"0 1px 3px rgba(0,0,0,0.1)"};
var B={padding:"10px 24px",background:"#00897b",color:"#fff",border:"none",borderRadius:6,cursor:"pointer",fontSize:14,fontWeight:600,marginRight:12};
var BO={padding:"10px 24px",background:"transparent",color:"#e51c23",border:"1px solid #e51c23",borderRadius:6,cursor:"pointer",fontSize:14,fontWeight:600};
var UPBTN={padding:"8px 16px",background:"#f5f5f5",border:"1px solid #d9d9d9",borderRadius:4,cursor:"pointer",fontSize:13};
var PREVIEW_IMG={width:120,height:40,objectFit:"contain",border:"1px solid #eee",borderRadius:4,padding:4,background:"#fafafa"};
var PREVIEW_FAV={width:32,height:32,objectFit:"contain",border:"1px solid #eee",borderRadius:4,padding:4,background:"#fafafa"};

// Preset brand colors
var PRESETS = [
  {name:"Teal",color:"#00897b"},
  {name:"Blue",color:"#1976d2"},
  {name:"Indigo",color:"#3949ab"},
  {name:"Purple",color:"#8e24aa"},
  {name:"Red",color:"#e53935"},
  {name:"Orange",color:"#f4511e"},
  {name:"Amber",color:"#ffb300"},
  {name:"Green",color:"#43a047"},
  {name:"Cyan",color:"#00acc1"},
  {name:"Pink",color:"#d81b60"},
];

class UISettings extends Component{
  constructor(p){
    super(p);
    this.state=getSettings();
    this.logoInput=React.createRef();
    this.favInput=React.createRef();
  }
  componentDidMount(){this._original=JSON.stringify(getSettings());applyTheme(this.state);window.addEventListener("beforeunload",this._warnUnsaved=function(e){if(this._dirty){e.preventDefault();e.returnValue=""}}.bind(this))}
  componentWillUnmount(){window.removeEventListener("beforeunload",this._warnUnsaved);if(this._dirty){var orig=JSON.parse(this._original);applyTheme(orig)}}
  sf(k,v){var ns=Object.assign({},this.state);ns[k]=v;this._dirty=true;this.setState(ns)}
  setBrand(color){
    var palette = generatePalette(color);
    var ns = Object.assign({}, this.state, palette, {brandColor: color});
    this._dirty=true;this.setState(ns);
  }
  doSave(){var me=this;var inst=document.getElementById("xloud-instant");if(inst)inst.remove();window._xloudInstantStop=true;saveSettings(this.state);applyTheme(this.state);if(!me.state.logoUrl){var imgs=document.querySelectorAll(".index__logo-image--1r9zB img,[class*=logo-image] img");imgs.forEach(function(img){img.src="/asset/image/cloud-logo.svg?t="+Date.now()})}if(!me.state.faviconUrl){var fav=document.querySelector("link[rel*=icon]");if(fav)fav.href="/favicon.svg?t="+Date.now()}me._dirty=false;me._original=JSON.stringify(me.state);me.setState({saveState:"saved"});setTimeout(function(){me.setState({saveState:""})},2000)}
  doReset(){if(!confirm("Reset all to defaults?"))return;var me=this;var d=Object.assign({},DEFAULTS);me._dirty=false;me._original=JSON.stringify(d);var inst=document.getElementById("xloud-instant");if(inst)inst.remove();window._xloudInstantStop=true;me.setState(Object.assign({},d,{saveState:"reset"}),function(){saveSettings(d);applyTheme(d);var fav=document.querySelector("link[rel*=icon]");if(fav)fav.href="/favicon.svg?t="+Date.now();var imgs=document.querySelectorAll(".index__logo-image--1r9zB img,[class*=logo-image] img");imgs.forEach(function(img){img.src="/asset/image/cloud-logo.svg?t="+Date.now()});setTimeout(function(){me.setState({saveState:""})},2000)})}
  doPreview(){applyTheme(this.state);this._previewing=true}
  handleLogo(e){var me=this;var f=e.target.files[0];if(!f)return;fileToDataUrl(f,function(url){me.sf("logoUrl",url)})}
  handleFavicon(e){var me=this;var f=e.target.files[0];if(!f)return;fileToDataUrl(f,function(url){me.sf("faviconUrl",url)})}
  removeLogo(){this.sf("logoUrl","")}
  removeFavicon(){this.sf("faviconUrl","")}
  render(){var s=this.state,me=this;
    var brandColor = s.brandColor || s.primaryColor || "#00897b";
    var palette = generatePalette(brandColor);
    var hsl = hexToHsl(brandColor);

    // Color swatch for generated shades
    var swatch = function(label, color) {
      return React.createElement("div",{style:{display:"flex",alignItems:"center",gap:10,marginBottom:6}},
        React.createElement("div",{style:{width:28,height:28,borderRadius:6,background:color,border:"1px solid rgba(0,0,0,0.1)"}}),
        React.createElement("div",null,
          React.createElement("div",{style:{fontSize:12,fontWeight:500}},label),
          React.createElement("div",{style:{fontSize:10,color:"#999",fontFamily:"monospace"}},color)));
    };

    return React.createElement("div",{style:{padding:24,overflowY:"auto",height:"calc(100vh - 100px)"}},
      React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}},
        React.createElement("div",null,
          React.createElement("h2",{style:{fontSize:22,fontWeight:600,margin:0}},"UI Customization"),
          React.createElement("p",{style:{color:"#888",margin:"4px 0 0",fontSize:14}},"Pick a brand color and the entire dashboard adapts")),
        React.createElement("div",null,
          React.createElement("button",{style:Object.assign({},B,{background:brandColor}),onClick:function(){me.doPreview()}},"Preview"),
          React.createElement("button",{style:Object.assign({},B,{background:s.saveState==="saved"?"#4caf50":"#1890ff",transition:"all 0.3s ease"}),onClick:function(){me.doSave()}},s.saveState==="saved"?"✓ Saved!":"Save"),
          React.createElement("button",{style:Object.assign({},BO,{color:s.saveState==="reset"?"#4caf50":"#e51c23",borderColor:s.saveState==="reset"?"#4caf50":"#e51c23"}),onClick:function(){me.doReset()}},s.saveState==="reset"?"✓ Reset!":"Reset"))),

      // Brand Color section - full width
      React.createElement("div",{style:Object.assign({},S,{marginBottom:24})},
        React.createElement("h3",{style:{fontSize:16,fontWeight:600,marginBottom:16,paddingBottom:8,borderBottom:"1px solid #f0f0f0"}},"Brand Color"),
        React.createElement("div",{style:{display:"flex",alignItems:"flex-start",gap:32}},
          // Color picker
          React.createElement("div",{style:{textAlign:"center"}},
            React.createElement("input",{type:"color",value:brandColor,onChange:function(e){me.setBrand(e.target.value)},style:{width:80,height:80,padding:2,border:"2px solid #d9d9d9",borderRadius:12,cursor:"pointer",display:"block"}}),
            React.createElement("div",{style:{fontSize:14,fontWeight:600,marginTop:8,fontFamily:"monospace"}},brandColor)),
          // Presets
          React.createElement("div",{style:{flex:1}},
            React.createElement("div",{style:{fontSize:13,fontWeight:600,marginBottom:10,color:"#555"}},"Quick Presets"),
            React.createElement("div",{style:{display:"flex",gap:8,flexWrap:"wrap"}},
              PRESETS.map(function(p){
                var isActive = brandColor.toLowerCase() === p.color.toLowerCase();
                return React.createElement("div",{key:p.color,onClick:function(){me.setBrand(p.color)},title:p.name,style:{width:36,height:36,borderRadius:8,background:p.color,cursor:"pointer",border:isActive?"3px solid #333":"3px solid transparent",transition:"transform 0.15s",display:"flex",alignItems:"center",justifyContent:"center"}},
                  isActive?React.createElement("span",{style:{color:"#fff",fontSize:16,fontWeight:700}},"\u2713"):null);
              }))),
          // Generated palette preview
          React.createElement("div",{style:{minWidth:180}},
            React.createElement("div",{style:{fontSize:13,fontWeight:600,marginBottom:10,color:"#555"}},"Generated Shades"),
            swatch("Primary", palette.primaryColor),
            swatch("Buttons", palette.btnPrimary),
            swatch("Header", palette.headerBorder),
            swatch("Tabs", palette.tabActive),
            swatch("Sidebar BG", palette.sidebarBg),
            swatch("Selected", palette.sidebarSelectedBg),
            swatch("Checkbox", palette.checkBg),
            swatch("Light Tint", palette.activeLight)))),

      React.createElement("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}},
        // Logo & Favicon
        React.createElement("div",{style:S},
          React.createElement("h3",{style:{fontSize:16,fontWeight:600,marginBottom:16,paddingBottom:8,borderBottom:"1px solid #f0f0f0"}},"Logo & Favicon"),
          React.createElement("div",{style:{marginBottom:20}},
            React.createElement("label",{style:L},"Dashboard Logo"),
            React.createElement("div",{style:{display:"flex",alignItems:"center",gap:12,marginBottom:8}},
              React.createElement("button",{style:UPBTN,onClick:function(){me.logoInput.current.click()}},"Upload Logo"),
              s.logoUrl?React.createElement("button",{style:Object.assign({},UPBTN,{color:"#e51c23",borderColor:"#e51c23"}),onClick:function(){me.removeLogo()}},"Remove"):null,
              React.createElement("input",{ref:me.logoInput,type:"file",accept:"image/png,image/svg+xml,image/jpeg",style:{display:"none"},onChange:function(e){me.handleLogo(e)}})),
            s.logoUrl?React.createElement("img",{src:s.logoUrl,style:PREVIEW_IMG,alt:"Logo preview"}):React.createElement("div",{style:{fontSize:12,color:"#aaa",fontStyle:"italic"}},"Using default logo")),
          React.createElement("div",null,
            React.createElement("label",{style:L},"Browser Favicon"),
            React.createElement("div",{style:{display:"flex",alignItems:"center",gap:12,marginBottom:8}},
              React.createElement("button",{style:UPBTN,onClick:function(){me.favInput.current.click()}},"Upload Favicon"),
              s.faviconUrl?React.createElement("button",{style:Object.assign({},UPBTN,{color:"#e51c23",borderColor:"#e51c23"}),onClick:function(){me.removeFavicon()}},"Remove"):null,
              React.createElement("input",{ref:me.favInput,type:"file",accept:"image/x-icon,image/png,image/svg+xml",style:{display:"none"},onChange:function(e){me.handleFavicon(e)}})),
            s.faviconUrl?React.createElement("img",{src:s.faviconUrl,style:PREVIEW_FAV,alt:"Favicon preview"}):React.createElement("div",{style:{fontSize:12,color:"#aaa",fontStyle:"italic"}},"Using default favicon"))),
        // Branding
        React.createElement("div",{style:S},
          React.createElement("h3",{style:{fontSize:16,fontWeight:600,marginBottom:16,paddingBottom:8,borderBottom:"1px solid #f0f0f0"}},"Branding"),
          React.createElement("label",{style:L},"Page Title"),
          React.createElement("input",{style:I,value:s.pageTitle||"",onChange:function(e){me.sf("pageTitle",e.target.value)}}),
          React.createElement("label",{style:L},"Welcome Text"),
          React.createElement("input",{style:I,value:s.welcomeText||"",onChange:function(e){me.sf("welcomeText",e.target.value)}}),
          React.createElement("label",{style:L},"Footer Text"),
          React.createElement("input",{style:I,value:s.footerText||"",onChange:function(e){me.sf("footerText",e.target.value)}}))),

      // Live Preview
      React.createElement("div",{style:Object.assign({},S,{marginTop:20})},
        React.createElement("h3",{style:{fontSize:16,fontWeight:600,marginBottom:16,paddingBottom:8,borderBottom:"1px solid #f0f0f0"}},"Live Preview"),
        React.createElement("div",{style:{display:"flex",gap:16,flexWrap:"wrap"}},
          // Sidebar preview
          React.createElement("div",{style:{width:200,height:140,background:palette.sidebarBg,borderRadius:8,padding:16}},
            React.createElement("div",{style:{background:palette.sidebarSelectedBg,borderRadius:4,padding:"8px 12px",color:"#fff",fontSize:12,marginBottom:8}},"Selected"),
            React.createElement("div",{style:{padding:"8px 12px",color:"rgba(255,255,255,0.65)",fontSize:12,marginBottom:4}},"Menu Item"),
            React.createElement("div",{style:{padding:"8px 12px",color:"rgba(255,255,255,0.65)",fontSize:12}},"Menu Item")),
          // Header + controls preview
          React.createElement("div",{style:{width:240,height:140,background:"#fff",borderRadius:8,border:"1px solid #eee",padding:16,display:"flex",flexDirection:"column"}},
            React.createElement("div",{style:{borderBottom:"2px solid "+palette.headerBorder,paddingBottom:8,marginBottom:12,fontSize:12,fontWeight:600}},"Header"),
            React.createElement("div",{style:{display:"flex",gap:8,marginBottom:10}},
              React.createElement("button",{style:{background:palette.btnPrimary,color:"#fff",border:"none",borderRadius:4,padding:"6px 16px",fontSize:11}},"Primary"),
              React.createElement("button",{style:{background:"#fff",color:palette.primaryColor,border:"1px solid "+palette.primaryColor,borderRadius:4,padding:"6px 16px",fontSize:11}},"Default")),
            React.createElement("div",{style:{display:"flex",gap:12,alignItems:"center"}},
              React.createElement("a",{style:{color:palette.primaryColor,fontSize:12,textDecoration:"none"}},"Link"),
              React.createElement("div",{style:{width:28,height:16,borderRadius:8,background:palette.switchBg,position:"relative"}},
                React.createElement("div",{style:{width:12,height:12,borderRadius:6,background:"#fff",position:"absolute",top:2,right:2}})),
              React.createElement("div",{style:{width:14,height:14,borderRadius:3,background:palette.checkBg,display:"flex",alignItems:"center",justifyContent:"center"}},
                React.createElement("span",{style:{color:"#fff",fontSize:10,fontWeight:700}},"\u2713")))),
          // Tabs preview
          React.createElement("div",{style:{width:200,height:140,background:"#fff",borderRadius:8,border:"1px solid #eee",padding:16}},
            React.createElement("div",{style:{display:"flex",gap:16,borderBottom:"1px solid #eee",paddingBottom:8,marginBottom:12}},
              React.createElement("div",{style:{fontSize:12,fontWeight:600,color:palette.tabActive,borderBottom:"2px solid "+palette.tabActive,paddingBottom:8}},"Active Tab"),
              React.createElement("div",{style:{fontSize:12,color:"#999",paddingBottom:8}},"Tab 2")),
            React.createElement("div",{style:{display:"flex",gap:6,alignItems:"center",marginBottom:8}},
              React.createElement("div",{style:{width:20,height:20,borderRadius:10,border:"2px solid "+palette.primaryColor,display:"flex",alignItems:"center",justifyContent:"center"}},
                React.createElement("div",{style:{width:10,height:10,borderRadius:5,background:palette.primaryColor}})),
              React.createElement("span",{style:{fontSize:11}},"Radio")),
            React.createElement("div",{style:{border:"1px solid "+palette.paginationBorder,borderRadius:4,padding:"4px 12px",fontSize:11,display:"inline-block",background:palette.activeLight}},
              React.createElement("span",{style:{color:palette.primaryColor}},"Page 1"))))))}}
export default inject("rootStore")(observer(UISettings));
