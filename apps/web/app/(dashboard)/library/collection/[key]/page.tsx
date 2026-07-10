import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getCollection } from "@/lib/library";
import { COLLECTION_META, type CollectionKey } from "@/components/library/icons";
import { CollectionView } from "@/components/library/collection-view";

export default async function CollectionPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const isValid = COLLECTION_META.some((c) => c.key === key);
  if (!isValid) notFound();

  const user = await requireAuth();
  const data = await getCollection(user.id, key as CollectionKey);
  if (!data) notFound();

  return <CollectionView data={data} />;
}
