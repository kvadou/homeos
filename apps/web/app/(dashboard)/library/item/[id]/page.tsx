import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getItem } from "@/lib/library";
import { ItemDetail } from "@/components/library/item-detail";

export default async function LibraryItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireAuth();
  const item = await getItem(user.id, id);
  if (!item) notFound();

  return <ItemDetail item={item} />;
}
