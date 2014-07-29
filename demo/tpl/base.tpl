<!DOCTYPE html>
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
	<title></title>
	<link rel="stylesheet" href="/css/combo/index.css"/>
    <script type="text/javascript">
	    var qPay = {};
	    window.pageConfig = {
		    showLogin: '{%$require_login%}',
		    hasPwd: '{%$has_paypwd%}',
		    pay: '{%$flag%}'
	    }
    </script>
</head>
<body>
	<!-- topbar start -->
<div class="topbar">
	<div class="doc-bd">
		{%if $placard%}
		<div class="fl txt_left">
			<em class="icon ico-speaker pngfix fl"></em>
			<ul class="an fl" data-an="run">
				{%section loop=$placard name=i%}
					<li><a href="{%$placard[i].url%}" target="_blank">{%$placard[i].title%}</a></li>
				{%/section%}
			</ul>
		</div>
		{%/if%}

		<div class="fr info mod-user">
            <span class="nloginWrap">
                <a class="pay-login-pop" href="###" >登录</a>|<a class="pay-reg-pop last" href="###" >注册</a>
            </span>
            <span class="loginWrap" style="display:none" >
                你好，<span class="popUsername" ></span>|<a class="last btn-logout-pop" href="###">安全退出</a>
            </span>
			<span class="mb-dw-box last">
				<a href="/" class="mb-index pngfix" target="_blank" style="display: none"><i class="icon icon-index pngfix"></i>首页</a>
				<a href="/index/mobile" class="mb-dw pngfix" target="_blank"><i class="icon icon-mbdw pngfix"></i>手机客户端</a>
				<i class="icon-new pngfix"></i>
			</span>
		</div>
	</div>
</div>
<!-- topbar end -->
<!-- header start -->
<div class="header">
	<div class="doc-bd clearfix">
		<h1 class="fl logo">
			<a href="/app.php" class="pngfix">哈哈哈</a>
		</h1>
		<div class="fr nav">
			<ul>
				<li {%if $curr_page=="index"%}class="active"{%/if%}><a>首 页</a></li>
				<li {%if $curr_page=="deposit"%}class="active"{%/if%}><a>账户充值</a></li>
				<li {%if $curr_page=="account"%}class="active"{%/if%}><a>我的账户</a></li>
			</ul>
		</div>
	</div>
</div>
<!-- header end -->
{%block name="block_body"%}{%/block%}
<!-- footer end -->
<!-- feedback -->
<div class="feedback">
    <div class="f-btn-box kf">
        <div class="kf-box">
            <div class="f-btn" data-type="f-btn-kf"></div>
        </div>
    </div>
</div>
<!--[if IE 6]>
<script src="/resource/js/lib/dd_belatedpng.js"></script>
<script> DD_belatedPNG.fix('.pngfix'); </script>
<![endif]-->
<script type="text/tpm" id="userLayer">
<div class="user-layer-box clearfix">
    <div class="balance-box">
        <div class="tr-arr"><em>◆</em><span>◆</span></div>
        账户余额：
        <div id="breadcrumb_balance" class="money"><em class="yahei"><%= balance %></em>个360币</div>
    </div>
    <ul>
        <li>
            <i class="pay-s-icon"></i>
            <a href="/deposit/recharge">充值</a>
        </li>
        <li>
            <i class="trade-s-icon"></i>
            <a href="/account/billList">充值明细</a>
        </li>
        <li>
            <i class="safe-s-icon"></i>
            <a href="/account/security">安全设置</a>
        </li>
    </ul>
</div>
</script>

<script type="text/tpl" id="testTpl">
	{%include file="public/testTpl.tpl"%}
</script>
{%/block%}


</body>
</html>
