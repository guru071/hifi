import { listActiveProducts } from "@/lib/services/catalog";
import ShopClient from "./ShopClient";

export const revalidate = 0; // or you could cache it for an hour depending on the requirement

export default async function Shop() {
  const products = await listActiveProducts();

  return <ShopClient initialProducts={products} />;
}