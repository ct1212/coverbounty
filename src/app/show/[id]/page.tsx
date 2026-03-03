import BountyBoard from "@/components/bounty/BountyBoard";

export default async function ShowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BountyBoard showId={id} />;
}
