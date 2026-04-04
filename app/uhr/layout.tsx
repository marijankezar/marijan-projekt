import MyFooter from "../components/footer";
import UhrHeaderLoader from "./uhr-header-loader";

export default function UhrLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <UhrHeaderLoader />
      <main>{children}</main>
      <footer><MyFooter /></footer>
    </div>
  );
}
