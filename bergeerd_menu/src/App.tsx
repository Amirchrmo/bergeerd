import { Suspense, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Splash from "@/components/Splash";
import StatusScreen from "@/components/StatusScreen";
import { BranchNotFoundError, branchSlugFromPath, useBranchMenu } from "@/core/menu";
import type { Branch } from "@/core/types";
import { themeFor } from "@/themes";

const queryClient = new QueryClient();
const BASE_TITLE = document.title;

/** Each branch is its own entry point (its QR code), so no client routing. */
const slug = branchSlugFromPath(window.location.pathname);

const App = () => (
  <QueryClientProvider client={queryClient}>
    {slug === null ? <StatusScreen kind="not-found" /> : <BranchPage slug={slug} />}
  </QueryClientProvider>
);

/** Loads one branch and renders it with the design the branch uses. */
function BranchPage({ slug }: { slug: string | undefined }) {
  const { data, error, refetch, isFetching } = useBranchMenu(slug);
  useBranchTitle(data?.branch);

  if (data) {
    const Theme = themeFor(data.branch.theme);
    return (
      <Suspense fallback={<Splash />}>
        <Theme menu={data} />
      </Suspense>
    );
  }
  if (error instanceof BranchNotFoundError) return <StatusScreen kind="not-found" />;
  if (error) return <StatusScreen kind="error" onRetry={() => refetch()} busy={isFetching} />;
  return <Splash />;
}

function useBranchTitle(branch: Branch | undefined) {
  useEffect(() => {
    document.title =
      branch && !branch.isDefault ? `برگرد ${branch.name} - یه گرد خوشمزه` : BASE_TITLE;
  }, [branch]);
}

export default App;
