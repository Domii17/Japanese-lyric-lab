import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "歌词拆解 Lab",
  description: "面向日语初学者的歌词分词、假名与罗马音学习工具",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
