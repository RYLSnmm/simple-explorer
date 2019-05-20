# 起動方法

electron がある場合

1. `app` フォルダだけ必要
    - ダウンロード用の `app.zip` をダウンロードして展開だけで OK
2. `app` の中の `run.bat` の electron 変数のパスを electron がある場所に修正する
3. `run.bat` を実行する

electron がない場合

1. `standalone.zip` だけ必要 (60MBくらい)
2. `standalone.zip` をダウンロード・展開して `electron.exe` を実行する

# 注意

Windows 用なので他 OS だと動くかわからない

# 内部事情のメモ

- ビルドした dist フォルダがあれば node_modules はなくていい（npm install しなくていい）
- electron を --target にすると require が nodejs のを使えるようになるみたいだけど、 cjs と es modules が混ざってエラーになってたからブラウザ用としてビルドするようにしてる （lit-html 内部で import {} ～ は構文エラーって感じ）

