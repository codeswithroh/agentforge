"use client";

import dynamic from "next/dynamic";

const CsprInner = dynamic(
  () => import("@make-software/cspr-design").then((m) => ({ default: m.CSPR })),
  { ssr: false, loading: () => <span>— CSPR</span> }
);

export function CsprAmount({ motes }: { motes: string | number }) {
  return <CsprInner motes={String(motes)} />;
}
