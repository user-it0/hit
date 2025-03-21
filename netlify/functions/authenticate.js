const bcrypt = require('bcrypt');

exports.handler = async function(event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { email, password } = JSON.parse(event.body);

    // ここでデータベースに保存されたメールアドレスとパスワード（暗号化済み）を照合
    // 例：データベースからユーザー情報を取得
    const user = await getUserByEmail(email);

    if (!user) {
        return { statusCode: 401, body: JSON.stringify({ message: 'メールアドレスが存在しません' }) };
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
        return { statusCode: 401, body: JSON.stringify({ message: 'パスワードが間違っています' }) };
    }

    return { statusCode: 200, body: JSON.stringify({ message: 'ログイン成功' }) };
};

// データベースからユーザー情報を取得する関数（実際にはデータベース接続が必要）
async function getUserByEmail(email) {
    // ここでデータベースからユーザー情報を取得
    // 例：
    if (email === 'test@example.com') {
        const passwordHash = await bcrypt.hash('password', 10); // パスワードを暗号化
        return { email, passwordHash };
    }
    return null;
}