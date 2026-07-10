import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getRoom } from "@/lib/library";
import { RoomView } from "@/components/library/room-view";

export default async function LibraryRoomPage({ params }: { params: Promise<{ room: string }> }) {
  const { room } = await params;
  const user = await requireAuth();
  const data = await getRoom(user.id, room);
  if (!data) notFound();

  return <RoomView room={data} />;
}
