function share_to_sina(title,pic,url){
	if(!url)
		url = window.location.href+"";
	window.open('http://v.t.sina.com.cn/share/share.php?url='+encodeURIComponent(url)+'&title='+encodeURIComponent(title)+'&pic='+encodeURIComponent(pic),'_blank');
}

function share_to_tengxun(title,pic,url){
	if(!url)
		url = window.location.href+"";
    window.open('http://v.t.qq.com/share/share.php?url='+encodeURIComponent(url)+'&pic='+encodeURIComponent(pic)+'&title='+encodeURIComponent(title));
}
function share_to_renren(title,pic,url){
	if(!url)
		url = window.location.href+"";
	window.open('http://widget.renren.com/dialog/share?resourceUrl='+encodeURIComponent(url)+'&srcUrl='+encodeURIComponent(url)+'&title='+encodeURIComponent(title)+'&description=&pic='+encodeURIComponent(pic));
}
function share_to_qzone(title,pic,url){
	if(!url)
		url = window.location.href+"";
	window.open('http://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url='+ encodeURIComponent(url)+ '&title='+encodeURIComponent(title),'_blank');
}
function share_boc(comid,type,url){
	var doctitle = null;
	try{
		doctitle = document.getElementById(comid).innerHTML;
	}catch(e){}
	if(type == "sina")
		share_to_sina(doctitle,'',url);
	else if(type == "qqwb")
		share_to_tengxun(doctitle,'',url);
	else if(type == "rrw")
		share_to_renren(doctitle,'',url);
	else if(type == "qqzone")
		share_to_qzone(doctitle,'',url);
}