import React, { Component } from "react";
import { inject, observer } from "mobx-react";

function getToken(){
  var raw=localStorage.getItem("keystone_token")||"";
  try{var parsed=JSON.parse(raw);return parsed.value||raw}catch(e){return raw}
}
function getUserIdFromStore(rootStore){
  try{return rootStore.user.user.id}catch(e){return""}
}
function api(path,opts){
  var base="/api/openstack/regionone/keystone";
  return fetch(base+path,Object.assign({headers:{"X-Auth-Token":getToken(),"Content-Type":"application/json"}},opts||{})).then(function(r){if(r.status===204)return{};return r.json()})
}

var S={background:"#fff",borderRadius:8,padding:24,marginBottom:20,boxShadow:"0 1px 3px rgba(0,0,0,0.1)"};
var L={display:"block",marginBottom:6,fontWeight:600,fontSize:13,color:"#333"};
var I={width:"100%",padding:"10px 12px",border:"1px solid #d9d9d9",borderRadius:6,fontSize:14,marginBottom:16,boxSizing:"border-box"};
var B={padding:"10px 24px",background:"#00897b",color:"#fff",border:"none",borderRadius:6,cursor:"pointer",fontSize:14,fontWeight:600,marginRight:12};
var BO={padding:"10px 24px",background:"transparent",color:"#e51c23",border:"1px solid #e51c23",borderRadius:6,cursor:"pointer",fontSize:14,fontWeight:600};
var TAB={display:"inline-block",padding:"10px 20px",cursor:"pointer",fontSize:14,fontWeight:500,borderBottom:"2px solid transparent",color:"#666",marginRight:4,userSelect:"none"};
var TAB_ACTIVE={display:"inline-block",padding:"10px 20px",cursor:"pointer",fontSize:14,fontWeight:600,borderBottom:"2px solid #00897b",color:"#00897b",marginRight:4,userSelect:"none"};
var AVATAR={width:100,height:100,borderRadius:"50%",objectFit:"cover",border:"3px solid #f0f0f0"};

