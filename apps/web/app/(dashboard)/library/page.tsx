import { requireAuth } from "@/lib/auth";
import { getLibraryHome } from "@/lib/library";
import { LibraryHome } from "@/components/library/library-home";

export default async function LibraryPage() {
  const user = await requireAuth();
  const { counts, recent, timeline, searchItems } = await getLibraryHome(user.id);

  return (
    <LibraryHome counts={counts} recent={recent} timeline={timeline} searchItems={searchItems} />
  );
}
