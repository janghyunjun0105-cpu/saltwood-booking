import type { Metadata } from "next";
import { ConfirmationView } from "@/components/booking/ConfirmationView";

export const metadata: Metadata = {
  title: "Your booking",
  description: "Your Saltwood Kitchen booking details.",
  robots: { index: false, follow: false },
};

export default async function ConfirmationPage(props: PageProps<"/book/confirmation/[code]">) {
  const { code } = await props.params;
  return (
    <div className="container-page py-10 sm:py-14">
      <ConfirmationView code={decodeURIComponent(code).toUpperCase()} />
    </div>
  );
}
