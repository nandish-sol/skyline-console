import React, { Component } from "react";
import { inject, observer } from "mobx-react";

var API="/api/openstack/regionone/barbican/v1";
var _bc=(function(){try{var u=JSON.parse(localStorage.getItem("xloud_ui"));return u&&u.brandColor?u.brandColor:"#00897b"}catch(e){return"#00897b"}})();
var SC=function(s){return{ACTIVE:"#52c41a",ERROR:"#f5222d"}[s]||"#666"};
var BTN={padding:"8px 20px",background:_bc,color:"#fff",border:"none",borderRadius:4,cursor:"pointer",fontSize:13,marginRight:8,fontWeight:600,letterSpacing:"0.5px",textTransform:"uppercase",boxShadow:"0 2px 4px rgba(0,0,0,0.2)"};
var BTN_DANGER={padding:"6px 16px",background:"transparent",color:"#e51c23",border:"1px solid #e51c23",borderRadius:4,cursor:"pointer",fontSize:12,fontWeight:600,letterSpacing:"0.5px",textTransform:"uppercase"};
var MODAL_BG={position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000};
var MODAL={background:"#fff",borderRadius:8,padding:24,minWidth:500,maxWidth:600};
var INPUT={width:"100%",padding:"8px 12px",border:"1px solid #d9d9d9",borderRadius:4,fontSize:14,marginBottom:12,boxSizing:"border-box"};
var LABEL={display:"block",marginBottom:4,fontWeight:500,fontSize:13};
var TH={padding:"12px 16px",textAlign:"left",fontWeight:500};
var TD={padding:"10px 16px"};