class ProfileSettings extends Component{
  constructor(p){
    super(p);
    this.state={
      tab:"profile",loading:true,saving:false,
      user:{},name:"",email:"",phone:"",real_name:"",description:"",
      oldPassword:"",newPassword:"",confirmPassword:"",passwordMsg:"",passwordOk:false,
      totpEnabled:false,totpSecret:"",totpCode:"",totpMsg:"",
      photoUrl:"",photoFile:null,profileMsg:""
    };
    this.photoInput=React.createRef();
  }
  componentDidMount(){this.fetchUser()}
  fetchUser(){
    var me=this;var uid=getUserIdFromStore(this.props.rootStore);
    if(!uid){me.setState({loading:false});return}
    api("/v3/users/"+uid).then(function(data){
      var u=data.user||{};
      me.setState({loading:false,user:u,name:u.name||"",email:u.email||"",phone:u.phone||"",real_name:u.real_name||"",description:u.description||"",totpEnabled:!!(u.options&&u.options.multi_factor_auth_enabled),photoUrl:localStorage.getItem("xloud_avatar")||""})
    }).catch(function(){me.setState({loading:false})})
  }
  saveProfile(){
    var me=this;me.setState({saving:true,profileMsg:""});
    var uid=getUserIdFromStore(this.props.rootStore);
    // Save photo to localStorage (Keystone doesn't support custom options)
    if(me.state.photoUrl){localStorage.setItem("xloud_avatar",me.state.photoUrl);window.dispatchEvent(new Event("xloud-avatar-changed"))}
    var body={user:{email:me.state.email,phone:me.state.phone,real_name:me.state.real_name,description:me.state.description}};
    api("/v3/users/"+uid,{method:"PATCH",body:JSON.stringify(body)}).then(function(data){
      if(data.error){me.setState({saving:false,profileMsg:data.error.message||"Failed"});return}
      me.setState({saving:false,user:data.user||me.state.user,profileMsg:"Profile updated successfully!"});window.dispatchEvent(new Event("xloud-avatar-changed"));
      setTimeout(function(){me.setState({profileMsg:""})},3000)
    }).catch(function(){me.setState({saving:false,profileMsg:"Failed to update profile"})})
  }
  changePassword(){
    var me=this;
    if(!me.state.oldPassword){me.setState({passwordMsg:"Current password is required",passwordOk:false});return}
    if(me.state.newPassword!==me.state.confirmPassword){me.setState({passwordMsg:"Passwords do not match",passwordOk:false});return}
    if(me.state.newPassword.length<6){me.setState({passwordMsg:"Password must be at least 6 characters",passwordOk:false});return}
    var uid=getUserIdFromStore(this.props.rootStore);
    var body={user:{password:me.state.newPassword,original_password:me.state.oldPassword}};
    api("/v3/users/"+uid+"/password",{method:"POST",body:JSON.stringify(body)}).then(function(r){
      if(r.error){me.setState({passwordMsg:r.error.message||"Failed to change password",passwordOk:false});return}
      me.setState({passwordMsg:"Password changed successfully! Redirecting to login...",passwordOk:true,oldPassword:"",newPassword:"",confirmPassword:""});
      setTimeout(function(){window.location.href="/auth/login"},2000)
    }).catch(function(){me.setState({passwordMsg:"Failed to change password",passwordOk:false})})
  }
  handlePhoto(e){
    var me=this;var f=e.target.files[0];if(!f)return;
    if(f.size>50000){alert("Image too large. Please use an image under 50KB.");return}
    var reader=new FileReader();
    reader.onload=function(ev){me.setState({photoUrl:ev.target.result,photoFile:f})};
    reader.readAsDataURL(f)
  }
  enableTotp(){
    var me=this;var uid=getUserIdFromStore(this.props.rootStore);
    // Generate a random base32 secret
    var chars="ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    var secret="";for(var i=0;i<32;i++)secret+=chars[Math.floor(Math.random()*chars.length)];
    // Create TOTP credential via /v3/credentials
    var body={credential:{user_id:uid,type:"totp",blob:secret}};
    api("/v3/credentials",{method:"POST",body:JSON.stringify(body)}).then(function(data){
      if(data.credential){me.setState({totpSecret:data.credential.blob,totpCredId:data.credential.id,totpMsg:""})}
      else{me.setState({totpMsg:(data.error&&data.error.message)||"TOTP not available on this deployment"})}
    }).catch(function(){me.setState({totpMsg:"TOTP not available. Keystone may not have TOTP enabled."})})
  }
  verifyAndEnableTotp(){
    var me=this;var uid=getUserIdFromStore(this.props.rootStore);
    var body={user:{options:{multi_factor_auth_enabled:true,multi_factor_auth_rules:[["password","totp"]]}}};
    api("/v3/users/"+uid,{method:"PATCH",body:JSON.stringify(body)}).then(function(data){
      if(data.error){me.setState({totpMsg:data.error.message||"Failed"});return}
      me.setState({totpEnabled:true,totpMsg:"2FA enabled successfully!"})
    }).catch(function(){me.setState({totpMsg:"Failed to enable 2FA"})})
  }
  disableTotp(){
    var me=this;var uid=getUserIdFromStore(this.props.rootStore);
    var body={user:{options:{multi_factor_auth_enabled:false,multi_factor_auth_rules:[]}}};
    api("/v3/users/"+uid,{method:"PATCH",body:JSON.stringify(body)}).then(function(data){
      if(data.error){me.setState({totpMsg:data.error.message||"Failed"});return}
      me.setState({totpEnabled:false,totpSecret:"",totpMsg:"2FA disabled successfully"})
    }).catch(function(){me.setState({totpMsg:"Failed to disable 2FA"})})
  }

