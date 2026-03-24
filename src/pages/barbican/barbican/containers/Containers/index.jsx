import React, { Component } from "react";
import { inject, observer } from "mobx-react";

var API="/api/openstack/regionone/barbican/v1";
var _bc=(function(){try{var u=JSON.parse(localStorage.getItem("xloud_ui"));return u&&u.brandColor?u.brandColor:"#00897b"}catch(e){return"#00897b"}})();
var SC=function(s){return{ACTIVE:"#52c41a",ERROR:"#f5222d"}[s]||"#666"};
var BTN={padding:"8px 20px",background:_bc,color:"#fff",border:"none",borderRadius:4,cursor:"pointer",fontSize:13,marginRight:8,fontWeight:600,letterSpacing:"0.5px",textTransform:"uppercase",boxShadow:"0 2px 4px rgba(0,0,0,0.2)"};
var BTN_DANGER={padding:"6px 16px",background:"transparent",color:"#e51c23",border:"1px solid #e51c23",borderRadius:4,cursor:"pointer",fontSize:12,fontWeight:600,letterSpacing:"0.5px",textTransform:"uppercase"};
var TH={padding:"12px 16px",textAlign:"left",fontWeight:500};
var TD={padding:"10px 16px"};

function gt(){
  var raw=localStorage.getItem("keystone_token")||"";
  try{var p=JSON.parse(raw);return p.value||raw}catch(e){return raw}
}
function ag(u,c){fetch(API+u,{headers:{"X-Auth-Token":gt(),"Accept":"application/json"}}).then(function(r){return r.json()}).then(c).catch(function(e){console.error(e)})}
function ad(u,c){fetch(API+u,{method:"DELETE",headers:{"X-Auth-Token":gt(),"Accept":"application/json"}}).then(function(r){if(!r.ok){return r.text().then(function(t){alert("Delete Error "+r.status);throw new Error(t)})}return r}).then(c).catch(function(e){console.error("DELETE error:",e)})}

class BarbicanContainers extends Component{
  constructor(p){super(p);this.state={items:[],loading:true}}
  componentDidMount(){this.load()}
  load(){ag("/containers",function(d){this.setState({items:d.containers||[],loading:false})}.bind(this))}
  doDelete(uuid){if(!confirm("Delete this container?"))return;ad("/containers/"+uuid,function(){this.load()}.bind(this))}
  getUUID(ref){if(!ref)return"";var parts=ref.split("/");return parts[parts.length-1]}
  render(){
    var s=this.state,me=this;
    if(s.loading)return React.createElement("div",{style:{padding:20}},"Loading...");
    return React.createElement("div",{style:{padding:20,overflowY:"auto",height:"calc(100vh - 100px)"}},
      React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}},
        React.createElement("h2",{style:{fontSize:20,fontWeight:500}},"Containers ("+s.items.length+")")),
      s.items.length===0?React.createElement("div",{style:{padding:40,textAlign:"center",color:"#999"}},"No containers"):
      React.createElement("table",{style:{width:"100%",borderCollapse:"collapse",background:"#fff"}},
        React.createElement("thead",null,React.createElement("tr",{style:{background:"#fafafa",borderBottom:"2px solid #e8e8e8"}},
          React.createElement("th",{style:TH},"Name"),
          React.createElement("th",{style:TH},"Type"),
          React.createElement("th",{style:TH},"Status"),
          React.createElement("th",{style:TH},"Secrets"),
          React.createElement("th",{style:TH},"Created"),
          React.createElement("th",{style:TH},"Actions"))),
        React.createElement("tbody",null,s.items.map(function(i){
          var uuid=me.getUUID(i.container_ref);
          return React.createElement("tr",{key:uuid,style:{borderBottom:"1px solid #f0f0f0"}},
            React.createElement("td",{style:TD},i.name||uuid.substring(0,8)),
            React.createElement("td",{style:TD},i.type),
            React.createElement("td",{style:TD},React.createElement("span",{style:{color:SC(i.status),fontWeight:600}},i.status)),
            React.createElement("td",{style:TD},(i.secret_refs||[]).length),
            React.createElement("td",{style:TD},i.created?new Date(i.created).toLocaleDateString():"-"),
            React.createElement("td",{style:TD},
              React.createElement("button",{style:BTN_DANGER,onClick:function(){me.doDelete(uuid)}},"DELETE")))}))))
  }
}
export default inject("rootStore")(observer(BarbicanContainers));
