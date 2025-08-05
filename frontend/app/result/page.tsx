import { Suspense } from "react";
import Result from "@/components/result";

export default function ResultPage() {
  return (
    <Suspense fallback={<div className="text-white p-10">Loading interview results...</div>}>
      <Result />
    </Suspense>
  );
}
