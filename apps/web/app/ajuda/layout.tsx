import { headers } from "next/headers";
import { ErpShell } from "../components/erp-shell";
import { getMasterData } from "../lib/erp";

export default async function AjudaLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "/ajuda";

  let companyName = "Winner Academia";
  let companyCnpj = "00000000000000";
  try {
    const data = await getMasterData();
    companyName = data.company?.tradeName ?? companyName;
    companyCnpj = data.company?.cnpj ?? companyCnpj;
  } catch {
    // use defaults
  }

  return (
    <ErpShell currentPath={pathname} companyName={companyName} companyCnpj={companyCnpj}>
      {children}
    </ErpShell>
  );
}
