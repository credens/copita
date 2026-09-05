import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PerfilForm, type PerfilFormUser } from "./perfil-form";

export default async function PerfilPage() {
  const user = await currentUser();
  if (!user) redirect("/login");

  // Los campos Decimal de Prisma no son serializables al cruzar a un Client
  // Component — se convierten a number acá antes de pasarlos como prop.
  const formUser: PerfilFormUser = {
    name: user.name,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    bannerUrl: user.bannerUrl,
    tags: user.tags,
    copitaPriceUsd: Number(user.copitaPriceUsd),
    matureContent: user.matureContent,
    subscriptionEnabled: user.subscriptionEnabled,
    subscriptionPriceUsd: user.subscriptionPriceUsd ? Number(user.subscriptionPriceUsd) : null,
  };

  return (
    <div className="container" style={{ maxWidth: 560, paddingTop: 40, paddingBottom: 40 }}>
      <h1>Editar mi perfil</h1>
      <PerfilForm user={formUser} />
    </div>
  );
}