function gt(){
  var raw=localStorage.getItem("keystone_token")||"";
  try{var p=JSON.parse(raw);return p.value||raw}catch(e){return raw}
}
function ag(u,c){fetch(API+u,{headers:{"X-Auth-Token":gt(),"Accept":"application/json"}}).then(function(r){return r.json()}).then(c).catch(function(e){console.error(e)})}
function ap(u,b,c){fetch(API+u,{method:"POST",headers:{"X-Auth-Token":gt(),"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify(b)}).then(function(r){if(!r.ok){return r.text().then(function(t){alert("API Error "+r.status+": "+t.substring(0,200));throw new Error(t)})}return r.json()}).then(c).catch(function(e){console.error("POST error:",e)})}
function ad(u,c){fetch(API+u,{method:"DELETE",headers:{"X-Auth-Token":gt(),"Accept":"application/json"}}).then(function(r){if(!r.ok){return r.text().then(function(t){alert("Delete Error "+r.status);throw new Error(t)})}return r}).then(c).catch(function(e){console.error("DELETE error:",e)})}

class BarbicanSecrets extends Component{
  constructor(p){super(p);this.state={items:[],loading:true,showCreate:false,showPayload:null,payloadText:"",showAll:true,form:{name:"",payload:"",payload_content_type:"text/plain",secret_type:"opaque",algorithm:"",bit_length:"",expiration:""}}}
  componentDidMount(){this.load()}
  load(){var me=this;
    ag("/secrets",function(d){
      var adminSecrets=d.secrets||[];
      adminSecrets.forEach(function(s){s._project="admin"});
      if(!me.state.showAll){me.setState({items:adminSecrets,loading:false});return}
      var token=gt();
      fetch("/api/openstack/regionone/keystone/v3/auth/tokens",{method:"POST",headers:{"Content-Type":"application/json","X-Auth-Token":token},body:JSON.stringify({auth:{identity:{methods:["token"],token:{id:token}},scope:{project:{name:"service",domain:{id:"default"}}}}})}).then(function(r){
        var svcToken=r.headers.get("x-subject-token");
        if(!svcToken){me.setState({items:adminSecrets,loading:false});return}
        fetch(API+"/secrets",{headers:{"X-Auth-Token":svcToken,"Accept":"application/json"}}).then(function(r2){return r2.json()}).then(function(d2){
          var svcSecrets=(d2.secrets||[]);svcSecrets.forEach(function(s){s._project="service"});
          var all=adminSecrets.concat(svcSecrets);
          var seen={};var unique=all.filter(function(s){var id=me.getUUID(s.secret_ref);if(seen[id])return false;seen[id]=true;return true});
          me.setState({items:unique,loading:false})
        }).catch(function(){me.setState({items:adminSecrets,loading:false})})
      }).catch(function(){me.setState({items:adminSecrets,loading:false})})
    })}
  doCreate(){
    var f=this.state.form;
    if(!f.name)return alert("Name required");
    var b={name:f.name,secret_type:f.secret_type};
    if(f.payload){b.payload=f.payload;b.payload_content_type=f.payload_content_type}
    if(f.algorithm)b.algorithm=f.algorithm;
    if(f.bit_length)b.bit_length=parseInt(f.bit_length);
    if(f.expiration)b.expiration=f.expiration;
    ap("/secrets",b,function(){this.setState({showCreate:false,form:{name:"",payload:"",payload_content_type:"text/plain",secret_type:"opaque",algorithm:"",bit_length:"",expiration:""}});this.load()}.bind(this))
  }
  doDelete(uuid){if(!confirm("Delete this secret?"))return;ad("/secrets/"+uuid,function(){this.load()}.bind(this))}
  getPayload(uuid){
    var me=this;
    var item=me.state.items.find(function(x){return me.getUUID(x.secret_ref)===uuid});
    var ct=(item&&item.content_types&&item.content_types["default"])||"application/octet-stream";
    fetch(API+"/secrets/"+uuid+"/payload",{headers:{"X-Auth-Token":gt(),"Accept":ct}}).then(function(r){
      if(!r.ok)return r.text().then(function(t){me.setState({showPayload:uuid,payloadText:"Error: "+r.status+" | "+t.substring(0,200)})});
      if(ct==="application/octet-stream"){return r.blob().then(function(b){me.setState({showPayload:uuid,payloadText:"[Binary data - "+b.size+" bytes] | Content-Type: "+ct})})}
      return r.text().then(function(t){me.setState({showPayload:uuid,payloadText:t})})
    }).catch(function(e){me.setState({showPayload:uuid,payloadText:"Error: "+e.message})})
  }
  getUUID(ref){if(!ref)return"";var parts=ref.split("/");return parts[parts.length-1]}
  sf(k,v){var f=Object.assign({},this.state.form);f[k]=v;this.setState({form:f})}
  render(){
    var s=this.state,me=this;
    if(s.loading)return React.createElement("div",{style:{padding:20}},"Loading...");

    var payloadModal=s.showPayload?React.createElement("div",{style:MODAL_BG,onClick:function(){me.setState({showPayload:null})}},
      React.createElement("div",{style:MODAL,onClick:function(e){e.stopPropagation()}},
        React.createElement("h3",{style:{marginBottom:16}},"Secret Payload"),
        React.createElement("pre",{style:{background:"#f5f5f5",padding:16,borderRadius:8,overflow:"auto",maxHeight:300,fontFamily:"monospace",fontSize:13}},s.payloadText),
        React.createElement("div",{style:{textAlign:"right",marginTop:16}},
          React.createElement("button",{style:Object.assign({},BTN,{background:"#666"}),onClick:function(){me.setState({showPayload:null})}},"Close")))):null;

    var createModal=s.showCreate?React.createElement("div",{style:MODAL_BG},
      React.createElement("div",{style:MODAL},
        React.createElement("h3",{style:{marginBottom:16}},"Create Secret"),
        React.createElement("label",{style:LABEL},"Name *"),
        React.createElement("input",{style:INPUT,value:s.form.name,onChange:function(e){me.sf("name",e.target.value)}}),
        React.createElement("label",{style:LABEL},"Secret Type"),
        React.createElement("select",{style:INPUT,value:s.form.secret_type,onChange:function(e){me.sf("secret_type",e.target.value)}},
          React.createElement("option",{value:"opaque"},"Opaque"),
          React.createElement("option",{value:"symmetric"},"Symmetric Key"),
          React.createElement("option",{value:"public"},"Public Key"),
          React.createElement("option",{value:"private"},"Private Key"),
          React.createElement("option",{value:"passphrase"},"Passphrase"),
          React.createElement("option",{value:"certificate"},"Certificate")),
        React.createElement("label",{style:LABEL},"Payload"),
        React.createElement("textarea",{style:Object.assign({},INPUT,{height:80,resize:"vertical"}),value:s.form.payload,placeholder:"Enter secret value...",onChange:function(e){me.sf("payload",e.target.value)}}),
        React.createElement("label",{style:LABEL},"Content Type"),
        React.createElement("select",{style:INPUT,value:s.form.payload_content_type,onChange:function(e){me.sf("payload_content_type",e.target.value)}},
          React.createElement("option",{value:"text/plain"},"text/plain"),
          React.createElement("option",{value:"application/octet-stream"},"application/octet-stream"),
          React.createElement("option",{value:"application/pkix-cert"},"application/pkix-cert")),
        React.createElement("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}},
          React.createElement("div",null,
            React.createElement("label",{style:LABEL},"Algorithm"),
            React.createElement("input",{style:INPUT,value:s.form.algorithm,placeholder:"e.g. aes",onChange:function(e){me.sf("algorithm",e.target.value)}})),
          React.createElement("div",null,
            React.createElement("label",{style:LABEL},"Bit Length"),
            React.createElement("input",{style:INPUT,type:"number",value:s.form.bit_length,placeholder:"e.g. 256",onChange:function(e){me.sf("bit_length",e.target.value)}}))),
        React.createElement("label",{style:LABEL},"Expiration"),
        React.createElement("input",{style:INPUT,type:"datetime-local",value:s.form.expiration,onChange:function(e){me.sf("expiration",e.target.value)}}),
        React.createElement("div",{style:{textAlign:"right",marginTop:16}},
          React.createElement("button",{style:Object.assign({},BTN,{background:"#ccc",color:"#333"}),onClick:function(){me.setState({showCreate:false})}},"Cancel"),
          React.createElement("button",{style:BTN,onClick:function(){me.doCreate()}},"Create")))):null;

    return React.createElement("div",{style:{padding:20,overflowY:"auto",height:"calc(100vh - 100px)"}},
      payloadModal,createModal,
      React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}},
        React.createElement("h2",{style:{fontSize:20,fontWeight:500}},"Secrets ("+s.items.length+")"),
        React.createElement("div",{style:{display:"flex",gap:8}},React.createElement("button",{style:Object.assign({},BTN,{background:s.showAll?"#666":"#ccc",fontSize:11,padding:"6px 12px"}),onClick:function(){me.setState({showAll:!s.showAll,loading:true},function(){me.load()})}},s.showAll?"All Projects":"My Project"),React.createElement("button",{style:BTN,onClick:function(){me.setState({showCreate:true})}},"+ Create Secret"))),
      s.items.length===0?React.createElement("div",{style:{padding:40,textAlign:"center",color:"#999"}},"No secrets"):
      React.createElement("table",{style:{width:"100%",borderCollapse:"collapse",background:"#fff"}},
        React.createElement("thead",null,React.createElement("tr",{style:{background:"#fafafa",borderBottom:"2px solid #e8e8e8"}},
          React.createElement("th",{style:TH},"Name"),
          React.createElement("th",{style:TH},"Type"),
          React.createElement("th",{style:TH},"Status"),
          React.createElement("th",{style:TH},"Algorithm"),
          React.createElement("th",{style:TH},"Project"),
          React.createElement("th",{style:TH},"Created"),
          React.createElement("th",{style:TH},"Actions"))),
        React.createElement("tbody",null,s.items.map(function(i){
          var uuid=me.getUUID(i.secret_ref);
          return React.createElement("tr",{key:uuid,style:{borderBottom:"1px solid #f0f0f0"}},
            React.createElement("td",{style:TD},i.name||uuid.substring(0,8)),
            React.createElement("td",{style:TD},i.secret_type),
            React.createElement("td",{style:TD},React.createElement("span",{style:{color:SC(i.status),fontWeight:600}},i.status)),
            React.createElement("td",{style:TD},i.algorithm||"-"),
            React.createElement("td",{style:TD},i._project||"admin"),
            React.createElement("td",{style:TD},i.created?new Date(i.created).toLocaleDateString():"-"),
            React.createElement("td",{style:TD},
              i.content_types?React.createElement("button",{style:Object.assign({},BTN,{fontSize:11,padding:"4px 12px",marginRight:8}),onClick:function(){me.getPayload(uuid)}},"VIEW"):null,
              React.createElement("button",{style:BTN_DANGER,onClick:function(){me.doDelete(uuid)}},"DELETE")))}))))
  }
}
export default inject("rootStore")(observer(BarbicanSecrets));
