# ClassMatchSystems 開発環境セットアップガイド

このドキュメントでは、開発環境のセットアップ手順および各種ツールの設定方法について説明します。

## 必要なツール

- **Node.js 18+**
- **npm** または **yarn**
- **Git**

## 環境変数の設定

プロジェクトルートに `.env.development.local` ファイルを作成します。以下は例です：

```env
DATABASE_URL="postgresql://user:password@localhost:5432/classmatch-db"
```

## 依存関係のインストール

```bash
npm install
```

## 開発サーバーの起動

```bash
npm run dev
```

## データベースのセットアップ (Prisma)

1. Prisma クライアント生成

   ```bash
   npx prisma generate
   ```

2. データベース初期化

   ```bash
   npx prisma db push
   ```

   PostgreSQLを使用している場合は、環境変数の `DATABASE_URL` を正しく設定し、必要に応じてマイグレーションを実行してください。

## スタイリング

本プロジェクトは Tailwind CSS を利用しています。設定ファイルは以下にあります：

- `tailwind.config.js`
- `tailwind.config.ts`

## その他の情報

- TypeScript の型定義は `next-env.d.ts` で管理されています。
- Vercel へのデプロイ手順や詳細は `README.md` をご参照ください。

---

これで基本的な開発環境のセットアップは完了です。各種スクリプトや設定について不明な点があれば、プロジェクト内のドキュメントやコメントを参照してください。
