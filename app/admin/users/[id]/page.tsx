import { notFound } from "next/navigation";
import { getUserForAdmin } from "@/lib/users";
import { getCurrentUser } from "@/lib/auth";
import UserEditForm from "./UserEditForm";

export const dynamic = "force-dynamic";

export default async function EditUser({ params }: { params: { id: string } }) {
  const [user, me] = await Promise.all([getUserForAdmin(params.id), getCurrentUser()]);
  if (!user) notFound();

  return (
    <section>
      <UserEditForm user={user} isSelf={user.id === (me?.id ?? "")} />
    </section>
  );
}
