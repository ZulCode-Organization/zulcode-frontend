import { redirect } from "next/navigation";

/**
 * A sidebar aponta para /admin, mas as telas moram em /admin/home, /admin/usuarios
 * e assim por diante. Sem esta rota o botão "Administrativo" dava 404.
 */
export default function Page() {
  redirect("/admin/home");
}
