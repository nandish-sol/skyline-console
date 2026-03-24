import React, { Component } from "react";
import { observer, inject } from "mobx-react";
import { getLocalStorageItem } from "utils/local-storage";
var API="/api/openstack/regionone/watcher/v1";
var SC=function(s){return{SUCCEEDED:"#52c41a",FAILED:"#f5222d",ONGOING:"#1890ff",PENDING:"#faad14",RECOMMENDED:"#1890ff",TRIGGERED:"#722ed1"}[s]||"#666"};
var _bc=(function(){try{var u=JSON.parse(localStorage.getItem("xloud_ui"));return u&&u.brandColor?u.brandColor:"#00897b"}catch(e){return"#00897b"}})();var BTN={padding:"8px 20px",background:_bc,color:"#fff",border:"none",borderRadius:4,cursor:"pointer",fontSize:13,marginRight:8,fontWeight:600,letterSpacing:"0.5px",textTransform:"uppercase",boxShadow:"0 2px 4px rgba(0,0,0,0.2)"};
var BTN_DANGER={padding:"6px 16px",background:"transparent",color:"#e51c23",border:"1px solid #e51c23",borderRadius:4,cursor:"pointer",fontSize:12,fontWeight:600,letterSpacing:"0.5px",textTransform:"uppercase"};
var BTN_SUCCESS={padding:"6px 16px",background:"transparent",color:_bc,border:"1px solid "+_bc,borderRadius:4,cursor:"pointer",fontSize:12,marginRight:8,fontWeight:600,letterSpacing:"0.5px",textTransform:"uppercase"};
var TH={padding:"12px 16px",textAlign:"left",fontWeight:500};
var TD={padding:"10px 16px"};
function gt(){return(typeof getLocalStorageItem!=="undefined"?getLocalStorageItem("keystone_token"):"")||"";}
function ag(u,c){fetch(API+u,{headers:{"X-Auth-Token":gt(),"Accept":"application/json"}}).then(function(r){return r.json()}).then(c).catch(function(e){console.error(e)})}
function ad(u,c){fetch(API+u,{method:"DELETE",headers:{"X-Auth-Token":gt(),"Accept":"application/json"}}).then(function(r){if(!r.ok){return r.text().then(function(t){alert("Delete Error "+r.status);throw new Error(t)})}return r}).then(c).catch(function(e){console.error(e)})}
class X extends Component{
  constructor(p){super(p);this.state={items:[],loading:true};}
  componentDidMount(){this.load()}
  load(){ag("/action_plans/detail",function(d){this.setState({items:d.action_plans||[],loading:false})}.bind(this))}
  doExecute(uuid){if(!confirm("Execute this action plan? This will apply the strategy recommendations."))return;fetch(API+"/action_plans/"+uuid,{method:"PATCH",headers:{"X-Auth-Token":gt(),"Content-Type":"application/json"},body:JSON.stringify([{op:"replace",path:"/state",value:"TRIGGERED"}])}).then(function(r){if(r.ok){alert("Action plan triggered!");this.load()}else{r.text().then(function(t){alert("Error: "+t.substring(0,200))})}}.bind(this)).catch(function(e){alert("Error: "+e)})}
  doDelete(uuid){if(!confirm("Delete?"))return;ad("/action_plans/"+uuid,function(){this.load()}.bind(this))}
  render(){
    var s=this.state,me=this;
    if(s.loading)return React.createElement("div",{style:{padding:20}},"Loading...");
    return React.createElement("div",{style:{padding:20,overflowY:"auto",height:"calc(100vh - 100px)"}},
      React.createElement("h2",{style:{marginBottom:16,fontSize:20,fontWeight:500}},"Action Plans ("+s.items.length+")"),
      s.items.length===0?React.createElement("div",{style:{padding:40,textAlign:"center",color:"#999"}},"No action plans"):
      React.createElement("table",{style:{width:"100%",borderCollapse:"collapse",background:"#fff"}},
        React.createElement("thead",null,React.createElement("tr",{style:{background:"#fafafa",borderBottom:"2px solid #e8e8e8"}},
          React.createElement("th",{style:TH},"UUID"),
          React.createElement("th",{style:TH},"State"),
          React.createElement("th",{style:TH},"Strategy"),
          React.createElement("th",{style:TH},"Created"),
          React.createElement("th",{style:TH},"Actions"))),
        React.createElement("tbody",null,s.items.map(function(i){
          return React.createElement("tr",{key:i.uuid,style:{borderBottom:"1px solid #f0f0f0"}},
            React.createElement("td",{style:Object.assign({},TD,{fontFamily:"monospace",fontSize:12})},i.uuid.substring(0,8)+"..."),
            React.createElement("td",{style:TD},React.createElement("span",{style:{color:SC(i.state),fontWeight:600}},i.state)),
            React.createElement("td",{style:TD},i.strategy_name),
            React.createElement("td",{style:TD},i.created_at?new Date(i.created_at).toLocaleString():"-"),
            React.createElement("td",{style:TD},
              i.state==="RECOMMENDED"?React.createElement("button",{style:BTN_SUCCESS,onClick:function(){me.doExecute(i.uuid)}},"Execute"):null,
              React.createElement("button",{style:BTN_DANGER,onClick:function(){me.doDelete(i.uuid)}},"Delete")
            ))}))));
  }
}
export default inject("rootStore")(observer(X));