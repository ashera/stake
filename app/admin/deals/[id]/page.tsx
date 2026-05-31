import { notFound } from "next/navigation";
import { getDealById, DEAL_STATUSES } from "@/lib/deals";
import DealWizard from "./DealWizard";

export const dynamic = "force-dynamic";

export default async function EditDeal({ params }: { params: { id: string } }) {
  const deal = await getDealById(params.id);
  if (!deal) notFound();

  return (
    <section>
      <DealWizard deal={deal} statuses={DEAL_STATUSES} />
    </section>
  );
}
