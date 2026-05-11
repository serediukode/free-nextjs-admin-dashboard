import LiveStatus from "@/components/nicom/LiveStatus";

export const metadata = {
  title: "Nicom Control Center — Live Status",
  description: "Real-time pulse of the Nicom AI SMM Factory",
};

export default function HomePage() {
  return <LiveStatus />;
}
