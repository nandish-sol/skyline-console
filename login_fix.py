import re
STATIC = "/var/lib/kolla/venv/lib/python3.12/site-packages/skyline_console/static"
html = open(STATIC + "/index.html").read()
html = re.sub(r"<style id=xloud-login-redesign>.*?</style>", "", html, flags=re.DOTALL)
html = re.sub(r"<script id=xloud-login-script>.*?</script>", "", html, flags=re.DOTALL)
css = '<style id=xloud-login-redesign>'
css += '.index__container--PLjMT{display:flex!important;min-height:100vh!important}'
css += '.index__left--1nLBx{order:2!important;flex:0 0 35%!important;display:flex!important;align-items:center!important;justify-content:center!important;background:#fff!important;padding:40px!important}'
css += '.index__right--1kgDa{order:1!important;flex:0 0 65%!important;background:url(/avs-card-svg-1.svg) center center / 70% no-repeat,linear-gradient(to bottom right,#0f4c3a,#197560,#2a9d8f)!important;display:flex!important;align-items:center!important;justify-content:center!important;position:relative!important;overflow:hidden!important}'
css += '.index__login-full-image--3lehL,.index__full-image-front--1vn-y{display:none!important}'
css += '.index__login-right-logo--31US1{display:none!important}'
css += '.index__right--1kgDa::before,.index__right--1kgDa::after{display:none!important}'
css += '.index__welcome--3RISd,.index__welcome--Wrl8u{visibility:hidden!important;height:0!important;margin:0!important;padding:0!important;overflow:hidden!important;position:relative!important}'
css += '.index__welcome--3RISd::before,.index__welcome--Wrl8u::before{content:"Sign In"!important;visibility:visible!important;font-size:28px!important;font-weight:700!important;color:#1a1a2e!important;display:block!important;margin-bottom:4px!important}'
css += '.index__welcome--3RISd::after,.index__welcome--Wrl8u::after{content:"Enter your credentials to access the dashboard"!important;visibility:visible!important;font-size:14px!important;color:#888!important;display:block!important;font-weight:400!important;margin-bottom:24px!important}'
css += '.index__left--1nLBx .index__login-logo--1JYNE,.index__left--1nLBx img[alt]{margin-top:-20px!important}'
css += '.login-form-button{background:#00897b!important;border-color:#00897b!important;height:48px!important;font-size:16px!important;font-weight:600!important;border-radius:8px!important;width:100%!important;margin-top:8px!important}'
css += '.login-form-button:hover{background:#00796b!important}'
css += '.index__login-form--2ucoo .ant-input,.index__login-form--2ucoo .ant-select-selector{height:44px!important;border-radius:8px!important;font-size:15px!important;background:#f8f9fa!important;padding-left:11px!important}'
css += '.index__login-form--2ucoo .ant-input:focus,.index__login-form--2ucoo .ant-input:hover{background:#fff!important;border-color:#197560!important;box-shadow:0 0 0 2px rgba(25,117,96,0.2)!important}'
css += '.index__login-form--2ucoo .ant-select-selector:hover,.index__login-form--2ucoo .ant-select-focused .ant-select-selector{border-color:#197560!important;box-shadow:0 0 0 2px rgba(25,117,96,0.2)!important}'
css += '.index__login-form--2ucoo .ant-input-affix-wrapper{padding-left:11px!important;padding-right:12px!important;height:44px!important;border-radius:8px!important;background:#f8f9fa!important;display:flex!important;align-items:center!important}'
css += '.index__login-form--2ucoo .ant-input-affix-wrapper:hover,.index__login-form--2ucoo .ant-input-affix-wrapper:focus,.index__login-form--2ucoo .ant-input-affix-wrapper-focused{border-color:#197560!important;box-shadow:0 0 0 2px rgba(25,117,96,0.2)!important;background:#fff!important}'
css += '.index__login-form--2ucoo .ant-input-affix-wrapper .ant-input{padding:0!important;background:transparent!important;border:none!important;box-shadow:none!important;height:auto!important}'
css += '.index__lang--1iG5n{position:absolute!important;top:16px!important;right:16px!important;z-index:10!important}'
css += '.index__lang--1iG5n .ant-dropdown-trigger{color:#197560!important}'
css += '.index__lang--1iG5n svg,.index__lang--1iG5n .anticon{color:#197560!important}'
css += '.ant-dropdown-menu-item:hover{background:rgba(25,117,96,0.08)!important}'
css += '.ant-dropdown-menu-item-selected,.ant-dropdown-menu-item-active{color:#197560!important;background:rgba(25,117,96,0.08)!important}'
css += '</style>'
html = html.replace("</head>", css + "</head>")
open(STATIC + "/index.html", "w").write(html)
print("Login fixed with new logo")