  renderProfile(){
    var me=this,s=this.state;
    var displayPhoto=s.photoUrl||"";
    return React.createElement("div",null,
      React.createElement("div",{style:S},
        React.createElement("h3",{style:{fontSize:16,fontWeight:600,marginBottom:20,paddingBottom:8,borderBottom:"1px solid #f0f0f0"}},"Profile Information"),
        React.createElement("div",{style:{display:"flex",gap:32,flexWrap:"wrap"}},
          React.createElement("div",{style:{flex:"0 0 140px",textAlign:"center"}},
            displayPhoto?React.createElement("img",{src:displayPhoto,style:Object.assign({},AVATAR,{display:"block",margin:"0 auto"}),alt:"Avatar"}):React.createElement("div",{style:{width:100,height:100,borderRadius:"50%",border:"3px solid #f0f0f0",background:"#e8e8e8",position:"relative",margin:"0 auto"}},React.createElement("svg",{width:"50",height:"50",viewBox:"0 0 24 24",fill:"none",style:{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)"}},React.createElement("path",{d:"M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z",fill:"#bbb"}))),
            React.createElement("div",{style:{marginTop:12}},
              React.createElement("button",{style:{padding:"6px 16px",background:"#f5f5f5",border:"1px solid #d9d9d9",borderRadius:4,cursor:"pointer",fontSize:12},onClick:function(){me.photoInput.current.click()}},"Change Photo"),
              s.photoUrl?React.createElement("button",{style:{padding:"6px 16px",background:"#fff",border:"1px solid #e51c23",borderRadius:4,cursor:"pointer",fontSize:12,color:"#e51c23",marginTop:6},onClick:function(){localStorage.removeItem("xloud_avatar");me.setState({photoUrl:"",photoFile:null});window.dispatchEvent(new Event("xloud-avatar-changed"))}},"Remove Photo"):null,
              React.createElement("input",{ref:me.photoInput,type:"file",accept:"image/*",style:{display:"none"},onChange:function(e){me.handlePhoto(e)}})),
            React.createElement("div",{style:{fontSize:11,color:"#aaa",marginTop:6}},"Max 50KB")),
          React.createElement("div",{style:{flex:1,minWidth:300}},
            React.createElement("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 20px"}},
              React.createElement("div",null,
                React.createElement("label",{style:L},"Username"),
                React.createElement("input",{style:Object.assign({},I,{background:"#f5f5f5",color:"#999"}),value:s.name,disabled:true,title:"Username cannot be changed"})),
              React.createElement("div",null,
                React.createElement("label",{style:L},"Email"),
                React.createElement("input",{style:I,type:"email",value:s.email,onChange:function(e){me.setState({email:e.target.value})}})),
              React.createElement("div",null,
                React.createElement("label",{style:L},"Phone"),
                React.createElement("input",{style:I,value:s.phone,onChange:function(e){me.setState({phone:e.target.value})}})),
              React.createElement("div",null,
                React.createElement("label",{style:L},"Real Name"),
                React.createElement("input",{style:I,value:s.real_name,onChange:function(e){me.setState({real_name:e.target.value})}}))),
            React.createElement("label",{style:L},"Description"),
            React.createElement("textarea",{style:Object.assign({},I,{height:70,resize:"vertical"}),value:s.description,onChange:function(e){me.setState({description:e.target.value})}}),
            s.profileMsg?React.createElement("div",{style:{padding:"8px 12px",marginBottom:12,borderRadius:4,background:s.profileMsg.includes("success")?"#e8f5e9":"#ffebee",color:s.profileMsg.includes("success")?"#2e7d32":"#c62828",fontSize:13}},s.profileMsg):null,
            React.createElement("div",{style:{marginTop:4}},
              React.createElement("button",{style:B,onClick:function(){me.saveProfile()},disabled:s.saving},s.saving?"Saving...":"Save Changes"))))))
  }

  renderPassword(){
    var me=this,s=this.state;
    return React.createElement("div",{style:S},
      React.createElement("h3",{style:{fontSize:16,fontWeight:600,marginBottom:20,paddingBottom:8,borderBottom:"1px solid #f0f0f0"}},"Change Password"),
      React.createElement("div",{style:{maxWidth:400}},
        React.createElement("label",{style:L},"Current Password"),
        React.createElement("input",{style:I,type:"password",value:s.oldPassword,placeholder:"Enter current password",onChange:function(e){me.setState({oldPassword:e.target.value})}}),
        React.createElement("label",{style:L},"New Password"),
        React.createElement("input",{style:I,type:"password",value:s.newPassword,placeholder:"Enter new password",onChange:function(e){me.setState({newPassword:e.target.value})}}),
        React.createElement("label",{style:L},"Confirm New Password"),
        React.createElement("input",{style:I,type:"password",value:s.confirmPassword,placeholder:"Confirm new password",onChange:function(e){me.setState({confirmPassword:e.target.value})}}),
        s.passwordMsg?React.createElement("div",{style:{padding:"8px 12px",marginBottom:12,borderRadius:4,background:s.passwordOk?"#e8f5e9":"#ffebee",color:s.passwordOk?"#2e7d32":"#c62828",fontSize:13}},s.passwordMsg):null,
        React.createElement("button",{style:B,onClick:function(){me.changePassword()}},"Change Password")))
  }

  renderTheme(){
    return React.createElement("div",{style:S},
      React.createElement("h3",{style:{fontSize:16,fontWeight:600,marginBottom:20,paddingBottom:8,borderBottom:"1px solid #f0f0f0"}},"Theme Settings"),
      React.createElement("p",{style:{color:"#666",marginBottom:16}},"Customize the look and feel of your dashboard including brand colors, logo, and favicon."),
      React.createElement("button",{onClick:function(){window.location.href="/infra-optim/ui-settings"},style:{display:"inline-block",padding:"10px 24px",background:"#00897b",color:"#fff",borderRadius:6,border:"none",fontWeight:600,fontSize:14,cursor:"pointer"}},"Open Theme Settings"))
  }

  renderTwoFactor(){
    var me=this,s=this.state;
    return React.createElement("div",{style:S},
      React.createElement("h3",{style:{fontSize:16,fontWeight:600,marginBottom:20,paddingBottom:8,borderBottom:"1px solid #f0f0f0"}},"Two-Factor Authentication"),
      React.createElement("div",{style:{display:"flex",alignItems:"center",gap:12,marginBottom:20}},
        React.createElement("div",{style:{width:12,height:12,borderRadius:"50%",background:s.totpEnabled?"#4caf50":"#bdbdbd"}}),
        React.createElement("span",{style:{fontSize:15,fontWeight:500}},s.totpEnabled?"2FA is enabled":"2FA is disabled")),
      s.totpEnabled?
        React.createElement("div",null,
          React.createElement("p",{style:{color:"#666",marginBottom:16}},"Your account is protected with two-factor authentication. You will need your authenticator app to log in."),
          React.createElement("button",{style:BO,onClick:function(){if(confirm("Are you sure you want to disable 2FA? This will make your account less secure."))me.disableTotp()}},"Disable 2FA")):
        React.createElement("div",null,
          !s.totpSecret?
            React.createElement("div",null,
              React.createElement("p",{style:{color:"#666",marginBottom:16}},"Add an extra layer of security to your account. You will need an authenticator app like Google Authenticator, Authy, or Microsoft Authenticator."),
              React.createElement("button",{style:B,onClick:function(){me.enableTotp()}},"Set Up 2FA")):
            React.createElement("div",null,
              React.createElement("div",{style:{background:"#f5f5f5",borderRadius:8,padding:20,marginBottom:20}},
                React.createElement("p",{style:{fontWeight:600,marginBottom:8}},"Step 1: Add this secret to your authenticator app"),
                React.createElement("div",{style:{padding:12,background:"#fff",borderRadius:6,fontFamily:"monospace",fontSize:18,wordBreak:"break-all",textAlign:"center",letterSpacing:3,border:"1px solid #e0e0e0"}},s.totpSecret)),
              React.createElement("div",null,
                React.createElement("p",{style:{fontWeight:600,marginBottom:8}},"Step 2: Enter the 6-digit code from your app"),
                React.createElement("input",{style:Object.assign({},I,{maxWidth:200,fontSize:18,letterSpacing:8,textAlign:"center"}),value:s.totpCode,placeholder:"000000",maxLength:6,onChange:function(e){me.setState({totpCode:e.target.value.replace(/\D/g,"")})}}),
                React.createElement("div",null,
                  React.createElement("button",{style:B,onClick:function(){me.verifyAndEnableTotp()}},"Verify & Enable 2FA"))))),
      s.totpMsg?React.createElement("div",{style:{padding:"8px 12px",marginTop:12,borderRadius:4,background:s.totpMsg.includes("success")?"#e8f5e9":"#fff3e0",color:s.totpMsg.includes("success")?"#2e7d32":"#e65100",fontSize:13}},s.totpMsg):null)
  }

  render(){
    var me=this,s=this.state;
    var tabs=[{key:"profile",label:"Profile"},{key:"password",label:"Password"},{key:"theme",label:"Theme"},{key:"security",label:"Security (2FA)"}];
    if(s.loading)return React.createElement("div",{style:{padding:40,textAlign:"center",color:"#999",fontSize:16}},"Loading profile...");
    return React.createElement("div",{style:{padding:24,overflowY:"auto",height:"calc(100vh - 100px)"}},
      React.createElement("div",{style:{marginBottom:24}},
        React.createElement("h2",{style:{fontSize:22,fontWeight:600,margin:0}},"Profile Settings"),
        React.createElement("p",{style:{color:"#888",margin:"4px 0 0",fontSize:14}},"Manage your account settings and preferences")),
      React.createElement("div",{style:{borderBottom:"1px solid #e8e8e8",marginBottom:24}},
        tabs.map(function(t){return React.createElement("span",{key:t.key,style:s.tab===t.key?TAB_ACTIVE:TAB,onClick:function(){me.setState({tab:t.key})}},t.label)})),
      s.tab==="profile"?me.renderProfile():null,
      s.tab==="password"?me.renderPassword():null,
      s.tab==="theme"?me.renderTheme():null,
      s.tab==="security"?me.renderTwoFactor():null)
  }
}
export default inject("rootStore")(observer(ProfileSettings));
