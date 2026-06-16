"use client";

import { V2Header } from "./V2Header";

export default function V2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden">
      <V2Header />
      {children}
    </div>
  );
}
