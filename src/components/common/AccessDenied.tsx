"use client";

import { Result } from "antd";
import Link from "next/link";

type Props = {
  title?: string;
  message?: string;
};

export default function AccessDenied({ title, message }: Props) {
  return (
    <div className="flex items-center justify-center py-16">
      <Result
        status="403"
        title={title || "403"}
        subTitle={
          message ||
          "You do not have permission to view this page."
        }
        extra={
          <Link
            href="/dashboard"
            className="inline-block px-4 py-2 rounded bg-black text-white hover:bg-gray-800"
          >
            Go to dashboard
          </Link>
        }
      />
    </div>
  );
}
