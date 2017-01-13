// cloudantの資格情報
var username = "";
var password = "";
var baseUrl = "https://" + username + ".cloudant.com/report/";

// 一覧ページの初期処理
$(document).on('init', '#list-page', function () {
    // 新規作成アイコンを押した時の処理
    $('.add-btn', this).on('click', function () {
        document.getElementById('navi').pushPage('new.html');
    });
    showAllItem();
});

// 追加ページ初期処理
$(document).on('init', '#new-page', function () {
	// 写真を撮るボタン
    $("#photo-btn").on("click", function(){
        var options = {
            quality: 50,
            targetWidth: 600,
            targetHeight: 600,
            destinationType: Camera.DestinationType.DATA_URL,  // base64で取得
            sourceType:Camera.PictureSourceType.CAMERA,   // 撮影モード
            saveToPhotoAlbum: true   // 撮影後端末に保存
        };
              
        // カメラを起動
        navigator.camera.getPicture(
        	function (base64){
        		// 撮影完了時処理
            	$("#small-image").attr("src", "data:image/jpeg;base64," + base64);
            	$("#photo-btn").attr("disabled", "disabled");
            	$("#add-save-btn").removeAttr("disabled");
        	}, 
        	function (message){
        		// 撮影失敗・キャンセル時処理
            	console.log("エラー: " + message);
        	}, 
        	options
        );
    });
    
    // 登録ボタンを押した時の処理
    $('#add-save-btn').on('click', function () {
    	var imgData = $("#small-image").attr("src").replace("data:image/jpeg;base64,","");
        if(!imgData) return;
        $("#add-save-btn").attr("disabled", "disabled");
        
        var date = new Date();
	    var today = date.getFullYear() + "/" + zeroPad((date.getMonth()+1)) + "/" + zeroPad(date.getDate()) + " " + zeroPad(date.getHours()) + ":" + zeroPad(date.getMinutes()) + ":" + zeroPad(date.getSeconds());
        
        var item = {
        	DATE: today,
	        _attachments:
			{
		    	PHOTO:
		    	{
		      		content_type:"image/jpeg",
		      		data: imgData
				}
			}
  		};
        // cloudantにデータ登録
        $.ajax({
    		type: "POST",
    		url: baseUrl,
    		username: username,
			password: password,
    		contentType: "application/json",
            data: JSON.stringify(item)
    	}).done(function(result) {
    		alert("登録が完了しました");
    		showAllItem();
            document.getElementById('navi').popPage();
    	}).fail(function(error) {
    		alert("エラー：" + error.statusText);
    	});
    });
});

// 一覧データを表示する
function showAllItem() {
    // リストを初期化
    var list = $('#list-page .item-list');
    list.empty();

    // 全件取得
   	$.ajax({
		type: "POST",
		url: baseUrl + "_find",
		username: username,
		password: password,
        contentType: "application/json",
	    data: JSON.stringify({
        	"selector": {
				"DATE": {"$ne": null}
			},
           "fields": ["_id", "_rev", "DATE"],
           "sort": [{"DATE:string":"desc"}]
        })
	}).done(function(data) {
		var results = JSON.parse(data);
        // 1件ずつリストに追加する
        results.docs.forEach(function (item) {
            list.append(createListItem(item));
        });
	}).fail(function(error) {
		console.log("エラー：" + error.statusText);
	});
}

// １件分のアイテムを表すHTML要素を作成
function createListItem(item) {
    var date = item.DATE;
    var li = $('#list-item-template .item').clone();
    $('.item-date', li).html(date);
    li.on('click', function () {
        document.getElementById('navi').pushPage('detail.html', {data: item});
    });
    return li;
}

// 詳細ページ初期処理
$(document).on('init', '#detail-page', function (event) {
    // 一覧ページからのパラメータを取得
    var item = event.target.data;
    $("#small-image").attr("src", baseUrl + item._id + "/PHOTO");
    
    // 削除アイコンを押した時の処理
    $('.del-btn', this).on('click', function () {
        $('#dialog').show();
    });
    
    $('#cancel-dialog-button', this).on('click', function () {
        $('#dialog').hide();
    });
    
    $('#ok-dialog-button', this).on('click', function () {
        // cloudantのデータ削除
        $.ajax({
    		type: "DELETE",
    		url: baseUrl + item._id + '?rev=' + item._rev,
    		username: username,
			password: password
    	}).done(function(result) {
    		alert("削除が完了しました");
    		showAllItem();
            document.getElementById('navi').popPage();
    	}).fail(function(error) {
    		alert("エラー：" + error.statusText);
    	});
    });
});

function zeroPad(time) {
	time = time.toString();
	return time.length == 1 ? '0' + time : time;
}