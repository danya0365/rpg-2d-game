import dynamic from "next/dynamic";

const DynamicComponentWithNoSSR = dynamic(
  () => import("./home-container-view"),
  { ssr: false }
);

export default function Home() {
  return <DynamicComponentWithNoSSR />;
}
